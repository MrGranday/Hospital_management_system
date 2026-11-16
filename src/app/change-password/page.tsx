import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAuthContext } from "@/server/auth/session";

import ChangePasswordForm from "./change-password-form";

export const metadata: Metadata = {
  title: "Change password",
};

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.mustChangePassword) redirect("/");

  return <ChangePasswordForm />;
}
