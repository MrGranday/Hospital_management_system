import Link from "next/link";
import { redirect } from "next/navigation";

import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

import { BatchForm } from "./batch-form";

export const dynamic = "force-dynamic";

export default async function NewBatchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  if (!hasPermission(context, "inventory:create")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">New Batch</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to create item batches.
        </p>
      </div>
    );
  }

  const raw = await searchParams;
  const initialItemId = Array.isArray(raw.itemId) ? raw.itemId[0] : raw.itemId;

  const supabase = await createSupabaseServerClient();
  const { data: items } = await supabase
    .from("items")
    .select("id, name, sku, unit")
    .eq("hospital_id", context.hospitalId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href="/inventory/batches" className="text-xs text-muted-foreground hover:underline">
          ← Back to batches
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Receive new batch</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Log a newly received batch with its batch number and expiry date.
        </p>
      </div>
      <BatchForm items={items ?? []} initialItemId={initialItemId} />
    </div>
  );
}
