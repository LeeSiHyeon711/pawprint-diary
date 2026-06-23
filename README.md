# PawprintDiary (발자국 일기)

반려동물의 **하루 컨디션·행동을 기록하고, AI가 요약·해석**해 주는 로컬 우선(local-first) 웹 앱.
일기/사진/건강 상태는 모두 **브라우저 IndexedDB**에 저장되며, AI 호출은 **서버 Route Handler를 통한 프록시**로만 이뤄진다(API 키는 클라이언트에 노출되지 않음).

> 본 README는 현재 repo에 **실제 구현된 코드**만을 기준으로 작성되었다.

---

## 기술 스택 (실제 설정 기준)
- **Next.js**(App Router) + **React** + **TypeScript**
- **Tailwind CSS** (PostCSS)
- 로컬 저장: **IndexedDB** (`idb`)
- AI: **`@anthropic-ai/sdk`** — 서버 측 Route Handler에서만 사용
- 날짜 처리: `date-fns`
- 패키지명: `pawprint-diary`

## 실행
```bash
npm install
npm run dev      # 개발 서버 (next dev)
# 그 외: npm run build / npm run start / npm run lint
```
환경변수(선택):
```bash
cp .env.example .env.local
```
| 변수 | 설명 |
|------|------|
| `ANTHROPIC_API_KEY` | 비우면 **Mock 모드**로 전체 UI 흐름 동작. 입력 시 실제 Claude 호출 |
| `ANTHROPIC_MODEL` | 기본 `claude-opus-4-8` (sonnet 등으로 변경 가능) |

---

## 구현된 기능

### 1. 반려동물 프로필
- `app/profile/new`(등록) · `app/profile/edit`(수정) — `components/ProfileForm`
- 모델(`lib/types.ts` `Pet`): 이름, 종(강아지/고양이/기타), 품종?, 나이, 성별, 성격?, 좋아하는 것?, 싫어하는 것?, 건강 메모?, 프로필 사진(Blob)
- 현재 반려동물 컨텍스트: `lib/petContext.tsx`(`usePet`)

### 2. 오늘의 발자국(일기) 작성
- `app/today` — `components/DiaryForm`(+ `MoodTagPicker`, `PhotoUpload`, `StepSelector`)
- 모델(`DiaryEntry`): 날짜, 일기 텍스트?, **식욕/활동량/수면/배변** 상태값, 특이행동?, 기분 태그(다중), 사진(Blob 다중), AI 요약(있으면 함께 저장)

### 3. 기록 목록 / 상세
- `app/entries`(목록, `components/EntryCard`) · `app/entries/[entryId]`(상세)
- 정렬: `date` 내림차순 → 동일 날짜 내 `created_at` 내림차순
- 이미지 표시: `components/BlobImage`(IndexedDB Blob 렌더), 빈 상태: `components/ui/EmptyState`

### 4. AI 일기 요약
- 화면: `components/AISummaryPanel`
- 서버 라우트: **`POST /api/ai/summary`** — 입력 `{ pet, entry }`(사진 Blob 제외) → 출력 `{ condition, behavior, observation, memory, vet_note }`
- 결과 `AISummary`는 해당 일기에 함께 저장 가능

### 5. AI에게 질문하기
- 화면: `app/ask`
- 서버 라우트: **`POST /api/ai/ask`** — 입력 `{ pet, question, recent? }`(사진 Blob 제외) → 출력 `{ answer }`

### 6. AI 안전 가드레일 (`lib/guardrails.ts`)
- `sanitize()` — AI 응답의 **단정·진단 단언·과도한 의료 표현을 제거/완화**
- `needsVetNote()` / `buildVetNote()` — 상태값 기반 **병원 상담 권장(vet_note)** 조건 판단·문구
- ★ 실제 Claude 응답 · Mock 응답 · 파싱 폴백 **모든 경로의 마지막 단계**로 공통 적용

### 안정성 설계 (코드 주석에 명시된 보정 지시 기준)
- **키 미설정 → 결정적 Mock 응답**으로 전체 흐름 동작
- **Anthropic 호출 실패/타임아웃 → graceful Mock 폴백** (UI 중단 없음)
- **`ANTHROPIC_API_KEY` / `NEXT_PUBLIC_*` 키의 클라이언트 노출 금지** (AI 호출은 서버 라우트 경유)
- AI 입력에서 **사진 Blob 제외**(텍스트 컨텍스트만 전송)

---

## 데이터 저장 (IndexedDB — `lib/db.ts`, `lib/repos.ts`)
객체 스토어:
- `pets` (keyPath `pet_id`)
- `entries` (keyPath `entry_id`, 인덱스 `by-pet`, `by-pet-date`)
- `conversations` (인덱스 `by-pet`)
- `meta` (keyPath `key`)

> 모든 사용자 데이터(프로필·일기·사진)는 **브라우저 로컬(IndexedDB)**에 저장된다. 별도 백엔드 DB·서버 저장은 없으며, 서버 라우트는 AI 프록시 용도로만 존재한다.

---

## 프로젝트 구조
```
05-개발/
├── app/
│   ├── page.tsx                 # 홈(진입 분기)
│   ├── layout.tsx, globals.css
│   ├── today/                   # 오늘의 일기 작성
│   ├── profile/new, profile/edit
│   ├── entries/, entries/[entryId]/
│   ├── ask/                     # AI 질문
│   └── api/ai/summary/route.ts, api/ai/ask/route.ts   # 서버 AI 프록시
├── components/                  # DiaryForm, ProfileForm, AISummaryPanel, EntryCard,
│   │                            #  PhotoUpload, MoodTagPicker, BlobImage, BottomNav, AppHeader, StepSelector
│   └── ui/                      # Button, Card, Field, Tag, Spinner, SectionTitle, EmptyState
├── lib/
│   ├── db.ts, repos.ts, types.ts        # IndexedDB·저장소·도메인 타입
│   ├── aiClient.ts                      # /api/ai 호출 fetch 래퍼
│   ├── guardrails.ts, prompt.ts         # AI 가드레일·프롬프트 빌더
│   ├── petContext.tsx, imageUtils.ts, format.ts
├── .env.example
├── next.config.mjs, tailwind.config.ts, tsconfig.json, postcss.config.mjs
└── package.json
```

---

## 비고
- 개인용/MVP 단계 프로젝트로, 사용자 데이터는 **기기 로컬에만** 저장된다(클라우드 동기화·계정 기능 없음).
- AI 요약·답변은 참고용이며, 가드레일을 통해 단정적 의료 표현을 피하고 필요 시 병원 상담을 권장한다.
- 위 기능 구성의 근거는 `app/` 라우트·`app/api/ai/*/route.ts`·`lib/*`·`components/*` 실제 파일이다.
