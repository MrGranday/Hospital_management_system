import Link from "next/link";
import { redirect } from "next/navigation";

import {
  APPOINTMENT_PAGE_SIZE,
  appointmentListHref,
  appointmentQuerySchema,
  appointmentStatusLabel,
  appointmentTypeLabel,
} from "@/lib/appointments/schema";
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

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  if (!hasPermission(context, "appointments:read")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Appointments</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view appointments.
        </p>
      </div>
    );
  }

  const raw = await searchParams;
  const query = appointmentQuerySchema.parse({
    q: first(raw.q),
    page: first(raw.page),
    status: first(raw.status),
    providerId: first(raw.providerId),
  });
  const offset = (query.page - 1) * APPOINTMENT_PAGE_SIZE;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("list_appointments", {
    p_query: query.q || undefined,
    p_limit: APPOINTMENT_PAGE_SIZE,
    p_offset: offset,
    p_status: query.status ?? undefined,
    p_provider_id: query.providerId ?? undefined,
  });

  if (error) throw new Error(error.message);

  const appointments = data ?? [];
  const total = appointments[0]?.total_count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / APPOINTMENT_PAGE_SIZE));
  const canUpdate = hasPermission(context, "appointments:update");
  const canCreate = hasPermission(context, "appointments:create");

  return (
    <div className="space-y-6">
      <form method="get" action="/appointments" className="flex flex-wrap gap-2">
        <label htmlFor="appointment-search" className="sr-only">
          Search appointments
        </label>
        <input
          id="appointment-search"
          name="q"
          type="search"
          defaultValue={query.q}
          placeholder="Search patient name, MRN or reason"
          className="flex h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <select
          name="status"
          defaultValue={query.status ?? ""}
          className="flex h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">All statuses</option>
          {["scheduled", "checked-in", "in-progress", "completed", "cancelled", "no-show"].map(
            (s) => (
              <option key={s} value={s}>
                {appointmentStatusLabel(s)}
              </option>
            ),
          )}
        </select>
        <button
          type="submit"
          className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
        >
          Search
        </button>
        {(query.q || query.status) && (
          <Link
            href="/appointments"
            className="inline-flex h-9 items-center justify-center px-3 text-sm text-muted-foreground hover:text-foreground"
          >
            Clear
          </Link>
        )}
      </form>

      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">
            {query.q ? `Results for “${query.q}”` : "All appointments"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {total} {total === 1 ? "appointment" : "appointments"}
            {totalPages > 1 ? ` · page ${query.page} of ${totalPages}` : ""}
          </p>
        </div>

        {appointments.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            {query.q || query.status
              ? "No appointments match your search."
              : "No appointments scheduled yet. Create the first appointment to get started."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
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
                    Starts
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Ends
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Type
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium text-right">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <Link href={`/appointments/${a.id}`} className="font-medium hover:underline">
                        {a.patient_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{a.patient_mrn}</td>
                    <td className="px-4 py-3">{a.provider_name}</td>
                    <td className="px-4 py-3">{formatTimestamp(a.starts_at)}</td>
                    <td className="px-4 py-3">{formatTimestamp(a.ends_at)}</td>
                    <td className="px-4 py-3 text-xs">{appointmentTypeLabel(a.type)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                          a.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : a.status === "cancelled" || a.status === "no-show"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : a.status === "in-progress"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : a.status === "checked-in"
                                  ? "bg-brand-50 text-brand-700 border-brand-200"
                                  : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {appointmentStatusLabel(a.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <span className="text-muted-foreground truncate max-w-[200px] block">
                        {a.reason}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 ? (
          <nav
            aria-label="Appointment pages"
            className="flex items-center justify-between gap-4 border-t border-border px-4 py-3 text-sm"
          >
            {query.page > 1 ? (
              <Link href={appointmentListHref(query, query.page - 1)} className="hover:underline">
                Previous
              </Link>
            ) : (
              <span className="text-muted-foreground">Previous</span>
            )}
            <span className="text-xs text-muted-foreground">
              Page {query.page} of {totalPages}
            </span>
            {query.page < totalPages ? (
              <Link href={appointmentListHref(query, query.page + 1)} className="hover:underline">
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
