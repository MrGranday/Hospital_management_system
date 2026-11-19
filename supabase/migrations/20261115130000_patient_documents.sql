-- Patient documents: metadata in public, bytes in a private Storage bucket.
-- Downloads are signed server-side for 60 seconds and write a READ audit event.

create table public.patient_documents (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id),
  patient_id uuid not null references public.patients (id),
  file_name text not null,
  mime_type text not null check (
    mime_type in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')
  ),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  storage_path text not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  version integer not null default 1,
  constraint patient_documents_path_key unique (hospital_id, storage_path)
);

create index patient_documents_patient_idx
  on public.patient_documents (hospital_id, patient_id, created_at desc)
  where deleted_at is null;

create or replace function private.prepare_patient_document_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(auth.uid(), new.created_by);
    new.updated_by := coalesce(auth.uid(), new.updated_by);
  else
    new.hospital_id := old.hospital_id;
    new.patient_id := old.patient_id;
    new.file_name := old.file_name;
    new.mime_type := old.mime_type;
    new.size_bytes := old.size_bytes;
    new.storage_path := old.storage_path;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_by := coalesce(auth.uid(), old.updated_by);
    new.version := old.version + 1;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger patient_documents_prepare
before insert or update on public.patient_documents
for each row execute function private.prepare_patient_document_row();

create or replace function private.guard_patient_document()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.patients p
    where p.id = new.patient_id
      and p.hospital_id = new.hospital_id
      and p.deleted_at is null
  ) then
    raise exception 'invalid_patient';
  end if;
  return new;
end;
$$;

create trigger patient_documents_guard
before insert or update on public.patient_documents
for each row execute function private.guard_patient_document();

create trigger patient_documents_audit
after insert or update or delete on public.patient_documents
for each row execute function private.write_audit_event();

alter table public.patient_documents enable row level security;

create policy patient_documents_select on public.patient_documents
for select to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('patients:read'))
  and deleted_at is null
);

create policy patient_documents_insert on public.patient_documents
for insert to authenticated
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('patients:update'))
);

create policy patient_documents_update on public.patient_documents
for update to authenticated
using (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('patients:update'))
  and deleted_at is null
)
with check (
  hospital_id = (select private.current_hospital_id())
  and (select private.has_permission('patients:update'))
);

revoke all on public.patient_documents from authenticated, anon;
grant select on public.patient_documents to authenticated;
grant insert (
  hospital_id, patient_id, file_name, mime_type, size_bytes, storage_path
) on public.patient_documents to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'patient-documents',
  'patient-documents',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy patient_documents_storage_select on storage.objects
for select to authenticated
using (
  bucket_id = 'patient-documents'
  and (storage.foldername(name))[1] = (select private.current_hospital_id())::text
  and (select private.has_permission('patients:read'))
);

create policy patient_documents_storage_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'patient-documents'
  and (storage.foldername(name))[1] = (select private.current_hospital_id())::text
  and (select private.has_permission('patients:update'))
);

create policy patient_documents_storage_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'patient-documents'
  and (storage.foldername(name))[1] = (select private.current_hospital_id())::text
  and (select private.has_permission('patients:update'))
);

create or replace function public.delete_patient_document(p_document_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.has_permission('patients:update')) then
    raise exception 'not_authorized';
  end if;

  update public.patient_documents
  set deleted_at = now()
  where id = p_document_id
    and hospital_id = private.current_hospital_id()
    and deleted_at is null;

  return found;
end;
$$;

revoke execute on function public.delete_patient_document(uuid) from public, anon;
grant execute on function public.delete_patient_document(uuid) to authenticated;

create or replace function public.log_patient_document_access(p_document_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_hospital uuid := private.current_hospital_id();
  document public.patient_documents;
begin
  if target_hospital is null or not (select private.has_permission('patients:read')) then
    raise exception 'not_authorized';
  end if;

  select * into document
  from public.patient_documents
  where id = p_document_id
    and hospital_id = target_hospital
    and deleted_at is null;

  if document.id is null then
    raise exception 'document_not_found';
  end if;

  insert into audit.events (
    hospital_id, actor_id, actor_role, action, table_name, record_id, after
  ) values (
    target_hospital, auth.uid(), auth.jwt() -> 'app_metadata' ->> 'role',
    'READ', 'public.patient_documents', document.id,
    jsonb_build_object('event', 'download', 'file_name', document.file_name)
  );
end;
$$;

revoke execute on function public.log_patient_document_access(uuid) from public, anon;
grant execute on function public.log_patient_document_access(uuid) to authenticated;
