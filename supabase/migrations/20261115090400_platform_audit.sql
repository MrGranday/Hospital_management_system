-- The platform audit log lets the super admin review hospital lifecycle and
-- account provisioning without exposing clinical, billing, HR or stock events.

create policy audit_events_select_platform on audit.events
for select to authenticated
using (
  (select private.is_super_admin())
  and (select private.has_permission('audit:read'))
  and table_name in ('public.hospitals', 'public.profiles', 'public.user_roles')
);
