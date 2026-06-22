'use client';

/**
 * components/StepSelector.tsx — 식욕/활동량/수면/배변 공용 단계형 선택 (FEAT-04)
 *
 * 가로 칩 형태로 옵션 표시. 같은 값 재클릭 시 해제(undefined 반환).
 */

import { Tag } from './ui/Tag';

// ────────────────────────────────────────────────
// 옵션 상수 (타입은 FEAT-02 유니온과 일치)
// ────────────────────────────────────────────────

export const APPETITE = ['잘 먹음', '보통', '적게 먹음', '거의 안 먹음'] as const;
export const ACTIVITY = ['매우 활발함', '보통', '조용함', '거의 움직이지 않음'] as const;
export const SLEEP    = ['평소보다 많이 잠', '보통', '평소보다 적게 잠'] as const;
export const TOILET   = ['정상', '묽음', '굳음', '없음', '이상 있음'] as const;

// ────────────────────────────────────────────────
// 컴포넌트
// ────────────────────────────────────────────────

interface StepSelectorProps<T extends string> {
  label: string;
  options: readonly T[];
  value?: T;
  /** 같은 값 재클릭 시 undefined 전달 (해제) */
  onChange: (v?: T) => void;
}

/**
 * 단계형 가로 칩 선택기.
 * 같은 값을 재클릭하면 해제(undefined)를 onChange로 전달한다.
 */
export function StepSelector<T extends string>({
  label,
  options,
  value,
  onChange,
}: StepSelectorProps<T>): JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <Tag
            key={opt}
            label={opt}
            selected={value === opt}
            onClick={() => onChange(value === opt ? undefined : opt)}
          />
        ))}
      </div>
    </div>
  );
}
