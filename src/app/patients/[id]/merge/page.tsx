import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { patientIdSchema, patientSexLabel } from "@/lib/patients/schema";
import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

import MergePatientForm from "./merge-patient-form";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: string | null): string {
  if (!value) return "Not recorded";
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function MergePatientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  if (!hasPermission(context, "patients:merge") || !hasPermission(context, "patients:read")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Merge patients</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to merge patient records.
        </p>
      </div>
    );
  }

  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: source } = await supabase
    .from("patients")
    .select("id, mrn, full_name, sex, date_of_birth, phone")
    .eq("id", id)
    .eq("hospital_id", context.hospitalId)
    .maybeSingle();

  if (!source) notFound();

  const raw = await searchParams;
  const q = (first(raw.q) ?? "").trim().slice(0, 80);
  const targetParam = first(raw.target);
  const targetId = targetParam ? patientIdSchema.safeParse(targetParam) : null;

  let target: {
    id: string;
    mrn: string;
    full_name: string;
    sex: string;
    date_of_birth: string | null;
    phone: string | null;
  } | null = null;
  let targetError: string | null = null;

  if (targetId?.success && targetId.data !== source.id) {
    const { data } = await supabase
      .from("patients")
      .select("id, mrn, full_name, sex, date_of_birth, phone")
      .eq("id", targetId.data)
      .eq("hospital_id", context.hospitalId)
      .maybeSingle();
    target = data;
    if (!data) targetError = "That patient is not available. Search again.";
  } else if (targetParam) {
    targetError = "Choose a different patient to merge into.";
  }

  let candidates: {
    id: string;
    mrn: string;
    full_name: string;
    sex: string;
    phone: string | null;
  }[] = [];
  if (!target && q) {
    const { data, error } = await supabase.rpc("list_patients", {
      p_query: q,
      p_limit: 25,
      p_offset: 0,
    });
    if (error) throw new Error(error.message);
    candidates = (data ?? []).filter((patient) => patient.id !== source.id);
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <Link href={`/patients/${source.id}`} className="text-xs text-muted-foreground hover:underline">
          ← Back to patient
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Merge duplicate</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Keep one record and archive the duplicate. The merge is recorded permanently.
        </p>
      </div>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Duplicate to archive</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Patient</dt>
            <dd className="font-medium">{source.full_name}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">MRN</dt>
            <dd className="font-mono">{source.mrn}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Sex</dt>
            <dd>{patientSexLabel(source.sex)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Date of birth</dt>
            <dd>{formatDate(source.date_of_birth)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Phone</dt>
            <dd>{source.phone || "Not recorded"}</dd>
          </div>
        </dl>
      </section>

      {target ? (
        <MergePatientForm
          sourceId={source.id}
          sourceName={`${source.full_name} (${source.mrn})`}
          targetId={target.id}
          targetName={`${target.full_name} (${target.mrn})`}
        />
      ) : (
        <section className="space-y-4">
          <form method="get" action={`/patients/${source.id}/merge`} className="flex flex-wrap gap-2">
            <label htmlFor="merge-search" className="sr-only">
              Search for the surviving patient
            </label>
            <input
              id="merge-search"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Search the patient to keep by name, phone or MRN"
              className="flex h-9 w-full max-w-md rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
            >
              Search
            </button>
          </form>

          {targetError ? (
            <p role="alert" className="text-sm text-destructive">
              {targetError}
            </p>
          ) : null}

          {!q ? (
            <p className="text-sm text-muted-foreground">
              Search for the patient record you want to keep.
            </p>
          ) : candidates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No other patients match that search.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <table className="w-full text-sm">
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
                      Phone
                    </th>
                    <th scope="col" className="px-4 py-2 font-medium">
                      <span className="sr-only">Choose</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((candidate) => (
                    <tr key={candidate.id} className="border-t border-border">
                      <td className="px-4 py-3 font-medium">{candidate.full_name}</td>
                      <td className="px-4 py-3 font-mono text-xs">{candidate.mrn}</td>
                      <td className="px-4 py-3">{patientSexLabel(candidate.sex)}</td>
                      <td className="px-4 py-3">{candidate.phone || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/patients/${source.id}/merge?target=${candidate.id}`}
                          className="text-xs font-medium hover:underline"
                        >
                          Keep this record
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
