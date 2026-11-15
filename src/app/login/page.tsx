import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAuthContext } from "@/server/auth/session";

import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
  const context = await getAuthContext();
  if (context) redirect(context.mustChangePassword ? "/change-password" : "/");

  return <LoginForm />;
}
