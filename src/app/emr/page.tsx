import Link from "next/link";
import { redirect } from "next/navigation";

import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

export const dynamic = "force-dynamic";

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function EmrDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  if (!hasPermission(context, "emr:read")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">EMR</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view EMR records.
        </p>
      </div>
    );
  }

  const raw = await searchParams;
  const q = Array.isArray(raw.q) ? raw.q[0] : raw.q;

  const supabase = await createSupabaseServerClient();

  // If search query is provided, search patients to jump directly to clinical chart
  let patientResults: Array<{ id: string; full_name: string; mrn: string; date_of_birth: string | null }> = [];
  if (q && typeof q === "string" && q.trim()) {
    const { data } = await supabase
      .from("patients")
      .select("id, full_name, mrn, date_of_birth")
      .eq("hospital_id", context.hospitalId)
      .is("deleted_at", null)
      .or(`full_name.ilike.%${q.trim()}%,mrn.ilike.%${q.trim()}%`)
      .limit(10);
    patientResults = data ?? [];
  }

  // Recent clinical notes across the hospital
  const { data: recentNotes } = await supabase
    .from("clinical_notes")
    .select("id, visit_id, provider_id, note_type, title, is_confidential, created_at")
    .eq("hospital_id", context.hospitalId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(10);

  // Recent diagnoses
  const { data: recentDiagnoses } = await supabase
    .from("diagnoses")
    .select("id, patient_id, visit_id, icd_code, description, is_primary, is_chronic, diagnosed_at")
    .eq("hospital_id", context.hospitalId)
    .is("deleted_at", null)
    .order("diagnosed_at", { ascending: false })
    .limit(10);

  // Patients linked to recent diagnoses
  const diagPatientIds = [...new Set((recentDiagnoses ?? []).map((d) => d.patient_id))];
  const { data: diagPatients } = diagPatientIds.length > 0
    ? await supabase
        .from("patients")
        .select("id, full_name, mrn")
        .in("id", diagPatientIds)
    : { data: [] };

  const diagPatientMap = new Map(diagPatients?.map((p) => [p.id, p]) ?? []);

  // Provider names for notes
  const noteProviderIds = [...new Set((recentNotes ?? []).map((n) => n.provider_id))];
  const { data: noteProviders } = noteProviderIds.length > 0
    ? await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", noteProviderIds)
    : { data: [] };

  const providerMap = new Map(noteProviders?.map((p) => [p.user_id, p.full_name]) ?? []);

  return (
    <div className="space-y-6">
      {/* Patient Search / Chart Lookup */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-base font-semibold">Open Patient Medical Record</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Search by patient name or Medical Record Number (MRN) to access complete clinical history, problem lists, allergies, and prescriptions.
        </p>
        <form method="get" className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Type patient name or MRN (e.g. John Doe, MRN-001)..."
            className="flex-1 min-w-[260px] max-w-lg rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="submit"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Find Chart
          </button>
        </form>

        {q && (
          <div className="mt-4 border-t border-border pt-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Search Results
            </h3>
            {patientResults.length === 0 ? (
              <p className="text-sm text-muted-foreground">No patients matched &quot;{q}&quot;.</p>
            ) : (
              <ul className="divide-y divide-border">
                {patientResults.map((p) => (
                  <li key={p.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <Link href={`/patients/${p.id}`} className="font-medium text-primary hover:underline">
                        {p.full_name}
                      </Link>
                      <span className="ml-3 font-mono text-xs text-muted-foreground">MRN: {p.mrn}</span>
                    </div>
                    <Link
                      href={`/patients/${p.id}`}
                      className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent"
                    >
                      Open Chart →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* Grid: Recent Diagnoses & Notes */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Diagnoses */}
        <section className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-base font-semibold">Recent Diagnoses (ICD)</h2>
          {!recentDiagnoses || recentDiagnoses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No recent diagnoses recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">Patient</th>
                    <th scope="col" className="px-3 py-2 font-medium">Code</th>
                    <th scope="col" className="px-3 py-2 font-medium">Diagnosis</th>
                    <th scope="col" className="px-3 py-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDiagnoses.map((d) => {
                    const pat = diagPatientMap.get(d.patient_id);
                    return (
                      <tr key={d.id} className="border-t border-border">
                        <td className="px-3 py-2.5">
                          <Link href={`/patients/${d.patient_id}`} className="font-medium hover:underline text-foreground">
                            {pat?.full_name ?? "—"}
                          </Link>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs font-semibold text-primary">
                          {d.icd_code}
                        </td>
                        <td className="px-3 py-2.5 text-xs">
                          {d.description}
                          {d.is_chronic ? (
                            <span className="ml-1.5 px-1 py-0.2 rounded text-[10px] bg-amber-50 text-amber-700 border border-amber-200">
                              Chronic
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground">
                          {formatTimestamp(d.diagnosed_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Recent Clinical Notes */}
        <section className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-base font-semibold">Recent Clinical Notes</h2>
          {!recentNotes || recentNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No clinical notes recorded.</p>
          ) : (
            <div className="divide-y divide-border">
              {recentNotes.map((n) => {
                const author = providerMap.get(n.provider_id) ?? "Clinician";
                return (
                  <div key={n.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold capitalize px-2 py-0.5 rounded bg-muted text-foreground">
                          {n.note_type}
                        </span>
                        <Link href={`/visits/${n.visit_id}`} className="font-medium text-sm hover:underline">
                          {n.title}
                        </Link>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">
                        {formatTimestamp(n.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recorded by {author} · Linked to visit
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
