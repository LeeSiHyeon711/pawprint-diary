import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { BottomNav } from '@/components/BottomNav';
import { PetProvider } from '@/lib/petContext';

export const metadata: Metadata = {
  title: '발자국일기',
  description: '반려동물과 함께한 하루를 기록하는 AI 일기',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
        {/* PetProvider — FEAT-01 임시 골격. FEAT-03에서 실구현으로 교체 */}
        <PetProvider>
          {/* 콘텐츠 영역: 하단 네비 높이(56px) + safe-area 만큼 패딩 */}
          <main style={{ paddingBottom: 'calc(56px + env(safe-area-inset-bottom, 0px))' }}>
            {children}
          </main>
          <BottomNav />
        </PetProvider>
      </body>
    </html>
  );
}
