'use client';

/**
 * app/entries/[entryId]/page.tsx — 발자국 상세 (FEAT-08)
 *
 * ★ 보정 지시 6 — AI 재호출 절대 금지 (ai_summary 있는 항목):
 *   entry.ai_summary가 있으면 그대로 AISummaryPanel에 표시한다.
 *   ai_summary가 없는 과거 기록은 "AI 읽기가 아직 없어요" 안내 + "지금 읽기" 버튼 제공.
 *
 * 삭제 시 entryRepo.remove → /entries 복귀.
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePet } from '@/lib/petContext';
import { entryRepo } from '@/lib/repos';
import { requestSummary } from '@/lib/aiClient';
import { AISummaryPanel } from '@/components/AISummaryPanel';
import { BlobImage } from '@/components/BlobImage';
import { AppHeader } from '@/components/AppHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { formatDateK } from '@/lib/format';
import type { DiaryEntry, AISummary } from '@/lib/types';

// ────────────────────────────────────────────────
// 내부: 입력 필드 한 줄 표시
// ────────────────────────────────────────────────

function FieldRow({ label, value }: { label: string; value?: string }): JSX.Element | null {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <span className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
        {value}
      </span>
    </div>
  );
}

// ────────────────────────────────────────────────
// 페이지
// ────────────────────────────────────────────────

export default function EntryDetailPage(): JSX.Element {
  const params   = useParams();
  const router   = useRouter();
  const { pet }  = usePet();

  const entryId = typeof params?.entryId === 'string' ? params.entryId : '';

  const [entry, setEntry]         = useState<DiaryEntry | undefined | null>(undefined); // null = 없음
  const [loading, setLoading]     = useState(true);
  const [deleting, setDeleting]   = useState(false);

  // AI 재시도 상태 (ai_summary 없는 과거 기록 전용 — 보정 지시 6)
  const [retryLoading, setRetryLoading] = useState(false);
  const [retryError, setRetryError]     = useState<string | undefined>(undefined);

  // ── 기록 로드 ─────────────────────────────────
  useEffect(() => {
    if (!entryId) {
      setEntry(null);
      setLoading(false);
      return;
    }
    void (async () => {
      setLoading(true);
      try {
        const found = await entryRepo.get(entryId);
        setEntry(found ?? null);
      } finally {
        setLoading(false);
      }
    })();
  }, [entryId]);

  // ── 로딩 중 ──────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner label="불러오는 중..." />
      </div>
    );
  }

  // ── 기록 없음 (존재하지 않는 entryId, 또는 아직 undefined) ────────
  // loading === false 이후에도 undefined/null이면 모두 "찾을 수 없음"으로 처리
  if (!entry) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader title="발자국 상세" />
        <EmptyState
          title="기록을 찾을 수 없어요"
          description="삭제됐거나 잘못된 주소일 수 있어요."
          action={
            <Link href="/entries">
              <Button variant="soft">목록으로 돌아가기</Button>
            </Link>
          }
        />
      </div>
    );
  }

  // ── 삭제 핸들러 ──────────────────────────────
  const handleDelete = async (): Promise<void> => {
    if (!entry) return;
    if (!confirm('이 발자국을 삭제할까요?')) return;
    setDeleting(true);
    try {
      await entryRepo.remove(entry.entry_id);
      router.push('/entries');
    } catch {
      setDeleting(false);
    }
  };

  // ── AI 재시도 (ai_summary 없는 경우만 — 보정 지시 6) ──
  const handleRetryAI = async (): Promise<void> => {
    if (!entry || !pet) return;
    setRetryLoading(true);
    setRetryError(undefined);
    try {
      const response = await requestSummary(pet, entry);
      const aiSummaryData: AISummary = {
        condition:   response.condition,
        behavior:    response.behavior,
        observation: response.observation,
        memory:      response.memory,
        ...(response.vet_note != null ? { vet_note: response.vet_note } : {}),
        generated_at: new Date().toISOString(),
      };
      const updated = { ...entry, ai_summary: aiSummaryData };
      await entryRepo.update(updated);
      setEntry(updated);
    } catch {
      setRetryError('AI 읽기를 불러오지 못했어요. 다시 시도해 주세요.');
    } finally {
      setRetryLoading(false);
    }
  };

  // ── 상세 화면 ─────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader title={formatDateK(entry.date)}>
        {/* 삭제 버튼 — 우측 */}
        <button
          type="button"
          onClick={() => { void handleDelete(); }}
          disabled={deleting}
          className="text-xs px-2 py-1 rounded focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50"
          style={{ color: 'var(--text-muted)' }}
          aria-label="발자국 삭제"
        >
          {deleting ? '삭제 중…' : '삭제'}
        </button>
      </AppHeader>

      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full flex flex-col gap-6">

        {/* ── 기분 태그 ─────────────────────────── */}
        {entry.mood_tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {entry.mood_tags.map((tag) => (
              <Tag key={tag} label={tag} selected />
            ))}
          </div>
        )}

        {/* ── 입력 정보 섹션 ────────────────────── */}
        <section
          className="rounded-card p-4 flex flex-col gap-3"
          style={{
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border)',
          }}
        >
          <SectionTitle>오늘의 상태</SectionTitle>

          {/* 상태 4종 */}
          <FieldRow label="식욕"     value={entry.appetite} />
          <FieldRow label="활동량"   value={entry.activity} />
          <FieldRow label="수면"     value={entry.sleep} />
          <FieldRow label="배변"     value={entry.toilet} />

          {/* 특이 행동 */}
          {entry.unusual_behavior && (
            <FieldRow label="특이 행동" value={entry.unusual_behavior} />
          )}

          {/* 상태 4종 + 특이행동 모두 없는 경우 */}
          {!entry.appetite && !entry.activity && !entry.sleep && !entry.toilet && !entry.unusual_behavior && (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              기록된 상태 항목이 없어요.
            </p>
          )}
        </section>

        {/* ── 자유 일기 ─────────────────────────── */}
        {entry.diary_text && (
          <section
            className="rounded-card p-4 flex flex-col gap-2"
            style={{
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border)',
            }}
          >
            <SectionTitle>자유 일기</SectionTitle>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text)' }}>
              {entry.diary_text}
            </p>
          </section>
        )}

        {/* ── 사진 ──────────────────────────────── */}
        {entry.photos.length > 0 && (
          <section className="flex flex-col gap-2">
            <SectionTitle>사진</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {entry.photos.map((blob, idx) => (
                <div
                  key={idx}
                  className="w-24 h-24 rounded-card overflow-hidden shrink-0"
                >
                  <BlobImage
                    blob={blob}
                    alt={`발자국 사진 ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── AI 발자국 읽기 ────────────────────── */}
        <section className="flex flex-col gap-3">
          <SectionTitle>AI 발자국 읽기</SectionTitle>

          {entry.ai_summary ? (
            /* ★ 저장된 ai_summary 그대로 표시 — 재호출 없음 (보정 지시 6) */
            <AISummaryPanel summary={entry.ai_summary} />
          ) : (
            /* ai_summary 없는 과거 기록: 안내 + 선택적 "지금 읽기" 버튼 */
            <div
              className="rounded-card p-4 flex flex-col gap-3 items-center text-center"
              style={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border)',
              }}
            >
              <span className="text-3xl" aria-hidden="true">🐾</span>
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                AI 읽기가 아직 없어요
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                이 기록이 작성될 때 AI 읽기가 저장되지 않았어요.
              </p>

              {/* 재시도 오류 메시지 */}
              {retryError && (
                <p className="text-xs" style={{ color: 'var(--primary)' }} role="alert">
                  {retryError}
                </p>
              )}

              {/* "지금 읽기" 버튼 — pet이 있을 때만 표시 */}
              {pet && (
                <Button
                  variant="soft"
                  onClick={() => { void handleRetryAI(); }}
                  disabled={retryLoading}
                >
                  {retryLoading ? 'AI가 읽는 중…' : '지금 읽기'}
                </Button>
              )}

              {retryLoading && <Spinner label="AI가 발자국을 읽고 있어요" />}
            </div>
          )}
        </section>

        {/* ── 하단 여백 + 목록 복귀 ─────────────── */}
        <div className="flex justify-center pb-4">
          <Link href="/entries">
            <Button variant="ghost">목록으로 돌아가기</Button>
          </Link>
        </div>

      </div>
    </div>
  );
}
