'use client';

/**
 * components/AISummaryPanel.tsx — AI 발자국 읽기 결과 패널 (FEAT-06)
 *
 * AI 4종 요약(컨디션/행동이야기/관찰포인트/추억문장)과 vet_note를 표시한다.
 *
 * - 각 항목은 카드 단위로 구분한다(설계서 4-3).
 * - 추억 문장은 인용체로 살짝 강조한다.
 * - vet_note는 "살펴봐요 🐾" 부드러운 안내 톤으로 표시한다(경고/불안 자극 금지).
 * - 필드 값이 비어 있어도 "내용을 준비하지 못했어요"로 처리해 크래시를 막는다.
 */

import type { AISummary } from '@/lib/types';
import { SectionTitle } from '@/components/ui/SectionTitle';

interface AISummaryPanelProps {
  summary: AISummary;
  /** true 이면 로딩 오버레이를 표시한다 (향후 재로딩 시 활용 예약). 현재는 미사용. */
  loading?: boolean;
}

// ────────────────────────────────────────────────
// 내부 서브 컴포넌트
// ────────────────────────────────────────────────

function SummaryCard({
  title,
  content,
  variant = 'default',
}: {
  title: string;
  content: string;
  variant?: 'default' | 'memory' | 'vet';
}): JSX.Element {
  const isEmpty = !content.trim();

  // 메모리(추억 문장): 인용체 + 살짝 강조
  const isMemory = variant === 'memory';
  // 병원 안내: 부드러운 배경 강조
  const isVet = variant === 'vet';

  return (
    <div
      className="rounded-card p-4 flex flex-col gap-2"
      style={{
        backgroundColor: isVet ? 'var(--primary-soft, #fdf4ed)' : 'var(--card-bg)',
        border: `1px solid ${isVet ? 'var(--primary)' : 'var(--border)'}`,
      }}
    >
      <SectionTitle>{title}</SectionTitle>

      {isEmpty ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          내용을 준비하지 못했어요.
        </p>
      ) : isMemory ? (
        <blockquote
          className="text-sm italic leading-relaxed"
          style={{ color: 'var(--text)', borderLeft: '3px solid var(--primary)', paddingLeft: '0.75rem' }}
        >
          {content}
        </blockquote>
      ) : (
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
          {content}
        </p>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────
// AISummaryPanel
// ────────────────────────────────────────────────

export function AISummaryPanel({ summary }: AISummaryPanelProps): JSX.Element {
  return (
    <div className="w-full flex flex-col gap-3">
      {/* 패널 헤더 */}
      <div className="flex items-center gap-2 mb-1">
        <span aria-hidden="true" className="text-base">🐾</span>
        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
          AI가 읽은 오늘의 발자국
        </p>
      </div>

      {/* 4종 요약 카드 */}
      <SummaryCard
        title="오늘의 컨디션"
        content={summary.condition ?? ''}
      />
      <SummaryCard
        title="행동 이야기"
        content={summary.behavior ?? ''}
      />
      <SummaryCard
        title="내일의 관찰 포인트"
        content={summary.observation ?? ''}
      />
      <SummaryCard
        title="오늘의 한 줄 추억"
        content={summary.memory ?? ''}
        variant="memory"
      />

      {/* 병원 안내 (조건부 — vet_note가 있을 때만) */}
      {summary.vet_note && (
        <SummaryCard
          title="살펴봐요 🐾"
          content={summary.vet_note}
          variant="vet"
        />
      )}
    </div>
  );
}
