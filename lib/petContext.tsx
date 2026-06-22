'use client';

/**
 * lib/petContext.tsx — 임시 골격 (FEAT-01)
 *
 * ★ 이 파일은 FEAT-01의 임시 골격입니다.
 * - PetProvider: children을 그대로 통과시키는 최소 Provider
 * - usePet(): 빌드/타입 통과용 최소 형태 (빈 객체 반환)
 *
 * FEAT-03에서 실제 usePet 시그니처로 "교체"합니다:
 *   usePet(): { pet?: Pet; loading: boolean; refresh: () => Promise<void> }
 *
 * 주의: 이 임시 형태에 의존하는 화면 로직을 작성하지 마세요.
 * 후속 FEAT-04/06/07/08/09는 FEAT-03 이후 확정 시그니처를 기준으로 구현합니다.
 */

import { createContext, useContext, type ReactNode } from 'react';

// 임시 컨텍스트 타입 — FEAT-03에서 교체됨
type PetContextType = Record<string, never>;

const PetContext = createContext<PetContextType>({});

/** 임시 PetProvider — children을 그대로 통과 (FEAT-03에서 실구현으로 교체) */
export function PetProvider({ children }: { children: ReactNode }): JSX.Element {
  return <PetContext.Provider value={{}}>{children}</PetContext.Provider>;
}

/**
 * 임시 usePet 훅 — 빌드 통과용 최소 형태
 * FEAT-03에서 { pet?: Pet; loading: boolean; refresh: () => Promise<void> }로 교체됩니다.
 */
export function usePet(): PetContextType {
  return useContext(PetContext);
}
