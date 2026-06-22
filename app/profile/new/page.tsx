'use client';

/**
 * app/profile/new/page.tsx — 반려동물 프로필 등록 (FEAT-03)
 *
 * 동작 흐름:
 * 1. 빈 ProfileForm 렌더링
 * 2. 저장 클릭 → petRepo.create → metaRepo.set('activePetId') → usePet().refresh() → /today
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { ProfileForm, type ProfileFormValues } from '@/components/ProfileForm';
import { petRepo, metaRepo } from '@/lib/repos';
import { usePet } from '@/lib/petContext';

export default function ProfileNewPage(): JSX.Element {
  const router = useRouter();
  const { refresh } = usePet();
  const [imageError, setImageError] = useState(false);

  const handleSubmit = async (values: ProfileFormValues) => {
    const pet = await petRepo.create(values);
    await metaRepo.set('activePetId', pet.pet_id);
    await refresh();
    router.push('/today');
  };

  return (
    <div>
      <AppHeader title="우리 아이를 소개해 주세요 🐾" />

      {/* 이미지 리사이즈 실패 알림 */}
      {imageError && (
        <div
          className="mx-4 mt-3 px-3 py-2 rounded-input text-sm"
          style={{ backgroundColor: 'var(--tag-bg)', color: 'var(--text-muted)' }}
          role="alert"
        >
          이미지를 불러오지 못했어요. 이미지 없이 저장됩니다.
        </div>
      )}

      <div className="px-4 py-4">
        <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
          이름, 종, 나이, 성별은 꼭 입력해 주세요.
        </p>
        <ProfileForm
          submitLabel="등록하기"
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
