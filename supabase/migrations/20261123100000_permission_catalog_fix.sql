-- Align the permission catalog with the permission keys already enforced by
-- RLS policies and server actions. Without these rows every check fails
-- (private.has_permission returns false), so purchasing, pharmacy dispensing
-- and lab verification are unreachable for every role.

insert into public.permissions (key, module, action) values
  ('purchasing:read', 'purchasing', 'read'),
  ('purchasing:create', 'purchasing', 'create'),
  ('purchasing:update', 'purchasing', 'update'),
  ('pharmacy:read', 'pharmacy', 'read'),
  ('pharmacy:create', 'pharmacy', 'create'),
  ('pharmacy:update', 'pharmacy', 'update'),
  ('lab:verify', 'lab', 'verify')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from (values
  ('hospital_admin', 'purchasing:read'),
  ('hospital_admin', 'pharmacy:read'),
  ('inventory_manager', 'purchasing:read'),
  ('inventory_manager', 'purchasing:create'),
  ('inventory_manager', 'purchasing:update'),
  ('accountant', 'purchasing:read'),
  ('auditor', 'purchasing:read'),
  ('auditor', 'pharmacy:read'),
  ('pharmacist', 'pharmacy:read'),
  ('pharmacist', 'pharmacy:create'),
  ('pharmacist', 'pharmacy:update'),
  ('lab_technician', 'lab:verify')
) as grants(role_key, permission_key)
join public.roles r on r.key = grants.role_key
join public.permissions p on p.key = grants.permission_key
on conflict do nothing;
