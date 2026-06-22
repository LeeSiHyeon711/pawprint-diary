'use client';

/**
 * app/page.tsx — 홈 진입 분기 (FEAT-09)
 *
 * 동작 흐름:
 *   1. PetProvider(usePet)의 loading이 false가 될 때까지 스플래시 표시
 *   2. loading 완료 → pet 있으면 /today, 없으면 /profile/new 로 router.replace
 *   3. 5초 타임아웃: loading이 여전히 true면 재로딩 안내 표시 (무한 스플래시 금지)
 */

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePet } from '@/lib/petContext';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';

/** IndexedDB 접근 이상 등 예외 상황 대비 타임아웃 (ms) */
const SPLASH_TIMEOUT_MS = 5000;

export default function HomePage(): JSX.Element {
  const { pet, loading } = usePet();
  const router = useRouter();
  const redirectedRef = useRef(false);
  const [timedOut, setTimedOut] = useState(false);

  // 5초 후에도 loading 중이면 타임아웃 플래그 (무한 스플래시 방지 — FEAT-09 7절)
  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), SPLASH_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  // 진입 분기: loading 완료 시 1회만 실행 (useRef로 중복 호출 방지)
  useEffect(() => {
    if (loading) return;
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    router.replace(pet ? '/today' : '/profile/new');
  }, [pet, loading, router]);

  // ── 타임아웃 에러 화면 (무한 스플래시 방지) ──────────────
  if (timedOut && loading) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen gap-5 px-6 text-center"
        style={{ backgroundColor: 'var(--bg)' }}
      >
        <span className="text-5xl leading-none" aria-hidden="true">🐾</span>
        <p className="text-base font-semibold" style={{ color: 'var(--text)' }}>
          앱을 불러오지 못했어요
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          저장소 접근에 문제가 생겼어요.
          <br />
          새로고침하면 다시 시도할 수 있어요.
        </p>
        <Button
          variant="primary"
          onClick={() => window.location.reload()}
        >
          새로고침
        </Button>
      </div>
    );
  }

  // ── 스플래시 화면 (진입 분기 대기 중) ────────────────────
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <span className="text-6xl leading-none" aria-hidden="true">🐾</span>
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
        발자국일기
      </h1>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        반려동물과 함께한 하루를 기록해요
      </p>
      <div className="mt-2">
        <Spinner label="잠시만 기다려 주세요..." />
      </div>
    </div>
  );
}
