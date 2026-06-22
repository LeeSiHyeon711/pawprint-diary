'use client';

/**
 * components/PhotoUpload.tsx — 단일/다중 이미지 업로드 (FEAT-03)
 *
 * mode='single' : 프로필 이미지(FEAT-03)
 * mode='multi'  : 일기 사진 다중 첨부(FEAT-04에서 사용)
 *
 * 업로드 시 resizeImageToBlob(file, 800, 0.85)로 리사이즈 후 Blob 저장.
 * 리사이즈 실패 시 인라인 에러 메시지 표시.
 */

import { useRef, useState } from 'react';
import { resizeImageToBlob } from '@/lib/imageUtils';
import { BlobImage } from './BlobImage';
import { Button } from './ui/Button';

// ────────────────────────────────────────────────
// 타입
// ────────────────────────────────────────────────

type PhotoUploadProps =
  | { mode: 'single'; value?: Blob; onChange: (b?: Blob) => void }
  | { mode: 'multi'; value: Blob[]; onChange: (b: Blob[]) => void; max?: number };

// ────────────────────────────────────────────────
// 컴포넌트
// ────────────────────────────────────────────────

/** 단일/다중 이미지 업로드. 파일 선택 시 canvas 리사이즈 후 Blob으로 전달. */
export function PhotoUpload(props: PhotoUploadProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | undefined>(undefined);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    // 같은 파일 재선택 허용
    e.target.value = '';
    setUploadError(undefined);

    if (props.mode === 'single') {
      try {
        const blob = await resizeImageToBlob(files[0], 800, 0.85);
        props.onChange(blob);
      } catch {
        // 리사이즈 실패 → 이미지 없이 진행
        props.onChange(undefined);
        setUploadError('이미지를 불러오지 못했어요.');
      }
      return;
    }

    // multi 모드
    const max = props.max ?? Infinity;
    const remaining = max - props.value.length;
    const toProcess = files.slice(0, Math.max(0, remaining));

    const results = await Promise.allSettled(
      toProcess.map((f) => resizeImageToBlob(f, 800, 0.85)),
    );
    const validBlobs = results
      .filter((r): r is PromiseFulfilledResult<Blob> => r.status === 'fulfilled')
      .map((r) => r.value);

    props.onChange([...props.value, ...validBlobs]);
  };

  // ── single 모드 ──────────────────────────────
  if (props.mode === 'single') {
    return (
      <div className="flex flex-col items-center gap-3">
        {/* 원형 프로필 이미지 영역 */}
        <button
          type="button"
          className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center border-2 focus-visible:outline-none focus-visible:ring-2"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--tag-bg)' }}
          onClick={() => inputRef.current?.click()}
          aria-label="프로필 이미지 선택"
        >
          {props.value ? (
            <BlobImage
              blob={props.value}
              alt="프로필 이미지"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-3xl select-none" aria-hidden="true">🐾</span>
          )}
        </button>

        {/* 버튼 영역 */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="soft"
            onClick={() => {
              setUploadError(undefined);
              inputRef.current?.click();
            }}
          >
            {props.value ? '이미지 변경' : '이미지 선택'}
          </Button>
          {props.value && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setUploadError(undefined);
                props.onChange(undefined);
              }}
            >
              삭제
            </Button>
          )}
        </div>

        {/* 리사이즈 실패 에러 메시지 */}
        {uploadError && (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }} role="alert">
            {uploadError}
          </p>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          aria-hidden="true"
        />
      </div>
    );
  }

  // ── multi 모드 ───────────────────────────────
  const max = props.max ?? Infinity;
  const canAdd = props.value.length < max;

  return (
    <div className="flex flex-wrap gap-2">
      {props.value.map((blob, i) => (
        <div key={i} className="relative w-20 h-20">
          <BlobImage
            blob={blob}
            alt={`사진 ${i + 1}`}
            className="w-full h-full object-cover rounded-card"
          />
          <button
            type="button"
            className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold focus-visible:outline-none focus-visible:ring-2"
            style={{ backgroundColor: 'var(--primary)' }}
            onClick={() => {
              const next = [...props.value];
              next.splice(i, 1);
              props.onChange(next);
            }}
            aria-label={`사진 ${i + 1} 삭제`}
          >
            ×
          </button>
        </div>
      ))}

      {canAdd && (
        <button
          type="button"
          className="w-20 h-20 rounded-card flex items-center justify-center border-2 border-dashed text-2xl focus-visible:outline-none focus-visible:ring-2"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          onClick={() => inputRef.current?.click()}
          aria-label="사진 추가"
        >
          +
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
        aria-hidden="true"
      />
    </div>
  );
}
