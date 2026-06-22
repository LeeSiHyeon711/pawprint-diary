/**
 * app/page.tsx — 임시 환영 페이지 (FEAT-01)
 *
 * 홈 진입 분기(프로필 유무 → /profile/new or /today)는 FEAT-09에서 완성합니다.
 * 현재는 환영 메시지와 /today 링크만 제공합니다.
 */
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-6 text-center">
      {/* 로고 영역 */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-6xl leading-none" aria-hidden="true">🐾</span>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          발자국일기
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          반려동물과 함께한 작은 순간들을 기록해요
        </p>
      </div>

      {/* 안내 문구 */}
      <div
        className="rounded-card p-5 w-full max-w-sm text-left shadow-card"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
          오늘도 함께한 하루, 발자국이 쌓이고 있어요. 🐾
          <br />
          <span style={{ color: 'var(--text-muted)' }}>
            건강 상태, 기분, 특별한 순간을 AI와 함께 기록하세요.
          </span>
        </p>
      </div>

      {/* CTA */}
      <Link href="/today" className="w-full max-w-sm">
        <Button variant="primary" full>
          오늘의 발자국 기록하기
        </Button>
      </Link>

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        * 홈 진입 분기(프로필 자동 이동)는 FEAT-09에서 완성됩니다.
      </p>
    </div>
  );
}
