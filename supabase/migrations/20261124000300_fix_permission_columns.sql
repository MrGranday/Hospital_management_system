-- Add label column to permissions table (missing from original migration).
alter table public.permissions
  add column if not exists label text not null default '';

-- Backfill label from key for existing permissions.
update public.permissions
set label = initcap(replace(key, '_', ' '))
where label = '' or label is null;

-- Add description column to roles if missing (migration 1 added it but ensure).
alter table public.roles
  add column if not exists description text;
