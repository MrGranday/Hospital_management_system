"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Database, Download, Upload, RefreshCw, Trash2, ShieldCheck, AlertTriangle,
  Clock, HardDrive, CheckCircle2, XCircle, Calendar, Settings as SettingsIcon,
  Plus, History,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useAppStore, type BackupRecord } from "@/store/app-store";
import { KpiCard, StatusPill } from "@/components/shell/ui-bits";
import { formatBytes } from "@/lib/storage";
import { can } from "@/lib/rbac";
import { toast } from "@/hooks/use-toast";

const STATUS_META: Record<BackupRecord["status"], { label: string; pill: "success" | "warning" | "danger" | "neutral" }> = {
  completed: { label: "Completed", pill: "success" },
  failed: { label: "Failed", pill: "danger" },
  in_progress: { label: "In Progress", pill: "warning" },
};

export default function BackupRestore() {
  const { backups, createBackup, deleteBackup, restoreBackup, backupSchedule, setBackupSchedule } = useAppStore();
  const [restoreTarget, setRestoreTarget] = useState<BackupRecord | null>(null);
  const [restoreStep, setRestoreStep] = useState<"confirm" | "restoring" | "done" | "error">("confirm");
  const [restoreError, setRestoreError] = useState("");
  const [newBackupName, setNewBackupName] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const role = useAppStore((s) => s.user?.role);
  const canCreate = can(role, "backup", "create");
  const canRestore = can(role, "backup", "restore");
  const canDelete = can(role, "backup", "delete");
  const canManage = can(role, "backup", "manage");

  const stats = useMemo(() => {
    const total = backups.length;
    const completed = backups.filter((b) => b.status === "completed").length;
    const totalSize = backups.reduce((s, b) => s + b.sizeBytes, 0);
    const lastBackup = backups[0]?.timestamp;
    const auto = backups.filter((b) => b.type === "auto").length;
    return { total, completed, totalSize, lastBackup, auto };
  }, [backups]);

  const handleDownload = (b: BackupRecord) => {
    try {
      const raw = localStorage.getItem(b.payloadKey);
      if (!raw) {
        toast({ title: "Backup missing", description: "Payload not found in storage.", variant: "destructive" });
        return;
      }
      const blob = new Blob([raw], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${b.name.replace(/[^a-zA-Z0-9-_]/g, "_")}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Download started", description: a.download });
    } catch (e) {
      toast({ title: "Download failed", variant: "destructive" });
    }
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setRestoreStep("restoring");
    await new Promise((r) => setTimeout(r, 800));
    const result = restoreBackup(restoreTarget.id);
    if (result.ok) {
      setRestoreStep("done");
      toast({ title: "Restore complete", description: `Restored from ${restoreTarget.name}`, variant: "default" });
    } else {
      setRestoreStep("error");
      setRestoreError(result.error ?? "Unknown error");
      toast({ title: "Restore failed", description: result.error, variant: "destructive" });
    }
  };

  const handleCreateManual = () => {
    const name = newBackupName.trim() || `Manual backup ${new Date().toLocaleString()}`;
    const rec = createBackup(name, "manual");
    if (rec) {
      setShowCreateDialog(false);
      setNewBackupName("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-medium text-brand-600 uppercase tracking-wider">Disaster Recovery</span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Backup & Restore</h1>
          <p className="text-sm text-muted-foreground mt-1">Automatic and manual backups. All operations are recorded in the activity log.</p>
        </div>
        {canCreate && (
          <Button size="sm" className="h-9 bg-brand-600 hover:bg-brand-700" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Create Backup
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Total Backups" value={stats.total} icon={Database} accent="brand" delay={0} sub={`${stats.completed} successful`} />
        <KpiCard label="Storage Used" value={stats.totalSize} format={(v) => formatBytes(v)} icon={HardDrive} accent="violet" delay={0.05} sub="across all backups" />
        <KpiCard label="Auto Backups" value={stats.auto} icon={Calendar} accent="amber" delay={0.1} sub={`${backupSchedule.interval} schedule`} />
        <Card className="border-border/60 shadow-soft rounded-xl p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Backup</p>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 text-emerald-600 flex items-center justify-center">
              <Clock className="h-[18px] w-[18px]" />
            </div>
          </div>
          <p className="text-base font-semibold tabular-nums">
            {stats.lastBackup ? new Date(stats.lastBackup).toLocaleDateString() : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.lastBackup ? new Date(stats.lastBackup).toLocaleTimeString() : "never"}
          </p>
        </Card>
      </div>

      {/* Automatic backup schedule */}
      {canManage && (
        <Card className="border-border/60 shadow-soft rounded-xl p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2"><SettingsIcon className="h-4 w-4" /> Automatic Backup Schedule</h3>
              <p className="text-xs text-muted-foreground mt-0.5">System automatically creates a snapshot at the configured interval.</p>
            </div>
            <Switch
              checked={backupSchedule.enabled}
              onCheckedChange={(v) => setBackupSchedule({ enabled: v })}
            />
          </div>
          <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 ${backupSchedule.enabled ? "" : "opacity-50 pointer-events-none"}`}>
            <div>
              <Label className="text-xs">Interval</Label>
              <Select value={backupSchedule.interval} onValueChange={(v: any) => setBackupSchedule({ interval: v })}>
                <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Time</Label>
              <Input type="time" value={backupSchedule.time} onChange={(e) => setBackupSchedule({ time: e.target.value })} className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Retention (days)</Label>
              <Input type="number" min={1} max={365} value={backupSchedule.retentionDays} onChange={(e) => setBackupSchedule({ retentionDays: parseInt(e.target.value) || 30 })} className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Next Backup</Label>
              <div className="h-9 mt-1 flex items-center px-3 rounded-md bg-accent/40 text-xs text-muted-foreground">
                {backupSchedule.enabled && backupSchedule.nextBackupAt ? new Date(backupSchedule.nextBackupAt).toLocaleString() : "Disabled"}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border/60 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Automatic backups include hospital profile, users, suppliers, purchase orders, returns, medicine batches, blood bank, sales, invoices, and activity log.</span>
          </div>
        </Card>
      )}

      {/* Backups list */}
      <Card className="border-border/60 shadow-soft rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2"><History className="h-4 w-4" /> Backup History ({backups.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-accent/30 border-b border-border">
              <tr>
                <Th>Name</Th><Th>Date</Th><Th>Type</Th><Th>Size</Th>
                <Th>Created By</Th><Th>Checksum</Th><Th>Status</Th>
                <Th className="text-right pr-4">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {backups.map((b, i) => (
                <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: i * 0.03 }} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                  <Td><span className="text-sm font-medium">{b.name}</span></Td>
                  <Td>
                    <div className="flex flex-col">
                      <span className="text-xs text-foreground tabular-nums">{new Date(b.timestamp).toLocaleDateString()}</span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">{new Date(b.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </Td>
                  <Td>
                    <Badge variant="outline" className={b.type === "auto" ? "text-violet-700 bg-violet-50" : "text-blue-700 bg-blue-50"}>
                      {b.type}
                    </Badge>
                  </Td>
                  <Td><span className="text-xs tabular-nums">{formatBytes(b.sizeBytes)}</span></Td>
                  <Td><span className="text-xs">{b.createdBy ?? "System"}</span></Td>
                  <Td><span className="text-[10px] font-mono text-muted-foreground">{b.checksum}</span></Td>
                  <Td><StatusPill status={STATUS_META[b.status].pill}>{STATUS_META[b.status].label}</StatusPill></Td>
                  <Td className="text-right pr-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleDownload(b)} title="Download">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      {canRestore && b.status === "completed" && (
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-brand-600 hover:text-brand-700" onClick={() => { setRestoreTarget(b); setRestoreStep("confirm"); setRestoreError(""); }}>
                          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Restore
                        </Button>
                      )}
                      {canDelete && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700" title="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete backup?</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently remove {b.name}. This cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={() => deleteBackup(b.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </Td>
                </motion.tr>
              ))}
              {backups.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-sm text-muted-foreground">No backups yet. Create your first backup to get started.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create backup dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Manual Backup</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">A complete snapshot of all system data will be created and stored locally. You can download it or restore from it later.</p>
            <div>
              <Label htmlFor="backup-name" className="text-xs">Backup Name (optional)</Label>
              <Input id="backup-name" placeholder={`Manual backup ${new Date().toLocaleString()}`} value={newBackupName} onChange={(e) => setNewBackupName(e.target.value)} className="h-9 mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button className="bg-brand-600 hover:bg-brand-700" onClick={handleCreateManual}>
              <Database className="h-4 w-4 mr-1.5" /> Create Backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore dialog (multi-step) */}
      <Dialog open={!!restoreTarget} onOpenChange={(v) => !v && setRestoreTarget(null)}>
        <DialogContent className="max-w-md">
          {restoreStep === "confirm" && restoreTarget && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Restore from Backup
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <p className="text-xs text-amber-800">
                    <strong>Warning:</strong> Restoring will replace <strong>all current data</strong> with the snapshot from
                    <strong> {new Date(restoreTarget.timestamp).toLocaleString()}</strong>. This includes users, suppliers, purchase orders, returns, inventory, blood bank, and activity log.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-[10px] uppercase text-muted-foreground">Backup</p><p className="text-sm font-medium">{restoreTarget.name}</p></div>
                  <div><p className="text-[10px] uppercase text-muted-foreground">Size</p><p className="text-sm font-medium">{formatBytes(restoreTarget.sizeBytes)}</p></div>
                  <div><p className="text-[10px] uppercase text-muted-foreground">Checksum</p><p className="text-sm font-mono">{restoreTarget.checksum}</p></div>
                  <div><p className="text-[10px] uppercase text-muted-foreground">Created By</p><p className="text-sm font-medium">{restoreTarget.createdBy ?? "System"}</p></div>
                </div>
                <p className="text-xs text-muted-foreground">The system will validate the backup checksum before applying any changes. A backup activity log entry will be created.</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRestoreTarget(null)}>Cancel</Button>
                <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleRestore}>
                  <RefreshCw className="h-4 w-4 mr-1.5" /> Restore Now
                </Button>
              </DialogFooter>
            </>
          )}
          {restoreStep === "restoring" && (
            <div className="py-8 text-center">
              <div className="inline-flex w-16 h-16 rounded-full bg-brand-50 items-center justify-center mb-3">
                <RefreshCw className="h-7 w-7 text-brand-600 animate-spin" />
              </div>
              <h3 className="text-sm font-semibold">Restoring from backup...</h3>
              <p className="text-xs text-muted-foreground mt-1">Validating checksum and applying snapshot</p>
            </div>
          )}
          {restoreStep === "done" && (
            <div className="py-8 text-center">
              <div className="inline-flex w-16 h-16 rounded-full bg-emerald-50 items-center justify-center mb-3">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>
              <h3 className="text-sm font-semibold">Restore complete</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4">The system has been restored from the selected backup.</p>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { setRestoreTarget(null); window.location.reload(); }}>
                Reload Application
              </Button>
            </div>
          )}
          {restoreStep === "error" && (
            <div className="py-8 text-center">
              <div className="inline-flex w-16 h-16 rounded-full bg-rose-50 items-center justify-center mb-3">
                <XCircle className="h-7 w-7 text-rose-600" />
              </div>
              <h3 className="text-sm font-semibold">Restore failed</h3>
              <p className="text-xs text-rose-600 mt-1 mb-4">{restoreError}</p>
              <Button variant="outline" onClick={() => setRestoreTarget(null)}>Close</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ${className || ""}`}>{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className || ""}`}>{children}</td>;
}
