/**
 * lib/guardrails.ts — AI 응답 가드레일 (FEAT-05)
 *
 * sanitize()    : 단정·말대리·의료 표현 제거/완화
 * needsVetNote(): 상태값 기반 병원 권장 조건 판단 (AC-10)
 * buildVetNote(): 병원 권장 고정 문구 반환
 *
 * ★ sanitize()는 실제 Claude 응답·Mock 응답·파싱 폴백 응답 "모두"에
 *   마지막 단계로 적용한다. 어느 경로든 가드레일이 누락되지 않게 한다(보정 지시 3).
 */

import type { Appetite, Activity, Toilet } from './types';

// ────────────────────────────────────────────────
// AI 입력 전용 경량 타입 (Blob 필드 제외 — 보정 지시 4)
// ────────────────────────────────────────────────

export interface PetLike {
  name: string;
  species: string; // '강아지' | '고양이' | '기타'
  breed?: string;
  age?: string;
  gender?: string;
  personality?: string;
  likes?: string;
  dislikes?: string;
  health_notes?: string;
}

export interface EntryLike {
  date?: string;
  diary_text?: string;
  appetite?: Appetite;
  activity?: Activity;
  sleep?: string;
  toilet?: Toilet;
  unusual_behavior?: string;
  mood_tags?: string[];
  /** AI 요약의 컨디션 — 최근 기록 참조 시 맥락 제공용 (ask 엔드포인트) */
  condition?: string;
}

// ────────────────────────────────────────────────
// 단정 표현 → 완충 표현 치환 맵
// ────────────────────────────────────────────────

const BANNED_REPLACE: Array<[RegExp, string]> = [
  [/확실히/g, '아마'],
  [/분명히/g, '아마'],
  [/틀림없이/g, '어쩌면'],
  [/100\s*%/g, '많이'],
  [/반드시/g, '되도록'],
];

/**
 * 의료 진단/말대리 표현이 든 문장은 제거(문장 단위 split 후 필터).
 * 이 패턴 중 하나라도 포함된 문장 전체를 삭제한다.
 */
const STRIP_SENTENCE: RegExp[] = [
  /진단/,
  /처방/,
  /말하고\s*있어요/,
  /행복하대/,
  /용서했/,
  /용서해/,
];

/**
 * sanitize(text): 단정·말대리·의료 표현 제거/완화.
 * 모든 응답 경로(실모델·Mock·폴백)의 마지막 단계로 반드시 적용한다.
 */
export function sanitize(text: string): string {
  if (!text) return text;

  // 1. 단정 표현 → 완충 표현 일괄 치환
  let result = text;
  for (const [pattern, replacement] of BANNED_REPLACE) {
    result = result.replace(pattern, replacement);
  }

  // 2. 금지 표현이 든 문장 제거 (줄 단위 → 문장 단위 처리)
  const lines = result.split('\n');
  const cleanedLines = lines.map(line => {
    // 마침표·느낌표·물음표 뒤로 문장 분리 (lookbehind — Node 10+ 지원)
    const parts = line.split(/(?<=[.!?])\s*/);
    const filtered = parts.filter(
      part => !STRIP_SENTENCE.some(re => re.test(part))
    );
    return filtered.join(' ').trim();
  });

  return cleanedLines.filter(l => l.length > 0).join('\n').trim();
}

// ────────────────────────────────────────────────
// vet_note 조건 판단 (AC-10)
// ────────────────────────────────────────────────

/** Set으로 빠른 멤버십 체크 */
const VET_APPETITE_SET = new Set<string>(['적게 먹음', '거의 안 먹음']);
const VET_ACTIVITY_SET = new Set<string>(['조용함', '거의 움직이지 않음']);
const VET_TOILET_SET   = new Set<string>(['묽음', '굳음', '이상 있음']);

/**
 * needsVetNote(entry): 다음 중 하나라도 해당하면 true → vet_note 강제 세팅(AC-10)
 *  - appetite ∈ {적게 먹음, 거의 안 먹음}
 *  - activity ∈ {조용함, 거의 움직이지 않음}
 *  - toilet   ∈ {묽음, 굳음, 이상 있음}
 */
export function needsVetNote(entry: EntryLike): boolean {
  if (entry.appetite && VET_APPETITE_SET.has(entry.appetite)) return true;
  if (entry.activity && VET_ACTIVITY_SET.has(entry.activity)) return true;
  if (entry.toilet   && VET_TOILET_SET.has(entry.toilet))    return true;
  return false;
}

/**
 * buildVetNote(): 병원 상담 권장 고정 문구 반환.
 * needsVetNote가 true일 때 모델 응답에 병원 언급이 없으면 이 문구를 주입한다.
 */
export function buildVetNote(): string {
  return '최근 컨디션이 평소와 달라 보이면, 가까운 시일 내 수의사 선생님과 상담해 보시길 부드럽게 권해드려요.';
}

// ────────────────────────────────────────────────
// 무지개연결 전용 위험 문장 패턴 (FEAT-11)
// 기존 STRIP_SENTENCE / BANNED_REPLACE 불변 — 확장만
// ────────────────────────────────────────────────

/**
 * 무지개연결 전용 위험 "문장" 패턴.
 *
 * ★ 보정 지시 R1 — "단어 삭제기"가 아니라 "위험 문장 패턴 차단기"
 *   - 단어 단독(`고마워`/`사망`/`무지개`/`세상을 떠난` 등) 제거 금지.
 *   - 차단 대상: 반려동물 주어+감정/의지/영적 술어의 **근접 조합**, 사망 원인 추측 **문장**.
 *
 * 반드시 통과(허용)해야 하는 문장 — 아래 패턴이 이 문장들을 잡지 않도록 설계:
 *   "고마웠던 순간을 기록 속에서 찾아볼게요."
 *   "무지개연결은 함께한 시간을 돌아보는 공간이에요."
 *   "세상을 떠난 반려동물과의 추억을 회상하기 위한 모드입니다."
 *   "남겨진 발자국 속에 돌보려 한 흔적이 보여요."
 *   "이 기록은 결론을 내리기보다 천천히 바라보게 해줘요."
 *
 * 반드시 제거(금지)해야 하는 문장:
 *   "아이가 고마워하고 있어요"   → ① 매칭
 *   "아이도 행복했을 거예요"     → ① 매칭
 *   "하늘에서 보고 있어요"       → ② 매칭
 *   "당신을 용서했을 거예요"     → 기존 sanitize() 의 STRIP_SENTENCE(/용서했/) 처리
 *   "사망 원인은 ~일 수 있어요"  → ⑥ 매칭
 */
const RAINBOW_STRIP_SENTENCE: RegExp[] = [
  // ① 반려동물 주어 + 감정·의지 대리 표현
  //    예: "아이가 고마워하고 있어요" / "아이도 행복했을 거예요"
  //    허용: "고마웠던 순간을 기록 속에서 찾아볼게요." (반려동물 주어 없음 → 미매칭)
  /(아이|반려동물|그\s*아이|이\s*아이|녀석)[가는도이]?.{0,20}(고마워하|고마워했|행복했|행복해했|행복할\s*거|기뻐했|기뻤|그리워하|그리워했|보고\s*싶어해)/,

  // ② 하늘에서 + 영적 감시·지켜봄 (술어 조합 필수 — "하늘에서" 단어만으론 차단 안 함)
  //    예: "하늘에서 보고 있어요"
  //    허용: "하늘에서 비가 내려요" (보고/지켜/바라보/내려다/기다리 없음 → 미매칭)
  /하늘에서.{0,15}(보고|지켜|바라보|내려다|기다리)/,

  // ③ 무지개다리 (영적 은유)
  //    예: "무지개다리를 건너 기다리고 있어요"
  //    허용: "무지개연결은 함께한 시간을 돌아보는 공간이에요." ("무지개연결" ≠ "무지개다리" → 미매칭)
  /무지개\s*다리/,

  // ④ 영적 장소(곁)에서 지켜봄·기다림
  //    예: "곁에서 지켜보고 있어요"
  /곁에서.{0,15}(지켜보|보고\s*있|기다리)/,

  // ⑤ 반려동물 주어 + 영적 기다림·지켜봄
  //    예: "아이가 기다리고 있어요"
  /(아이|반려동물|그\s*아이|이\s*아이|녀석)[가는도이]?.{0,20}(기다리고\s*있|지켜보고\s*있)/,

  // ⑥ 사망 원인 추측 (원인+술어 근접 조합 필수)
  //    예: "사망 원인은 노화일 수 있어요"
  //    허용: "세상을 떠난 반려동물과의 추억을 회상하기 위한 모드입니다."
  //          ("사망/죽음" + "원인" + "일 수/때문/였을" 조합 없음 → 미매칭)
  /(사망|죽음).{0,5}원인.{0,20}(일\s*수|때문|였을|이었을)/,
];

/**
 * sanitizeRainbow(text): 무지개연결 모드 AI 응답 전용 후처리.
 *
 * 동작 흐름:
 *   1. 기존 sanitize(text) 적용 — 단정·말대리·의료 문장 제거/완화 재사용.
 *   2. 결과를 줄·문장 단위로 분리.
 *   3. RAINBOW_STRIP_SENTENCE 패턴에 매칭되는 문장만 추가 제거.
 *   4. 남은 문장 재결합. 전부 제거 시 안전 기본 문구 반환.
 *
 * ★ 보정 지시 R2: AI 응답에만 적용.
 *   UI 고정 문구(첫 진입 안내·버튼·모드 설명 등)에는 적용하지 않는다(FEAT-13 담당).
 *
 * 예외 처리:
 *   - 빈 문자열 / undefined → 그대로 반환 (크래시 금지).
 *   - 모든 문장이 제거되면 안전 기본 문구 반환 (빈 응답 방지).
 */
export function sanitizeRainbow(text: string): string {
  if (!text) return text;

  // 1단계: 기존 sanitize 적용 (단정·말대리·의료 패턴 처리)
  const base = sanitize(text);

  // 2단계: 줄 단위 → 문장 단위 분리 후 RAINBOW_STRIP_SENTENCE 필터
  const lines = base.split('\n');
  const cleanedLines = lines.map(line => {
    // 마침표·느낌표·물음표 뒤로 문장 분리 (기존 sanitize 방식 차용)
    const parts = line.split(/(?<=[.!?])\s*/);
    const filtered = parts.filter(
      part => !RAINBOW_STRIP_SENTENCE.some(re => re.test(part))
    );
    return filtered.join(' ').trim();
  });

  const result = cleanedLines.filter(l => l.length > 0).join('\n').trim();

  // 3단계: 전부 제거됐으면 안전 기본 문구 반환 (빈 응답 방지)
  if (!result) {
    return '기록을 천천히 살펴보았어요. 함께한 시간이 남아 있어요.';
  }

  return result;
}
