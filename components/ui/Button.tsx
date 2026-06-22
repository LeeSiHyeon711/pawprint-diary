import React from 'react';

export type ButtonVariant = 'primary' | 'soft' | 'ghost';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** primary=살구 채움, soft=tagbg, ghost=테두리 */
  variant?: ButtonVariant;
  /** true이면 width: 100% */
  full?: boolean;
};

/** 공통 버튼 컴포넌트 */
export function Button({
  variant = 'primary',
  full = false,
  className = '',
  children,
  ...rest
}: ButtonProps): JSX.Element {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-input px-4 py-2.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:pointer-events-none';

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'text-white',
    soft:
      'text-text',
    ghost:
      'bg-transparent border text-text',
  };

  const inlineStyles: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--primary)',
    },
    soft: {
      backgroundColor: 'var(--tag-bg)',
    },
    ghost: {
      borderColor: 'var(--border)',
      color: 'var(--text)',
    },
  };

  return (
    <button
      className={`${base} ${variantStyles[variant]} ${full ? 'w-full' : ''} ${className}`}
      style={inlineStyles[variant]}
      {...rest}
    >
      {children}
    </button>
  );
}
