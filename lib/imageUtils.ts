/**
 * lib/imageUtils.ts — 이미지 유틸리티 (FEAT-03)
 */

/**
 * File을 canvas로 그려 최대 변 maxSize 이하로 축소, JPEG Blob 반환.
 * 이미 maxSize 이하면 그대로 JPEG 변환만 수행(원본 무압축 저장 금지).
 *
 * @param file     입력 이미지 파일
 * @param maxSize  출력 최대 변 길이 (픽셀)
 * @param quality  JPEG 품질 (0.0 ~ 1.0)
 * @returns        리사이즈된 JPEG Blob
 * @throws         이미지 로드 실패 또는 Canvas Blob 변환 실패 시 Error
 */
export async function resizeImageToBlob(
  file: File,
  maxSize: number,
  quality: number,
): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // 긴 변이 maxSize를 초과하면 비율 유지하며 축소
      if (width > maxSize || height > maxSize) {
        if (width >= height) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context를 가져올 수 없습니다.'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Blob 변환에 실패했습니다.'));
          }
        },
        'image/jpeg',
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('이미지를 불러올 수 없습니다.'));
    };

    img.src = url;
  });
}
