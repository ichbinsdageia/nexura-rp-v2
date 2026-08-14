-- Nexura RP v2 · Supabase production schema
-- Run once in Supabase: SQL Editor → New query → paste → Run.
-- Owner account: ichbinsdageia@gmail.com

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  discord_name text,
  roblox_name text,
  avatar_url text,
  website_role text not null default 'player',
  is_approved boolean not null default false,
  status text not null default 'active' check (status in ('active','suspended','former','pending')),
  suspended_reason text,
  suspended_until timestamptz,
  former_team_role text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  id integer primary key default 1 check (id = 1),
  owner_email text not null default 'ichbinsdageia@gmail.com',
  official_status text not null default 'closed' check (official_status in ('live','planned','preparation','pause','maintenance','closed')),
  roblox_reachable boolean not null default false,
  players integer not null default 0 check (players >= 0),
  max_players integer not null default 40 check (max_players > 0),
  manual_override boolean not null default false,
  server_code text not null default 'NEXURA',
  team_applications_open boolean not null default true,
  maintenance_message text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);
insert into public.app_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.team_positions (
  id text primary key,
  role_key text not null unique,
  label text not null,
  group_name text not null,
  role_rank integer not null default 0,
  open boolean not null default true,
  applications_open boolean not null default true,
  minimum_days integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

alter table public.team_positions
add column if not exists created_at timestamptz not null default now();

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles(id) on delete set null,
  discord_name text not null,
  roblox_name text,
  role_key text not null,
  public boolean not null default true,
  public_status text not null default 'active' check (public_status in ('active','leave','away','hidden','former')),
  public_note text,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  former_public boolean not null default false,
  tribute text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  excerpt text not null default '',
  body text,
  image_url text,
  published boolean not null default false,
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'Community',
  status text not null default 'new' check (status in ('new','reviewing','planned','implemented','rejected')),
  summary text not null,
  author_name text not null default 'Community',
  public boolean not null default true,
  source_submission_id uuid,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'planned' check (status in ('live','planned','preparation','pause','maintenance','closed')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  note text,
  banner_url text,
  approved boolean not null default false,
  published boolean not null default false,
  announced_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gangs (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid,
  name text not null,
  founder text,
  member_count integer not null default 2,
  description text,
  colors text,
  motto text,
  discord_contact text,
  member_roblox_names text,
  logo_url text,
  status text not null default 'pending' check (status in ('pending','question','approved','rejected','archived')),
  published boolean not null default false,
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  type text not null,
  status text not null default 'new' check (status in ('new','in_review','question','interview','accepted','rejected','open','closed','done','approved')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  payload jsonb not null default '{}'::jsonb,
  submitter_name text,
  submitter_user_id uuid references public.profiles(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  public_message text,
  internal_note text,
  decision_reason text,
  retry_after timestamptz,
  retention_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists submissions_type_status_idx on public.submissions(type,status,created_at desc);
create index if not exists submissions_submitter_idx on public.submissions(submitter_user_id,created_at desc);

alter table public.gangs drop constraint if exists gangs_submission_id_fkey;
alter table public.gangs add constraint gangs_submission_id_fkey foreign key (submission_id) references public.submissions(id) on delete set null;
alter table public.ideas drop constraint if exists ideas_source_submission_id_fkey;
alter table public.ideas add constraint ideas_source_submission_id_fkey foreign key (source_submission_id) references public.submissions(id) on delete set null;

create table if not exists public.account_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  discord_name text,
  roblox_name text not null,
  verification_code text not null,
  profile_code_confirmed boolean not null default false,
  ticket_confirmed boolean not null default false,
  admin_checked_by uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','prepared','approved','rejected','revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists account_links_one_active_user on public.account_links(user_id) where status in ('pending','prepared','approved');

create table if not exists public.player_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  roblox_name text not null,
  discord_name text,
  points integer not null default 0 check (points >= 0),
  active_sanction text,
  sanction_until timestamptz,
  internal_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists player_records_user_idx on public.player_records(user_id);
create index if not exists player_records_roblox_idx on public.player_records(lower(roblox_name));

create table if not exists public.player_record_entries (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.player_records(id) on delete cascade,
  category text not null,
  severity text not null default 'light' check (severity in ('light','medium','severe','critical')),
  points integer not null default 0 check (points >= 0),
  reason text not null,
  evidence jsonb not null default '[]'::jsonb,
  witnesses text,
  suggested_sanction text,
  final_sanction text,
  expires_at timestamptz,
  is_public boolean not null default true,
  internal_note text,
  created_by uuid references public.profiles(id) on delete set null,
  confirmed_by uuid references public.profiles(id) on delete set null,
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists player_entries_record_idx on public.player_record_entries(record_id,created_at desc);

create table if not exists public.team_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  discord_name text not null,
  roblox_name text,
  role_key text not null,
  previous_role_key text,
  status text not null default 'active' check (status in ('active','probation','leave','away','suspended','former')),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  probation_started_at timestamptz,
  probation_target_at timestamptz,
  rating numeric(3,2) not null default 0,
  internal_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists team_records_user_idx on public.team_records(user_id);

create table if not exists public.team_record_entries (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.team_records(id) on delete cascade,
  entry_type text not null,
  title text not null,
  details text,
  score numeric(3,2),
  result text,
  visible_to_subject boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workflow_requests (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('promotion','promotion_interest','absence','exit','rule_change','mfa_reset','role_approval','other')),
  subject_user_id uuid references public.profiles(id) on delete set null,
  subject_name text not null,
  target_role text,
  period text,
  starts_at timestamptz,
  ends_at timestamptz,
  reason text not null,
  handover text,
  status text not null default 'in_review' check (status in ('new','in_review','question','approved','rejected','done','cancelled')),
  created_by uuid references public.profiles(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  decided_by uuid references public.profiles(id) on delete set null,
  decision_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  owner_name text,
  status text not null default 'planned' check (status in ('planned','in_progress','blocked','done','archived')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  due_at timestamptz,
  description text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.internal_rules (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  change_summary text not null,
  content jsonb not null default '{}'::jsonb,
  affected_roles text[] not null default array['all']::text[],
  critical boolean not null default false,
  test_required boolean not null default false,
  ack_deadline_days integer not null default 3,
  published_at timestamptz not null default now(),
  published_by uuid references public.profiles(id) on delete set null,
  archived boolean not null default false
);

create table if not exists public.internal_rule_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references public.internal_rules(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  confirmed_at timestamptz not null default now(),
  test_score integer,
  test_passed boolean,
  unique(rule_id,user_id)
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_name text,
  target_type text,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_created_idx on public.audit_log(created_at desc);

-- Updated-at helper
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

do $$
declare t text;
begin
  foreach t in array array['profiles','app_settings','team_positions','team_members','news','ideas','sessions','gangs','submissions','account_links','player_records','player_record_entries','team_records','team_record_entries','workflow_requests','projects'] loop
    execute format('drop trigger if exists touch_updated_at on public.%I', t);
    execute format('create trigger touch_updated_at before update on public.%I for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- Role and access helpers. SECURITY DEFINER prevents recursive profile RLS.
create or replace function public.role_rank(role_key text) returns integer
language sql immutable as $$
select case role_key
  when 'owner' then 100 when 'co_owner' then 95 when 'project_management' then 90 when 'leadership' then 88 when 'teamlead' then 85
  when 'hr_lead' then 80 when 'head_admin' then 78 when 'hr_manager' then 76 when 'lead_admin' then 74 when 'hr_staff' then 72
  when 'senior_admin' then 70 when 'admin' then 66 when 'junior_admin' then 62 when 'test_admin' then 58
  when 'head_mod' then 56 when 'senior_mod' then 52 when 'moderator' then 48 when 'junior_mod' then 44 when 'test_mod' then 40
  when 'head_support' then 38 when 'senior_support' then 34 when 'supporter' then 30 when 'junior_support' then 26 when 'test_support' then 20
  else 0 end $$;

create or replace function public.current_role() returns text
language sql stable security definer set search_path = public as $$
  select coalesce((
    select website_role
    from public.profiles
    where id = auth.uid()
      and is_approved = true
      and status = 'active'
      and (suspended_until is null or suspended_until <= now())
  ), 'player')
$$;
create or replace function public.current_rank() returns integer language sql stable as $$ select public.role_rank(public.current_role()) $$;
create or replace function public.has_aal2() returns boolean language sql stable as $$ select coalesce(auth.jwt()->>'aal','aal1') = 'aal2' $$;
create or replace function public.role_requires_mfa(role_key text) returns boolean language sql immutable as $$
  select role_key in (
    'test_admin','junior_admin','admin','senior_admin','lead_admin','head_admin',
    'teamlead','leadership','project_management','co_owner','owner'
  )
$$;
create or replace function public.mfa_ok() returns boolean language sql stable as $$
  select not public.role_requires_mfa(public.current_role()) or public.has_aal2()
$$;
create or replace function public.is_owner() returns boolean language sql stable as $$ select public.current_role() = 'owner' and public.mfa_ok() $$;
create or replace function public.is_team() returns boolean language sql stable as $$ select public.current_role() <> 'player' and public.mfa_ok() $$;
create or replace function public.is_leadership() returns boolean language sql stable as $$
  select public.current_role() in ('teamlead','leadership','project_management','co_owner','owner') and public.mfa_ok()
$$;
create or replace function public.is_hr_branch() returns boolean language sql stable as $$
  select public.current_role() in ('hr_staff','hr_manager','hr_lead') or public.is_leadership()
$$;
create or replace function public.is_admin_branch() returns boolean language sql stable as $$
  select (public.current_role() in ('test_admin','junior_admin','admin','senior_admin','lead_admin','head_admin') and public.mfa_ok()) or public.is_leadership()
$$;
create or replace function public.is_moderation_branch() returns boolean language sql stable as $$
  select public.current_role() in ('test_mod','junior_mod','moderator','senior_mod','head_mod') or public.is_admin_branch()
$$;
create or replace function public.is_support_branch() returns boolean language sql stable as $$
  select public.current_role() in ('test_support','junior_support','supporter','senior_support','head_support') or public.is_moderation_branch()
$$;


create or replace function public.can_read_submission(row_type text, row_payload jsonb) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare r text := public.current_role(); category text := coalesce(row_payload->>'category','');
begin
  if public.is_leadership() then return true; end if;
  if row_type = 'team_application' or category in ('Teammitglied melden','Team-Bewerbung') then return public.is_hr_branch(); end if;
  if row_type in ('gang_application','partnership','creator') then return public.is_admin_branch() or public.is_hr_branch(); end if;
  if row_type in ('appeal','player_report') or category in ('Spieler melden','Ban- oder Sanktionseinspruch','Roblox-Name oder Accountverknüpfung') then return public.is_moderation_branch(); end if;
  if row_type in ('idea','feedback','rp_nomination','support_rating','support') then return public.is_support_branch(); end if;
  return public.is_admin_branch();
end $$;

create or replace function public.can_manage_submission(row_type text, row_payload jsonb) returns boolean
language sql stable as $$
  select public.is_leadership()
    or (row_type = 'team_application' and public.is_hr_branch())
    or (row_type in ('appeal','player_report') and public.is_admin_branch())
    or (row_type = 'gang_application' and public.is_admin_branch())
    or (row_type in ('idea','feedback','rp_nomination','support_rating','support') and (public.current_role() in ('head_support') or public.is_moderation_branch()))
    or (row_type in ('partnership','creator') and (public.is_hr_branch() or public.is_admin_branch()))
$$;

-- Owner bootstrap and safe profile creation.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare is_owner_email boolean := lower(coalesce(new.email,'')) = 'ichbinsdageia@gmail.com' and new.email_confirmed_at is not null;
begin
  insert into public.profiles (id,email,discord_name,avatar_url,website_role,is_approved,status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name',new.raw_user_meta_data->>'user_name'),
    new.raw_user_meta_data->>'avatar_url',
    case when is_owner_email then 'owner' else 'player' end,
    is_owner_email,
    case when is_owner_email then 'active' else 'pending' end
  ) on conflict (id) do update set
    email = excluded.email,
    discord_name = coalesce(public.profiles.discord_name, excluded.discord_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    website_role = case when is_owner_email then 'owner' else public.profiles.website_role end,
    is_approved = case when is_owner_email then true else public.profiles.is_approved end,
    status = case when is_owner_email then 'active' else public.profiles.status end;
  if is_owner_email then
    update public.team_members set user_id = new.id where role_key = 'owner' and lower(discord_name) = 'vibevisionde';
    update public.team_records set user_id = new.id where role_key = 'owner' and lower(discord_name) = 'vibevisionde';
  end if;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert or update of email,raw_user_meta_data,email_confirmed_at on auth.users for each row execute function public.handle_new_user();

create or replace function public.protect_profile_privileges() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() = old.id and not public.is_owner() then
    if new.website_role is distinct from old.website_role or new.is_approved is distinct from old.is_approved or new.status is distinct from old.status or new.suspended_until is distinct from old.suspended_until or new.former_team_role is distinct from old.former_team_role then
      raise exception 'Privilegierte Profilfelder dürfen nicht selbst geändert werden.';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges before update on public.profiles for each row execute function public.protect_profile_privileges();

create or replace function public.protect_session_approval() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.approved is distinct from old.approved or new.published is distinct from old.published) and not public.is_leadership() then
    raise exception 'Nur Teamleitung oder Owner dürfen Sessions freigeben.';
  end if;
  return new;
end $$;
drop trigger if exists protect_session_approval on public.sessions;
create trigger protect_session_approval before update on public.sessions for each row execute function public.protect_session_approval();

create or replace function public.protect_account_link_approval() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status in ('approved','revoked') and new.status is distinct from old.status and not public.is_leadership() then
    raise exception 'Die endgültige Verknüpfung benötigt Teamleitung oder Owner.';
  end if;
  return new;
end $$;
drop trigger if exists protect_account_link_approval on public.account_links;
create trigger protect_account_link_approval before update on public.account_links for each row execute function public.protect_account_link_approval();

create or replace function public.protect_account_link_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() = old.user_id and not public.is_admin_branch() then
    if new.profile_code_confirmed = true
      or new.ticket_confirmed = true
      or new.admin_checked_by is not null
      or new.approved_by is not null
      or new.status not in ('pending') then
      raise exception 'Bestätigungsfelder dürfen nicht selbst gesetzt werden.';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists protect_account_link_fields on public.account_links;
create trigger protect_account_link_fields before update on public.account_links for each row execute function public.protect_account_link_fields();

create or replace function public.protect_submission_decisions() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and new.status in ('accepted','rejected','approved') then
    if old.type in ('team_application','appeal') and not public.is_leadership() then
      raise exception 'Die endgültige Entscheidung benötigt Teamleitung oder Owner.';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists protect_submission_decisions on public.submissions;
create trigger protect_submission_decisions before update on public.submissions for each row execute function public.protect_submission_decisions();

create or replace function public.protect_workflow_decisions() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and new.status in ('approved','rejected','done') then
    if old.type = 'promotion' and not public.is_leadership() then
      raise exception 'Beförderungen benötigen Teamleitung oder Owner.';
    elsif old.type in ('absence','exit') and not public.is_hr_branch() then
      raise exception 'Abwesenheit und Austritt benötigen HR, Teamleitung oder Owner.';
    elsif old.type = 'mfa_reset' and not public.is_leadership() then
      raise exception '2FA-Reset-Anfragen benötigen Teamleitung oder Owner.';
    elsif old.type = 'role_approval' and not public.is_owner() then
      raise exception 'Website-Rollen werden nur durch den Owner bestätigt.';
    elsif old.type = 'rule_change' and new.status = 'done' and not public.is_owner() then
      raise exception 'Regeländerungen werden nur durch den Owner veröffentlicht.';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists protect_workflow_decisions on public.workflow_requests;
create trigger protect_workflow_decisions before update on public.workflow_requests for each row execute function public.protect_workflow_decisions();

-- Generic owner-only audit history. Application inserts may add richer events as well.
create or replace function public.audit_row_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare actor text; target text; detail jsonb;
begin
  if auth.uid() is null then return coalesce(new,old); end if;
  select coalesce(discord_name,email,auth.uid()::text) into actor from public.profiles where id = auth.uid();
  target := coalesce((case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end)->>'id','');
  detail := jsonb_build_object('operation',tg_op,'table',tg_table_name);
  insert into public.audit_log(action,actor_id,actor_name,target_type,target_id,details)
  values (lower(tg_table_name)||'.'||lower(tg_op),auth.uid(),actor,tg_table_name,target,detail);
  return coalesce(new,old);
end $$;

do $$
declare t text;
begin
  foreach t in array array['profiles','app_settings','team_positions','team_members','news','ideas','sessions','gangs','submissions','account_links','player_records','player_record_entries','team_records','team_record_entries','workflow_requests','projects','internal_rules','internal_rule_acknowledgements'] loop
    execute format('drop trigger if exists audit_row_change on public.%I', t);
    execute format('create trigger audit_row_change after insert or update or delete on public.%I for each row execute function public.audit_row_change()', t);
  end loop;
end $$;

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.app_settings enable row level security;
alter table public.team_positions enable row level security;
alter table public.team_members enable row level security;
alter table public.news enable row level security;
alter table public.ideas enable row level security;
alter table public.sessions enable row level security;
alter table public.gangs enable row level security;
alter table public.submissions enable row level security;
alter table public.account_links enable row level security;
alter table public.player_records enable row level security;
alter table public.player_record_entries enable row level security;
alter table public.team_records enable row level security;
alter table public.team_record_entries enable row level security;
alter table public.workflow_requests enable row level security;
alter table public.projects enable row level security;
alter table public.internal_rules enable row level security;
alter table public.internal_rule_acknowledgements enable row level security;
alter table public.audit_log enable row level security;

-- Drop/recreate policies for repeatable setup.
do $$
declare rec record;
begin
  for rec in select schemaname,tablename,policyname from pg_policies where schemaname='public' and tablename in ('profiles','app_settings','team_positions','team_members','news','ideas','sessions','gangs','submissions','account_links','player_records','player_record_entries','team_records','team_record_entries','workflow_requests','projects','internal_rules','internal_rule_acknowledgements','audit_log') loop
    execute format('drop policy if exists %I on %I.%I',rec.policyname,rec.schemaname,rec.tablename);
  end loop;
end $$;

create policy profiles_select on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin_branch() or public.is_hr_branch());
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid() or public.is_owner()) with check (id = auth.uid() or public.is_owner());

create policy settings_public_read on public.app_settings for select using (true);
create policy settings_owner_update on public.app_settings for update to authenticated using (public.is_owner()) with check (public.is_owner());

create policy positions_public_read on public.team_positions for select using (true);
create policy positions_owner_manage on public.team_positions for all to authenticated using (public.is_owner()) with check (public.is_owner());

create policy team_members_public_read on public.team_members for select using (public = true or public.is_admin_branch() or public.is_hr_branch() or user_id = auth.uid());
create policy team_members_owner_manage on public.team_members for all to authenticated using (public.is_owner()) with check (public.is_owner());

create policy news_public_read on public.news for select using (published = true or public.current_role() = 'head_support' or public.is_leadership());
create policy news_manage on public.news for all to authenticated using (public.current_role() = 'head_support' or public.is_leadership()) with check (public.current_role() = 'head_support' or public.is_leadership());
create policy ideas_public_read on public.ideas for select using ("public" = true or public.current_role() in ('head_support','project_management','co_owner','owner') or public.is_leadership());
create policy ideas_team_insert on public.ideas for insert to authenticated with check (public.current_role() in ('head_support','project_management','co_owner','owner') or public.is_leadership());
create policy ideas_team_update on public.ideas for update to authenticated using (public.current_role() in ('head_support','project_management','co_owner','owner') or public.is_leadership()) with check (public.current_role() in ('head_support','project_management','co_owner','owner') or public.is_leadership());
create policy ideas_owner_delete on public.ideas for delete to authenticated using (public.is_owner());


create policy sessions_public_read on public.sessions for select using ((published = true and approved = true) or public.is_admin_branch());
create policy sessions_insert on public.sessions for insert to authenticated with check (public.is_admin_branch());
create policy sessions_update on public.sessions for update to authenticated using (public.is_admin_branch()) with check (public.is_admin_branch());
create policy sessions_owner_delete on public.sessions for delete to authenticated using (public.is_owner());

create policy gangs_public_read on public.gangs for select using ((published = true and status = 'approved') or public.is_admin_branch());
create policy gangs_manage on public.gangs for insert to authenticated with check (public.is_admin_branch());
create policy gangs_update on public.gangs for update to authenticated using (public.is_admin_branch()) with check (public.is_admin_branch());
create policy gangs_owner_delete on public.gangs for delete to authenticated using (public.is_owner());

create policy submissions_anon_insert on public.submissions for insert to anon with check (submitter_user_id is null and status = 'new' and assigned_to is null and internal_note is null and decision_reason is null);
create policy submissions_auth_insert on public.submissions for insert to authenticated with check ((submitter_user_id is null or submitter_user_id = auth.uid()) and status in ('new','rejected') and assigned_to is null and internal_note is null and decision_reason is null);
create policy submissions_select on public.submissions for select to authenticated using (submitter_user_id = auth.uid() or public.can_read_submission(type,payload));
create policy submissions_update on public.submissions for update to authenticated using (public.can_manage_submission(type,payload)) with check (public.can_manage_submission(type,payload));
create policy submissions_owner_delete on public.submissions for delete to authenticated using (public.is_owner());

create policy account_links_own_read on public.account_links for select to authenticated using (user_id = auth.uid() or public.is_admin_branch());
create policy account_links_own_insert on public.account_links for insert to authenticated with check (user_id = auth.uid() and status = 'pending' and profile_code_confirmed = false and ticket_confirmed = false and admin_checked_by is null and approved_by is null);
create policy account_links_own_update on public.account_links for update to authenticated using (user_id = auth.uid() or public.is_admin_branch()) with check (user_id = auth.uid() or public.is_admin_branch());
create policy account_links_owner_delete on public.account_links for delete to authenticated using (public.is_owner());

create policy player_records_select on public.player_records for select to authenticated using (user_id = auth.uid() or public.is_moderation_branch());
create policy player_records_insert on public.player_records for insert to authenticated with check (public.is_support_branch());
create policy player_records_update on public.player_records for update to authenticated using (public.is_admin_branch()) with check (public.is_admin_branch());
create policy player_records_owner_delete on public.player_records for delete to authenticated using (public.is_owner());

create policy player_entries_select on public.player_record_entries for select to authenticated using (public.is_moderation_branch() or (is_public = true and exists(select 1 from public.player_records r where r.id = record_id and r.user_id = auth.uid())));
create policy player_entries_insert on public.player_record_entries for insert to authenticated with check (public.is_support_branch());
create policy player_entries_update on public.player_record_entries for update to authenticated using (public.is_moderation_branch()) with check (public.is_moderation_branch());
create policy player_entries_owner_delete on public.player_record_entries for delete to authenticated using (public.is_owner());

create policy team_records_select on public.team_records for select to authenticated using (user_id = auth.uid() or public.is_admin_branch() or public.is_hr_branch());
create policy team_records_insert on public.team_records for insert to authenticated with check (public.is_admin_branch() or public.is_hr_branch());
create policy team_records_update on public.team_records for update to authenticated using (public.is_admin_branch() or public.is_hr_branch()) with check (public.is_admin_branch() or public.is_hr_branch());
create policy team_records_owner_delete on public.team_records for delete to authenticated using (public.is_owner());

create policy team_entries_select on public.team_record_entries for select to authenticated using (public.is_admin_branch() or public.is_hr_branch() or (visible_to_subject and exists(select 1 from public.team_records r where r.id = record_id and r.user_id = auth.uid())));
create policy team_entries_manage on public.team_record_entries for insert to authenticated with check (public.is_admin_branch() or public.is_hr_branch());
create policy team_entries_update on public.team_record_entries for update to authenticated using (public.is_admin_branch() or public.is_hr_branch()) with check (public.is_admin_branch() or public.is_hr_branch());
create policy team_entries_owner_delete on public.team_record_entries for delete to authenticated using (public.is_owner());

create policy workflows_select on public.workflow_requests for select to authenticated using (created_by = auth.uid() or subject_user_id = auth.uid() or public.is_admin_branch() or public.is_hr_branch());
create policy workflows_insert on public.workflow_requests for insert to authenticated with check ((created_by = auth.uid() and status = 'in_review' and reviewed_by is null and decided_by is null and decision_note is null) or public.is_admin_branch() or public.is_hr_branch());
create policy workflows_update on public.workflow_requests for update to authenticated using (public.is_admin_branch() or public.is_hr_branch()) with check (public.is_admin_branch() or public.is_hr_branch());
create policy workflows_owner_delete on public.workflow_requests for delete to authenticated using (public.is_owner());
create policy projects_select on public.projects for select to authenticated using (public.is_admin_branch() or public.is_hr_branch());
create policy projects_insert on public.projects for insert to authenticated with check (public.is_admin_branch() or public.is_hr_branch());
create policy projects_update on public.projects for update to authenticated using (public.is_admin_branch() or public.is_hr_branch()) with check (public.is_admin_branch() or public.is_hr_branch());
create policy projects_owner_delete on public.projects for delete to authenticated using (public.is_owner());


create policy internal_rules_team_read on public.internal_rules for select to authenticated using (public.is_team());
create policy internal_rules_owner_manage on public.internal_rules for all to authenticated using (public.is_owner()) with check (public.is_owner());
create policy rule_ack_own_insert on public.internal_rule_acknowledgements for insert to authenticated with check (user_id = auth.uid());
create policy rule_ack_read on public.internal_rule_acknowledgements for select to authenticated using (user_id = auth.uid() or public.current_role() in ('hr_staff','hr_manager','hr_lead','teamlead','leadership','project_management','co_owner','owner'));
create policy rule_ack_own_update on public.internal_rule_acknowledgements for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy rule_ack_owner_delete on public.internal_rule_acknowledgements for delete to authenticated using (public.is_owner());

create policy audit_owner_read on public.audit_log for select to authenticated using (public.is_owner());
create policy audit_team_insert on public.audit_log for insert to authenticated with check (public.is_team());
create policy audit_owner_delete on public.audit_log for delete to authenticated using (public.is_owner());

-- Storage buckets. Evidence stays private; public assets can hold approved banners/logos.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('evidence','evidence',false,10485760,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public=false,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('public-assets','public-assets',true,10485760,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public=true,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;

-- Storage policies
DROP POLICY IF EXISTS evidence_own_upload ON storage.objects;
DROP POLICY IF EXISTS evidence_own_read ON storage.objects;
DROP POLICY IF EXISTS evidence_team_read ON storage.objects;
DROP POLICY IF EXISTS evidence_owner_delete ON storage.objects;
DROP POLICY IF EXISTS public_assets_read ON storage.objects;
DROP POLICY IF EXISTS public_assets_team_upload ON storage.objects;
DROP POLICY IF EXISTS public_assets_team_update ON storage.objects;
DROP POLICY IF EXISTS public_assets_owner_delete ON storage.objects;
create policy evidence_own_upload on storage.objects for insert to authenticated with check (bucket_id='evidence' and (storage.foldername(name))[1]=auth.uid()::text);
create policy evidence_own_read on storage.objects for select to authenticated using (bucket_id='evidence' and owner_id=auth.uid()::text);
create policy evidence_team_read on storage.objects for select to authenticated using (bucket_id='evidence' and public.is_moderation_branch());
create policy evidence_owner_delete on storage.objects for delete to authenticated using (bucket_id='evidence' and public.is_owner());
create policy public_assets_read on storage.objects for select using (bucket_id='public-assets');
create policy public_assets_team_upload on storage.objects for insert to authenticated with check (bucket_id='public-assets' and public.is_admin_branch());
create policy public_assets_team_update on storage.objects for update to authenticated using (bucket_id='public-assets' and public.is_admin_branch()) with check (bucket_id='public-assets' and public.is_admin_branch());
create policy public_assets_owner_delete on storage.objects for delete to authenticated using (bucket_id='public-assets' and public.is_owner());

-- Grants. RLS remains authoritative.
grant usage on schema public to anon, authenticated;
grant select on public.app_settings, public.team_positions, public.team_members, public.news, public.ideas, public.sessions, public.gangs to anon;
grant insert on public.submissions to anon;
grant select,insert,update,delete on all tables in schema public to authenticated;

-- Seed public roles and the initial Owner card.
insert into public.team_positions (id,role_key,label,group_name,role_rank,open,applications_open,sort_order) values
('owner','owner','Owner','Leitung',100,false,false,1),
('co_owner','co_owner','Co-Owner','Leitung',95,true,true,2),
('project_management','project_management','Projektmanagement','Leitung',90,true,true,3),
('leadership','leadership','Führungskraft','Leitung',88,true,true,4),
('teamlead','teamlead','Teamleitung','Leitung',85,true,true,5),
('hr_lead','hr_lead','HR-Leitung','Human Resources',80,true,true,10),
('hr_manager','hr_manager','HR-Manager','Human Resources',76,true,true,11),
('hr_staff','hr_staff','HR-Mitarbeiter','Human Resources',72,true,true,12),
('head_admin','head_admin','Head of Administration','Administration',78,true,true,20),
('lead_admin','lead_admin','Leitender Administrator','Administration',74,true,true,21),
('senior_admin','senior_admin','Senior Administrator','Administration',70,true,true,22),
('admin','admin','Administrator','Administration',66,true,true,23),
('junior_admin','junior_admin','Junior Administrator','Administration',62,true,true,24),
('test_admin','test_admin','Test Administrator','Administration',58,true,true,25),
('head_mod','head_mod','Head of Moderation','Moderation',56,true,true,30),
('senior_mod','senior_mod','Senior Moderator','Moderation',52,true,true,31),
('moderator','moderator','Moderator','Moderation',48,true,true,32),
('junior_mod','junior_mod','Junior Moderator','Moderation',44,true,true,33),
('test_mod','test_mod','Test Moderator','Moderation',40,true,true,34),
('head_support','head_support','Head of Support','Support',38,true,true,40),
('senior_support','senior_support','Senior Supporter','Support',34,true,true,41),
('supporter','supporter','Supporter','Support',30,true,true,42),
('junior_support','junior_support','Junior Supporter','Support',26,true,true,43),
('test_support','test_support','Support in Ausbildung','Support',20,true,true,44)
on conflict (id) do update set label=excluded.label,group_name=excluded.group_name,role_rank=excluded.role_rank,sort_order=excluded.sort_order;

insert into public.team_members (discord_name,roblox_name,role_key,public,public_status,joined_at)
select 'vibevisionde','Idk765433454','owner',true,'active',now()
where not exists (select 1 from public.team_members where role_key='owner' and lower(discord_name)='vibevisionde');
insert into public.team_records (discord_name,roblox_name,role_key,status,joined_at,rating)
select 'vibevisionde','Idk765433454','owner','active',now(),5
where not exists (select 1 from public.team_records where role_key='owner' and lower(discord_name)='vibevisionde');

-- Backfill and link an already existing Owner account, if it was registered before this SQL was run.
insert into public.profiles (id,email,discord_name,roblox_name,website_role,is_approved,status)
select id,email,'vibevisionde','Idk765433454','owner',true,'active'
from auth.users where lower(email)='ichbinsdageia@gmail.com' and email_confirmed_at is not null
on conflict (id) do update set website_role='owner',is_approved=true,status='active',discord_name=coalesce(public.profiles.discord_name,'vibevisionde'),roblox_name=coalesce(public.profiles.roblox_name,'Idk765433454');
update public.team_members tm set user_id=p.id from public.profiles p where p.website_role='owner' and lower(p.email)='ichbinsdageia@gmail.com' and tm.role_key='owner' and lower(tm.discord_name)='vibevisionde';
update public.team_records tr set user_id=p.id from public.profiles p where p.website_role='owner' and lower(p.email)='ichbinsdageia@gmail.com' and tr.role_key='owner' and lower(tr.discord_name)='vibevisionde';

insert into public.news(category,title,excerpt,published,published_at)
select 'Ankündigungen','Nexura RP ist öffentlich spielbar','Tritt dem Discord bei, öffne den Roblox-Server und starte deine erste Geschichte in Hamburg.',true,now()
where not exists(select 1 from public.news where title='Nexura RP ist öffentlich spielbar');
insert into public.ideas(title,category,status,summary,author_name,"public")
select 'Mehr kleine Einsatzlagen','Sessions','planned','Regelmäßige kurze Mini-Events zwischen den großen Community-Sessions.','Community',true
where not exists(select 1 from public.ideas where title='Mehr kleine Einsatzlagen');


-- Keep totals in player_records synchronized with visible, non-expired entries.
create or replace function public.recalculate_player_record(record uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.player_records r set points = coalesce((select sum(e.points) from public.player_record_entries e where e.record_id=record and (e.expires_at is null or e.expires_at > now())),0), updated_at=now() where r.id=record;
end $$;
create or replace function public.after_player_entry_change() returns trigger language plpgsql security definer set search_path=public as $$
begin perform public.recalculate_player_record(coalesce(new.record_id,old.record_id)); return coalesce(new,old); end $$;
drop trigger if exists recalc_player_record on public.player_record_entries;
create trigger recalc_player_record after insert or update or delete on public.player_record_entries for each row execute function public.after_player_entry_change();

-- End of schema.
