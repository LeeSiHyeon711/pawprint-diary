'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  /**
   * 활성 탭 판단 시 사용할 경로 prefix.
   * 미지정 시 href를 prefix로 사용한다.
   * 예) profile 탭: href="/profile/edit", activePrefix="/profile"
   *     → /profile/new 에서도 프로필 탭이 활성화됨.
   */
  activePrefix?: string;
}

const NAV: NavItem[] = [
  { href: '/today',        label: '오늘',   icon: '🐾' },
  { href: '/entries',      label: '기록',   icon: '📖' },
  { href: '/ask',          label: '질문',   icon: '💬' },
  { href: '/profile/edit', label: '프로필', icon: '🐶', activePrefix: '/profile' },
];

/** 하단 탭 네비게이션 (4탭: 오늘/기록/질문/프로필) */
export function BottomNav(): JSX.Element {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
      }}
    >
      {/* 데스크톱: 탭 그룹을 max-w-[480px] 중앙 정렬 */}
      <ul className="flex items-stretch max-w-[480px] mx-auto" role="tablist">
        {NAV.map(({ href, label, icon, activePrefix }) => {
          const base = activePrefix ?? href;
          const isActive = pathname === base || pathname.startsWith(base + '/');
          return (
            <li key={href} className="flex-1" role="none">
              <Link
                href={href}
                role="tab"
                aria-selected={isActive}
                aria-label={label}
                className="flex flex-col items-center justify-center gap-0.5 py-3 w-full transition-colors"
                style={{
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                <span className="text-xl leading-none" aria-hidden="true">
                  {icon}
                </span>
                <span className="text-[11px] leading-tight">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
