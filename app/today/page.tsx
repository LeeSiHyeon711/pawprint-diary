'use client';

/**
 * app/today/page.tsx — 오늘의 발자국 작성 + AI 발자국 읽기 (FEAT-04 + FEAT-06)
 *
 * 저장 흐름 (보정 지시 5 — 선저장 보장):
 *   1. entryRepo.save → entry 저장 완료 → setSavedEntry (일기 데이터 확정)
 *   2. requestSummary → /api/ai/summary 호출
 *   3. entryRepo.update → ai_summary 병합 저장
 *   4. AISummaryPanel 표시
 *
 * ★ AI 호출이 실패해도 step 1에서 저장된 일기 본문은 절대 유실되지 않는다.
 * ★ AI 요청 payload에 Blob 필드(photos, profile_image) 절대 포함 금지 (보정 지시 4).
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePet } from '@/lib/petContext';
import { entryRepo } from '@/lib/repos';
import { requestSummary } from '@/lib/aiClient';
import { DiaryForm, type DiaryFormValues } from '@/components/DiaryForm';
import { AISummaryPanel } from '@/components/AISummaryPanel';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { AppHeader } from '@/components/AppHeader';
import type { DiaryEntry, AISummary } from '@/lib/types';

// ────────────────────────────────────────────────
// 페이지
// ────────────────────────────────────────────────

export default function TodayPage(): JSX.Element {
  const { pet, loading } = usePet();

  // ── 일기 저장 상태 ──────────────────────────────
  const [submitting, setSubmitting]       = useState(false);
  /** 저장 완료된 DiaryEntry 객체. undefined이면 작성 폼을 표시한다. */
  const [savedEntry, setSavedEntry]       = useState<DiaryEntry | undefined>(undefined);
  const [saveError, setSaveError]         = useState<string | undefined>(undefined);

  // ── AI 상태 (저장 후 별도 단계 — 보정 지시 5) ────
  const [aiLoading, setAiLoading]         = useState(false);
  const [aiError, setAiError]             = useState<string | undefined>(undefined);
  const [aiSummary, setAiSummary]         = useState<AISummary | undefined>(undefined);

  // ────────────────────────────────────────────────
  // AI 호출 함수 — 저장 완료 후 별도 실행
  // 실패해도 savedEntry(이미 저장된 일기)는 건드리지 않는다 (보정 지시 5)
  // ────────────────────────────────────────────────
  const triggerAI = async (entry: DiaryEntry): Promise<void> => {
    if (!pet) return;
    setAiLoading(true);
    setAiError(undefined);
    try {
      const response = await requestSummary(pet, entry);

      // AISummary 구성 — vet_note: null → undefined 변환 (타입 정합)
      const aiSummaryData: AISummary = {
        condition:    response.condition,
        behavior:     response.behavior,
        observation:  response.observation,
        memory:       response.memory,
        ...(response.vet_note != null ? { vet_note: response.vet_note } : {}),
        generated_at: new Date().toISOString(),
      };

      // ai_summary 병합 저장 (entry 본문은 그대로 유지)
      await entryRepo.update({ ...entry, ai_summary: aiSummaryData });
      setAiSummary(aiSummaryData);
    } catch (err) {
      console.error('[TodayPage] AI 요약 실패 (일기는 보존됨):', err);
      setAiError('AI 읽기를 불러오지 못했어요. 다시 시도해 주세요.');
    } finally {
      setAiLoading(false);
    }
  };

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
        <AppHeader title="오늘의 발자국" />
        <EmptyState
          title="먼저 우리 아이를 소개해 주세요"
          description="반려동물 프로필을 등록하면 오늘의 발자국을 남길 수 있어요."
          action={
            <Link href="/profile/new">
              <Button variant="primary">프로필 등록하기</Button>
            </Link>
          }
        />
      </div>
    );
  }

  // ── 저장 완료 → AI 요약 화면 ─────────────────
  if (savedEntry) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader title="오늘의 발자국" />

        <div className="flex flex-col items-center flex-1 gap-6 px-6 py-12 max-w-lg mx-auto w-full">
          {/* 저장 성공 메시지 */}
          <span className="text-5xl leading-none" aria-hidden="true">
            🐾
          </span>
          <div className="flex flex-col gap-1 text-center">
            <p className="text-base font-semibold" style={{ color: 'var(--text)' }}>
              오늘의 발자국이 남겨졌어요!
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {pet.name}의 하루가 소중하게 저장되었어요.
            </p>
          </div>

          {/* ── AI 섹션 ──────────────────────────── */}

          {/* AI 로딩 중 */}
          {aiLoading && (
            <div className="w-full flex flex-col items-center gap-2">
              <Spinner label="AI가 오늘의 발자국을 읽고 있어요 🐾" />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }} aria-live="polite">
                AI가 오늘의 발자국을 읽고 있어요 🐾
              </p>
            </div>
          )}

          {/* AI 오류 — entry 본문은 이미 저장됨, 재시도 가능 (보정 지시 5) */}
          {aiError && !aiLoading && (
            <div
              className="w-full rounded-card p-4 flex flex-col gap-3"
              style={{
                backgroundColor: 'var(--tag-bg)',
                border: '1px solid var(--border)',
              }}
              role="alert"
            >
              <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                {aiError}
              </p>
              <div className="flex justify-center">
                <Button
                  variant="soft"
                  onClick={() => {
                    void triggerAI(savedEntry);
                  }}
                >
                  다시 읽기
                </Button>
              </div>
            </div>
          )}

          {/* AI 요약 패널 */}
          {aiSummary && !aiLoading && (
            <div className="w-full">
              <AISummaryPanel summary={aiSummary} />
            </div>
          )}

          {/* 새 일기 쓰기 */}
          <Button
            variant="soft"
            onClick={() => {
              setSavedEntry(undefined);
              setSaveError(undefined);
              setAiSummary(undefined);
              setAiError(undefined);
            }}
          >
            새 일기 쓰기
          </Button>
        </div>
      </div>
    );
  }

  // ── 저장 핸들러 ───────────────────────────────
  const handleSubmit = async (values: DiaryFormValues): Promise<void> => {
    setSubmitting(true);
    setSaveError(undefined);
    try {
      // ★ STEP 1: 일기 저장 (ai_summary 없이) — 이 단계가 성공하면 데이터는 보존됨 (보정 지시 5)
      const entry = await entryRepo.save({
        pet_id: pet.pet_id,
        ...values,
      });

      // ★ STEP 2: 저장 완료 화면으로 전환 (이미 저장됨)
      setSavedEntry(entry);

      // ★ STEP 3: AI 호출 — fire-and-forget, 실패해도 entry는 유실되지 않음
      void triggerAI(entry);
    } catch (err) {
      console.error('[TodayPage] 일기 저장 실패:', err);
      setSaveError('저장 중 오류가 발생했어요. 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── 작성 폼 ───────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader title="오늘의 발자국" />

      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        {/* 타이틀 문구 */}
        <div className="mb-6 text-center">
          <p className="text-base font-semibold" style={{ color: 'var(--text)' }}>
            오늘의 발자국을 남겨볼까요? 🐾
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {pet.name}의 하루를 기록해요.
          </p>
        </div>

        {/* 저장 실패 토스트 */}
        {saveError && (
          <div
            className="mb-4 rounded-card p-3 text-sm"
            style={{
              backgroundColor: 'var(--tag-bg)',
              border: '1px solid var(--primary)',
              color: 'var(--text)',
            }}
            role="alert"
          >
            {saveError}
          </div>
        )}

        <DiaryForm onSubmit={handleSubmit} submitting={submitting} />
      </div>
    </div>
  );
}
