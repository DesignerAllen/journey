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
- [supabase/migrations/](supabase/migrations/): DB 스키마

## 인증
- 4자리 PIN을 서버에서 `timingSafeEqual`로 검증
- 실패 5회 → 15분 잠금 (`login_attempts`의 전역 키 `global` 하나로 관리)
- 성공 시 httpOnly 쿠키 30일 발급

## DB 규칙
- 모든 테이블(events, memories, todos, login_attempts)에 RLS 활성화, 정책 없음
- 접근은 서버에서 secret(service role) 키로만. 클라이언트에서 Supabase 직접 호출 금지, 키를 `NEXT_PUBLIC_*`로 노출 금지
- 스키마 변경은 `supabase/migrations/`에 새 마이그레이션 파일로 추가
