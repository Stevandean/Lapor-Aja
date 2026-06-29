create table if not exists public.report_sla_alert_notifications (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  alert_type text not null,
  triggered_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint report_sla_alert_notifications_alert_type_check
    check (alert_type in ('at_risk', 'overdue'))
);

create unique index if not exists report_sla_alert_notifications_unique_idx
  on public.report_sla_alert_notifications(report_id, alert_type);

create index if not exists report_sla_alert_notifications_created_at_idx
  on public.report_sla_alert_notifications(created_at desc);

alter table public.report_sla_alert_notifications enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'report_sla_alert_notifications'
      and policyname = 'Village officers can read SLA alert notifications'
  ) then
    create policy "Village officers can read SLA alert notifications"
      on public.report_sla_alert_notifications
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
      and tablename = 'report_sla_alert_notifications'
      and policyname = 'Village officers can insert SLA alert notifications'
  ) then
    create policy "Village officers can insert SLA alert notifications"
      on public.report_sla_alert_notifications
      for insert
      to authenticated
      with check (
        exists (
          select 1
          from public.profiles p
          where p.id = auth.uid()
            and p.role in ('admin', 'kepala_desa', 'sekdes')
        )
      );
  end if;
end $$;

notify pgrst, 'reload schema';
