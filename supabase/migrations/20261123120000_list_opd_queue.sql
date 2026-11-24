-- OPD queue for the SPA. list_visits is paginated and does not include the
-- patient demographics or latest vitals the queue UI renders, so this read
-- model joins them in one tenant-scoped, permission-checked query.

create or replace function public.list_opd_queue(p_limit integer default 100)
returns table (
  id uuid,
  patient_id uuid,
  patient_name text,
  patient_mrn text,
  patient_age integer,
  patient_sex text,
  provider_id uuid,
  provider_name text,
  status text,
  queue_position integer,
  started_at timestamptz,
  completed_at timestamptz,
  chief_complaint text,
  created_at timestamptz,
  check_in_time text,
  version integer,
  temperature_c numeric,
  heart_rate integer,
  respiratory_rate integer,
  blood_pressure_systolic integer,
  blood_pressure_diastolic integer,
  oxygen_saturation integer,
  weight_kg numeric,
  height_cm numeric,
  recorded_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  with tz as (
    select coalesce(
      (select hs.timezone from public.hospital_settings hs
       where hs.hospital_id = private.current_hospital_id()),
      'UTC'
    ) as zone
  )
  select
    v.id,
    v.patient_id,
    p.full_name,
    p.mrn,
    case
      when p.date_of_birth is null then null
      else extract(year from age(current_date, p.date_of_birth))::integer
    end,
    p.sex,
    v.provider_id,
    pr.full_name,
    v.status,
    v.queue_position,
    v.started_at,
    v.completed_at,
    v.chief_complaint,
    v.created_at,
    to_char(v.created_at at time zone (select zone from tz), 'HH24:MI'),
    v.version,
    vit.temperature_c,
    vit.heart_rate,
    vit.respiratory_rate,
    vit.blood_pressure_systolic,
    vit.blood_pressure_diastolic,
    vit.oxygen_saturation,
    vit.weight_kg,
    vit.height_cm,
    vit.recorded_at
  from public.visits v
  join public.patients p on p.id = v.patient_id
  join public.profiles pr on pr.user_id = v.provider_id
  left join lateral (
    select vt.*
    from public.vitals vt
    where vt.visit_id = v.id
      and vt.hospital_id = v.hospital_id
    order by vt.recorded_at desc
    limit 1
  ) vit on true
  where v.hospital_id = private.current_hospital_id()
    and private.has_permission('visits:read')
    and v.deleted_at is null
    and v.status <> 'cancelled'
    and (v.created_at at time zone (select zone from tz))::date
      = (now() at time zone (select zone from tz))::date
  order by
    case v.status
      when 'waiting' then 0
      when 'vitals' then 1
      when 'consultation' then 2
      else 3
    end,
    v.queue_position asc nulls last,
    v.created_at asc
  limit least(greatest(coalesce(p_limit, 100), 1), 500);
$$;

revoke execute on function public.list_opd_queue(integer) from public, anon;
grant execute on function public.list_opd_queue(integer) to authenticated;
