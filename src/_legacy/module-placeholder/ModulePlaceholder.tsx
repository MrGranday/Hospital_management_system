"use client";

import { motion } from "framer-motion";
import {
  type LucideIcon,
  Construction,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore, type PageKey } from "@/store/app-store";

interface ModulePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  features: string[];
  comingSoon?: boolean;
}

export function ModulePlaceholder({ title, description, icon: Icon, features, comingSoon = true }: ModulePlaceholderProps) {
  const { setPage } = useAppStore();
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-brand-600 uppercase tracking-wider">Module</span>
          {comingSoon && (
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md font-medium">
              <Sparkles className="h-2.5 w-2.5" />
              In Design
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      <Card className="border-border/60 shadow-soft rounded-2xl p-12 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-md mx-auto"
        >
          <div className="relative inline-flex">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500/10 to-brand-500/5 flex items-center justify-center">
              <Icon className="h-10 w-10 text-brand-600" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-100 border-2 border-background flex items-center justify-center">
              <Construction className="h-4 w-4 text-amber-600" />
            </div>
          </div>

          <h2 className="text-xl font-bold mt-6">{title} — Under Construction</h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            We&apos;re crafting this module with the same care as the rest of MediCore.
            Here&apos;s what you can expect when it lands:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 text-left">
            {features.map((f, i) => (
              <motion.div
                key={f}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-accent/30 border border-border/50"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                <span className="text-xs text-foreground">{f}</span>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => setPage("dashboard")}
            >
              Back to Dashboard
            </Button>
            <Button
              size="sm"
              className="h-9 bg-brand-600 hover:bg-brand-700"
              onClick={() => setPage("patients" as PageKey)}
            >
              Explore Patients
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </motion.div>
      </Card>
    </div>
  );
}
