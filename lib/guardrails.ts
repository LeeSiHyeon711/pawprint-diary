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
