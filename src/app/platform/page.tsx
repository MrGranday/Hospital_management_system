import Link from "next/link";
import type { Metadata } from "next";

import {
  getPlatformDashboardMetrics,
  listPlatformAuditEvents,
} from "@/server/platform/hospitals";
import { getModules } from "@/modules/registry";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Platform Dashboard",
};

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function PlatformDashboardPage() {
  const metrics = await getPlatformDashboardMetrics();
  const recentEvents = await listPlatformAuditEvents(5);
  const catalogModules = getModules();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform-level metrics, hospital tenant status, and system security overview. No patient PHI is exposed here.
        </p>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Total Hospitals</CardDescription>
            <CardTitle className="text-3xl font-bold tracking-tight">{metrics.totalHospitals}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">All provisioned tenants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Active Tenants</CardDescription>
            <CardTitle className="text-3xl font-bold tracking-tight text-emerald-600">
              {metrics.activeHospitals}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Live & operational</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Suspended Tenants</CardDescription>
            <CardTitle className="text-3xl font-bold tracking-tight text-amber-600">
              {metrics.suspendedHospitals}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Logins blocked, data kept</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Staff Accounts</CardDescription>
            <CardTitle className="text-3xl font-bold tracking-tight">{metrics.totalUsers}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Total users across hospitals</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="font-semibold text-sm">Hospital Management</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            View, filter, provision new hospitals, and manage status or administrator credentials.
          </p>
          <Link
            href="/platform/hospitals"
            className="mt-4 inline-flex items-center text-xs font-medium text-primary hover:underline"
          >
            Go to hospitals &rarr;
          </Link>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="font-semibold text-sm">Platform Audit Log</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Review immutable audit records of hospital lifecycle, provisioning, and status changes.
          </p>
          <Link
            href="/platform/audit"
            className="mt-4 inline-flex items-center text-xs font-medium text-primary hover:underline"
          >
            View platform audit &rarr;
          </Link>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="font-semibold text-sm">Tenant Isolation</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Every tenant is isolated at the database level with strict RLS and JWT verification.
          </p>
          <span className="mt-4 inline-block text-xs font-mono text-muted-foreground">
            Status: Active & Enforced
          </span>
        </div>
      </div>

      {/* Available Modules Catalog */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Available Module Catalog</h2>
          <p className="text-xs text-muted-foreground">
            Modular monolith catalog. Modules are switchable per hospital by the platform owner.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {catalogModules.map((mod) => (
            <div key={mod.key} className="rounded-lg border border-border bg-card p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{mod.name}</span>
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  {mod.key}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {mod.description ?? "Core functional hospital module."}
              </p>
              {mod.requires.length > 0 ? (
                <p className="text-[11px] text-amber-600 pt-1">
                  Requires: {mod.requires.join(", ")}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {/* Recent Platform Events */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Recent Platform Actions</h2>
            <p className="text-xs text-muted-foreground">Latest hospital and platform management events</p>
          </div>
          <Link href="/platform/audit" className="text-xs font-medium text-primary hover:underline">
            View full log
          </Link>
        </div>

        {recentEvents.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            No recent platform audit records.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">When</th>
                  <th className="px-4 py-2 font-medium">Action</th>
                  <th className="px-4 py-2 font-medium">Target Table</th>
                  <th className="px-4 py-2 font-medium">Actor Role</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((event) => (
                  <tr key={`${event.occurred_at}-${event.id}`} className="border-t border-border">
                    <td className="whitespace-nowrap px-4 py-2 text-xs text-muted-foreground">
                      {formatTimestamp(event.occurred_at)}
                    </td>
                    <td className="px-4 py-2 font-medium text-xs">{event.action}</td>
                    <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{event.table_name}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{event.actor_role ?? "—"}</td>
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
