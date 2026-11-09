-- 일정 사진: 경로 컬럼 + 비공개 Storage 버킷 (접근은 서버 service_role 만)
alter table public.events add column photo_paths text[] not null default '{}';

insert into storage.buckets (id, name, public)
values ('event-photos', 'event-photos', false)
on conflict (id) do nothing;
