'use client';

/**
 * components/MoodTagPicker.tsx — 기분 태그 복수 선택 (FEAT-04)
 *
 * MOOD_TAGS 상수 6개를 칩으로 표시. 토글 방식 복수 선택.
 */

import { Tag } from './ui/Tag';

// ────────────────────────────────────────────────
// 기분 태그 상수
// ────────────────────────────────────────────────

export const MOOD_TAGS = [
  '활발함',
  '차분함',
  '예민함',
  '피곤해 보임',
  '애교 많음',
  '식욕 없어 보임',
] as const;

// ────────────────────────────────────────────────
// 컴포넌트
// ────────────────────────────────────────────────

interface MoodTagPickerProps {
  value: string[];
  onChange: (v: string[]) => void;
}

/** 기분 태그 복수 선택 칩 그룹. 이미 선택된 태그를 클릭하면 해제. */
export function MoodTagPicker({ value, onChange }: MoodTagPickerProps): JSX.Element {
  const toggle = (tag: string) => {
    if (value.includes(tag)) {
      onChange(value.filter((t) => t !== tag));
    } else {
      onChange([...value, tag]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {MOOD_TAGS.map((tag) => (
        <Tag
          key={tag}
          label={tag}
          selected={value.includes(tag)}
          onClick={() => toggle(tag)}
        />
      ))}
    </div>
  );
}
