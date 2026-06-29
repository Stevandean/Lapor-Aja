alter table public.profiles
  add column if not exists notification_internal_enabled boolean not null default true,
  add column if not exists notification_email_enabled boolean not null default true,
  add column if not exists notification_whatsapp_enabled boolean not null default true;

insert into storage.buckets (id, name, public)
values ('profile-avatars', 'profile-avatars', false)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users can upload own profile avatar'
  ) then
    create policy "Authenticated users can upload own profile avatar"
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'profile-avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users can update own profile avatar'
  ) then
    create policy "Authenticated users can update own profile avatar"
      on storage.objects
      for update
      to authenticated
      using (
        bucket_id = 'profile-avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      )
      with check (
        bucket_id = 'profile-avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users can read profile avatars'
  ) then
    create policy "Authenticated users can read profile avatars"
      on storage.objects
      for select
      to authenticated
      using (bucket_id = 'profile-avatars');
  end if;
end $$;

notify pgrst, 'reload schema';
