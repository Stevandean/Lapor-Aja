alter table public.report_budget_requests
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_note text;

create index if not exists report_budget_requests_status_created_at_idx
  on public.report_budget_requests(status, created_at desc);

create index if not exists report_budget_requests_reviewed_by_idx
  on public.report_budget_requests(reviewed_by);
