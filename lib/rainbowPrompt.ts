/**
 * lib/rainbowPrompt.ts — 무지개연결 회고 프롬프트 빌더 (FEAT-11)
 *
 * RAINBOW_SYSTEM_PROMPT   : 무지개연결 전용 엄격 시스템 프롬프트
 * buildRainbowIntroPrompt : 첫 회고 카드용 user 프롬프트 생성
 * buildRainbowChatPrompt  : 채팅 답변용 user 프롬프트 생성
 * RainbowRecord           : Blob 제외 회고용 경량 타입
 *
 * PetLike는 lib/guardrails.ts 에서 재사용 (import).
 */

import type { PetLike } from './guardrails';

// ────────────────────────────────────────────────
// 회고용 경량 타입 (Blob 필드 제외)
// ────────────────────────────────────────────────

export interface RainbowRecord {
  date: string;
  mood_tags?: string[];
  /** 절단된 일기 텍스트 (AI 전송용) */
  diary_text?: string;
  /** ai_summary.condition 값 */
  condition?: string;
  photoCount?: number;
}

// ────────────────────────────────────────────────
// 무지개연결 전용 시스템 프롬프트
// ────────────────────────────────────────────────

export const RAINBOW_SYSTEM_PROMPT = `당신은 세상을 떠난 반려동물과 함께한 시간을, 보호자가 조용히
되돌아보도록 돕는 안내자입니다. 반려동물을 대신해 말하지 않습니다. 다음을 반드시 지키세요.
1) 반려동물 말 대리 금지: "아이가 ~라고 말해요", "고마워하고 있어요"처럼 반려동물을 주어로
   감정/의지를 대신 전하지 않습니다.
2) 감정 단정 금지: "행복했어요/행복했을 거예요/용서했어요"처럼 반려동물의 감정을 단정하지 않습니다.
3) 종교·영적 해석 금지: "하늘에서 보고 있어요", "무지개다리 건너", "기다리고 있어요" 등을 쓰지 않습니다.
4) 죄책감 자극·슬픔 재촉 금지: "이제 괜찮아져야 해요" 같은 표현 대신, 슬픔을 서둘러 정리하지
   않아도 된다는 태도를 유지합니다.
5) 의료 판단·사망 원인 추측 금지.
지향: 기록에 실제로 남아있는 사실(날짜·활동·자주 남겨진 순간·좋아했던 것)만 인용하고,
보호자가 꾸준히 기록하고 돌본 흔적을 조용히 비춥니다. 감정은 보호자의 몫으로 남깁니다.
기록이 적으면 "남겨진 기록이 많지는 않지만…"처럼 조심스럽게 답합니다.
모든 답변은 한국어로, 따뜻하지만 단정하지 않는 어조로 작성합니다.`;

// ────────────────────────────────────────────────
// 헬퍼 (내부 전용)
// ────────────────────────────────────────────────

function buildRainbowPetProfile(pet: PetLike): string {
  return [
    `이름: ${pet.name}`,
    `종: ${pet.species}${pet.breed ? ` (${pet.breed})` : ''}`,
    pet.age          ? `나이: ${pet.age}`                   : null,
    pet.gender       ? `성별: ${pet.gender}`                : null,
    pet.personality  ? `성격: ${pet.personality}`           : null,
    pet.likes        ? `좋아했던 것: ${pet.likes}`          : null,
    pet.dislikes     ? `힘들어했던 것: ${pet.dislikes}`     : null,
    pet.health_notes ? `건강 특이사항: ${pet.health_notes}` : null,
  ]
    .filter((v): v is string => v !== null)
    .join('\n');
}

function buildRainbowRecordsBlock(records: RainbowRecord[]): string {
  if (!records || records.length === 0) return '(남겨진 기록 없음)';
  return records
    .slice(0, 20)
    .map((r, i) => {
      const fields = [
        `날짜: ${r.date}`,
        r.mood_tags?.length  ? `기분 태그: ${r.mood_tags.join(', ')}`   : null,
        r.diary_text         ? `일기: ${r.diary_text.slice(0, 80)}`      : null,
        r.condition          ? `컨디션: ${r.condition}`                  : null,
        r.photoCount != null ? `사진 수: ${r.photoCount}`               : null,
      ]
        .filter((v): v is string => v !== null)
        .join(', ');
      return `[기록 ${i + 1}] ${fields}`;
    })
    .join('\n');
}

// ────────────────────────────────────────────────
// 프롬프트 빌더
// ────────────────────────────────────────────────

/**
 * buildRainbowIntroPrompt: 첫 회고 카드용 { system, user }.
 *
 * - 한국어 300~500자 이내 짧은 산문. 항목 나열(번호·불릿) 금지.
 * - 기록에 실제 남아있는 날짜·활동·기분 태그만 근거로 삼음.
 * - 기록이 적으면 "남겨진 기록이 많지는 않지만…"으로 시작.
 */
export function buildRainbowIntroPrompt(
  pet: PetLike,
  records: RainbowRecord[]
): { system: string; user: string } {
  const user =
    `다음 반려동물과 함께한 시간을 조용히 회고하는 글을 써주세요.\n\n` +
    `## 반려동물 프로필\n${buildRainbowPetProfile(pet)}\n\n` +
    `## 남겨진 기록 (최대 20개)\n${buildRainbowRecordsBlock(records)}\n\n` +
    `## 작성 규칙\n` +
    `- 한국어 산문으로, 300~500자 이내로 작성합니다.\n` +
    `- 번호 매기기·불릿 목록 없이 자연스럽게 흐르는 산문으로 씁니다.\n` +
    `- 기록에 실제로 남아있는 날짜·활동·기분 태그만 근거로 삼습니다.\n` +
    `- 보호자가 꾸준히 기록하고 돌본 흔적을 조용히 비춥니다.\n` +
    `- 감정 단정이나 영적 해석 없이, 사실과 따뜻한 관찰만 담습니다.\n` +
    `- 기록이 적으면 "남겨진 기록이 많지는 않지만…"으로 시작합니다.`;

  return { system: RAINBOW_SYSTEM_PROMPT, user };
}

/**
 * buildRainbowChatPrompt: 채팅 답변용 { system, user }.
 *
 * - 보호자의 질문에 기록 기반으로 조심스럽고 따뜻하게 답변.
 * - history가 있으면 최근 3턴까지 맥락으로 포함.
 */
export function buildRainbowChatPrompt(
  pet: PetLike,
  question: string,
  records: RainbowRecord[],
  history?: { q: string; a: string }[]
): { system: string; user: string } {
  const historyBlock =
    history && history.length > 0
      ? `## 이전 대화 (최근 ${Math.min(history.length, 3)}턴)\n` +
        history
          .slice(-3)
          .map((h, i) => `[Q${i + 1}] ${h.q}\n[A${i + 1}] ${h.a}`)
          .join('\n\n') +
        '\n\n'
      : '';

  const user =
    `다음 반려동물에 대한 보호자의 질문에, 기록을 근거로 조심스럽고 따뜻하게 답해주세요.\n\n` +
    `## 반려동물 프로필\n${buildRainbowPetProfile(pet)}\n\n` +
    `## 남겨진 기록 (최대 20개)\n${buildRainbowRecordsBlock(records)}\n\n` +
    historyBlock +
    `## 보호자 질문\n${question}\n\n` +
    `한국어로, 기록에 있는 사실만 근거로 삼아 1~3문단 정도 답해주세요. ` +
    `감정 단정·영적 해석·사망 원인 추측 없이, 보호자의 감정을 서두르지 않는 어조를 유지합니다.`;

  return { system: RAINBOW_SYSTEM_PROMPT, user };
}
