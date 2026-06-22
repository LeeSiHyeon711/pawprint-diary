/**
 * app/api/ai/ask/route.ts — AI 질문 Route Handler (FEAT-05)
 *
 * POST /api/ai/ask
 * 입력: { pet: PetLike, question: string, recent?: EntryLike[] }  ← Blob 미포함(보정 지시 4)
 * 출력: { answer: string }
 *
 * ★ ANTHROPIC_API_KEY 미설정 → 결정적 Mock 응답 반환 (보정 지시 9)
 * ★ Anthropic 호출 실패/타임아웃 → graceful Mock 폴백 (보정 지시 9)
 * ★ sanitize()는 실모델·Mock 모든 경로의 마지막 단계로 공통 적용 (보정 지시 3)
 * ★ ANTHROPIC_API_KEY / NEXT_PUBLIC_* 키 클라이언트 노출 금지 (보정 지시 3)
 */

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildAskPrompt } from '@/lib/prompt';
import { sanitize } from '@/lib/guardrails';
import type { PetLike, EntryLike } from '@/lib/guardrails';

// 모델 기본값 고정 (보정 지시 2)
const model = process.env.ANTHROPIC_MODEL || 'claude-opus-4-8';

interface AskRequest {
  pet: PetLike;
  question: string;
  recent?: EntryLike[];
}

// ────────────────────────────────────────────────
// Mock 응답 생성 (키 없을 때 / 호출 실패 폴백)
// 프로필·최근 기록 맥락 반영, 완충 표현만 사용, sanitize() 최종 적용 (AC-11)
// ────────────────────────────────────────────────

function buildMockAsk(
  pet: PetLike,
  question: string,
  recent: EntryLike[]
): string {
  const name           = pet.name;
  const recentCount    = recent.length;
  const latestDate     = recent[0]?.date ?? '최근';
  const latestActivity = recent[0]?.activity ?? '보통';
  const latestAppetite = recent[0]?.appetite ?? '보통';
  const personalityNote = pet.personality
    ? `${name}의 성격이 ${pet.personality}인 점을 고려하면`
    : '지금까지의 기록을 살펴보면';

  return sanitize(
    `"${question}"에 대해 답해드릴게요.\n\n` +
    `${name}의 최근 ${recentCount}개 기록을 살펴보았어요. ` +
    `${latestDate} 기록 기준으로 식욕은 ${latestAppetite}, 활동량은 ${latestActivity} 상태였네요. ` +
    `기록을 보면 ${name}는 아마 일상적인 컨디션을 유지하고 있을 가능성이 있어요. ` +
    `단정할 수는 없지만, 이 기록들이 소중한 참고가 되었으면 해요.\n\n` +
    `${personalityNote}, 지금처럼 꾸준히 관찰하고 기록해 주시는 것이 ` +
    `${name}에게 가장 좋은 돌봄이 되고 있어요. ` +
    `보호자 분의 세심한 관심이 늘 느껴지는 기록이에요.`
  );
}

// ────────────────────────────────────────────────
// Route Handler
// ────────────────────────────────────────────────

export async function POST(request: Request) {
  // 1. body 파싱
  let body: AskRequest;
  try {
    body = (await request.json()) as AskRequest;
  } catch {
    return NextResponse.json(
      { error: '요청 본문을 파싱할 수 없어요.' },
      { status: 400 }
    );
  }

  const { pet, question, recent = [] } = body;

  // 2. 필수 필드 검증
  if (!pet?.name || !pet?.species || !question?.trim()) {
    return NextResponse.json(
      { error: '필수 필드(pet.name, pet.species, question)가 누락되었어요.' },
      { status: 400 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // 3. ANTHROPIC_API_KEY 미설정 → 결정적 Mock 응답 (보정 지시 9)
  if (!apiKey) {
    return NextResponse.json({ answer: buildMockAsk(pet, question, recent) });
  }

  // 4. 실제 Claude 호출
  try {
    const { system, user } = buildAskPrompt(pet, question, recent);
    const client = new Anthropic({ apiKey });

    const res = await client.messages.create({
      model,
      max_tokens: 700,
      temperature: 0.6,
      system,
      messages: [{ role: 'user', content: user }],
    });

    const textBlock = res.content.find(
      (c): c is Anthropic.TextBlock => c.type === 'text'
    );
    const rawText = textBlock?.text ?? '';

    // sanitize — 실모델 응답도 마지막 단계에서 가드레일 적용 (보정 지시 3)
    const answer = sanitize(rawText);

    return NextResponse.json({ answer });
  } catch (err) {
    // Graceful 폴백 — Claude 호출 실패/타임아웃 → Mock 반환 (보정 지시 9)
    console.error('[AI Ask] Claude 호출 실패, Mock 폴백:', err);
    return NextResponse.json({ answer: buildMockAsk(pet, question, recent) });
  }
}
