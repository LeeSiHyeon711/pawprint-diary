'use client';

/**
 * lib/petContext.tsx — usePet 실구현 (FEAT-03)
 *
 * FEAT-01 임시 골격을 실제 구현으로 교체.
 * 확정 시그니처:
 *   usePet(): { pet?: Pet; loading: boolean; refresh: () => Promise<void> }
 *
 * 후속 FEAT-04/06/07/08/09는 이 시그니처를 기준으로 구현한다.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { petRepo } from './repos';
import type { Pet } from './types';

// ────────────────────────────────────────────────
// 컨텍스트 타입 — FEAT-03 확정 시그니처
// ────────────────────────────────────────────────

interface PetContextType {
  /** 현재 activePet. petRepo.getActive() 결과. 없으면 undefined. */
  pet?: Pet;
  /** 최초 로딩/refresh 진행 여부 */
  loading: boolean;
  /** petRepo.getActive() 재조회로 pet 갱신 (프로필 등록·수정 직후 호출) */
  refresh: () => Promise<void>;
}

const PetContext = createContext<PetContextType>({
  pet: undefined,
  loading: true,
  refresh: async () => {},
});

// ────────────────────────────────────────────────
// PetProvider
// ────────────────────────────────────────────────

/** 마운트 시 petRepo.getActive()로 activePet 로딩. refresh로 재로딩 가능. */
export function PetProvider({ children }: { children: ReactNode }): JSX.Element {
  const [pet, setPet] = useState<Pet | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const activePet = await petRepo.getActive();
      setPet(activePet);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <PetContext.Provider value={{ pet, loading, refresh }}>
      {children}
    </PetContext.Provider>
  );
}

// ────────────────────────────────────────────────
// usePet 훅 — 확정 시그니처
// ────────────────────────────────────────────────

/**
 * 현재 activePet과 로딩 상태, refresh 함수를 반환한다.
 *
 * @returns { pet?: Pet; loading: boolean; refresh: () => Promise<void> }
 */
export function usePet(): PetContextType {
  return useContext(PetContext);
}
