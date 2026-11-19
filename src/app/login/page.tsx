import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { isMfaSatisfied } from "@/lib/auth/mfa";
import { getAuthContext } from "@/server/auth/session";

import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const context = await getAuthContext();
  if (context) {
    if (context.mustChangePassword) redirect("/change-password");
    if (!isMfaSatisfied(context.role, context.aal)) redirect("/mfa");
    redirect(context.role === "super_admin" ? "/platform" : "/");
  }

  return <LoginForm />;
}
