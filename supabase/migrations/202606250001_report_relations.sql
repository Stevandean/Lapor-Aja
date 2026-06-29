do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t
      on t.oid = e.enumtypid
    where t.typname = 'report_status'
      and e.enumlabel = 'merged'
  ) then
    alter type public.report_status add value 'merged';
  end if;
end $$;

create table if not exists public.report_relations (
  id uuid primary key default gen_random_uuid(),
  source_report_id uuid not null references public.reports(id) on delete cascade,
  target_report_id uuid not null references public.reports(id) on delete cascade,
  relation_type text not null,
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint report_relations_relation_type_check
    check (relation_type in ('duplicate', 'recurrence')),
  constraint report_relations_not_self_check
    check (source_report_id <> target_report_id)
);

alter table public.report_relations
  add column if not exists note text,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists report_relations_unique_relation_idx
  on public.report_relations(source_report_id, target_report_id, relation_type);

create index if not exists report_relations_source_report_id_idx
  on public.report_relations(source_report_id);

create index if not exists report_relations_target_report_id_idx
  on public.report_relations(target_report_id);

create index if not exists report_relations_relation_type_created_at_idx
  on public.report_relations(relation_type, created_at desc);

alter table public.report_relations enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'report_relations'
      and policyname = 'Admins can manage report relations'
  ) then
    create policy "Admins can manage report relations"
      on public.report_relations
      for all
      to authenticated
      using (
        exists (
          select 1
          from public.profiles p
          where p.id = auth.uid()
            and p.role = 'admin'
        )
      )
      with check (
        exists (
          select 1
          from public.profiles p
          where p.id = auth.uid()
            and p.role = 'admin'
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'report_relations'
      and policyname = 'Village officers can read report relations'
  ) then
    create policy "Village officers can read report relations"
      on public.report_relations
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.profiles p
          where p.id = auth.uid()
            and p.role in ('admin', 'kepala_desa', 'sekdes', 'kepala_dusun', 'kasi')
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'report_relations'
      and policyname = 'Citizens can read own report relations'
  ) then
    create policy "Citizens can read own report relations"
      on public.report_relations
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.reports r
          where (r.id = report_relations.source_report_id or r.id = report_relations.target_report_id)
            and r.reporter_id = auth.uid()
        )
      );
  end if;
end $$;
