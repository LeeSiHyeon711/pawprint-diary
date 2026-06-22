import React from 'react';

interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
}

/** 섹션 제목 (예: "오늘의 컨디션") */
export function SectionTitle({ children, className = '' }: SectionTitleProps): JSX.Element {
  return (
    <h2
      className={`text-sm font-semibold tracking-wide uppercase ${className}`}
      style={{ color: 'var(--text-muted)' }}
    >
      {children}
    </h2>
  );
}
