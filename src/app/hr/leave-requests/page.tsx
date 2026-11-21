import Link from "next/link";
import { redirect } from "next/navigation";

import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

export const dynamic = "force-dynamic";

export default async function LeaveRequestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  const hospitalId = context.hospitalId;

  if (!hasPermission(context, "hr:read")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Leave Requests</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view leave requests.
        </p>
      </div>
    );
  }

  const raw = await searchParams;
  const q = Array.isArray(raw.q) ? raw.q[0] : raw.q;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("leave_requests").select(
    "id, staff_id, leave_type, start_date, end_date, days, status, reason, created_at",
  )
    .eq("hospital_id", hospitalId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const requests = data ?? [];
  const filtered = q
    ? requests.filter((r) => r.staff_id.toLowerCase().includes(q.toLowerCase()))
    : requests;

  return (
    <div className="space-y-6">
      <form method="get" action="/hr/leave-requests" className="flex flex-wrap gap-2">
        <input
          name="q"
          type="search"
          defaultValue={q ?? ""}
          placeholder="Search leave requests by staff ID"
          className="flex h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <button
          type="submit"
          className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
        >
          Search
        </button>
        {q && (
          <Link
            href="/hr/leave-requests"
            className="inline-flex h-9 items-center justify-center px-3 text-sm text-muted-foreground hover:text-foreground"
          >
            Clear
          </Link>
        )}
      </form>

      <section className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Leave Requests</h2>
          <p className="text-xs text-muted-foreground">
            {filtered.length} request{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>

        {filtered.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            {q ? "No leave requests match your search." : "No leave requests yet."}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">Staff ID</th>
                <th scope="col" className="px-4 py-2 font-medium">Type</th>
                <th scope="col" className="px-4 py-2 font-medium">Dates</th>
                <th scope="col" className="px-4 py-2 font-medium text-right">Days</th>
                <th scope="col" className="px-4 py-2 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3 font-mono text-xs">{r.staff_id}</td>
                  <td className="px-4 py-3 text-xs">{r.leave_type}</td>
                  <td className="px-4 py-3 text-xs">
                    {r.start_date} to {r.end_date}
                  </td>
                  <td className="px-4 py-3 text-right text-xs">{r.days}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                        r.status === "approved"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : r.status === "rejected"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : r.status === "cancelled"
                              ? "bg-muted text-muted-foreground border-border"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
