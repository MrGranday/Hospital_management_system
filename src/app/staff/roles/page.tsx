import { redirect } from "next/navigation";

import { hasPermission } from "@/server/auth/require-permission";
import { getAuthContext } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

export const dynamic = "force-dynamic";

export default async function StaffRolesPage() {
  const context = await getAuthContext();
  if (!context) redirect("/login");

  if (!hasPermission(context, "roles:read")) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold">Roles</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view roles.
        </p>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: roles, error: roleError }, { data: grants }, { data: permissions }] =
    await Promise.all([
      supabase.from("roles").select("id, key, name").order("name"),
      supabase.from("role_permissions").select("role_id, permission_id"),
      supabase.from("permissions").select("id, key").order("key"),
    ]);

  if (roleError) throw new Error(roleError.message);

  const permissionKeyById = new Map((permissions ?? []).map((p) => [p.id, p.key]));
  const permissionsByRole = new Map<string, string[]>();
  for (const grant of grants ?? []) {
    const key = permissionKeyById.get(grant.permission_id);
    if (!key) continue;
    const list = permissionsByRole.get(grant.role_id) ?? [];
    list.push(key);
    permissionsByRole.set(grant.role_id, list);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Roles</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          System roles and their permissions. Roles are data-driven; this page is read-only.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {(roles ?? []).map((role) => {
          const keys = (permissionsByRole.get(role.id) ?? []).sort();
          return (
            <section key={role.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-sm font-semibold">{role.name}</h2>
                <span className="font-mono text-xs text-muted-foreground">{role.key}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {keys.length} permission{keys.length === 1 ? "" : "s"}
              </p>
              {keys.length === 0 ? (
                <p className="mt-3 text-xs text-muted-foreground">No permissions granted.</p>
              ) : (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {keys.map((key) => (
                    <li
                      key={key}
                      className="rounded border border-border bg-muted/50 px-1.5 py-0.5 font-mono text-[11px]"
                    >
                      {key}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
