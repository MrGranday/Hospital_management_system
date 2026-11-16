import Link from "next/link";
import { notFound } from "next/navigation";

import { getHospital } from "@/server/platform/hospitals";

import { setHospitalStatusAction } from "../actions";
import ResetAdminPasswordForm from "./reset-admin-password-form";

export default async function HospitalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const hospital = await getHospital(id);
  if (!hospital) notFound();

  const createdAt = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: hospital.timezone,
  }).format(new Date(hospital.created_at));

  return (
    <div className="space-y-8">
      <div>
        <Link href="/platform/hospitals" className="text-xs text-muted-foreground hover:underline">
          Back to hospitals
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{hospital.name}</h1>
        <p className="mt-1 font-mono text-sm text-muted-foreground">{hospital.code}</p>
      </div>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Details</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Status</dt>
            <dd className="capitalize">{hospital.status}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Country</dt>
            <dd>{hospital.country}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Timezone</dt>
            <dd>{hospital.timezone}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Currency</dt>
            <dd>{hospital.currency}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Created</dt>
            <dd>{createdAt}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Access</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Suspending a hospital blocks new sessions. It does not delete data.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {hospital.status === "active" ? (
            <form action={setHospitalStatusAction}>
              <input type="hidden" name="hospitalId" value={hospital.id} />
              <input type="hidden" name="status" value="suspended" />
              <button
                type="submit"
                className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                Suspend hospital
              </button>
            </form>
          ) : null}

          {hospital.status === "suspended" ? (
            <form action={setHospitalStatusAction}>
              <input type="hidden" name="hospitalId" value={hospital.id} />
              <input type="hidden" name="status" value="active" />
              <button
                type="submit"
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Reactivate hospital
              </button>
            </form>
          ) : null}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Administrator password</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Generates a one-time password for the hospital administrator and forces a change at
          the next sign-in. The password is shown once.
        </p>
        <div className="mt-4">
          <ResetAdminPasswordForm hospitalId={hospital.id} />
        </div>
      </section>
    </div>
  );
}
