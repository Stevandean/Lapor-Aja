alter table public.report_relations
  add column if not exists note text,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

notify pgrst, 'reload schema';
