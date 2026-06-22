import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

/** 카드 컴포넌트 — radius 16, surface 배경, 옅은 그림자 */
export function Card({ children, className = '' }: CardProps): JSX.Element {
  return (
    <div
      className={`rounded-card shadow-card p-4 ${className}`}
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      {children}
    </div>
  );
}
