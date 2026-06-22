/**
 * lib/aiClient.ts — AI 클라이언트 fetch 래퍼 (FEAT-06 · FEAT-07)
 *
 * requestSummary: POST /api/ai/summary
 * requestAsk:     POST /api/ai/ask
 *
 * ★ 보정 지시 4: pet.profile_image(Blob), entry.photos(Blob[]) 절대 포함 금지.
 *   텍스트/상태 필드만 명시적으로 매핑해 전송.
 */

import type { Pet, DiaryEntry } from './types';

// ────────────────────────────────────────────────
// 반환 타입
// ────────────────────────────────────────────────

export interface SummaryResponse {
  condition: string;
  behavior: string;
  observation: string;
  memory: string;
  vet_note: string | null;
}

// ────────────────────────────────────────────────
// requestSummary
// ────────────────────────────────────────────────

/**
 * 저장된 DiaryEntry에 대해 AI 4종 요약을 요청한다.
 *
 * - Blob 필드(pet.profile_image, entry.photos)를 **제외**하고 텍스트/상태 필드만 직렬화한다.
 * - 서버 오류(4xx/5xx)는 Error를 throw한다. 호출자가 try/catch로 처리해야 한다.
 * - 네트워크 오류도 throw되므로 호출자가 처리한다.
 * - AI 실패와 무관하게 이미 저장된 entry는 보존된다(보정 지시 5).
 */
export async function requestSummary(
  pet: Pet,
  entry: DiaryEntry,
): Promise<SummaryResponse> {
  // ── Blob 제외 pet 페이로드 ──────────────────────────
  // profile_image(Blob) 명시적으로 미포함 (보정 지시 4)
  const petPayload = {
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    age: pet.age,
    gender: pet.gender,
    personality: pet.personality,
    likes: pet.likes,
    dislikes: pet.dislikes,
    health_notes: pet.health_notes,
  };

  // ── Blob 제외 entry 페이로드 ──────────────────────────
  // photos(Blob[]) 명시적으로 미포함, ai_summary·entry_id·created_at 미포함 (보정 지시 4)
  const entryPayload = {
    date: entry.date,
    diary_text: entry.diary_text,
    appetite: entry.appetite,
    activity: entry.activity,
    sleep: entry.sleep,
    toilet: entry.toilet,
    unusual_behavior: entry.unusual_behavior,
    mood_tags: entry.mood_tags,
  };

  const res = await fetch('/api/ai/summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pet: petPayload, entry: entryPayload }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `AI 요약 요청 실패 (${res.status}): ${text || res.statusText}`,
    );
  }

  return res.json() as Promise<SummaryResponse>;
}

// ────────────────────────────────────────────────
// requestAsk (FEAT-07)
// ────────────────────────────────────────────────

/**
 * 보호자의 자유 질문에 대해 AI 맞춤 답변을 요청한다.
 *
 * - pet 직렬화: profile_image(Blob) 제외, 텍스트/상태 필드만 전송 (보정 지시 4).
 * - recent 직렬화: photos(Blob[]) 제외, 상태+condition 필드만 전송 (보정 지시 4).
 * - 서버 오류(4xx/5xx)·네트워크 오류는 Error를 throw한다. 호출자가 try/catch로 처리.
 */
export async function requestAsk(
  pet: Pet,
  question: string,
  recent: DiaryEntry[],
): Promise<{ answer: string }> {
  // ── Blob 제외 pet 페이로드 ──────────────────────────
  // profile_image(Blob) 명시적으로 미포함 (보정 지시 4)
  const petPayload = {
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    age: pet.age,
    gender: pet.gender,
    personality: pet.personality,
    likes: pet.likes,
    dislikes: pet.dislikes,
    health_notes: pet.health_notes,
  };

  // ── Blob 제외 recent 페이로드 ────────────────────────
  // photos(Blob[]) 명시적으로 미포함, ai_summary.condition만 텍스트 추출 (보정 지시 4)
  const recentPayload = recent.map((e) => ({
    date: e.date,
    appetite: e.appetite,
    activity: e.activity,
    sleep: e.sleep,
    toilet: e.toilet,
    unusual_behavior: e.unusual_behavior,
    mood_tags: e.mood_tags,
    condition: e.ai_summary?.condition,
  }));

  const res = await fetch('/api/ai/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pet: petPayload, question, recent: recentPayload }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `AI 질문 요청 실패 (${res.status}): ${text || res.statusText}`,
    );
  }

  return res.json() as Promise<{ answer: string }>;
}
