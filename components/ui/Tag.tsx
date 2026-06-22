import React from 'react';

interface TagProps {
  label: string;
  /** 선택된 상태 (살구색 강조) */
  selected?: boolean;
  /** 클릭 가능한 선택형 태그 */
  onClick?: () => void;
}

/** Pill 태그 칩 — 선택형 또는 표시형 */
export function Tag({ label, selected = false, onClick }: TagProps): JSX.Element {
  const isInteractive = typeof onClick === 'function';

  const style: React.CSSProperties = selected
    ? { backgroundColor: 'var(--primary)', color: '#FFFFFF' }
    : { backgroundColor: 'var(--tag-bg)', color: 'var(--text)' };

  if (isInteractive) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className="rounded-pill px-3 py-1 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2"
        style={style}
      >
        {label}
      </button>
    );
  }

  return (
    <span
      className="rounded-pill px-3 py-1 text-xs font-medium"
      style={style}
    >
      {label}
    </span>
  );
}
