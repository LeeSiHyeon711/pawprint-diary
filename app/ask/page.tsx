'use client';

/**
 * app/ask/page.tsx — AI에게 질문하기 (FEAT-07)
 *
 * 동작 흐름:
 *   1. 마운트 → activePet 확인 → 과거 대화 목록 로드(conversationRepo.listByPet)
 *   2. 질문 입력(예시 칩 또는 직접 입력) → 전송 버튼
 *   3. entryRepo.recentByPet(pet_id, 5) → requestAsk(pet, question, recent)
 *   4. 성공: conversationRepo.add 저장 → 목록 갱신(최신 Q&A 최상단) → 입력 초기화
 *   5. 실패: 에러 안내 + 재시도, 질문 텍스트 유지
 *
 * ★ Blob 필드 제외: requestAsk 내부에서 보장 (보정 지시 4)
 * ★ 1마리 MVP: activePet 하나만 기준 (보정 지시 8)
 * ★ usePet 시그니처: { pet, loading, refresh } (FEAT-03 확정)
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePet } from '@/lib/petContext';
import { entryRepo, conversationRepo } from '@/lib/repos';
import { requestAsk } from '@/lib/aiClient';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { AppHeader } from '@/components/AppHeader';
import type { AIConversation } from '@/lib/types';

// ── 예시 질문 칩 ──────────────────────────────────────
const EXAMPLE_QUESTIONS = [
  '요즘 자꾸 문 앞에서 긁어요',
  '활동량이 줄어든 것 같아요',
  '식욕이 갑자기 늘었어요',
  '낮잠을 너무 많이 자는 것 같아요',
];

// ── 타임스탬프 포맷 (한국어 짧은 날짜+시간) ─────────────
function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// ────────────────────────────────────────────────
// 페이지
// ────────────────────────────────────────────────

export default function AskPage(): JSX.Element {
  const { pet, loading } = usePet();

  // ── 질문 입력 상태 ─────────────────────────────
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  // ── 대화 목록 상태 ─────────────────────────────
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [convLoading, setConvLoading] = useState(false);

  // ── 대화 목록 갱신 ─────────────────────────────
  const refreshConversations = useCallback(async () => {
    if (!pet) return;
    setConvLoading(true);
    try {
      const list = await conversationRepo.listByPet(pet.pet_id);
      setConversations(list);
    } finally {
      setConvLoading(false);
    }
  }, [pet]);

  useEffect(() => {
    void refreshConversations();
  }, [refreshConversations]);

  // ── 로딩 중 ──────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner label="불러오는 중..." />
      </div>
    );
  }

  // ── activePet 없음 → 프로필 등록 유도 ────────
  if (!pet) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader title="AI에게 질문하기" />
        <EmptyState
          title="먼저 우리 아이를 소개해 주세요"
          description="반려동물 프로필을 등록하면 AI에게 질문할 수 있어요."
          action={
            <Link href="/profile/new">
              <Button variant="primary">프로필 등록하기</Button>
            </Link>
          }
        />
      </div>
    );
  }

  // ── 질문 전송 핸들러 ─────────────────────────
  const handleSubmit = async (): Promise<void> => {
    const trimmed = question.trim();
    if (!trimmed) return; // 빈 입력 차단

    setSubmitting(true);
    setError(undefined);

    try {
      // 최근 5개 기록 조회 (AI 컨텍스트 — 결정 #5)
      const recent = await entryRepo.recentByPet(pet.pet_id, 5);

      // AI 요청 (Blob 제외는 requestAsk 내부에서 처리 — 보정 지시 4)
      const response = await requestAsk(pet, trimmed, recent);

      // Q&A 저장 (AC-12)
      await conversationRepo.add({
        pet_id: pet.pet_id,
        user_question: trimmed,
        ai_response: response.answer,
      });

      // 입력 초기화 + 목록 갱신 (방금 Q&A 최상단)
      setQuestion('');
      await refreshConversations();
    } catch (err) {
      console.error('[AskPage] AI 질문 실패:', err);
      // 에러 안내 + 질문 텍스트 유지 (보정 지시 5/3)
      setError('답변을 불러오지 못했어요. 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  // ────────────────────────────────────────────────
  // 렌더
  // ────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader title="AI에게 질문하기" />

      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">

        {/* ── 히어로 문구 ──────────────────────── */}
        <div className="mb-5 text-center">
          <p className="text-base font-semibold" style={{ color: 'var(--text)' }}>
            우리 아이에 대해 무엇이든 물어보세요 🐾
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {pet.name}의 프로필과 최근 기록을 참고해 답해드려요.
          </p>
        </div>

        {/* ── 예시 질문 칩 ─────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-4" aria-label="예시 질문">
          {EXAMPLE_QUESTIONS.map((q) => (
            <Tag
              key={q}
              label={q}
              onClick={() => setQuestion(q)}
            />
          ))}
        </div>

        {/* ── 질문 입력 영역 ───────────────────── */}
        <div className="flex flex-col gap-3 mb-4">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={`${pet.name}에 대해 궁금한 것을 자유롭게 적어주세요.`}
            disabled={submitting}
            rows={3}
            className="w-full rounded-input px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 disabled:opacity-50"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
            aria-label="질문 입력"
          />
          <Button
            variant="primary"
            full
            onClick={() => { void handleSubmit(); }}
            disabled={submitting || !question.trim()}
          >
            {submitting ? '답변 중...' : '질문하기'}
          </Button>
        </div>

        {/* ── 전송 중 스피너 ───────────────────── */}
        {submitting && (
          <div className="mb-6 flex flex-col items-center gap-1">
            <Spinner label="AI가 답변을 준비하고 있어요" />
            <p
              className="text-sm"
              style={{ color: 'var(--text-muted)' }}
              aria-live="polite"
            >
              AI가 {pet.name}의 기록을 살펴보고 있어요...
            </p>
          </div>
        )}

        {/* ── 에러 + 재시도 ────────────────────── */}
        {error && !submitting && (
          <div
            className="mb-6 rounded-card p-4 flex flex-col gap-3"
            style={{
              backgroundColor: 'var(--tag-bg)',
              border: '1px solid var(--border)',
            }}
            role="alert"
          >
            <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
              {error}
            </p>
            <div className="flex justify-center">
              <Button
                variant="soft"
                onClick={() => { void handleSubmit(); }}
              >
                다시 시도하기
              </Button>
            </div>
          </div>
        )}

        {/* ── 대화 목록 ────────────────────────── */}
        {convLoading && !submitting ? (
          <Spinner label="이전 대화 불러오는 중..." />
        ) : conversations.length > 0 ? (
          <div className="mt-2">
            <p
              className="text-xs font-semibold mb-3 uppercase tracking-wide"
              style={{ color: 'var(--text-muted)' }}
            >
              이전 대화
            </p>
            <div className="flex flex-col gap-5">
              {conversations.map((conv) => (
                <div key={conv.conversation_id} className="flex flex-col gap-2">
                  {/* 질문 카드 (오른쪽 들여쓰기) */}
                  <Card className="ml-6">
                    <p
                      className="text-xs font-semibold mb-1"
                      style={{ color: 'var(--primary)' }}
                    >
                      질문
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text)' }}>
                      {conv.user_question}
                    </p>
                  </Card>
                  {/* 답변 카드 (왼쪽 들여쓰기) */}
                  <Card className="mr-6">
                    <p
                      className="text-xs font-semibold mb-1"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      AI 답변
                    </p>
                    <p
                      className="text-sm whitespace-pre-wrap"
                      style={{ color: 'var(--text)' }}
                    >
                      {conv.ai_response}
                    </p>
                    <p
                      className="text-xs mt-2 text-right"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {formatTimestamp(conv.timestamp)}
                    </p>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        ) : (
          !submitting && (
            <p
              className="text-sm text-center py-8"
              style={{ color: 'var(--text-muted)' }}
            >
              아직 질문 기록이 없어요.
              <br />
              궁금한 것을 자유롭게 물어보세요.
            </p>
          )
        )}
      </div>
    </div>
  );
}
