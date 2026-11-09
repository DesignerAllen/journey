-- Journey 초기 스키마
-- 접근은 서버(service_role)에서만 수행. RLS는 켜고 정책은 만들지 않아 anon/authenticated 직접 접근을 차단.

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  note text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  created_at timestamptz not null default now()
);
create index events_starts_at_idx on public.events (starts_at);

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events (id) on delete set null,
  title text not null,
  body text,
  memory_date date not null,
  photo_paths text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index memories_date_idx on public.memories (memory_date desc);

create table public.todos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  due_date date,
  done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now()
);

-- PIN 무차별 대입 방지
create table public.login_attempts (
  key text primary key,
  failed_count int not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.events enable row level security;
alter table public.memories enable row level security;
alter table public.todos enable row level security;
alter table public.login_attempts enable row level security;
