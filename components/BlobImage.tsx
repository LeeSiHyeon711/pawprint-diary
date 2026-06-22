'use client';

/**
 * components/BlobImage.tsx — Blob → objectURL 이미지 표시 (FEAT-03)
 *
 * 마운트 시 URL.createObjectURL(blob),
 * 언마운트/blob 변경 시 URL.revokeObjectURL로 메모리 누수 방지.
 */

import { useEffect, useState } from 'react';

interface BlobImageProps {
  blob?: Blob;
  alt: string;
  className?: string;
}

/** Blob을 objectURL로 변환해 img 태그로 표시. blob이 없으면 기본 플레이스홀더. */
export function BlobImage({ blob, alt, className }: BlobImageProps): JSX.Element {
  const [src, setSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!blob) {
      setSrc(undefined);
      return;
    }

    const url = URL.createObjectURL(blob);
    setSrc(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [blob]);

  if (!src) {
    return (
      <div
        className={`flex items-center justify-center ${className ?? ''}`}
        aria-label={alt}
        role="img"
      >
        <span className="text-3xl select-none" aria-hidden="true">🐾</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} />
  );
}
