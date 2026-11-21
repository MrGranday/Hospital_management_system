import Link from "next/link";
import { redirect } from "next/navigation";

import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage({
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
        <h1 className="text-lg font-semibold">Departments</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view departments.
        </p>
      </div>
    );
  }

  const raw = await searchParams;
  const q = Array.isArray(raw.q) ? raw.q[0] : raw.q;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("departments").select(
    "id, name, description, is_active, created_at",
  )
    .eq("hospital_id", hospitalId)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);

  const departments = data ?? [];
  const filtered = q
    ? departments.filter(
        (d) =>
          d.name.toLowerCase().includes(q.toLowerCase()) ||
          d.description?.toLowerCase().includes(q.toLowerCase()),
      )
    : departments;

  return (
    <div className="space-y-6">
      <form method="get" action="/hr/departments" className="flex flex-wrap gap-2">
        <input
          name="q"
          type="search"
          defaultValue={q ?? ""}
          placeholder="Search departments"
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
            href="/hr/departments"
            className="inline-flex h-9 items-center justify-center px-3 text-sm text-muted-foreground hover:text-foreground"
          >
            Clear
          </Link>
        )}
      </form>

      <section className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Departments</h2>
          <p className="text-xs text-muted-foreground">
            {filtered.length} department{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>

        {filtered.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            {q ? "No departments match your search." : "No departments yet."}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">Name</th>
                <th scope="col" className="px-4 py-2 font-medium">Description</th>
                <th scope="col" className="px-4 py-2 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="border-t border-border">
                  <td className="px-4 py-3">{d.name}</td>
                  <td className="px-4 py-3 text-xs">{d.description ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                        d.is_active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {d.is_active ? "Active" : "Inactive"}
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
