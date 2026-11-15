"use client";

import { useAppStore, type PageKey } from "@/store/app-store";
import { AppShell } from "@/components/shared/AppShell";
import LoginScreen from "@/features/auth/components/LoginScreen";
import Dashboard from "@/features/dashboard/components/Dashboard";
import Patients from "@/features/patients/components/Patients";
import OPD from "@/features/opd/components/OPD";
import Billing from "@/features/billing/components/Billing";
import Pharmacy from "@/features/pharmacy/components/Pharmacy";
import Lab from "@/features/lab/components/Lab";
import Inventory from "@/features/inventory/components/Inventory";
import Appointments from "@/features/appointments/components/Appointments";
import Emergency from "@/features/emergency/components/Emergency";
import IPD from "@/features/ipd/components/IPD";
import EMR from "@/features/emr/components/EMR";
import Nursing from "@/features/nursing/components/Nursing";
import Radiology from "@/features/radiology/components/Radiology";
import Finance from "@/features/finance/components/Finance";
import HR from "@/features/hr/components/HR";
import Reports from "@/features/reports/components/Reports";
import Communications from "@/_legacy/communications/Communications";
import Telemedicine from "@/_legacy/telemedicine/Telemedicine";
import Settings from "@/features/settings/components/Settings";
import Purchases from "@/features/purchases/components/Purchases";
import BloodBank from "@/features/blood-bank/components/BloodBank";
import ActivityLog from "@/features/audit-log/components/ActivityLog";
import BackupRestore from "@/_legacy/backup-restore/BackupRestore";
import Roles from "@/features/users-roles/components/Roles";
import Suppliers from "@/features/suppliers/components/Suppliers";

export default function Home() {
  const { authenticated, currentPage } = useAppStore();

  if (!authenticated) {
    return <LoginScreen />;
  }

  return (
    <AppShell>
      <PageRouter page={currentPage} />
    </AppShell>
  );
}

function PageRouter({ page }: { page: PageKey }) {
  switch (page) {
    case "dashboard":
      return <Dashboard />;
    case "patients":
      return <Patients />;
    case "opd":
      return <OPD />;
    case "appointments":
      return <Appointments />;
    case "billing":
      return <Billing />;
    case "pharmacy":
      return <Pharmacy />;
    case "lab":
      return <Lab />;
    case "inventory":
      return <Inventory />;
    case "emergency":
      return <Emergency />;
    case "ipd":
      return <IPD />;
    case "emr":
      return <EMR />;
    case "nursing":
      return <Nursing />;
    case "radiology":
      return <Radiology />;
    case "finance":
      return <Finance />;
    case "hr":
      return <HR />;
    case "reports":
      return <Reports />;
    case "communications":
      return <Communications />;
    case "live-consultation":
      return <Telemedicine />;
    case "purchases":
      return <Purchases />;
    case "blood-bank":
      return <BloodBank />;
    case "suppliers":
      return <Suppliers />;
    case "activity-log":
      return <ActivityLog />;
    case "backup":
      return <BackupRestore />;
    case "roles":
      return <Roles />;
    case "settings":
      return <Settings />;
    case "insurance":
    case "services":
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground capitalize">{page.replace("-", " ")}</h1>
            <p className="text-sm text-muted-foreground mt-1">This module is reserved for future expansion.</p>
          </div>
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <p className="text-sm text-muted-foreground">Coming soon — this module will be available in a future release.</p>
          </div>
        </div>
      );
    default:
      return <Dashboard />;
  }
}
