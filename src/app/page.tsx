import { redirect } from "next/navigation";

import { pagePath } from "@/lib/app-routes";
import { isMfaSatisfied } from "@/lib/auth/mfa";
import { getAuthContext } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function Home() {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (context.mustChangePassword) redirect("/change-password");
  if (!isMfaSatisfied(context.role, context.aal)) redirect("/mfa");
  if (context.role === "super_admin") redirect("/platform");

  redirect(pagePath("dashboard"));
}
