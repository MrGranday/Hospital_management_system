import Link from "next/link";
import { redirect } from "next/navigation";

import { poStatusLabel } from "@/lib/purchasing/schema";
import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

export const dynamic = "force-dynamic";

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  const hospitalId = context.hospitalId;

  if (!hasPermission(context, "purchasing:read")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Suppliers</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view suppliers.
        </p>
      </div>
    );
  }

  const raw = await searchParams;
  const q = Array.isArray(raw.q) ? raw.q[0] : raw.q;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("suppliers").select(
    "id, supplier_code, name, contact_name, contact_email, contact_phone, is_active, created_at",
  )
    .eq("hospital_id", hospitalId)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);

  const suppliers = data ?? [];
  const canCreate = hasPermission(context, "purchasing:create");
  const canUpdate = hasPermission(context, "purchasing:update");

  const filtered = q
    ? suppliers.filter(
        (s) =>
          s.name.toLowerCase().includes(q.toLowerCase()) ||
          s.supplier_code.toLowerCase().includes(q.toLowerCase()),
      )
    : suppliers;

  return (
    <div className="space-y-6">
      <form method="get" action="/purchasing/suppliers" className="flex flex-wrap gap-2">
        <label htmlFor="supplier-search" className="sr-only">
          Search suppliers
        </label>
        <input
          id="supplier-search"
          name="q"
          type="search"
          defaultValue={q ?? ""}
          placeholder="Search supplier name or code"
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
            href="/purchasing/suppliers"
            className="inline-flex h-9 items-center justify-center px-3 text-sm text-muted-foreground hover:text-foreground"
          >
            Clear
          </Link>
        )}
      </form>

      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Suppliers</h2>
          <p className="text-xs text-muted-foreground">
            {filtered.length} supplier{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>

        {filtered.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            {q ? "No suppliers match your search." : "No suppliers yet. Create the first supplier to get started."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">Code</th>
                  <th scope="col" className="px-4 py-2 font-medium">Name</th>
                  <th scope="col" className="px-4 py-2 font-medium">Contact</th>
                  <th scope="col" className="px-4 py-2 font-medium">Phone</th>
                  <th scope="col" className="px-4 py-2 font-medium text-right">Status</th>
                  <th scope="col" className="px-4 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="px-4 py-3 font-mono text-xs">{s.supplier_code}</td>
                    <td className="px-4 py-3">
                      <Link href={`/purchasing/suppliers/${s.id}`} className="font-medium hover:underline">
                        {s.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{s.contact_name ?? "—"}</td>
                    <td className="px-4 py-3 text-xs">{s.contact_phone ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                          s.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {s.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/purchasing/suppliers/${s.id}`}
                          className="text-xs font-medium hover:underline"
                        >
                          View
                        </Link>
                        {canUpdate && (
                          <Link
                            href={`/purchasing/suppliers/${s.id}/edit`}
                            className="text-xs text-brand hover:underline"
                          >
                            Edit
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {canCreate && (
        <div className="pt-4">
          <Link
            href="/purchasing/suppliers/new"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            + New supplier
          </Link>
        </div>
      )}
    </div>
  );
}
