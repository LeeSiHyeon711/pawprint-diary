import React from 'react';

interface AppHeaderProps {
  title: string;
  /** 우측 영역 — 옵션 버튼, 아이콘 등 후속 FEAT에서 채움 */
  children?: React.ReactNode;
  className?: string;
}

/** 화면 상단 헤더 — 타이틀 + 우측 children 자리 */
export function AppHeader({ title, children, className = '' }: AppHeaderProps): JSX.Element {
  return (
    <header
      className={`sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b ${className}`}
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      <h1
        className="text-base font-semibold truncate"
        style={{ color: 'var(--text)' }}
      >
        {title}
      </h1>
      {children && (
        <div className="flex items-center gap-2 shrink-0">{children}</div>
      )}
    </header>
  );
}
