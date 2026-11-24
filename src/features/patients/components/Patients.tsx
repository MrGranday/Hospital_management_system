"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Plus,
  Download,
  MoreHorizontal,
  Phone,
  Mail,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Users,
  Activity,
  Heart,
  AlertCircle,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PATIENTS, type Patient } from "@/_legacy/mock-data/data";
import { ColorAvatar, StatusPill } from "@/components/shared/ui-bits";
import { useAppStore } from "@/store/app-store";
import { exportToCsv } from "@/lib/print";
import { cn } from "@/lib/utils";

const STATUS_INFO: Record<Patient["status"], { status: "success" | "warning" | "danger" | "info" | "neutral"; label: string }> = {
  active: { status: "success", label: "Active" },
  admitted: { status: "info", label: "Admitted" },
  discharged: { status: "neutral", label: "Discharged" },
  critical: { status: "danger", label: "Critical" },
};

export default function Patients() {
  const { pushToast, logActivity, livePatients, realPatients, openModal } = useAppStore();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const loadingPatients = realPatients === null;
  const pageSize = 8;

  const allPatients = useMemo(
    () => realPatients ?? livePatients,
    [realPatients, livePatients],
  );

  const filtered = useMemo(() => {
    return allPatients.filter((p) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.mrn.toLowerCase().includes(q) ||
        p.phone.includes(q);
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      const matchesGender = genderFilter === "all" || p.gender === genderFilter;
      return matchesSearch && matchesStatus && matchesGender;
    });
  }, [allPatients, search, statusFilter, genderFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const pageWindow = useMemo(() => {
    const windowSize = 5;
    const end = Math.min(totalPages, Math.max(1, page - 2) + windowSize - 1);
    const start = Math.max(1, end - windowSize + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, totalPages]);

  const stats = useMemo(() => {
    return {
      total: allPatients.length,
      active: allPatients.filter((p) => p.status === "active").length,
      admitted: allPatients.filter((p) => p.status === "admitted").length,
      critical: allPatients.filter((p) => p.status === "critical").length,
    };
  }, [allPatients]);

  const handleExport = () => {
    if (filtered.length === 0) { pushToast({ title: "No patients to export", variant: "warning" }); return; }
    const rows = filtered.map((p) => ({
      MRN: p.mrn, Name: p.name, Age: p.age, Gender: p.gender, Phone: p.phone,
      Email: p.email ?? "", BloodType: p.bloodType ?? "", Status: p.status,
      Registered: p.registeredOn, LastVisit: p.lastVisit ?? "", Balance: p.balance,
    }));
    exportToCsv(`medicore-patients-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    logActivity({ action: "Exported patients", category: "patient", details: `${rows.length} patients → CSV` });
    pushToast({ title: "Export Complete ✓", description: `${rows.length} patients downloaded`, variant: "success" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-brand-600 uppercase tracking-wider">Patient Registry</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Patients</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage patient records, histories, and demographics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
          <Button size="sm" className="h-9 bg-brand-600 hover:bg-brand-700" onClick={() => openModal("newPatient")}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Patient
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStat label="Total Patients" value={stats.total} icon={Users} accent="text-brand-600 bg-brand-50" />
        <MiniStat label="Active" value={stats.active} icon={Activity} accent="text-emerald-600 bg-emerald-50" />
        <MiniStat label="Admitted" value={stats.admitted} icon={Heart} accent="text-blue-600 bg-blue-50" />
        <MiniStat label="Critical" value={stats.critical} icon={AlertCircle} accent="text-rose-600 bg-rose-50" />
      </div>

      {/* Table card */}
      <Card className="border-border/60 shadow-soft rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, MRN, or phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              className="h-9"
              onClick={() => setShowFilters((s) => !s)}
            >
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              Filters
            </Button>
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex items-center gap-2 overflow-hidden"
                >
                  <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                    <SelectTrigger className="h-9 w-[130px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="admitted">Admitted</SelectItem>
                      <SelectItem value="discharged">Discharged</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={genderFilter} onValueChange={(v) => { setGenderFilter(v); setPage(1); }}>
                    <SelectTrigger className="h-9 w-[110px]">
                      <SelectValue placeholder="Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="M">Male</SelectItem>
                      <SelectItem value="F">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-accent/30 border-b border-border">
              <tr>
                <Th>Patient</Th>
                <Th>MRN</Th>
                <Th>Age / Gender</Th>
                <Th>Contact</Th>
                <Th>Last Visit</Th>
                <Th>Balance</Th>
                <Th>Status</Th>
                <Th className="text-right pr-4">Action</Th>
              </tr>
            </thead>
            <tbody>
              {loadingPatients && realPatients === null && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Loading patients…
                  </td>
                </tr>
              )}
              <AnimatePresence initial={false}>
                {paginated.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    className="border-b border-border/50 hover:bg-accent/30 transition-colors group cursor-pointer"
                    onClick={() => router.push(`/patients/${p.id}`)}
                  >
                    <Td>
                      <div className="flex items-center gap-3">
                        <ColorAvatar name={p.name} color={p.avatarColor} size="sm" />
                        <div>
                          <p className="font-medium text-foreground group-hover:text-brand-600 transition-colors">{p.name}</p>
                          {p.chronicConditions.length > 0 && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">{p.chronicConditions[0]}</p>
                          )}
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <span className="text-xs font-mono text-muted-foreground">{p.mrn}</span>
                    </Td>
                    <Td>
                      <span className="text-sm">{p.age}y</span>
                      <span className="text-xs text-muted-foreground ml-1">{p.gender === "M" ? "♂" : "♀"}</span>
                    </Td>
                    <Td>
                      <p className="text-xs text-muted-foreground font-mono">{p.phone}</p>
                    </Td>
                    <Td>
                      <span className="text-xs text-muted-foreground">
                        {p.lastVisit ? new Date(p.lastVisit).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                      </span>
                    </Td>
                    <Td>
                      {p.balance > 0 ? (
                        <span className="text-sm font-semibold text-rose-600 tabular-nums">
                          ${p.balance.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </Td>
                    <Td>
                      <StatusPill status={STATUS_INFO[p.status].status}>
                        {STATUS_INFO[p.status].label}
                      </StatusPill>
                    </Td>
                    <Td className="text-right pr-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/patients/${p.id}`);
                        }}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </Td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-accent mx-auto flex items-center justify-center mb-4">
                <Search className="h-7 w-7 text-muted-foreground/50" />
              </div>
              <p className="font-medium text-foreground">No patients found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing <span className="font-medium text-foreground">{(page - 1) * pageSize + 1}</span>–
            <span className="font-medium text-foreground">{Math.min(page * pageSize, filtered.length)}</span> of{" "}
            <span className="font-medium text-foreground">{filtered.length}</span>
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {pageWindow.map((pageNumber) => (
              <Button
                key={pageNumber}
                variant={page === pageNumber ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <PatientDetailDrawer />
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
        className,
      )}
    >
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3", className)}>{children}</td>;
}

function MiniStat({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <Card className="border-border/60 shadow-soft rounded-xl p-4 flex items-center gap-3">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", accent)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xl font-bold tabular-nums">{value}</p>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
      </div>
    </Card>
  );
}

function PatientDetailDrawer() {
  const { selectedPatientId, setSelectedPatient, livePatients } = useAppStore();
  const patient = [...livePatients, ...PATIENTS].find((p) => p.id === selectedPatientId);

  return (
    <AnimatePresence>
      {patient && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedPatient(undefined)}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[480px] bg-background shadow-premium overflow-y-auto"
          >
            <PatientDetailContent patient={patient} onClose={() => setSelectedPatient(undefined)} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function PatientDetailContent({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const { openModal, pushToast, logActivity } = useAppStore();
  const statusInfo = STATUS_INFO[patient.status];

  const handleNewVisit = () => {
    openModal("newAppointment", { patientId: patient.id });
  };

  const handleCollectPayment = () => {
    if (patient.balance <= 0) return;
    openModal("newInvoice", { patientId: patient.id });
    pushToast({ title: "Creating invoice for patient", description: patient.name, variant: "info" });
  };

  return (
    <div>
      {/* Cover */}
      <div className="relative h-32 bg-gradient-to-br from-brand-600 to-brand-800 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Profile header */}
      <div className="px-6 -mt-12 relative">
        <div className="w-24 h-24 rounded-2xl ring-4 ring-background flex items-center justify-center text-white font-bold text-2xl shadow-premium"
          style={{ backgroundColor: patient.avatarColor }}
        >
          {patient.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
        </div>
        <div className="mt-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">{patient.name}</h2>
              <StatusPill status={statusInfo.status}>{statusInfo.label}</StatusPill>
            </div>
            <p className="text-sm text-muted-foreground font-mono mt-1">{patient.mrn}</p>
          </div>
          <Button size="sm" className="bg-brand-600 hover:bg-brand-700" onClick={handleNewVisit}>
            New Visit
          </Button>
        </div>
        <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
          <span>{patient.age} years · {patient.gender === "M" ? "Male" : "Female"}</span>
          <span>•</span>
          <span>Blood: <span className="font-semibold text-foreground">{patient.bloodType || "—"}</span></span>
          <span>•</span>
          <span>Registered {new Date(patient.registeredOn).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Contact */}
        <Section title="Contact Information">
          <div className="space-y-2.5">
            <ContactRow icon={Phone} value={patient.phone} />
            {patient.email && <ContactRow icon={Mail} value={patient.email} />}
            {patient.address && <ContactRow icon={MapPin} value={patient.address} />}
          </div>
        </Section>

        {/* Insurance */}
        {patient.insurance && (
          <Section title="Insurance">
            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/40 border border-border">
              <div>
                <p className="text-sm font-medium">{patient.insurance.provider}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Coverage active</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-emerald-600">{patient.insurance.coverage}%</p>
                <p className="text-[10px] text-muted-foreground uppercase">covered</p>
              </div>
            </div>
          </Section>
        )}

        {/* Allergies */}
        <Section title="Allergies">
          <div className="flex flex-wrap gap-2">
            {patient.allergies.length > 0 ? (
              patient.allergies.map((a) => (
                <Badge key={a} variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                  ⚠ {a}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No known allergies</p>
            )}
          </div>
        </Section>

        {/* Chronic conditions */}
        <Section title="Chronic Conditions">
          <div className="flex flex-wrap gap-2">
            {patient.chronicConditions.length > 0 ? (
              patient.chronicConditions.map((c) => (
                <Badge key={c} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  {c}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">None on record</p>
            )}
          </div>
        </Section>

        {/* Balance */}
        {patient.balance > 0 && (
          <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100/50 border border-rose-200">
            <p className="text-xs text-rose-700 uppercase tracking-wider font-semibold">Outstanding Balance</p>
            <p className="text-2xl font-bold text-rose-700 mt-1 tabular-nums">${patient.balance.toLocaleString()}</p>
            <Button size="sm" variant="outline" className="mt-3 bg-white border-rose-200 text-rose-700 hover:bg-rose-50" onClick={handleCollectPayment}>
              Collect Payment
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2.5">{title}</p>
      {children}
    </div>
  );
}

function ContactRow({ icon: Icon, value }: { icon: React.ElementType; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center shrink-0">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
