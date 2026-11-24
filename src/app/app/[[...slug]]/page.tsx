import { redirect } from "next/navigation";

import HomeClient from "@/app/home-client";
import { pageFromSlug } from "@/lib/app-routes";
import { isMfaSatisfied } from "@/lib/auth/mfa";
import { getAuthContext } from "@/server/auth/session";
import { hasPermission } from "@/server/auth/require-permission";

export const dynamic = "force-dynamic";

export default async function AppModulePage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (context.mustChangePassword) redirect("/change-password");
  if (!isMfaSatisfied(context.role, context.aal)) redirect("/mfa");
  if (context.role === "super_admin") redirect("/platform");

  const { slug } = await params;

  return (
    <HomeClient
      session={{
        id: context.userId,
        name: context.fullName,
        username: context.username,
        role: context.role,
      }}
      initialPage={pageFromSlug(slug)}
      canReadPatients={hasPermission(context, "patients:read")}
    />
  );
}
