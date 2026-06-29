/**
 * app/api/ai/rainbow/route.ts — 무지개연결 AI 회고 Route Handler (FEAT-12)
 *
 * POST /api/ai/rainbow
 * 입력: { pet, intent:'intro'|'chat', question?, records, history? }  ← Blob 미포함(보정 지시 R3)
 * 출력: { answer: string }
 *
 * ★ ANTHROPIC_API_KEY 미설정 → 결정적 Mock 응답 반환 (AC-R09)
 * ★ Anthropic 호출 실패/타임아웃 → graceful Mock 폴백
 * ★ sanitizeRainbow()는 실모델·Mock 모든 경로의 마지막 단계로 공통 적용 (AC-R07)
 * ★ ANTHROPIC_API_KEY / NEXT_PUBLIC_* 키 클라이언트 노출 금지
 */

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import {
  buildRainbowIntroPrompt,
  buildRainbowChatPrompt,
} from '@/lib/rainbowPrompt';
import type { RainbowRecord } from '@/lib/rainbowPrompt';
import { sanitizeRainbow } from '@/lib/guardrails';
import type { PetLike } from '@/lib/guardrails';

// 모델 기본값 고정 (FEAT-12 §6, 보정 지시 2)
const model = process.env.ANTHROPIC_MODEL || 'claude-opus-4-8';

interface RainbowRequest {
  pet: PetLike;
  intent: 'intro' | 'chat';
  question?: string;
  records: RainbowRecord[];
  history?: { q: string; a: string }[];
}

// ────────────────────────────────────────────────
// Mock 응답 생성 (키 없을 때 / 호출 실패 폴백)
//
// ★ 결정성 보장: 입력(pet.name, intent, records 수)만을 결정 인자로 사용.
//   Date.now() / Math.random() 등 시간·난수 의존 값 금지.
//   동일 입력 → 동일 출력 보장.
// ★ records 0~1개 → "남겨진 기록이 많지는 않지만…" 어조(AC-R06)
// ★ 반드시 sanitizeRainbow() 통과
// ────────────────────────────────────────────────

function buildMockRainbow(req: RainbowRequest): string {
  const { pet, intent, question, records, history } = req;
  const name = pet.name;
  const recordCount = records?.length ?? 0;
  const fewRecords = recordCount <= 1;

  // 기록 수가 적을 때의 조심스러운 시작 문구 (AC-R06)
  const intro = fewRecords
    ? `남겨진 기록이 많지는 않지만, ${name}와 함께한 시간이 이 기록 속에 담겨 있어요.`
    : `${name}와 함께한 시간을 기록 속에서 조용히 살펴보았어요.`;

  if (intent === 'intro') {
    // intro: 첫 회고 산문 (300~500자 이내, 완충 어조)
    const latestDate = records[0]?.date ?? '';
    const moods = records
      .flatMap((r) => r.mood_tags ?? [])
      .slice(0, 3)
      .join(', ');
    const moodNote = moods
      ? `기록 속에는 ${moods} 같은 순간들이 남아 있어요.`
      : '';
    const countNote =
      recordCount > 0
        ? `총 ${recordCount}개의 기록이 있고${latestDate ? `, 그 중 ${latestDate}의 기록도 포함되어 있어요` : ''}.`
        : '';

    const raw =
      `${intro}\n\n` +
      `${countNote ? countNote + ' ' : ''}` +
      `${moodNote ? moodNote + ' ' : ''}` +
      `꾸준히 기록하고 돌본 흔적이 느껴져요. ` +
      `${name}와 함께했던 일상을 기록으로 남겨주신 마음이, ` +
      `지금 이 시간을 천천히 돌아보는 데 도움이 되고 있어요. ` +
      `이 기록들은 함께했던 시간의 작은 증거로, 오래 남을 거예요.`;

    return sanitizeRainbow(raw);
  }

  // chat: 질문에 기록 기반으로 답변
  const questionText = question ?? '';

  // 이전 대화 맥락이 있으면 참조 표시 (결정적)
  const hasHistory = history && history.length > 0;
  const contextNote = hasHistory
    ? `지금까지 나눈 이야기를 바탕으로 답해드릴게요. `
    : '';

  const fewNote = fewRecords
    ? `남겨진 기록이 많지는 않지만, `
    : `${recordCount}개의 기록을 살펴보았어요. `;

  const raw =
    `"${questionText}"에 대해 ${fewNote}답해드릴게요.\n\n` +
    `${contextNote}` +
    `${intro} ` +
    `기록에 남아 있는 사실을 바탕으로 조심스럽게 말씀드리면, ` +
    `${name}와 함께한 순간들은 보호자 분이 꾸준히 관찰하고 기록해 주신 덕분에 ` +
    `이렇게 남아있어요. ` +
    `단정 짓기보다는, 기록 속에 담긴 흔적을 함께 바라보는 마음으로 ` +
    `천천히 되돌아보시면 좋겠어요.`;

  return sanitizeRainbow(raw);
}

// ────────────────────────────────────────────────
// Route Handler
// ────────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  // 1. body 파싱
  let body: RainbowRequest;
  try {
    body = (await request.json()) as RainbowRequest;
  } catch {
    return NextResponse.json(
      { error: '요청 본문을 파싱할 수 없어요.' },
      { status: 400 }
    );
  }

  const { pet, intent, question, records = [], history } = body;

  // 2. 필수 필드 유효성 검증
  if (!pet?.name || !pet?.species || !intent) {
    return NextResponse.json(
      { error: '필수 필드(pet.name, pet.species, intent)가 누락되었어요.' },
      { status: 400 }
    );
  }

  if (intent !== 'intro' && intent !== 'chat') {
    return NextResponse.json(
      { error: 'intent는 "intro" 또는 "chat"이어야 해요.' },
      { status: 400 }
    );
  }

  if (intent === 'chat' && !question?.trim()) {
    return NextResponse.json(
      { error: 'chat 모드에서는 question이 필요해요.' },
      { status: 400 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // 3. ANTHROPIC_API_KEY 미설정 → 결정적 Mock 응답 (AC-R09)
  if (!apiKey) {
    const answer = buildMockRainbow({ pet, intent, question, records, history });
    return NextResponse.json({ answer });
  }

  // 4. 실제 Claude 호출
  try {
    // intent에 따라 프롬프트 분기
    const { system, user } =
      intent === 'intro'
        ? buildRainbowIntroPrompt(pet, records)
        : buildRainbowChatPrompt(pet, question!, records, history);

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

    // sanitizeRainbow — 실모델 응답도 마지막 단계에서 가드레일 적용 (AC-R07)
    const answer = sanitizeRainbow(rawText);

    return NextResponse.json({ answer });
  } catch (err) {
    // Graceful 폴백 — Claude 호출 실패/타임아웃 → Mock 반환
    console.error('[AI Rainbow] Claude 호출 실패, Mock 폴백:', err);
    const answer = buildMockRainbow({ pet, intent, question, records, history });
    return NextResponse.json({ answer });
  }
}
