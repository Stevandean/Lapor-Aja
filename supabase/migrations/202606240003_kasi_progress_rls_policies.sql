alter table public.report_progress_updates enable row level security;
alter table public.report_progress_photos enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'report_progress_updates'
      and policyname = 'Kasi can insert progress updates for assigned reports'
  ) then
    create policy "Kasi can insert progress updates for assigned reports"
      on public.report_progress_updates
      for insert
      to authenticated
      with check (
        created_by = auth.uid()
        and exists (
          select 1
          from public.profiles p
          join public.reports r
            on r.id = report_progress_updates.report_id
          where p.id = auth.uid()
            and p.role = 'kasi'
            and p.section_id is not null
            and r.assigned_section_id = p.section_id
            and r.status in (
              'handled_by_village',
              'waiting_budget',
              'in_progress',
              'resolved'
            )
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'report_progress_updates'
      and policyname = 'Village officers can read progress updates'
  ) then
    create policy "Village officers can read progress updates"
      on public.report_progress_updates
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.profiles p
          left join public.reports r
            on r.id = report_progress_updates.report_id
          where p.id = auth.uid()
            and (
              p.role in ('admin', 'kepala_desa', 'sekdes')
              or (
                p.role = 'kasi'
                and p.section_id is not null
                and r.assigned_section_id = p.section_id
              )
            )
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'report_progress_updates'
      and policyname = 'Kasi can delete own progress updates during rollback'
  ) then
    create policy "Kasi can delete own progress updates during rollback"
      on public.report_progress_updates
      for delete
      to authenticated
      using (created_by = auth.uid());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'report_progress_photos'
      and policyname = 'Kasi can insert photos for own progress updates'
  ) then
    create policy "Kasi can insert photos for own progress updates"
      on public.report_progress_photos
      for insert
      to authenticated
      with check (
        exists (
          select 1
          from public.report_progress_updates u
          where u.id = report_progress_photos.progress_update_id
            and u.created_by = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'report_progress_photos'
      and policyname = 'Village officers can read progress photos'
  ) then
    create policy "Village officers can read progress photos"
      on public.report_progress_photos
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.report_progress_updates u
          join public.profiles p
            on p.id = auth.uid()
          left join public.reports r
            on r.id = u.report_id
          where u.id = report_progress_photos.progress_update_id
            and (
              p.role in ('admin', 'kepala_desa', 'sekdes')
              or (
                p.role = 'kasi'
                and p.section_id is not null
                and r.assigned_section_id = p.section_id
              )
            )
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'report_progress_photos'
      and policyname = 'Kasi can delete own progress photos during rollback'
  ) then
    create policy "Kasi can delete own progress photos during rollback"
      on public.report_progress_photos
      for delete
      to authenticated
      using (
        exists (
          select 1
          from public.report_progress_updates u
          where u.id = report_progress_photos.progress_update_id
            and u.created_by = auth.uid()
        )
      );
  end if;
end $$;
