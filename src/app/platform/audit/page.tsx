import type { Metadata } from "next";

import { listPlatformAuditEvents } from "@/server/platform/hospitals";

export const metadata: Metadata = {
  title: "Platform audit log",
};

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));
}

export default async function PlatformAuditPage() {
  const events = await listPlatformAuditEvents();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform audit log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hospital lifecycle and account provisioning events. Clinical, billing, HR and stock
          events are not visible here.
        </p>
      </div>

      {events.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No platform events yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">When</th>
                <th className="px-4 py-2 font-medium">Action</th>
                <th className="px-4 py-2 font-medium">Table</th>
                <th className="px-4 py-2 font-medium">Actor role</th>
                <th className="px-4 py-2 font-medium">Record</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={`${event.occurred_at}-${event.id}`} className="border-t border-border">
                  <td className="whitespace-nowrap px-4 py-2 text-xs text-muted-foreground">
                    {formatTimestamp(event.occurred_at)}
                  </td>
                  <td className="px-4 py-2 font-medium">{event.action}</td>
                  <td className="px-4 py-2 font-mono text-xs">{event.table_name}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">
                    {event.actor_role ?? "—"}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                    {event.record_id ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
