import Link from "next/link";
import { redirect } from "next/navigation";

import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { InvoiceForm } from "./invoice-form";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  if (!hasPermission(context, "billing:create")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">New invoice</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to create invoices.
        </p>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: patients } = await supabase
    .from("patients")
    .select("id, full_name, mrn")
    .eq("hospital_id", context.hospitalId)
    .is("deleted_at", null)
    .order("full_name", { ascending: true })
    .limit(100);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/billing" className="text-xs text-muted-foreground hover:underline">
          ← Back to invoices
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Create Invoice</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Draft a new patient invoice or billing record.
        </p>
      </div>

      <InvoiceForm patients={patients ?? []} />
    </div>
  );
}
