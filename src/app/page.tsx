import { redirect } from "next/navigation";

import { isMfaSatisfied } from "@/lib/auth/mfa";
import { getAuthContext } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

import HomeClient from "./home-client";

export const dynamic = "force-dynamic";

export default async function Home() {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (context.mustChangePassword) redirect("/change-password");
  if (!isMfaSatisfied(context.role, context.aal)) redirect("/mfa");
  if (context.role === "super_admin") redirect("/platform");

  const supabase = await createSupabaseServerClient();
  const hospitalId = context.hospitalId!;

  // 1. Registered patients count
  const { count: patientsCount } = await supabase
    .from("patients")
    .select("id", { count: "exact", head: true })
    .eq("hospital_id", hospitalId)
    .is("deleted_at", null);

  // 2. Today's appointments count
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { count: appointmentsCount } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("hospital_id", hospitalId)
    .gte("scheduled_at", todayStart.toISOString())
    .lte("scheduled_at", todayEnd.toISOString())
    .is("deleted_at", null);

  // 3. Active visits count
  const { count: activeVisitsCount } = await supabase
    .from("visits")
    .select("id", { count: "exact", head: true })
    .eq("hospital_id", hospitalId)
    .not("status", "in", '("completed","cancelled")')
    .is("deleted_at", null);

  // 4. Pending lab orders
  const { count: pendingLabCount } = await supabase
    .from("lab_orders")
    .select("id", { count: "exact", head: true })
    .eq("hospital_id", hospitalId)
    .in("status", ["ordered", "sample_collected"])
    .is("deleted_at", null);

  // 5. Invoices & collections
  const { data: invoices } = await supabase
    .from("invoices")
    .select("total_minor, currency")
    .eq("hospital_id", hospitalId)
    .is("deleted_at", null);

  const totalInvoiced = (invoices ?? []).reduce((sum, inv) => sum + inv.total_minor, 0);
  const currency = invoices?.[0]?.currency ?? "AFN";

  const { data: payments } = await supabase
    .from("payments")
    .select("amount_minor")
    .eq("hospital_id", hospitalId)
    .is("deleted_at", null);

  const totalCollected = (payments ?? []).reduce((sum, p) => sum + p.amount_minor, 0);
  const outstandingMinor = Math.max(0, totalInvoiced - totalCollected);

  return (
    <HomeClient
      session={{
        id: context.userId,
        name: context.fullName,
        username: context.username,
        role: context.role,
      }}
      kpis={{
        totalPatients: patientsCount ?? 0,
        appointmentsToday: appointmentsCount ?? 0,
        activeVisits: activeVisitsCount ?? 0,
        pendingLabOrders: pendingLabCount ?? 0,
        totalCollectedMinor: totalCollected,
        outstandingMinor: outstandingMinor,
        currency: currency,
      }}
    />
  );
}
