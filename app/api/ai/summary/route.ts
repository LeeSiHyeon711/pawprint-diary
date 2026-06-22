/**
 * app/api/ai/summary/route.ts — 일기 요약 AI Route Handler (FEAT-05)
 *
 * POST /api/ai/summary
 * 입력: { pet: PetLike, entry: EntryLike }  ← Blob 미포함(보정 지시 4)
 * 출력: { condition, behavior, observation, memory, vet_note: string | null }
 *
 * ★ ANTHROPIC_API_KEY 미설정 → 결정적 Mock 응답 반환 (보정 지시 9)
 * ★ Anthropic 호출 실패/타임아웃 → graceful Mock 폴백 (보정 지시 9)
 * ★ sanitize()는 실모델·Mock·폴백 모든 경로의 마지막 단계로 공통 적용 (보정 지시 3)
 * ★ ANTHROPIC_API_KEY / NEXT_PUBLIC_* 키 클라이언트 노출 금지 (보정 지시 3)
 */

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildSummaryPrompt } from '@/lib/prompt';
import { sanitize, needsVetNote, buildVetNote } from '@/lib/guardrails';
import type { PetLike, EntryLike } from '@/lib/guardrails';

// 모델 기본값 고정 (보정 지시 2)
const model = process.env.ANTHROPIC_MODEL || 'claude-opus-4-8';

interface SummaryRequest {
  pet: PetLike;
  entry: EntryLike;
}

interface SummaryFields {
  condition: string;
  behavior: string;
  observation: string;
  memory: string;
  vet_note: string | null;
}

// ────────────────────────────────────────────────
// Mock 응답 생성 (키 없을 때 / 호출 실패 폴백)
// 가드레일 형식 준수, 완충 표현만 사용, sanitize() 최종 적용
// ────────────────────────────────────────────────

function buildMockSummary(pet: PetLike, entry: EntryLike): SummaryFields {
  const name         = pet.name;
  const appetiteText = entry.appetite ?? '보통';
  const activityText = entry.activity ?? '보통';
  const moodText     =
    entry.mood_tags && entry.mood_tags.length > 0
      ? entry.mood_tags.join(', ')
      : '평온한 편';
  const diaryHint    = entry.diary_text
    ? ' 일기 내용을 살펴보면 오늘 하루의 이야기가 담겨 있어요.'
    : '';

  const condition = sanitize(
    `기록을 보면 ${name}의 오늘 식욕은 ${appetiteText} 상태였어요.` +
    ` 어쩌면 평소와 조금 다른 하루였을 가능성이 있어요.` +
    diaryHint
  );
  const behavior = sanitize(
    `활동량이 ${activityText}인 점을 살펴보면, 아마 오늘은 ${name}에게 그런 하루였을 수도 있어요.` +
    ` 단정할 수는 없지만, 보호자 분의 관찰이 소중한 기록이 되어가고 있어요.`
  );
  const observation = sanitize(
    `오늘 기분 태그로 ${moodText}가 기록되었어요.` +
    ` 보호자 분이 세심하게 관찰해 주신 덕분에 ${name}의 하루가 잘 남겨졌네요.`
  );
  const memory = sanitize(
    `오늘도 ${name}와 함께한 시간이 따뜻한 추억으로 남길 바라요.` +
    ` 보호자 분의 사랑이 느껴지는 하루였어요.`
  );

  const vet_note = needsVetNote(entry) ? buildVetNote() : null;

  return { condition, behavior, observation, memory, vet_note };
}

// ────────────────────────────────────────────────
// Route Handler
// ────────────────────────────────────────────────

export async function POST(request: Request) {
  // 1. body 파싱
  let body: SummaryRequest;
  try {
    body = (await request.json()) as SummaryRequest;
  } catch {
    return NextResponse.json(
      { error: '요청 본문을 파싱할 수 없어요.' },
      { status: 400 }
    );
  }

  const { pet, entry } = body;

  // 2. 필수 필드 검증
  if (!pet?.name || !pet?.species || !entry?.date) {
    return NextResponse.json(
      { error: '필수 필드(pet.name, pet.species, entry.date)가 누락되었어요.' },
      { status: 400 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // 3. ANTHROPIC_API_KEY 미설정 → 결정적 Mock 응답 (보정 지시 9)
  if (!apiKey) {
    return NextResponse.json(buildMockSummary(pet, entry));
  }

  // 4. 실제 Claude 호출
  try {
    const { system, user } = buildSummaryPrompt(pet, entry);
    const client = new Anthropic({ apiKey });

    // 4-1. 첫 번째 시도
    const res = await client.messages.create({
      model,
      max_tokens: 900,
      temperature: 0.6,
      system,
      messages: [{ role: 'user', content: user }],
    });

    const rawBlock = res.content.find(
      (c): c is Anthropic.TextBlock => c.type === 'text'
    );
    const rawText = rawBlock?.text ?? '';
    const jsonText = rawText.replace(/```json\n?|```\n?/g, '').trim();

    // 4-2. JSON 파싱 시도
    let parsed: Record<string, string> | null = null;
    try {
      parsed = JSON.parse(jsonText) as Record<string, string>;
    } catch {
      // 4-3. 1회 재시도 — 새 요청으로 JSON only 강제
      try {
        const retryRes = await client.messages.create({
          model,
          max_tokens: 900,
          temperature: 0,
          system,
          messages: [
            {
              role: 'user',
              content:
                user +
                '\n\n반드시 JSON 형식으로만 출력하세요. ' +
                '다른 텍스트·마크다운 없이 { "condition":"...", "behavior":"...", "observation":"...", "memory":"..." } 형식으로만.',
            },
          ],
        });
        const retryBlock = retryRes.content.find(
          (c): c is Anthropic.TextBlock => c.type === 'text'
        );
        const retryText = retryBlock?.text ?? '';
        const retryJson = retryText.replace(/```json\n?|```\n?/g, '').trim();
        parsed = JSON.parse(retryJson) as Record<string, string>;
      } catch {
        // 4-4. 폴백 — rawText를 4구간으로 분배
        const segments = rawText.split(/\n\n+/);
        const quarter  = Math.ceil(rawText.length / 4);
        parsed = {
          condition:   segments[0] ?? rawText.slice(0, quarter),
          behavior:    segments[1] ?? rawText.slice(quarter, quarter * 2),
          observation: segments[2] ?? rawText.slice(quarter * 2, quarter * 3),
          memory:      segments[3] ?? rawText.slice(quarter * 3),
        };
      }
    }

    // 5. 4필드 보장 + sanitize (보정 지시 3 — 모든 경로 공통 마지막 단계)
    const condition = sanitize(
      typeof parsed?.condition === 'string' && parsed.condition
        ? parsed.condition
        : '오늘 기록을 살펴보았어요. 하루 동안의 관찰이 소중한 기록이 되었어요.'
    );
    const behavior = sanitize(
      typeof parsed?.behavior === 'string' && parsed.behavior
        ? parsed.behavior
        : '행동 패턴을 주의 깊게 살펴보면 좋을 것 같아요.'
    );
    const observation = sanitize(
      typeof parsed?.observation === 'string' && parsed.observation
        ? parsed.observation
        : '보호자 분의 관찰이 소중한 기록이 되었어요.'
    );
    const memory = sanitize(
      typeof parsed?.memory === 'string' && parsed.memory
        ? parsed.memory
        : '오늘도 함께한 하루가 따뜻한 추억으로 남길 바라요.'
    );

    // 6. vet_note 강제 세팅 (AC-10)
    let vet_note: string | null = null;
    if (needsVetNote(entry)) {
      const modelVetNote =
        typeof parsed?.vet_note === 'string' ? parsed.vet_note.trim() : '';
      // 모델이 이미 병원 언급을 포함했으면 그대로(sanitize 적용), 없으면 buildVetNote() 주입
      const hasMention = /수의사|동물병원|병원/.test(
        [condition, behavior, observation, memory, modelVetNote].join(' ')
      );
      vet_note =
        hasMention && modelVetNote
          ? sanitize(modelVetNote)
          : buildVetNote();
    }

    return NextResponse.json({ condition, behavior, observation, memory, vet_note });
  } catch (err) {
    // Graceful 폴백 — Claude 호출 실패/타임아웃 → Mock 반환 (보정 지시 9)
    console.error('[AI Summary] Claude 호출 실패, Mock 폴백:', err);
    return NextResponse.json(buildMockSummary(pet, entry));
  }
}
