'use client';

/**
 * components/RainbowConfirmModal.tsx — 무지개연결 2차 확인 모달 (FEAT-13)
 *
 * 브라우저 confirm()/alert() 대신 자체 컴포넌트 모달.
 * open=false 이면 null 반환(DOM에 렌더되지 않음).
 * 고정 문구는 sanitizeRainbow 적용 금지(보정 지시 R2).
 */

import React from 'react';
import { Button } from '@/components/ui/Button';

export interface RainbowConfirmModalProps {
  open: boolean;
  busy?: boolean;
  errorMsg?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function RainbowConfirmModal({
  open,
  busy = false,
  errorMsg,
  onCancel,
  onConfirm,
}: RainbowConfirmModalProps): JSX.Element | null {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rainbow-confirm-title"
    >
      <div
        className="w-full max-w-sm rounded-card p-6 flex flex-col gap-4"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      >
        <h3
          id="rainbow-confirm-title"
          className="text-base font-semibold"
          style={{ color: 'var(--text)' }}
        >
          무지개연결 활성화
        </h3>

        {/* 2차 확인 고정 문구 — sanitizeRainbow 적용 금지(보정 지시 R2) */}
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--text)' }}
        >
          이 기능은 세상을 떠난 반려동물과의 추억을 회상하기 위한 모드입니다. 무지개연결 모드를 활성화할까요?
        </p>

        {errorMsg && (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {errorMsg}
          </p>
        )}

        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={busy}
            className="flex-1"
          >
            취소할게요
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={busy}
            className="flex-1"
          >
            {busy ? '처리 중...' : '무지개연결 활성화'}
          </Button>
        </div>
      </div>
    </div>
  );
}
