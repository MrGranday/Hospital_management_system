import { redirect } from "next/navigation";

import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";
import { listAssignableRoles, listStaff } from "@/server/admin/staff";

import CreateStaffForm from "./create-staff-form";
import StaffRowActions from "./staff-row-actions";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (!context.hospitalId) redirect("/");

  if (!hasPermission(context, "users:read")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Staff accounts</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view staff accounts.
        </p>
      </div>
    );
  }

  const [members, roles] = await Promise.all([
    listStaff(context.hospitalId),
    listAssignableRoles(),
  ]);
  const canManage = hasPermission(context, "users:manage");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Staff &amp; access</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage staff accounts for your hospital. Every change is written to the audit log.
        </p>
      </div>

      {hasPermission(context, "users:create") ? <CreateStaffForm roles={roles} /> : null}

      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Accounts</h2>
          <p className="text-xs text-muted-foreground">{members.length} staff account(s)</p>
        </div>

        {members.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No staff accounts yet. Create the first one above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Name
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Username
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Role
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.userId} className="border-t border-border align-top">
                    <td className="px-4 py-3">
                      <span className="font-medium">{member.fullName}</span>
                      {member.mustChangePassword ? (
                        <span className="ml-2 text-xs text-muted-foreground">
                          Password change pending
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{member.username}</td>
                    <td className="px-4 py-3">
                      {member.roleName ?? <span className="text-muted-foreground">No role</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          member.isActive
                            ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-900"
                            : "rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                        }
                      >
                        {member.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {canManage ? (
                        <StaffRowActions
                          member={member}
                          roles={roles}
                          isSelf={member.userId === context.userId}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">Read-only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
