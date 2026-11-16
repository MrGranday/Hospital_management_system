-- Audit events must outlive the hospital they describe; a hard reference made
-- deleting a hospital (an operations runbook action) impossible, because the
-- AFTER DELETE trigger could not insert its own event.

alter table audit.events
  drop constraint if exists events_hospital_id_fkey;
