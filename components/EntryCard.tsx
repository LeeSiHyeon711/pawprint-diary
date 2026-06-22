'use client';

/**
 * components/EntryCard.tsx — 기록 목록 카드 (FEAT-08)
 *
 * 표시 항목:
 *  - 날짜: formatDateK(entry.date) — 따뜻한 헤더
 *  - 기분 태그: mood_tags 최대 2개 Tag 칩
 *  - 요약 1줄: ai_summary?.condition 또는 diary_text 앞부분 (previewText)
 *  - 대표 사진 썸네일: photos[0] BlobImage (있으면)
 */

import type { DiaryEntry } from '@/lib/types';
import { formatDateK, previewText } from '@/lib/format';
import { BlobImage } from '@/components/BlobImage';
import { Tag } from '@/components/ui/Tag';

interface EntryCardProps {
  entry: DiaryEntry;
  onClick: () => void;
}

export function EntryCard({ entry, onClick }: EntryCardProps): JSX.Element {
  const preview = previewText(entry.ai_summary?.condition ?? entry.diary_text);
  const thumbnail = entry.photos[0];
  const tags = entry.mood_tags.slice(0, 2);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-card p-4 flex gap-3 items-start transition-all focus-visible:outline-none focus-visible:ring-2"
      style={{
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border)',
      }}
    >
      {/* 썸네일 (사진 있을 때) */}
      {thumbnail && (
        <div className="shrink-0 w-16 h-16 rounded-card overflow-hidden">
          <BlobImage
            blob={thumbnail}
            alt="발자국 사진"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* 텍스트 영역 */}
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {/* 날짜 */}
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
          {formatDateK(entry.date)}
        </p>

        {/* 기분 태그 */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Tag key={tag} label={tag} selected />
            ))}
          </div>
        )}

        {/* 요약 1줄 미리보기 */}
        {preview && (
          <p
            className="text-xs leading-relaxed line-clamp-2"
            style={{ color: 'var(--text-muted)' }}
          >
            {preview}
          </p>
        )}
      </div>
    </button>
  );
}
