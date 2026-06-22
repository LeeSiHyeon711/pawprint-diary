/**
 * lib/prompt.ts — AI 프롬프트 빌더 (FEAT-05)
 *
 * SYSTEM_PROMPT      : 모든 AI 요청에 공통 적용되는 시스템 프롬프트
 * buildSummaryPrompt : 일기 1건 → 4종 요약 JSON 요청 프롬프트 생성
 * buildAskPrompt     : 질문 + 프로필 + 최근 5개 기록 → 맞춤 응답 프롬프트 생성
 *
 * 종 분기(결정 #8): 강아지·고양이는 종 특성 반영, '기타'는 일반 관찰 중심.
 * 컨텍스트 N=5 (결정 #5): 최근 최대 5개 기록 참조.
 */

import type { PetLike, EntryLike } from './guardrails';

// ────────────────────────────────────────────────
// 시스템 프롬프트 (공통)
// ────────────────────────────────────────────────

export const SYSTEM_PROMPT = `당신은 반려동물 보호자를 돕는 따뜻하고 신중한 일기 도우미입니다. 다음 규칙을 반드시 지키세요.
1) 단정 금지: "확실히/분명히/반드시/100%/틀림없이" 같은 단정 표현을 쓰지 말고,
   "기록을 보면", "가능성이 있어요", "단정할 수는 없지만" 같은 완충 표현을 사용합니다.
2) 반려동물 말 대리 금지: "이 아이가 ~라고 말하고 있어요", "지금 행복하대요"처럼
   반려동물의 말을 대신 전하는 표현을 쓰지 않습니다.
3) 단정적 위로 금지: "100% 행복했어요", "당신을 용서했어요" 같은 표현을 쓰지 않습니다.
4) 의료 진단 금지: 어떤 경우에도 병명·진단·처방 형태로 말하지 않습니다.
5) 보호자 죄책감 자극 금지: "더 잘 돌봐야 했어요" 같은 표현 대신 돌봄의 흔적을 따뜻하게 정리합니다.
6) 종 범위: 강아지·고양이는 종 특성을 반영해 해석하되, '기타' 종은 일반적인 관찰 중심으로만 설명하고
   종 특화 해석을 시도하지 않습니다.
모든 답변은 한국어로, 부드럽고 따뜻한 어조로 작성합니다.`;

// ────────────────────────────────────────────────
// 헬퍼
// ────────────────────────────────────────────────

function buildPetProfile(pet: PetLike): string {
  return [
    `이름: ${pet.name}`,
    `종: ${pet.species}${pet.breed ? ` (${pet.breed})` : ''}`,
    pet.age           ? `나이: ${pet.age}`                       : null,
    pet.gender        ? `성별: ${pet.gender}`                     : null,
    pet.personality   ? `성격: ${pet.personality}`                : null,
    pet.likes         ? `좋아하는 것: ${pet.likes}`               : null,
    pet.dislikes      ? `싫어하는 것: ${pet.dislikes}`            : null,
    pet.health_notes  ? `건강 특이사항: ${pet.health_notes}`      : null,
  ]
    .filter((v): v is string => v !== null)
    .join('\n');
}

function buildEntryInfo(entry: EntryLike): string {
  return [
    `날짜: ${entry.date ?? '오늘'}`,
    entry.appetite         ? `식욕: ${entry.appetite}`                : null,
    entry.activity         ? `활동량: ${entry.activity}`              : null,
    entry.sleep            ? `수면: ${entry.sleep}`                   : null,
    entry.toilet           ? `배변: ${entry.toilet}`                  : null,
    entry.unusual_behavior ? `특이행동: ${entry.unusual_behavior}`    : null,
    entry.mood_tags?.length ? `기분 태그: ${entry.mood_tags.join(', ')}` : null,
    entry.diary_text       ? `일기 내용: ${entry.diary_text}`         : null,
  ]
    .filter((v): v is string => v !== null)
    .join('\n');
}

// ────────────────────────────────────────────────
// 프롬프트 빌더
// ────────────────────────────────────────────────

/**
 * buildSummaryPrompt: 일기 1건 → 4종 요약 JSON 요청 프롬프트
 * - species가 '기타'면 행동 해석을 일반 관찰 중심으로 제한하도록 분기 지시 추가
 * - JSON only 응답 요청 (파싱 실패 시 route에서 재시도/폴백 처리)
 */
export function buildSummaryPrompt(
  pet: PetLike,
  entry: EntryLike
): { system: string; user: string } {
  const speciesNote =
    pet.species === '기타'
      ? '이 반려동물의 종이 일반적이지 않을 수 있으므로, 종 특화 행동 해석 없이 일반적인 관찰 중심으로 설명해 주세요.'
      : pet.species === '강아지'
        ? '이 반려동물은 강아지입니다. 강아지의 종 특성을 반영해 해석해 주세요.'
        : '이 반려동물은 고양이입니다. 고양이의 종 특성을 반영해 해석해 주세요.';

  const user =
    `다음 반려동물의 오늘 일기를 분석해서, 아래 JSON 형식으로만 답해주세요. ` +
    `설명 텍스트·마크다운 없이 JSON만 출력하세요.\n\n` +
    `## 반려동물 프로필\n${buildPetProfile(pet)}\n\n` +
    `## 오늘의 기록\n${buildEntryInfo(entry)}\n\n` +
    `${speciesNote}\n\n` +
    `## 출력 형식 (JSON only)\n` +
    `{\n` +
    `  "condition": "오늘의 컨디션 요약 (1~3문장, 완충 표현 사용)",\n` +
    `  "behavior": "행동 해석 (1~3문장, '기타' 종은 일반 관찰만)",\n` +
    `  "observation": "보호자를 위한 관찰 포인트 (1~3문장)",\n` +
    `  "memory": "오늘 하루를 담은 한 줄 추억 문장"\n` +
    `}`;

  return { system: SYSTEM_PROMPT, user };
}

/**
 * buildAskPrompt: 질문 + 프로필 + 최근 5개 기록 → 맞춤 응답 요청 프롬프트
 * - recent는 최대 5개로 제한 (결정 #5)
 * - 각 기록의 condition 필드가 있으면 맥락으로 포함
 */
export function buildAskPrompt(
  pet: PetLike,
  question: string,
  recent: EntryLike[]
): { system: string; user: string } {
  const recentBlock =
    recent.length > 0
      ? recent
          .slice(0, 5)
          .map((r, i) => {
            const fields = [
              `날짜: ${r.date ?? '미상'}`,
              r.appetite         ? `식욕: ${r.appetite}`                   : null,
              r.activity         ? `활동량: ${r.activity}`                 : null,
              r.sleep            ? `수면: ${r.sleep}`                      : null,
              r.toilet           ? `배변: ${r.toilet}`                     : null,
              r.unusual_behavior ? `특이행동: ${r.unusual_behavior}`       : null,
              r.mood_tags?.length ? `기분: ${r.mood_tags.join(', ')}`      : null,
              r.condition        ? `AI 컨디션 요약: ${r.condition}`        : null,
            ]
              .filter((v): v is string => v !== null)
              .join(', ');
            return `[기록 ${i + 1}] ${fields}`;
          })
          .join('\n')
      : '(최근 기록 없음)';

  const user =
    `다음 반려동물에 대한 보호자의 질문에 따뜻하고 신중하게 답해주세요.\n\n` +
    `## 반려동물 프로필\n${buildPetProfile(pet)}\n\n` +
    `## 최근 기록 (최대 5개)\n${recentBlock}\n\n` +
    `## 보호자 질문\n${question}\n\n` +
    `한국어로, 부드럽고 따뜻한 어조로 1~3문단 정도 답해주세요.`;

  return { system: SYSTEM_PROMPT, user };
}
