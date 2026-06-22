/**
 * lib/format.ts — 날짜·텍스트 포맷 유틸 (FEAT-08)
 */

const DAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const;

/**
 * 'YYYY-MM-DD' 형식의 날짜 문자열을 한국어 날짜 + 요일로 변환한다.
 * 예: '2026-06-22' → '2026년 6월 22일 (월)'
 *
 * ★ new Date(year, month-1, day) 로컬 시간으로 생성 — UTC 오프셋에 의한 요일 오차 방지.
 */
export function formatDateK(isoDate: string): string {
  const [yearStr, monthStr, dayStr] = isoDate.split('-');
  const year  = Number(yearStr);
  const month = Number(monthStr);
  const day   = Number(dayStr);
  const d = new Date(year, month - 1, day);
  const dow = DAY_KO[d.getDay()];
  return `${year}년 ${month}월 ${day}일 (${dow})`;
}

/**
 * 문자열의 앞 n글자(기본 60)를 반환하고, 잘린 경우 '…'를 붙인다.
 * s가 undefined / 빈 문자열이면 빈 문자열을 반환한다.
 */
export function previewText(s?: string, n = 60): string {
  if (!s) return '';
  const trimmed = s.trim();
  if (trimmed.length <= n) return trimmed;
  return trimmed.slice(0, n) + '…';
}
