alter table public.notifications
  add column if not exists recipient_phone text,
  add column if not exists channel text not null default 'email',
  add column if not exists provider text,
  add column if not exists provider_message_id text,
  add column if not exists read_at timestamptz;

create index if not exists notifications_user_id_created_at_idx
  on public.notifications(user_id, created_at desc);

create index if not exists notifications_user_id_channel_created_at_idx
  on public.notifications(user_id, channel, created_at desc);

create index if not exists notifications_user_id_read_at_idx
  on public.notifications(user_id, read_at);

notify pgrst, 'reload schema';
