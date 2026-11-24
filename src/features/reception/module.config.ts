import { defineModule } from "@/modules/defineModule";

export default defineModule({
  key: "reception",
  name: "Reception",
  description:
    "Patient registration, search, edit, merge, archive, documents; appointments; queue/check-in",
  requires: [],
  softRequires: [],
  sort: 0,
  isDeferred: false,
  nav: [
    { label: "Patients", href: "/patients", permission: "reception:patient:read" },
    { label: "Register patient", href: "/patients/new", permission: "reception:patient:create" },
    { label: "Appointments", href: "/appointments", permission: "reception:appointment:read" },
    { label: "Queue", href: "/queue", permission: "reception:queue:read" },
    { label: "Today's visits", href: "/visits/today", permission: "reception:visit:read" },
  ],
  permissions: [
    { key: "reception:patient:read", label: "Read patients" },
    { key: "reception:patient:create", label: "Create patients" },
    { key: "reception:patient:update", label: "Update patients" },
    { key: "reception:patient:archive", label: "Archive patients" },
    { key: "reception:patient:merge", label: "Merge duplicate patients" },
    { key: "reception:patient:export", label: "Export patients" },
    { key: "reception:patient:print", label: "Print patient records" },
    { key: "reception:allergy:create", label: "Add allergies/alerts", clinicalAuthoring: true },
    { key: "reception:allergy:update", label: "Update allergies/alerts", clinicalAuthoring: true },
    { key: "reception:appointment:read", label: "Read appointments" },
    { key: "reception:appointment:create", label: "Create appointments" },
    { key: "reception:appointment:update", label: "Update appointments" },
    { key: "reception:appointment:cancel", label: "Cancel appointments" },
    { key: "reception:queue:read", label: "Read queue" },
    { key: "reception:queue:manage", label: "Manage queue" },
    { key: "reception:visit:create", label: "Create visits" },
    { key: "reception:dashboard:read", label: "Read reception dashboard" },
  ],
  dashboardWidgets: [
    { key: "reception.patientsToday", permission: "reception:dashboard:read", component: "PatientsToday" },
    { key: "reception.appointmentsToday", permission: "reception:dashboard:read", component: "AppointmentsToday" },
    { key: "reception.queueLength", permission: "reception:dashboard:read", component: "QueueLength" },
    { key: "reception.averageWait", permission: "reception:dashboard:read", component: "AverageWait" },
  ],
});
