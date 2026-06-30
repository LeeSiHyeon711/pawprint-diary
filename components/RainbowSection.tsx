'use client';

/**
 * components/RainbowSection.tsx — 무지개연결 진입점 + 이중 확인 흐름 (FEAT-13)
 *
 * 프로필 수정 화면 최하단에만 표시(BottomNav 미노출 — AC-R01).
 * 마운트 시 rainbowRepo.isOn() 조회 후 활성/미활성 분기.
 *
 * 미활성 흐름:
 *   idle("무지개연결 열기") → intro(1차 안내) → confirm(2차 모달)
 *   → "무지개연결 활성화" → rainbowRepo.turnOn() → /rainbow 이동
 *   → "아직 아니에요" / "취소할게요" → 저장 없이 닫기
 *
 * 활성 흐름:
 *   "무지개연결 들어가기" → /rainbow
 *   "무지개연결 닫기"     → rainbowRepo.turnOff() → 미활성 갱신
 *
 * 고정 문구는 sanitizeRainbow 적용 금지(보정 지시 R2).
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { rainbowRepo } from '@/lib/repos';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { RainbowConfirmModal } from '@/components/RainbowConfirmModal';

type Step = 'idle' | 'intro' | 'confirm';

export function RainbowSection(): JSX.Element {
  const router = useRouter();

  // null = 로딩 중, boolean = 조회 완료
  const [on, setOn] = useState<boolean | null>(null);
  const [step, setStep] = useState<Step>('idle');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    rainbowRepo.isOn().then(setOn);
  }, []);

  // ── 미활성 흐름 핸들러 ────────────────────────────

  /** "무지개연결 열기" 클릭 → 1차 안내 표시 */
  const handleOpen = () => {
    setStep('intro');
    setErrorMsg(null);
  };

  /** 1차 안내 "아직 아니에요" — 저장 없이 idle 복귀 */
  const handleNotYet = () => {
    setStep('idle');
  };

  /** 1차 안내 "계속 보기" → 2차 확인 모달 열기 */
  const handleContinue = () => {
    setStep('confirm');
  };

  /** 2차 모달 "취소할게요" — 저장 없이 idle 복귀 */
  const handleCancelConfirm = () => {
    setStep('idle');
    setErrorMsg(null);
  };

  /** 2차 모달 "무지개연결 활성화" → turnOn() → /rainbow 이동 */
  const handleActivate = async () => {
    setBusy(true);
    setErrorMsg(null);
    try {
      await rainbowRepo.turnOn();
      setOn(true);
      setStep('idle');
      router.push('/rainbow');
      // 이동 후 setBusy(false) 불필요 — 페이지 언마운트
    } catch {
      setErrorMsg('활성화 중 오류가 발생했어요. 다시 시도해 주세요.');
      setBusy(false);
    }
  };

  // ── 활성 흐름 핸들러 ─────────────────────────────

  /** 활성 상태 "무지개연결 들어가기" → /rainbow */
  const handleEnter = () => {
    router.push('/rainbow');
  };

  /** 활성 상태 "무지개연결 닫기" → turnOff() → 미활성 갱신 */
  const handleTurnOff = async () => {
    const prev = on;
    setBusy(true);
    setErrorMsg(null);
    setOn(false); // 낙관적 업데이트 — UI 즉시 반응
    try {
      await rainbowRepo.turnOff();
    } catch {
      setOn(prev); // 실패 시 상태 롤백
      setErrorMsg('닫기 중 오류가 발생했어요. 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  };

  // ── 로딩 중: 중립 카드로 레이아웃 안정화 (깜빡임 최소화) ──
  if (on === null) {
    return (
      <div className="mt-8">
        <Card>
          <div
            className="h-14 rounded animate-pulse"
            style={{ backgroundColor: 'var(--tag-bg)' }}
            aria-hidden="true"
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <Card className="flex flex-col gap-3">
        <SectionTitle>무지개연결</SectionTitle>

        {on ? (
          /* ── 활성 상태 ── */
          <div className="flex flex-col gap-2">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              무지개연결 모드가 켜져 있어요.
            </p>
            {errorMsg && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {errorMsg}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                variant="soft"
                onClick={handleEnter}
                disabled={busy}
                className="flex-1"
              >
                무지개연결 들어가기
              </Button>
              <Button
                variant="ghost"
                onClick={handleTurnOff}
                disabled={busy}
                className="flex-1"
              >
                무지개연결 닫기
              </Button>
            </div>
          </div>
        ) : step === 'idle' ? (
          /* ── 미활성 — idle ── */
          <div className="flex flex-col gap-2">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              세상을 떠난 반려동물과의 소중한 시간을 돌아볼 수 있는 공간이에요.
            </p>
            <Button variant="ghost" onClick={handleOpen}>
              무지개연결 열기
            </Button>
          </div>
        ) : (
          /* ── 미활성 — intro + confirm (모달 오픈 중에도 배경 표시) ── */
          <div className="flex flex-col gap-3">
            {/* 1차 안내 고정 문구 — sanitizeRainbow 적용 금지(보정 지시 R2) */}
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
              무지개연결은 반려동물이 세상을 떠난 뒤, 함께했던 시간을 조용히 돌아보기 위한 공간이에요. 아직 준비되지 않았다면 지금 열지 않아도 괜찮아요.
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={handleNotYet}
                disabled={step === 'confirm'}
                className="flex-1"
              >
                아직 아니에요
              </Button>
              <Button
                variant="soft"
                onClick={handleContinue}
                disabled={step === 'confirm'}
                className="flex-1"
              >
                계속 보기
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 2차 확인 모달 — step==='confirm' 일 때만 오픈 */}
      <RainbowConfirmModal
        open={step === 'confirm'}
        busy={busy}
        errorMsg={errorMsg}
        onCancel={handleCancelConfirm}
        onConfirm={handleActivate}
      />
    </div>
  );
}
