import Link from "next/link";

import { signOutAction } from "@/server/auth/actions";

export function HospitalShell({
  fullName,
  showPatients,
  showStaff,
  showAudit,
  children,
}: {
  fullName: string;
  showPatients: boolean;
  showStaff: boolean;
  showAudit: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm font-semibold tracking-tight">
              MediCore
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/" className="text-muted-foreground hover:text-foreground">
                Home
              </Link>
              {showPatients ? (
                <Link href="/patients" className="text-muted-foreground hover:text-foreground">
                  Patients
                </Link>
              ) : null}
              {showStaff ? (
                <Link href="/staff" className="text-muted-foreground hover:text-foreground">
                  Staff
                </Link>
              ) : null}
              {showAudit ? (
                <Link href="/audit" className="text-muted-foreground hover:text-foreground">
                  Audit
                </Link>
              ) : null}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">{fullName}</span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
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
