"use client";

import { useAppStore, type PageKey } from "@/store/app-store";
import { AppShell } from "@/components/shell/AppShell";
import LoginScreen from "@/components/shell/LoginScreen";
import Dashboard from "@/pages/Dashboard";
import Patients from "@/pages/Patients";
import OPD from "@/pages/OPD";
import Billing from "@/pages/Billing";
import Pharmacy from "@/pages/Pharmacy";
import Lab from "@/pages/Lab";
import Inventory from "@/pages/Inventory";
import Appointments from "@/pages/Appointments";
import Emergency from "@/pages/Emergency";
import IPD from "@/pages/IPD";
import EMR from "@/pages/EMR";
import Nursing from "@/pages/Nursing";
import Radiology from "@/pages/Radiology";
import Finance from "@/pages/Finance";
import HR from "@/pages/HR";
import Reports from "@/pages/Reports";
import Communications from "@/pages/Communications";
import Telemedicine from "@/pages/Telemedicine";
import Settings from "@/pages/Settings";
import Purchases from "@/pages/Purchases";
import BloodBank from "@/pages/BloodBank";
import ActivityLog from "@/pages/ActivityLog";
import BackupRestore from "@/pages/BackupRestore";
import Roles from "@/pages/Roles";
import Suppliers from "@/pages/Suppliers";

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
