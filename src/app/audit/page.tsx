import Link from "next/link";
import { redirect } from "next/navigation";

import {
  AUDIT_ACTIONS,
  AUDIT_PAGE_SIZE,
  AUDIT_TABLES,
  auditPageHref,
  auditQuerySchema,
} from "@/lib/audit/query";
import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

export const dynamic = "force-dynamic";

const TABLE_LABELS: Record<(typeof AUDIT_TABLES)[number], string> = {
  "public.hospitals": "Hospital",
  "public.profiles": "Staff profile",
  "public.hospital_settings": "Hospital settings",
  "public.user_roles": "Staff role",
};

const selectClassName =
  "flex h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  if (!hasPermission(context, "audit:read")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Audit log</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view the audit log.
        </p>
      </div>
    );
  }

  const raw = await searchParams;
  const query = auditQuerySchema.parse({
    page: first(raw.page),
    table: first(raw.table) || undefined,
    action: first(raw.action) || undefined,
  });

  const supabase = await createSupabaseServerClient();
  const from = (query.page - 1) * AUDIT_PAGE_SIZE;

  const [{ data: events, error }, { data: hospital }] = await Promise.all([
    supabase.rpc("list_hospital_audit_events", {
      p_limit: AUDIT_PAGE_SIZE,
      p_offset: from,
      p_table: query.table ?? undefined,
      p_action: query.action ?? undefined,
    }),
    supabase.from("hospitals").select("timezone").eq("id", context.hospitalId).maybeSingle(),
  ]);

  if (error) throw new Error(error.message);

  const rows = events ?? [];
  const actorIds = [...new Set(rows.map((event) => event.actor_id).filter((id) => id !== null))];
  const actorNames = new Map<string, string>();

  if (actorIds.length > 0 && hasPermission(context, "users:read")) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", actorIds);
    for (const profile of profiles ?? []) actorNames.set(profile.user_id, profile.full_name);
  }

  const total = rows[0]?.total_count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE));
  const timeZone = hospital?.timezone ?? "UTC";
  const dateFormat = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone,
  });
  const filtersActive = Boolean(query.table || query.action);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every write to staff, hospital settings and access records. Times shown in {timeZone}.
        </p>
      </div>

      <form method="get" action="/audit" className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label htmlFor="table" className="text-xs font-medium text-muted-foreground">
            Table
          </label>
          <select id="table" name="table" defaultValue={query.table ?? ""} className={selectClassName}>
            <option value="">All</option>
            {AUDIT_TABLES.map((table) => (
              <option key={table} value={table}>
                {TABLE_LABELS[table]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="action" className="text-xs font-medium text-muted-foreground">
            Action
          </label>
          <select
            id="action"
            name="action"
            defaultValue={query.action ?? ""}
            className={selectClassName}
          >
            <option value="">All</option>
            {AUDIT_ACTIONS.map((action) => (
              <option key={action} value={action}>
                {action.charAt(0) + action.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Apply filters
        </button>
        {filtersActive ? (
          <Link href="/audit" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
            Clear
          </Link>
        ) : null}
      </form>

      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Events</h2>
          <p className="text-xs text-muted-foreground">
            {total} event{total === 1 ? "" : "s"}
          </p>
        </div>

        {rows.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No audit events match these filters yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">
                    When
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Actor
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Action
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Record
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((event) => {
                  const actor = event.actor_id
                    ? (actorNames.get(event.actor_id) ??
                      `${event.actor_role ?? "user"} · ${event.actor_id.slice(0, 8)}`)
                    : "System";

                  return (
                    <tr key={`${event.occurred_at}-${event.id}`} className="border-t border-border align-top">
                      <td className="whitespace-nowrap px-4 py-3 text-xs">
                        {dateFormat.format(new Date(event.occurred_at))}
                      </td>
                      <td className="px-4 py-3">{actor}</td>
                      <td className="px-4 py-3 font-mono text-xs">{event.action}</td>
                      <td className="px-4 py-3">
                        <span className="block">{TABLE_LABELS[event.table_name as keyof typeof TABLE_LABELS] ?? event.table_name}</span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {event.record_id?.slice(0, 8) ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {event.before || event.after ? (
                          <details>
                            <summary className="cursor-pointer text-xs text-muted-foreground">
                              View changes
                            </summary>
                            <pre className="mt-2 max-h-64 max-w-md overflow-auto rounded bg-muted/50 p-2 text-[11px]">
                              {JSON.stringify({ before: event.before, after: event.after }, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                        {event.reason ? (
                          <p className="mt-1 text-xs text-muted-foreground">Reason: {event.reason}</p>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
          <span className="text-xs text-muted-foreground">
            Page {query.page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            {query.page > 1 ? (
              <Link
                href={auditPageHref(query, query.page - 1)}
                className="inline-flex h-8 items-center rounded-md border border-input px-3 text-xs font-medium hover:bg-accent"
              >
                Previous
              </Link>
            ) : (
              <span className="inline-flex h-8 items-center rounded-md border border-input px-3 text-xs text-muted-foreground">
                Previous
              </span>
            )}
            {query.page < totalPages ? (
              <Link
                href={auditPageHref(query, query.page + 1)}
                className="inline-flex h-8 items-center rounded-md border border-input px-3 text-xs font-medium hover:bg-accent"
              >
                Next
              </Link>
            ) : (
              <span className="inline-flex h-8 items-center rounded-md border border-input px-3 text-xs text-muted-foreground">
                Next
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
