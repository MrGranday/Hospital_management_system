import Link from "next/link";
import { redirect } from "next/navigation";

import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  const supabase = await createSupabaseServerClient();

  // Fetch hospital
  const { data: hospital } = await supabase
    .from("hospitals")
    .select("id, name, code, status, created_at")
    .eq("id", context.hospitalId)
    .maybeSingle();

  // Fetch hospital settings
  const { data: settings } = await supabase
    .from("hospital_settings")
    .select("currency, timezone, tax_rate, logo_path")
    .eq("hospital_id", context.hospitalId)
    .maybeSingle();

  const canManageUsers = hasPermission(context, "users:read");
  const canManageRoles = hasPermission(context, "roles:read");

  return (
    <div className="max-w-3xl space-y-8">
      {/* Hospital Profile Section */}
      <section className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h2 className="text-base font-semibold">Hospital Profile</h2>
        <dl className="grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Hospital Name</dt>
            <dd className="mt-1 font-medium text-foreground text-base">{hospital?.name ?? "MediCore Hospital"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Hospital Code</dt>
            <dd className="mt-1 font-mono text-xs">{hospital?.code ?? "default"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Status</dt>
            <dd className="mt-1">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {hospital?.status ?? "active"}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Hospital ID</dt>
            <dd className="mt-1 font-mono text-xs text-muted-foreground">{hospital?.id}</dd>
          </div>
        </dl>
      </section>

      {/* Financial & Regional Defaults */}
      <section className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h2 className="text-base font-semibold">Regional &amp; Financial Configuration</h2>
        <dl className="grid gap-4 sm:grid-cols-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Operating Currency</dt>
            <dd className="mt-1 font-mono font-bold text-foreground">
              {settings?.currency ?? "AFN"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Timezone</dt>
            <dd className="mt-1 text-foreground">
              {settings?.timezone ?? "Asia/Kabul"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Default Sales Tax</dt>
            <dd className="mt-1 font-mono font-medium text-foreground">
              {settings?.tax_rate ?? "0.00"}%
            </dd>
          </div>
        </dl>
      </section>

      {/* Administration Links */}
      <section className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h2 className="text-base font-semibold">Security &amp; User Administration</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {canManageUsers ? (
            <Link
              href="/staff"
              className="p-4 rounded-md border border-border hover:bg-muted/40 transition-colors block"
            >
              <h3 className="text-sm font-semibold text-foreground">Staff &amp; User Accounts</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Manage doctor, nurse, and employee accounts and credentials.
              </p>
            </Link>
          ) : null}

          {canManageRoles ? (
            <Link
              href="/staff/roles"
              className="p-4 rounded-md border border-border hover:bg-muted/40 transition-colors block"
            >
              <h3 className="text-sm font-semibold text-foreground">Roles &amp; RBAC Permissions</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Configure role capabilities, clinical boundaries, and access levels.
              </p>
            </Link>
          ) : null}

          <Link
            href="/change-password"
            className="p-4 rounded-md border border-border hover:bg-muted/40 transition-colors block"
          >
            <h3 className="text-sm font-semibold text-foreground">Change Password</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Update your account password with minimum entropy enforcement.
            </p>
          </Link>

          <Link
            href="/mfa"
            className="p-4 rounded-md border border-border hover:bg-muted/40 transition-colors block"
          >
            <h3 className="text-sm font-semibold text-foreground">Two-Factor Authentication (MFA)</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Manage TOTP authenticator keys and two-factor safety.
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
