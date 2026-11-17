import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getMfaState } from "@/server/auth/mfa";
import { getAuthContext } from "@/server/auth/session";

import MfaForm from "./mfa-form";

export const metadata: Metadata = {
  title: "Two-factor authentication",
};

export const dynamic = "force-dynamic";

export default async function MfaPage() {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (context.mustChangePassword) redirect("/change-password");

  const state = await getMfaState(context.role, context.aal);
  if (state.satisfied) redirect(context.role === "super_admin" ? "/platform" : "/");

  return <MfaForm factorId={state.verifiedFactorId} />;
}
