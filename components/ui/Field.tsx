import React from 'react';

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

/** 레이블 + 입력 묶음 컴포넌트 */
export function Field({ label, required = false, hint, children }: FieldProps): JSX.Element {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>
        {label}
        {required && (
          <span className="ml-1" style={{ color: 'var(--primary)' }} aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {hint && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {hint}
        </p>
      )}
    </div>
  );
}
