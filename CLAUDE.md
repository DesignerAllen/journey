# journey

커플 공용 단일 사용자 서비스. 이벤트(events), 추억(memories), 할 일(todos)을 관리한다.

@AGENTS.md

## Stack
Next.js 16 (App Router, `src/`), React 19, TypeScript, Tailwind 4, Supabase, Vercel. `main`에 push하면 Vercel이 자동 재배포한다.

## Commands
- `npm run dev` / `npm run build` / `npm run lint`
- 환경변수: `.env.example` 참고 → `.env.local` (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_PIN`, `SESSION_SECRET`)

## Next 16 주의점 (학습 데이터와 다름)
- `middleware`는 `proxy`로 변경됨 → [src/proxy.ts](src/proxy.ts)
- `cookies()`, `headers()` 등은 비동기 (`await`)
- 코드 작성 전 `node_modules/next/dist/docs/`의 관련 문서를 먼저 확인할 것

## 구조
- [src/proxy.ts](src/proxy.ts): 전역 인증 게이트. 미인증 시 페이지는 `/login` 리다이렉트, `/api/*`는 401. `/api/login`과 정적 리소스는 matcher에서 제외
- [src/lib/session.ts](src/lib/session.ts): jose HS256 JWT 세션 서명/검증 (쿠키명 `journey_session`)
- [src/lib/supabase-admin.ts](src/lib/supabase-admin.ts): `server-only` Supabase 클라이언트 (secret 키)
- [src/app/api/login/route.ts](src/app/api/login/route.ts): PIN 검증
- [src/app/page.tsx](src/app/page.tsx) → [Timeline.tsx](src/components/Timeline.tsx): 메인 타임라인 (날짜별 행, 위/아래 30개씩 '더보기', 빈 날짜 클릭 시 등록)
- `/month` 월 보기, `/events/new` 등록, `/events/[id]` 상세, `/events/[id]/edit` 수정·삭제, `/wishes` 같이 하고 싶은 것(todos) 목록
- [src/lib/events.ts](src/lib/events.ts), [todos.ts](src/lib/todos.ts): 서버 전용 DB 접근. [date.ts](src/lib/date.ts): KST 날짜 유틸
- 사진: 브라우저에서 500KB 이하 JPEG로 압축([compress.ts](src/lib/compress.ts)) → `/api/upload` → 비공개 버킷 `event-photos`, 표시는 `/api/photo` 서명 URL 리다이렉트
- UI: shadcn/ui(base-nova, Base UI) + lucide-react. `cn`은 [utils.ts](src/lib/utils.ts)(clsx+tailwind-merge). `shadcn add` 시 기존 파일 덮어쓰기 금지
- [supabase/migrations/](supabase/migrations/): DB 스키마

## 인증
- 4자리 PIN을 서버에서 `timingSafeEqual`로 검증
- 실패 5회 → 15분 잠금 (`login_attempts`의 전역 키 `global` 하나로 관리)
- 성공 시 httpOnly 쿠키 7일 발급

## DB 규칙
- 모든 테이블(events, memories, todos, login_attempts)에 RLS 활성화, 정책 없음
- 접근은 서버에서 secret(service role) 키로만. 클라이언트에서 Supabase 직접 호출 금지, 키를 `NEXT_PUBLIC_*`로 노출 금지
- 스키마 변경은 `supabase/migrations/`에 새 마이그레이션 파일로 추가

## Next 16 Cache Components
- `cacheComponents`가 켜져 있어 요청 시점 데이터/`Date.now()`는 `<Suspense>` 안에서 `await connection()` 뒤에 읽는다. 클라이언트 컴포넌트에서 오늘 날짜를 직접 계산하지 말고 서버에서 props로 전달
- 폰 테스트: 개발 서버는 http(LAN)라 `crypto.randomUUID()` 같은 보안 컨텍스트 전용 API를 클라이언트에서 쓰지 말 것
