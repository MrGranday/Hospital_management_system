-- Supabase grants table-level DML on public tables to anon/authenticated by
-- default, which defeated the column-level grants from the tenancy migration.
-- Restrict the authenticated surface to what the policies actually intend and
-- expose the audit log to authenticated users (rows still filtered by RLS).

revoke insert, update, delete on public.hospitals from anon, authenticated;
revoke insert, update, delete on public.hospital_settings from anon, authenticated;

revoke update on public.hospital_settings from authenticated;
grant update (logo_path, tax_rate, currency, timezone, number_formats)
  on public.hospital_settings to authenticated;

revoke insert, update, delete on public.profiles from anon, authenticated;

revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

revoke insert, update, delete on public.hospital_counters from anon, authenticated;
revoke insert, update, delete on public.roles from anon, authenticated;
revoke insert, update, delete on public.permissions from anon, authenticated;
revoke insert, update, delete on public.role_permissions from anon, authenticated;
revoke insert, update, delete on public.user_roles from anon, authenticated;

grant usage on schema audit to authenticated;
grant select on audit.events to authenticated;
