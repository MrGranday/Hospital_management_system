"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  Stethoscope,
  CircleDot,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { APPOINTMENTS, DOCTORS, type Appointment } from "@/lib/data";
import { ColorAvatar, StatusPill } from "@/components/shared/ui-bits";
import { useAppStore } from "@/store/app-store";

const STATUS_INFO: Record<Appointment["status"], { status: "success" | "warning" | "danger" | "info" | "neutral"; label: string }> = {
  scheduled: { status: "neutral", label: "Scheduled" },
  "checked-in": { status: "info", label: "Checked-in" },
  "in-progress": { status: "warning", label: "In Progress" },
  completed: { status: "success", label: "Completed" },
  cancelled: { status: "danger", label: "Cancelled" },
  "no-show": { status: "danger", label: "No-show" },
};

const TYPE_INFO: Record<Appointment["type"], { color: string; label: string }> = {
  new: { color: "bg-brand-500", label: "New" },
  "follow-up": { color: "bg-emerald-500", label: "Follow-up" },
  emergency: { color: "bg-rose-500", label: "Emergency" },
};

const HOURS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

export default function Appointments() {
  const { openModal, liveAppointments, updateAppointmentStatus, pushToast } = useAppStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<"day" | "week">("day");

  const allAppointments = useMemo(() => [...liveAppointments, ...APPOINTMENTS], [liveAppointments]);

  const dayAppointments = useMemo(() => {
    // "today" in static data means the current selected date — also include live appointments for the selected date
    const sel = selectedDate.toISOString().slice(0, 10);
    return allAppointments
      .filter((a) => a.date === "today" || a.date === sel)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [allAppointments, selectedDate]);

  const shiftDate = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-brand-600 uppercase tracking-wider">Appointment Scheduling</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage patient appointments across all departments</p>
        </div>
        <Button size="sm" className="h-9 bg-brand-600 hover:bg-brand-700" onClick={() => openModal("newAppointment")}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Appointment
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Calendar grid */}
        <Card className="lg:col-span-3 border-border/60 shadow-soft rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => shiftDate(-1)} aria-label="Previous day">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="font-semibold">
                {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </h2>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => shiftDate(1)} aria-label="Next day">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
              <button
                onClick={() => setView("day")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  view === "day" ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setView("week")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  view === "week" ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Week
              </button>
            </div>
          </div>

          <div className="grid grid-cols-[60px_1fr]">
            {/* Hours column */}
            <div className="border-r border-border">
              {HOURS.map((h) => (
                <div key={h} className="h-20 px-2 py-1 text-[10px] font-medium text-muted-foreground border-b border-border/50 text-right tabular-nums">
                  {h}
                </div>
              ))}
            </div>

            {/* Schedule column */}
            <div className="relative">
              {HOURS.map((h, hourIdx) => (
                <div key={h} className="h-20 border-b border-border/50 relative">
                  {dayAppointments
                    .filter((a) => {
                      const aptHour = parseInt(a.time.split(":")[0]);
                      return aptHour === parseInt(h);
                    })
                    .map((apt, i) => {
                      const typeInfo = TYPE_INFO[apt.type];
                      const statusInfo = STATUS_INFO[apt.status];
                      const minutes = parseInt(apt.time.split(":")[1]);
                      const topOffset = (minutes / 60) * 80; // 80px per hour
                      const height = (apt.duration / 60) * 80;
                      return (
                        <motion.div
                          key={apt.id}
                          initial={{ opacity: 0, scale: 0.97 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: hourIdx * 0.05 + i * 0.03 }}
                          className="absolute left-2 right-2 rounded-lg border-l-4 bg-card border-border shadow-soft hover:shadow-premium transition-all cursor-pointer overflow-hidden"
                          style={{
                            top: topOffset,
                            height: Math.max(60, height - 4),
                            borderLeftColor: typeInfo.color,
                          }}
                          onClick={() => {
                            const next: Record<string, Appointment["status"]> = {
                              scheduled: "checked-in", "checked-in": "in-progress", "in-progress": "completed", completed: "completed",
                            };
                            const ns = next[apt.status];
                            if (apt.id.startsWith("apt-")) { updateAppointmentStatus(apt.id, ns); pushToast({ title: `Marked ${ns}`, description: apt.patientName, variant: "success" }); }
                            else pushToast({ title: `Status: ${ns}`, description: `${apt.patientName} (demo data, cannot mutate)`, variant: "info" });
                          }}
                        >
                          <div className="p-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">{apt.patientName}</p>
                                <p className="text-xs text-muted-foreground truncate">{apt.reason}</p>
                              </div>
                              <StatusPill status={statusInfo.status}>{statusInfo.label}</StatusPill>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-0.5">
                                <Clock className="h-3 w-3" />
                                {apt.time}
                              </span>
                              <span className="flex items-center gap-0.5">
                                <Stethoscope className="h-3 w-3" />
                                {apt.doctorName.split(" ").slice(-1)[0]}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Side panel - doctors */}
        <div className="space-y-4">
          <Card className="border-border/60 shadow-soft rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3">Doctors on Schedule</h3>
            <div className="space-y-2">
              {DOCTORS.slice(0, 5).map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/30 transition-colors">
                  <ColorAvatar name={doc.name} color={doc.avatarColor} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{doc.name}</p>
                    <p className="text-[10px] text-muted-foreground">{doc.specialty}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <CircleDot className={`h-3 w-3 ${doc.status === "available" ? "text-emerald-500" : doc.status === "busy" ? "text-amber-500" : "text-muted-foreground"}`} />
                    <span className="text-[10px] text-muted-foreground">{doc.patientsToday}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-border/60 shadow-soft rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3">Today&apos;s Summary</h3>
            <div className="space-y-3">
              <SummaryRow label="Total" value={allAppointments.length} color="bg-brand-500" />
              <SummaryRow label="Completed" value={allAppointments.filter((a) => a.status === "completed").length} color="bg-emerald-500" />
              <SummaryRow label="In Progress" value={allAppointments.filter((a) => a.status === "in-progress").length} color="bg-amber-500" />
              <SummaryRow label="Scheduled" value={allAppointments.filter((a) => a.status === "scheduled" || a.status === "checked-in").length} color="bg-blue-500" />
            </div>
          </Card>

          <Card className="border-border/60 shadow-soft rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3">Appointment Types</h3>
            <div className="space-y-2">
              {(Object.keys(TYPE_INFO) as Appointment["type"][]).map((type) => {
                const count = allAppointments.filter((a) => a.type === type).length;
                return (
                  <div key={type} className="flex items-center gap-2 text-xs">
                    <span className={`w-2.5 h-2.5 rounded-full ${TYPE_INFO[type].color}`} />
                    <span className="flex-1 text-muted-foreground">{TYPE_INFO[type].label}</span>
                    <span className="font-semibold tabular-nums">{count}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${color}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}
