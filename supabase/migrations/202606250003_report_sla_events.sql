create table if not exists public.report_sla_events (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  event_type text not null,
  previous_resolution_due_at timestamptz,
  new_resolution_due_at timestamptz,
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint report_sla_events_event_type_check
    check (
      event_type in (
        'deadline_started',
        'paused_budget',
        'resumed_budget',
        'completed',
        'merged'
      )
    )
);

create index if not exists report_sla_events_report_id_created_at_idx
  on public.report_sla_events(report_id, created_at desc);

create index if not exists report_sla_events_event_type_created_at_idx
  on public.report_sla_events(event_type, created_at desc);

alter table public.report_sla_events enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'report_sla_events'
      and policyname = 'Village officers can read SLA events'
  ) then
    create policy "Village officers can read SLA events"
      on public.report_sla_events
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.profiles p
          where p.id = auth.uid()
            and p.role in ('admin', 'kepala_desa', 'sekdes')
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'report_sla_events'
      and policyname = 'Admins can insert SLA events'
  ) then
    create policy "Admins can insert SLA events"
      on public.report_sla_events
      for insert
      to authenticated
      with check (
        exists (
          select 1
          from public.profiles p
          where p.id = auth.uid()
            and p.role in ('admin', 'kepala_desa', 'sekdes', 'kasi')
        )
      );
  end if;
end $$;

notify pgrst, 'reload schema';
