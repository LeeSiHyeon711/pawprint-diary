import React from 'react';

interface EmptyStateProps {
  /** 표시 아이콘 (기본 🐾) */
  icon?: string;
  title: string;
  description?: string;
  /** 선택 액션 버튼 등 */
  action?: React.ReactNode;
}

/** 빈 상태 안내 컴포넌트 */
export function EmptyState({
  icon = '🐾',
  title,
  description,
  action,
}: EmptyStateProps): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
      <span className="text-5xl leading-none" aria-hidden="true">
        {icon}
      </span>
      <p className="text-base font-semibold" style={{ color: 'var(--text)' }}>
        {title}
      </p>
      {description && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
