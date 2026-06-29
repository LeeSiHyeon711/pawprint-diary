/**
 * lib/types.ts — 도메인 타입 (FEAT-02)
 *
 * ★ 이 파일의 타입 이름·필드는 모든 FEAT가 그대로 사용한다. 임의 변경 금지.
 *   후속 FEAT(03~09)는 여기 정의된 이름·구조에 의존한다.
 */

// ────────────────────────────────────────────────
// 선택값 유니온 타입
// ────────────────────────────────────────────────

export type Species  = '강아지' | '고양이' | '기타';
export type Gender   = '수컷' | '암컷' | '중성화 수컷' | '중성화 암컷';
export type Appetite = '잘 먹음' | '보통' | '적게 먹음' | '거의 안 먹음';
export type Activity = '매우 활발함' | '보통' | '조용함' | '거의 움직이지 않음';
export type Sleep    = '평소보다 많이 잠' | '보통' | '평소보다 적게 잠';
export type Toilet   = '정상' | '묽음' | '굳음' | '없음' | '이상 있음';

// ────────────────────────────────────────────────
// 도메인 인터페이스
// ────────────────────────────────────────────────

export interface Pet {
  pet_id: string;
  name: string;
  species: Species;
  breed?: string;
  age: string;
  gender: Gender;
  personality?: string;
  likes?: string;
  dislikes?: string;
  health_notes?: string;
  /**
   * ⚠ IndexedDB 저장 전용 Blob.
   * AI 요청(/api/ai/*)에 절대 포함 금지 — 직렬화 시 반드시 제외 (보정 지시 4).
   */
  profile_image?: Blob;
  created_at: string; // ISO 문자열
}

export interface AISummary {
  condition: string;    // 오늘의 컨디션 요약
  behavior: string;     // 행동 해석
  observation: string;  // 관찰 포인트
  memory: string;       // 한 줄 추억 문장
  vet_note?: string;    // 조건부 병원 상담 권장 (FEAT-05/06)
  generated_at: string; // ISO 문자열
}

export interface DiaryEntry {
  entry_id: string;
  pet_id: string;
  date: string;            // YYYY-MM-DD — 정렬 1순위 desc (보정 지시 7)
  diary_text?: string;
  appetite?: Appetite;
  activity?: Activity;
  sleep?: Sleep;
  toilet?: Toilet;
  unusual_behavior?: string;
  mood_tags: string[];
  /**
   * ⚠ IndexedDB 저장 전용 Blob 배열.
   * AI 요청(/api/ai/*)에 절대 포함 금지 — 직렬화 시 반드시 제외 (보정 지시 4).
   */
  photos: Blob[];
  ai_summary?: AISummary; // 저장 시 함께 저장 (결정 #4). FEAT-04는 미포함 저장, FEAT-06이 병합
  created_at: string;     // ISO 문자열 — 정렬 2순위: 동일 date 내 desc (보정 지시 7)
}

export interface AIConversation {
  conversation_id: string;
  pet_id: string;
  user_question: string;
  ai_response: string;
  timestamp: string; // ISO 문자열
  mode?: 'ask' | 'rainbow'; // ★ FEAT-10: 대화 출처 구분 (미지정 시 'ask'로 간주)
}

export interface MetaRecord {
  key: string;
  value: string;
}
