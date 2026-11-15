"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

// Count-up hook
function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(from + (target - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setValue(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

// Premium card with hover lift effect
export function GlassCard({
  children,
  className,
  hover = true,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={hover ? { y: -2 } : undefined}
      className={cn("transition-shadow", hover && "hover:shadow-premium", className)}
    >
      <Card className="border-border/60 shadow-soft rounded-xl">{children}</Card>
    </motion.div>
  );
}

// === Mini Sparkline ===
export function Sparkline({
  data,
  color = "oklch(0.535 0.195 245)",
  width = 80,
  height = 28,
  fillOpacity = 0.15,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  fillOpacity?: number;
}) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  const points = data.map((v, i) => ({
    x: i * stepX,
    y: height - ((v - min) / range) * (height - 4) - 2,
  }));

  const path = points
    .map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`))
    .join(" ");

  const areaPath = `${path} L ${width},${height} L 0,${height} Z`;
  const gradId = `spark-${color.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={fillOpacity * 2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <motion.path
        d={areaPath}
        fill={`url(#${gradId})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      />
      <motion.path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      <motion.circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={2.5}
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.7 }}
      />
    </svg>
  );
}

// === Modern Premium KPI Card ===
export function KpiCard({
  label,
  value,
  format,
  delta,
  deltaType = "neutral",
  icon: Icon,
  accent = "brand",
  delay = 0,
  sub,
  sparkline,
}: {
  label: string;
  value: number;
  format?: (v: number) => string;
  delta?: string;
  deltaType?: "up" | "down" | "neutral";
  icon: React.ElementType;
  accent?: "brand" | "emerald" | "rose" | "amber" | "violet" | "blue";
  delay?: number;
  sub?: string;
  sparkline?: number[];
}) {
  const accentMap = {
    brand: { bg: "from-brand-500/15 to-brand-500/5", text: "text-brand-600", spark: "oklch(0.535 0.195 245)", glow: "shadow-blue-glow" },
    emerald: { bg: "from-emerald-500/15 to-emerald-500/5", text: "text-emerald-600", spark: "oklch(0.62 0.150 155)", glow: "" },
    rose: { bg: "from-rose-500/15 to-rose-500/5", text: "text-rose-600", spark: "oklch(0.65 0.200 15)", glow: "" },
    amber: { bg: "from-amber-500/15 to-amber-500/5", text: "text-amber-600", spark: "oklch(0.72 0.160 75)", glow: "" },
    violet: { bg: "from-violet-500/15 to-violet-500/5", text: "text-violet-600", spark: "oklch(0.58 0.150 290)", glow: "" },
    blue: { bg: "from-blue-500/15 to-blue-500/5", text: "text-blue-600", spark: "oklch(0.62 0.150 240)", glow: "" },
  };

  const deltaColor =
    deltaType === "up" ? "text-emerald-600 bg-emerald-50" :
    deltaType === "down" ? "text-rose-600 bg-rose-50" :
    "text-muted-foreground bg-muted";

  const animated = useCountUp(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className="h-full"
    >
      <Card className={cn(
        "border-border/60 shadow-soft hover:shadow-premium transition-all rounded-xl overflow-hidden h-full relative group",
      )}>
        {/* Gradient glow on hover */}
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none", accentMap[accent].bg)} />

        <div className="p-5 relative">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
                {label}
              </p>
            </div>
            <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", accentMap[accent].bg, accentMap[accent].text)}>
              <Icon className="h-[18px] w-[18px]" />
            </div>
          </div>

          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[26px] font-bold tracking-tight tabular-nums text-foreground leading-none">
                {format ? format(animated) : animated.toLocaleString()}
              </p>
              <div className="flex items-center gap-1.5 mt-2.5">
                {delta && (
                  <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-0.5", deltaColor)}>
                    {deltaType === "up" && "↑"}
                    {deltaType === "down" && "↓"}
                    {delta}
                  </span>
                )}
                {sub && (
                  <span className="text-xs text-muted-foreground truncate">{sub}</span>
                )}
              </div>
            </div>

            {sparkline && (
              <div className="shrink-0">
                <Sparkline data={sparkline} color={accentMap[accent].spark} width={80} height={32} />
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// Section header
export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// Status pill
export function StatusPill({
  status,
  children,
}: {
  status: "success" | "warning" | "danger" | "info" | "neutral";
  children: React.ReactNode;
}) {
  const colors = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    info: "bg-brand-50 text-brand-700 border-brand-200",
    neutral: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border", colors[status])}>
      {children}
    </span>
  );
}

// Avatar with initials + color
export function ColorAvatar({
  name,
  color,
  size = "md",
}: {
  name: string;
  color: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const sizes = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-xs",
    lg: "h-12 w-12 text-sm",
  };
  return (
    <div
      className={cn("rounded-full flex items-center justify-center font-semibold text-white shrink-0", sizes[size])}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}
