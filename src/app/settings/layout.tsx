import Link from "next/link";
import { redirect } from "next/navigation";

import { getAuthContext } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/" className="text-xs text-muted-foreground hover:underline">
            ← Home
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Hospital Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hospital profile, currency, tax rates, timezone, and operational parameters.
          </p>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
