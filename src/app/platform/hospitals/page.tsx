import Link from "next/link";

import type { Metadata } from "next";

import { listHospitals, type HospitalStatus } from "@/server/platform/hospitals";

import CreateHospitalForm from "./create-hospital-form";

export const metadata: Metadata = {
  title: "Hospitals",
};

const STATUS_STYLES: Record<HospitalStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  suspended: "bg-amber-50 text-amber-700 border-amber-200",
  archived: "bg-muted text-muted-foreground border-border",
};

export default async function HospitalsPage() {
  const hospitals = await listHospitals();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hospitals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create and manage hospital tenants. Each hospital gets every module and its own
          isolated data.
        </p>
      </div>

      <CreateHospitalForm />

      <section>
        <h2 className="text-sm font-semibold">All hospitals</h2>
        {hospitals.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No hospitals yet. Create the first one above.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Code</th>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Locale</th>
                  <th className="px-4 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {hospitals.map((hospital) => (
                  <tr key={hospital.id} className="border-t border-border">
                    <td className="px-4 py-3 font-mono text-xs">{hospital.code}</td>
                    <td className="px-4 py-3">{hospital.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs capitalize ${STATUS_STYLES[hospital.status]}`}
                      >
                        {hospital.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {hospital.country} · {hospital.timezone} · {hospital.currency}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/platform/hospitals/${hospital.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
