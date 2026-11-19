-- Merged patients are archived (deleted_at) and linked (merged_into_id).
-- The original guard prevented that combination; merging needs both signals.
alter table public.patients
  drop constraint if exists patients_archive_excludes_merge;
