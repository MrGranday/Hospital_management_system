import { defineModule } from "@/modules/defineModule";

export default defineModule({
  key: "lab",
  name: "Laboratory",
  description: "Worklist, walk-in order, results, verification, reports/print, test catalog",
  requires: [],
  softRequires: ["opd", "finance"],
  sort: 2,
  isDeferred: false,
  nav: [
    { label: "Worklist", href: "/lab/worklist", permission: "lab:order:read" },
    { label: "Walk-in order", href: "/lab/walk-in", permission: "lab:order:create" },
    { label: "Results", href: "/lab/results", permission: "lab:result:create" },
    { label: "Verification", href: "/lab/verification", permission: "lab:result:verify" },
    { label: "Reports/print", href: "/lab/reports", permission: "lab:report:print" },
    { label: "Test catalog", href: "/lab/catalog", permission: "lab:catalog:manage" },
  ],
  permissions: [
    { key: "lab:order:read", label: "Read lab orders" },
    { key: "lab:order:create", label: "Create lab orders" },
    { key: "lab:order:cancel", label: "Cancel lab orders" },
    { key: "lab:sample:collect", label: "Collect samples", clinicalAuthoring: false },
    { key: "lab:sample:reject", label: "Reject samples", clinicalAuthoring: false },
    { key: "lab:result:create", label: "Enter results", clinicalAuthoring: true },
    { key: "lab:result:amend", label: "Amend results", clinicalAuthoring: true },
    { key: "lab:result:verify", label: "Verify results", clinicalAuthoring: true },
    { key: "lab:report:print", label: "Print lab reports", clinicalAuthoring: false },
    { key: "lab:catalog:read", label: "Read test catalog" },
    { key: "lab:catalog:manage", label: "Manage test catalog" },
    { key: "lab:dashboard:read", label: "Read lab dashboard" },
  ],
  dashboardWidgets: [
    { key: "lab.pending", permission: "lab:dashboard:read", component: "PendingOrders" },
    { key: "lab.inProgress", permission: "lab:dashboard:read", component: "InProgress" },
    { key: "lab.criticalAlerts", permission: "lab:dashboard:read", component: "CriticalAlerts" },
    { key: "lab.averageTurnaround", permission: "lab:dashboard:read", component: "AverageTurnaround" },
  ],
});
