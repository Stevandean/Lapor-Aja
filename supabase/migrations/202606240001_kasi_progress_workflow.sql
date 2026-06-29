create index if not exists report_progress_updates_report_id_created_at_idx
  on public.report_progress_updates(report_id, created_at desc);

create index if not exists report_progress_photos_progress_update_id_idx
  on public.report_progress_photos(progress_update_id);

create table if not exists public.report_budget_requests (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  requested_by uuid references public.profiles(id) on delete set null,
  section_id uuid references public.village_sections(id) on delete set null,
  summary_note text not null,
  total_estimated_budget numeric(14, 2) not null default 0,
  status text not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint report_budget_requests_status_check
    check (status in ('submitted', 'approved', 'rejected'))
);

create index if not exists report_budget_requests_report_id_created_at_idx
  on public.report_budget_requests(report_id, created_at desc);

create index if not exists report_budget_requests_section_id_status_idx
  on public.report_budget_requests(section_id, status);

create table if not exists public.report_budget_request_items (
  id uuid primary key default gen_random_uuid(),
  budget_request_id uuid not null references public.report_budget_requests(id) on delete cascade,
  item_name text not null,
  description text,
  quantity numeric(12, 2) not null default 1,
  unit text not null default 'unit',
  unit_price numeric(14, 2) not null default 0,
  subtotal numeric(14, 2) generated always as (quantity * unit_price) stored,
  created_at timestamptz not null default now()
);

create index if not exists report_budget_request_items_request_id_idx
  on public.report_budget_request_items(budget_request_id);

insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users can upload progress photos'
  ) then
    create policy "Authenticated users can upload progress photos"
      on storage.objects
      for insert
      to authenticated
      with check (bucket_id = 'progress-photos');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users can read progress photos'
  ) then
    create policy "Authenticated users can read progress photos"
      on storage.objects
      for select
      to authenticated
      using (bucket_id = 'progress-photos');
  end if;
end $$;
