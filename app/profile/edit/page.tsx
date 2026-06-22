'use client';

/**
 * app/profile/edit/page.tsx — 반려동물 프로필 수정 (FEAT-03)
 *
 * 동작 흐름:
 * 1. 마운트 시 petRepo.getActive() 로딩 → 기존 값 ProfileForm 프리필
 * 2. activePet 없으면 /profile/new 리다이렉트
 * 3. 저장 클릭 → petRepo.update → usePet().refresh()
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { ProfileForm, type ProfileFormValues } from '@/components/ProfileForm';
import { Spinner } from '@/components/ui/Spinner';
import { petRepo } from '@/lib/repos';
import { usePet } from '@/lib/petContext';
import type { Pet } from '@/lib/types';

export default function ProfileEditPage(): JSX.Element {
  const router = useRouter();
  const { refresh } = usePet();

  const [currentPet, setCurrentPet] = useState<Pet | undefined>(undefined);
  const [loadingPet, setLoadingPet] = useState(true);

  // 마운트 시 activePet 조회
  useEffect(() => {
    petRepo.getActive().then((p) => {
      if (!p) {
        // activePet 없으면 등록 화면으로
        router.replace('/profile/new');
      } else {
        setCurrentPet(p);
      }
      setLoadingPet(false);
    });
  }, [router]);

  const handleSubmit = async (values: ProfileFormValues) => {
    if (!currentPet) return;
    await petRepo.update({
      ...values,
      pet_id: currentPet.pet_id,
      created_at: currentPet.created_at,
    });
    await refresh();
  };

  // 로딩 중
  if (loadingPet) {
    return (
      <div>
        <AppHeader title="프로필 수정" />
        <div className="flex justify-center py-20">
          <Spinner label="프로필 불러오는 중..." />
        </div>
      </div>
    );
  }

  // activePet 없음 → 리다이렉트 진행 중 (빈 화면)
  if (!currentPet) return <></>;

  return (
    <div>
      <AppHeader title="프로필 수정" />
      <div className="px-4 py-4">
        <ProfileForm
          initial={currentPet}
          submitLabel="수정 저장"
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
