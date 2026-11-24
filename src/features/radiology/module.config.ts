import { defineModule } from "@/modules/defineModule";

export default defineModule({
  key: "radiology",
  name: "Radiology",
  description: "Worklist, walk-in order, reports, attachments, exam catalog",
  requires: [],
  softRequires: ["opd", "finance"],
  sort: 3,
  isDeferred: false,
  nav: [
    { label: "Worklist", href: "/radiology/worklist", permission: "radiology:order:read" },
    { label: "Walk-in order", href: "/radiology/walk-in", permission: "radiology:order:create" },
    { label: "Reports", href: "/radiology/reports", permission: "radiology:report:create" },
    { label: "Exam catalog", href: "/radiology/catalog", permission: "radiology:catalog:manage" },
  ],
  permissions: [
    { key: "radiology:order:read", label: "Read imaging orders" },
    { key: "radiology:order:create", label: "Create imaging orders" },
    { key: "radiology:order:cancel", label: "Cancel imaging orders" },
    { key: "radiology:exam:perform", label: "Perform exams", clinicalAuthoring: false },
    { key: "radiology:report:create", label: "Create reports", clinicalAuthoring: true },
    { key: "radiology:report:sign", label: "Sign reports", clinicalAuthoring: true },
    { key: "radiology:report:print", label: "Print reports", clinicalAuthoring: false },
    { key: "radiology:attachment:upload", label: "Upload attachments", clinicalAuthoring: false },
    { key: "radiology:catalog:manage", label: "Manage exam catalog" },
    { key: "radiology:dashboard:read", label: "Read radiology dashboard" },
  ],
  dashboardWidgets: [
    { key: "radiology.pending", permission: "radiology:dashboard:read", component: "PendingStudies" },
    { key: "radiology.reportedToday", permission: "radiology:dashboard:read", component: "ReportedToday" },
  ],
});
