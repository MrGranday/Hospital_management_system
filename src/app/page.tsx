import { redirect } from "next/navigation";

import { isMfaSatisfied } from "@/lib/auth/mfa";
import { getAuthContext } from "@/server/auth/session";

import HomeClient from "./home-client";

export const dynamic = "force-dynamic";

export default async function Home() {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (context.mustChangePassword) redirect("/change-password");
  if (!isMfaSatisfied(context.role, context.aal)) redirect("/mfa");
  if (context.role === "super_admin") redirect("/platform");

  return (
    <HomeClient
      session={{
        id: context.userId,
        name: context.fullName,
        username: context.username,
        role: context.role,
      }}
    />
  );
}
