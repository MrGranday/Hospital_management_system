"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Stethoscope,
  Lock,
  User as UserIcon,
  ChevronDown,
  ShieldCheck,
  Activity,
  HeartPulse,
  Users,
  ArrowRight,
  Fingerprint,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { USERS_BY_ROLE, ROLE_LABELS, type Role } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/hooks/use-toast";

const DEMO_ACCOUNTS: { role: Role; username: string; password: string }[] = [
  { role: "super_admin", username: "admin", password: "Admin@123" },
  { role: "doctor", username: "doctor", password: "Doctor@123" },
  { role: "nurse", username: "nurse", password: "Nurse@123" },
  { role: "receptionist", username: "reception", password: "Reception@123" },
  { role: "pharmacist", username: "pharmacist", password: "Pharmacist@123" },
  { role: "accountant", username: "accountant", password: "Accountant@123" },
  { role: "inventory_manager", username: "inventory", password: "Inventory@123" },
  { role: "lab_tech", username: "labtech", password: "Labtech@123" },
];

export default function LoginScreen() {
  const login = useAppStore((s) => s.login);
  const pushToast = useAppStore((s) => s.pushToast);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDemo, setShowDemo] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulated auth — accepts any of the demo accounts
    await new Promise((r) => setTimeout(r, 700));
    const account = DEMO_ACCOUNTS.find(
      (a) => a.username === username.trim() && a.password === password,
    );

    if (account) {
      login(account.role);
      toast({ title: "Welcome back", description: `${ROLE_LABELS[account.role]} signed in successfully` });
    } else if (username && password) {
      // Allow any non-empty credentials to log in as doctor (demo mode)
      login("doctor");
      toast({ title: "Signed in (demo mode)", description: "Logged in as Doctor" });
    } else {
      setError("Please enter both username and password.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full mesh-blue relative overflow-hidden flex">
      {/* Decorative floating cards */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <FloatingCard
          className="top-[10%] left-[8%]"
          icon={<Activity className="h-5 w-5 text-brand-200" />}
          label="Live Operations"
          value="96 visits today"
          delay={0.2}
        />
        <FloatingCard
          className="top-[22%] right-[10%]"
          icon={<HeartPulse className="h-5 w-5 text-rose-300" />}
          label="Critical Patients"
          value="3 monitoring"
          delay={0.4}
        />
        <FloatingCard
          className="bottom-[18%] left-[12%]"
          icon={<Users className="h-5 w-5 text-emerald-300" />}
          label="Staff On Duty"
          value="124 clinicians"
          delay={0.6}
        />
        <FloatingCard
          className="bottom-[10%] right-[14%]"
          icon={<ShieldCheck className="h-5 w-5 text-brand-200" />}
          label="HIPAA Compliant"
          value="End-to-end encrypted"
          delay={0.8}
        />
      </div>

      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 w-[44%] relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3"
        >
          <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
            <Stethoscope className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-lg tracking-tight">MediCore</p>
            <p className="text-white/60 text-xs">Enterprise Hospital OS</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="space-y-5 max-w-md"
        >
          <h1 className="text-white font-bold text-4xl xl:text-5xl leading-[1.1] tracking-tight">
            Care delivery,<br />
            <span className="bg-gradient-to-r from-brand-200 to-cyan-200 bg-clip-text text-transparent">
              reimagined.
            </span>
          </h1>
          <p className="text-white/70 text-base leading-relaxed">
            One unified platform for clinicians, nurses, pharmacists, and administrators —
            designed to reduce cognitive load and put patient outcomes first.
          </p>

          <div className="grid grid-cols-3 gap-3 pt-4">
            <StatCard value="20+" label="Modules" />
            <StatCard value="99.99%" label="Uptime" />
            <StatCard value="SOC 2" label="Certified" />
          </div>
        </motion.div>

        <p className="text-white/40 text-xs">
          © 2026 MediCore Systems · Trusted by 240+ hospitals worldwide
        </p>
      </div>

      {/* Right login card */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="glass rounded-2xl shadow-premium p-8">
            {/* Mobile-only logo */}
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <p className="font-semibold text-foreground">MediCore</p>
            </div>

            <div className="mb-7">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Sign in</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enter your credentials to access your workspace
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Username
                </Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    className="pl-9 h-11 bg-white/60 border-white/40"
                    placeholder="e.g. doctor"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Password
                  </Label>
                  <button type="button" className="text-xs text-brand-600 hover:text-brand-700 hover:underline" onClick={() => pushToast({ title: "Password reset", description: "Please contact your administrator to reset your password.", variant: "info" })}>
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    className="pl-9 h-11 bg-white/60 border-white/40"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-brand-600 hover:bg-brand-700 text-white shadow-soft mt-2 group"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign in to MediCore
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                )}
              </Button>

              <button
                type="button"
                onClick={() => setShowDemo((s) => !s)}
                className="w-full flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-3 group"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Quick demo accounts — click a role to sign in
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showDemo ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {showDemo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      {DEMO_ACCOUNTS.map((acc) => (
                        <button
                          key={acc.username}
                          type="button"
                          onClick={() => {
                            // Direct login on role selection (skip form)
                            login(acc.role);
                            toast({ title: "Welcome back", description: `${ROLE_LABELS[acc.role]} signed in successfully` });
                          }}
                          className="text-left px-3 py-2 rounded-lg bg-white/50 hover:bg-white/80 border border-white/40 hover:border-brand-300 transition-all group"
                        >
                          <p className="text-xs font-medium text-foreground leading-tight">
                            {ROLE_LABELS[acc.role]}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                            {acc.username}
                          </p>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            <div className="mt-7 pt-5 border-t border-white/40">
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Fingerprint className="h-3.5 w-3.5" />
                <span>SSO · SAML · LDAP supported</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      <Toaster />
    </div>
  );
}

function FloatingCard({
  className,
  icon,
  label,
  value,
  delay,
}: {
  className?: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className={`absolute ${className} hidden md:block`}
    >
      <div className="glass rounded-xl px-4 py-3 shadow-soft flex items-center gap-3 min-w-[180px]">
        <div className="w-9 h-9 rounded-lg bg-white/40 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{label}</p>
          <p className="text-sm font-semibold text-slate-700">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm px-3 py-3 text-center">
      <p className="text-white font-bold text-lg">{value}</p>
      <p className="text-white/50 text-[10px] uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}
