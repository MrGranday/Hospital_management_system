"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  Phone,
  PhoneOff,
  ScreenShare,
  Settings as SettingsIcon,
  MessageSquare,
  Users,
  Stethoscope,
  Calendar,
  Plus,
  Copy,
  Lock,
  Wifi,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ColorAvatar, StatusPill } from "@/components/shared/ui-bits";
import { useAppStore } from "@/store/app-store";

const UPCOMING_CONSULTATIONS = [
  { id: "tc1", patientName: "Sofia Reyes", mrn: "MRN-2024-0002", doctorName: "Dr. Sarah Chen", time: "11:30", date: "Today", type: "Follow-up", avatarColor: "oklch(0.62 0.150 200)", status: "scheduled" },
  { id: "tc2", patientName: "Daniel Okafor", mrn: "MRN-2024-0005", doctorName: "Dr. Marcus Reed", time: "12:00", date: "Today", type: "New", avatarColor: "oklch(0.535 0.195 245)", status: "scheduled" },
  { id: "tc3", patientName: "Mia Chen", mrn: "MRN-2024-0010", doctorName: "Dr. Sarah Chen", time: "14:30", date: "Today", type: "Follow-up", avatarColor: "oklch(0.62 0.130 240)", status: "scheduled" },
  { id: "tc4", patientName: "Charlotte Dubois", mrn: "MRN-2024-0012", doctorName: "Dr. Sarah Chen", time: "15:00", date: "Today", type: "Post-discharge", avatarColor: "oklch(0.58 0.150 290)", status: "waiting" },
];

const ACTIVE_PARTICIPANTS = [
  { name: "Dr. Sarah Chen", role: "Host", avatarColor: "oklch(0.535 0.195 245)", micOn: true, videoOn: true, isHost: true },
  { name: "Sofia Reyes", role: "Patient", avatarColor: "oklch(0.62 0.150 200)", micOn: true, videoOn: true, isHost: false },
  { name: "Nurse Olivia", role: "Nurse", avatarColor: "oklch(0.62 0.130 240)", micOn: false, videoOn: true, isHost: false },
];

export default function Telemedicine() {
  const [inCall, setInCall] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const { openModal, pushToast, setPage } = useAppStore();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">Telemedicine</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              ONLINE
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Video Consultations</h1>
          <p className="text-sm text-muted-foreground mt-1">Secure HIPAA-compliant telemedicine visits</p>
        </div>
        <Button size="sm" className="h-9 bg-brand-600 hover:bg-brand-700 shadow-blue-glow" onClick={() => openModal("newAppointment")}>
          <Plus className="h-4 w-4 mr-1.5" />
          Schedule Consultation
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main video area */}
        <Card className="lg:col-span-2 border-border/60 shadow-soft rounded-xl overflow-hidden">
          <div className="aspect-video bg-gradient-to-br from-brand-950 to-brand-900 relative grid-pattern-light">
            {inCall ? (
              <>
                {/* Main participant */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 rounded-full bg-brand-600 mx-auto flex items-center justify-center text-white text-4xl font-bold shadow-blue-glow">
                      SR
                    </div>
                    <p className="text-white font-semibold mt-4">Sofia Reyes</p>
                    <p className="text-brand-200 text-sm">Patient · Speaking</p>
                  </div>
                </div>

                {/* Self preview */}
                <div className="absolute bottom-4 right-4 w-32 h-24 bg-brand-700 rounded-lg border-2 border-white/20 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold">
                    SC
                  </div>
                </div>

                {/* Top bar */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 backdrop-blur-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1" />
                      REC 00:12:34
                    </Badge>
                    <Badge variant="outline" className="bg-white/10 text-white border-white/20 backdrop-blur-sm">
                      <Lock className="h-3 w-3 mr-1" />
                      Encrypted
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-white/80 text-xs">
                    <Wifi className="h-4 w-4 text-emerald-400" />
                    HD Quality
                  </div>
                </div>

                {/* Controls */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10">
                  <ControlButton active={micOn} onClick={() => setMicOn(!micOn)} activeIcon={Mic} inactiveIcon={MicOff} label="Mic" />
                  <ControlButton active={videoOn} onClick={() => setVideoOn(!videoOn)} activeIcon={Video} inactiveIcon={VideoOff} label="Video" />
                  <ControlButton active={true} onClick={() => pushToast({ title: "Feature in demo", variant: "info" })} activeIcon={ScreenShare} inactiveIcon={ScreenShare} label="Share" />
                  <ControlButton active={true} onClick={() => pushToast({ title: "Feature in demo", variant: "info" })} activeIcon={MessageSquare} inactiveIcon={MessageSquare} label="Chat" />
                  <ControlButton active={true} onClick={() => pushToast({ title: "Feature in demo", variant: "info" })} activeIcon={SettingsIcon} inactiveIcon={SettingsIcon} label="Settings" />
                  <div className="w-px h-8 bg-white/20 mx-1" />
                  <button
                    onClick={() => setInCall(false)}
                    className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-700 flex items-center justify-center text-white transition-colors"
                  >
                    <PhoneOff className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-4">
                    <Video className="h-10 w-10 text-white" />
                  </div>
                  <p className="text-white font-semibold text-lg">No active consultation</p>
                  <p className="text-brand-200 text-sm mt-1">Start a call from the upcoming list</p>
                  <Button
                    size="sm"
                    className="mt-4 bg-white text-brand-700 hover:bg-white/90"
                    onClick={() => setInCall(true)}
                  >
                    <Phone className="h-4 w-4 mr-1.5" />
                    Start Test Call
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Participants bar */}
          {inCall && (
            <div className="p-4 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-brand-600" />
                  Participants ({ACTIVE_PARTICIPANTS.length})
                </h3>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => pushToast({ title: "Invite link copied", variant: "success" })}>
                  Invite
                </Button>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto">
                {ACTIVE_PARTICIPANTS.map((p) => (
                  <div key={p.name} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/30 border border-border/50 shrink-0">
                    <ColorAvatar name={p.name} color={p.avatarColor} size="sm" />
                    <div>
                      <p className="text-xs font-medium">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">{p.role}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      {p.micOn ? <Mic className="h-3 w-3 text-emerald-600" /> : <MicOff className="h-3 w-3 text-muted-foreground" />}
                      {p.videoOn ? <Video className="h-3 w-3 text-emerald-600" /> : <VideoOff className="h-3 w-3 text-muted-foreground" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Meeting info */}
          <Card className="border-border/60 shadow-soft rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-3">Meeting Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Meeting ID</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-mono text-xs">med-core-tc-8x2k</p>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => navigator.clipboard.writeText("med-core-tc-8x2k").then(() => pushToast({ title: "Copied", variant: "success" }))} aria-label="Copy meeting ID">
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Join Link</p>
                <p className="font-mono text-xs text-brand-600 mt-1 truncate">telemed.medicore.io/j/8x2k</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Encryption</p>
                <p className="text-xs mt-1 flex items-center gap-1">
                  <Lock className="h-3 w-3 text-emerald-600" />
                  End-to-end encrypted
                </p>
              </div>
            </div>
          </Card>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-border/60 shadow-soft rounded-xl p-4">
              <Video className="h-5 w-5 text-brand-600 mb-2" />
              <p className="text-xl font-bold tabular-nums">12</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Today's Calls</p>
            </Card>
            <Card className="border-border/60 shadow-soft rounded-xl p-4">
              <Calendar className="h-5 w-5 text-emerald-600 mb-2" />
              <p className="text-xl font-bold tabular-nums">48</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">This Week</p>
            </Card>
          </div>
        </div>
      </div>

      {/* Upcoming consultations */}
      <Card className="border-border/60 shadow-soft rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground">Upcoming Consultations</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Today's scheduled telemedicine visits</p>
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setPage("appointments")}>
            View Calendar
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {UPCOMING_CONSULTATIONS.map((cons, i) => (
            <motion.div
              key={cons.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              whileHover={{ y: -2 }}
            >
              <Card className="border-border/60 shadow-soft hover:shadow-premium transition-all rounded-xl p-4 h-full">
                <div className="flex items-start gap-3 mb-3">
                  <ColorAvatar name={cons.patientName} color={cons.avatarColor} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{cons.patientName}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{cons.mrn}</p>
                  </div>
                  {cons.status === "waiting" && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-semibold tabular-nums">{cons.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Doctor</span>
                    <span className="font-medium">{cons.doctorName.split(" ").slice(-1)[0]}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <Badge variant="outline" className="text-[10px]">{cons.type}</Badge>
                  </div>
                </div>
                <Button
                  size="sm"
                  className={`w-full mt-3 h-8 text-xs ${cons.status === "waiting" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-brand-600 hover:bg-brand-700"}`}
                  onClick={() => setInCall(true)}
                >
                  <Video className="h-3.5 w-3.5 mr-1" />
                  {cons.status === "waiting" ? "Join Now" : "Start Call"}
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ControlButton({
  active,
  onClick,
  activeIcon: ActiveIcon,
  inactiveIcon: InactiveIcon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  activeIcon: React.ElementType;
  inactiveIcon: React.ElementType;
  label: string;
}) {
  const Icon = active ? ActiveIcon : InactiveIcon;
  return (
    <button
      onClick={onClick}
      title={label}
      className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
        active
          ? "bg-white/10 hover:bg-white/20 text-white"
          : "bg-rose-600 hover:bg-rose-700 text-white"
      }`}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
