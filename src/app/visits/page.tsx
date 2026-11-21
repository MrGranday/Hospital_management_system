import Link from "next/link";
import { redirect } from "next/navigation";

import {
  VISIT_PAGE_SIZE,
  visitListHref,
  visitQuerySchema,
  visitStatusLabel,
} from "@/lib/visits/schema";
import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function VisitsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  if (!hasPermission(context, "visits:read")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Visits / OPD</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view visits.
        </p>
      </div>
    );
  }

  const raw = await searchParams;
  const query = visitQuerySchema.parse({
    q: first(raw.q),
    page: first(raw.page),
    status: first(raw.status),
  });
  const offset = (query.page - 1) * VISIT_PAGE_SIZE;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("list_visits", {
    p_query: query.q || undefined,
    p_limit: VISIT_PAGE_SIZE,
    p_offset: offset,
    p_status: query.status ?? undefined,
  });

  if (error) throw new Error(error.message);

  const visits = data ?? [];
  const total = visits[0]?.total_count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / VISIT_PAGE_SIZE));
  const canCreate = hasPermission(context, "visits:create");
  const canUpdate = hasPermission(context, "visits:update");

  return (
    <div className="space-y-6">
      <form method="get" action="/visits" className="flex flex-wrap gap-2">
        <label htmlFor="visit-search" className="sr-only">
          Search visits
        </label>
        <input
          id="visit-search"
          name="q"
          type="search"
          defaultValue={query.q}
          placeholder="Search patient name, MRN or chief complaint"
          className="flex h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <select
          name="status"
          defaultValue={query.status ?? ""}
          className="flex h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">All statuses</option>
          {["waiting", "vitals", "consultation", "completed", "cancelled"].map((s) => (
            <option key={s} value={s}>
              {visitStatusLabel(s)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
        >
          Search
        </button>
        {(query.q || query.status) && (
          <Link
            href="/visits"
            className="inline-flex h-9 items-center justify-center px-3 text-sm text-muted-foreground hover:text-foreground"
          >
            Clear
          </Link>
        )}
      </form>

      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">
            {query.q ? `Results for “${query.q}”` : "OPD queue"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {total} {total === 1 ? "visit" : "visits"}
            {totalPages > 1 ? ` · page ${query.page} of ${totalPages}` : ""}
          </p>
        </div>

        {visits.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            {query.q || query.status
              ? "No visits match your search."
              : "No visits in the queue yet. Create the first visit to get started."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Patient
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    MRN
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Provider
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Queue
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Chief complaint
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Started
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {visits.map((v) => (
                  <tr key={v.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <Link href={`/visits/${v.id}`} className="font-medium hover:underline">
                        {v.patient_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{v.patient_mrn}</td>
                    <td className="px-4 py-3">{v.provider_name}</td>
                    <td className="px-4 py-3">
                      {v.queue_position ?? <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                          v.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : v.status === "cancelled"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : v.status === "consultation"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : v.status === "vitals"
                                  ? "bg-brand-50 text-brand-700 border-brand-200"
                                  : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {visitStatusLabel(v.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-muted-foreground truncate max-w-[240px] block">
                        {v.chief_complaint || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {v.started_at ? formatTimestamp(v.started_at) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/visits/${v.id}`}
                          className="text-xs font-medium hover:underline"
                        >
                          View
                        </Link>
                        {canUpdate && v.status === "waiting" ? (
                          <Link
                            href={`/visits/${v.id}/edit`}
                            className="text-xs text-brand hover:underline"
                          >
                            Edit
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 ? (
          <nav
            aria-label="Visit pages"
            className="flex items-center justify-between gap-4 border-t border-border px-4 py-3 text-sm"
          >
            {query.page > 1 ? (
              <Link href={visitListHref(query, query.page - 1)} className="hover:underline">
                Previous
              </Link>
            ) : (
              <span className="text-muted-foreground">Previous</span>
            )}
            <span className="text-xs text-muted-foreground">
              Page {query.page} of {totalPages}
            </span>
            {query.page < totalPages ? (
              <Link href={visitListHref(query, query.page + 1)} className="hover:underline">
                Next
              </Link>
            ) : (
              <span className="text-muted-foreground">Next</span>
            )}
          </nav>
        ) : null}
      </section>
    </div>
  );
}
