import Link from "next/link";
import { redirect } from "next/navigation";

import {
  PATIENT_PAGE_SIZE,
  patientListHref,
  patientQuerySchema,
  patientSexLabel,
} from "@/lib/patients/schema";
import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  if (!hasPermission(context, "patients:read")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Patients</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view patients.
        </p>
      </div>
    );
  }

  const raw = await searchParams;
  const query = patientQuerySchema.parse({
    q: first(raw.q),
    page: first(raw.page),
  });
  const offset = (query.page - 1) * PATIENT_PAGE_SIZE;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("list_patients", {
    p_query: query.q || undefined,
    p_limit: PATIENT_PAGE_SIZE,
    p_offset: offset,
  });

  if (error) throw new Error(error.message);

  const patients = data ?? [];
  const total = patients[0]?.total_count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PATIENT_PAGE_SIZE));
  const canCreate = hasPermission(context, "patients:create");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Patients</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Register patients and find them by name, phone or medical record number.
          </p>
        </div>
        {canCreate ? (
          <Link
            href="/patients/new"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Register patient
          </Link>
        ) : null}
      </div>

      <form method="get" action="/patients" className="flex flex-wrap gap-2">
        <label htmlFor="patient-search" className="sr-only">
          Search patients
        </label>
        <input
          id="patient-search"
          name="q"
          type="search"
          defaultValue={query.q}
          placeholder="Search name, phone or MRN"
          className="flex h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <button
          type="submit"
          className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
        >
          Search
        </button>
        {query.q ? (
          <Link
            href="/patients"
            className="inline-flex h-9 items-center justify-center px-3 text-sm text-muted-foreground hover:text-foreground"
          >
            Clear
          </Link>
        ) : null}
      </form>

      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">
            {query.q ? `Results for “${query.q}”` : "All patients"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {total} {total === 1 ? "patient" : "patients"}
            {totalPages > 1 ? ` · page ${query.page} of ${totalPages}` : ""}
          </p>
        </div>

        {patients.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            {query.q
              ? "No patients match that search."
              : "No patients registered yet. Register the first patient to get started."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Patient
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    MRN
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Sex
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Date of birth
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Phone
                  </th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <Link href={`/patients/${patient.id}`} className="font-medium hover:underline">
                        {patient.full_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{patient.mrn}</td>
                    <td className="px-4 py-3">{patientSexLabel(patient.sex)}</td>
                    <td className="px-4 py-3">{formatDate(patient.date_of_birth)}</td>
                    <td className="px-4 py-3">{patient.phone || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 ? (
          <nav
            aria-label="Patient pages"
            className="flex items-center justify-between gap-4 border-t border-border px-4 py-3 text-sm"
          >
            {query.page > 1 ? (
              <Link href={patientListHref(query, query.page - 1)} className="hover:underline">
                Previous
              </Link>
            ) : (
              <span className="text-muted-foreground">Previous</span>
            )}
            <span className="text-xs text-muted-foreground">
              Page {query.page} of {totalPages}
            </span>
            {query.page < totalPages ? (
              <Link href={patientListHref(query, query.page + 1)} className="hover:underline">
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
