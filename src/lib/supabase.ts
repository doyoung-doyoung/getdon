-- 겟돈: 실시간 공유 투표 테이블
-- Supabase 대시보드 → SQL Editor (/sql/new) 에서 한 번 실행

create table if not exists getdon_votes (
  id          bigint generated always as identity primary key,
  month       text        not null,          -- "2025-07"
  date        text        not null,          -- "2025-07-15"
  name        text        not null,          -- "엄마" / "도유유" / "부채리" / "하티지"
  created_at  timestamptz not null default now(),
  unique (date, name)                        -- 같은 사람이 같은 날 중복 투표 방지
);

-- 월별 조회 빠르게
create index if not exists getdon_votes_month_idx on getdon_votes (month);

-- 로그인 없이 누구나 읽고/쓰게 (공유 앱이므로)
alter table getdon_votes enable row level security;

create policy "anyone can read"   on getdon_votes for select using (true);
create policy "anyone can insert" on getdon_votes for insert with check (true);
create policy "anyone can delete" on getdon_votes for delete using (true);

-- Realtime 활성화 (다른 사람 선택이 즉시 반영되도록)
alter publication supabase_realtime add table getdon_votes;
