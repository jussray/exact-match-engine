-- Exact Match Engine reviewer workspace persistence.
-- Apply to an Exact Match-owned Supabase project. Do not reuse another product's project silently.

create table if not exists public.recon_workspace_state (
  workspace_key text primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.recon_workspace_state enable row level security;

revoke all on table public.recon_workspace_state from anon;
grant select, insert, update on table public.recon_workspace_state to authenticated;

drop policy if exists "exact_match_reviewers_select" on public.recon_workspace_state;
create policy "exact_match_reviewers_select"
on public.recon_workspace_state
for select
to authenticated
using (
  workspace_key = 'exact-match'
  and (select auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'reviewer')
);

drop policy if exists "exact_match_reviewers_insert" on public.recon_workspace_state;
create policy "exact_match_reviewers_insert"
on public.recon_workspace_state
for insert
to authenticated
with check (
  workspace_key = 'exact-match'
  and (select auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'reviewer')
);

drop policy if exists "exact_match_reviewers_update" on public.recon_workspace_state;
create policy "exact_match_reviewers_update"
on public.recon_workspace_state
for update
to authenticated
using (
  workspace_key = 'exact-match'
  and (select auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'reviewer')
)
with check (
  workspace_key = 'exact-match'
  and (select auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'reviewer')
);

comment on table public.recon_workspace_state is
  'Shared Exact Match reviewer state. Authorization is controlled by Supabase Auth app_metadata.role and RLS.';
