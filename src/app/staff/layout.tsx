import { redirect } from "next/navigation";

import { HospitalShell } from "@/components/shared/hospital-shell";
import { getAuthContext } from "@/server/auth/session";
import { hasPermission } from "@/server/auth/require-permission";

export const dynamic = "force-dynamic";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (context.role === "super_admin") redirect("/platform");

  return (
    <HospitalShell
      fullName={context.fullName}
      showPatients={hasPermission(context, "patients:read")}
      showStaff={hasPermission(context, "users:read")}
      showAudit={hasPermission(context, "audit:read")}
    >
      {children}
    </HospitalShell>
  );
}
