'use client';

/**
 * app/today/page.tsx — 오늘의 발자국 작성 (FEAT-04)
 *
 * ★ ai_summary 없이 일기 저장까지만 담당 (보정 지시 5).
 *    AI 호출·요약 표시는 FEAT-06이 이 화면에 얹는다.
 *    저장은 AI와 무관하게 항상 성공해야 하며 작성 데이터 유실 금지.
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePet } from '@/lib/petContext';
import { entryRepo } from '@/lib/repos';
import { DiaryForm, type DiaryFormValues } from '@/components/DiaryForm';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { AppHeader } from '@/components/AppHeader';

// ────────────────────────────────────────────────
// 페이지
// ────────────────────────────────────────────────

export default function TodayPage(): JSX.Element {
  const { pet, loading } = usePet();
  const [submitting, setSubmitting] = useState(false);
  const [savedEntryId, setSavedEntryId] = useState<string | undefined>(undefined);
  const [saveError, setSaveError] = useState<string | undefined>(undefined);

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

  // ── 저장 완료 ─────────────────────────────────
  if (savedEntryId) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader title="오늘의 발자국" />
        <div className="flex flex-col items-center justify-center flex-1 gap-6 px-6 py-12 text-center">
          <span className="text-5xl leading-none" aria-hidden="true">
            🐾
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-base font-semibold" style={{ color: 'var(--text)' }}>
              오늘의 발자국이 남겨졌어요!
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {pet.name}의 하루가 소중하게 저장되었어요.
            </p>
          </div>

          {/* FEAT-06 AI 요약 플레이스홀더 — 실제 AI 호출/표시는 FEAT-06에서 구현 */}
          <div
            className="w-full max-w-sm rounded-card p-4 text-sm text-left"
            style={{
              backgroundColor: 'var(--tag-bg)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
            }}
          >
            AI가 오늘의 발자국을 읽고 있어요 ✨
          </div>

          <Button
            variant="soft"
            onClick={() => {
              setSavedEntryId(undefined);
              setSaveError(undefined);
            }}
          >
            새 일기 쓰기
          </Button>
        </div>
      </div>
    );
  }

  // ── 저장 핸들러 ───────────────────────────────
  const handleSubmit = async (values: DiaryFormValues) => {
    setSubmitting(true);
    setSaveError(undefined);
    try {
      // ★ ai_summary 미포함 저장 — FEAT-06이 entry_id를 받아 AI 호출 후 병합 (보정 지시 5)
      const entry = await entryRepo.save({
        pet_id: pet.pet_id,
        ...values,
      });
      setSavedEntryId(entry.entry_id);
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
