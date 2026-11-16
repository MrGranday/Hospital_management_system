import Link from "next/link";
import { redirect } from "next/navigation";

import { signOutAction } from "@/server/auth/actions";
import { getSuperAdminContext } from "@/server/platform/guard";

export const dynamic = "force-dynamic";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getSuperAdminContext();
  if (!context) redirect("/login");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/platform/hospitals" className="text-sm font-semibold tracking-tight">
              MediCore Platform
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/platform/hospitals" className="text-muted-foreground hover:text-foreground">
                Hospitals
              </Link>
              <Link href="/platform/audit" className="text-muted-foreground hover:text-foreground">
                Audit log
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">{context.fullName}</span>
            <form action={signOutAction}>
              <button type="submit" className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
