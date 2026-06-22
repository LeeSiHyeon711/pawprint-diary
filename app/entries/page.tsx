'use client';

/**
 * app/entries/page.tsx — 기록 목록 (FEAT-08)
 *
 * - activePet의 모든 일기를 entryRepo.listByPet으로 가져와 EntryCard로 나열한다.
 * - 정렬은 listByPet이 보장하는 date desc · created_at desc 순서를 그대로 사용한다(임의 재정렬 금지).
 * - 0건이면 EmptyState("아직 발자국이 없어요").
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePet } from '@/lib/petContext';
import { entryRepo } from '@/lib/repos';
import { EntryCard } from '@/components/EntryCard';
import { AppHeader } from '@/components/AppHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import type { DiaryEntry } from '@/lib/types';

export default function EntriesPage(): JSX.Element {
  const { pet, loading: petLoading } = usePet();
  const router = useRouter();

  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);

  // activePet이 확정되면 목록 로드
  useEffect(() => {
    if (petLoading) return;
    if (!pet) {
      setEntriesLoading(false);
      return;
    }
    void (async () => {
      setEntriesLoading(true);
      try {
        const list = await entryRepo.listByPet(pet.pet_id);
        setEntries(list);
      } finally {
        setEntriesLoading(false);
      }
    })();
  }, [pet, petLoading]);

  // ── 로딩 중 ──────────────────────────────────
  if (petLoading || entriesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner label="불러오는 중..." />
      </div>
    );
  }

  // ── activePet 없음 ────────────────────────────
  if (!pet) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader title="발자국 모음" />
        <EmptyState
          title="먼저 우리 아이를 소개해 주세요"
          description="반려동물 프로필을 등록하면 발자국을 모아볼 수 있어요."
          action={
            <Link href="/profile/new">
              <Button variant="primary">프로필 등록하기</Button>
            </Link>
          }
        />
      </div>
    );
  }

  // ── 기록 0건 ─────────────────────────────────
  if (entries.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader title="발자국 모음" />
        <EmptyState
          title="아직 발자국이 없어요"
          description={`${pet.name}의 첫 번째 발자국을 남겨볼까요?`}
          action={
            <Link href="/today">
              <Button variant="primary">오늘의 발자국 쓰기</Button>
            </Link>
          }
        />
      </div>
    );
  }

  // ── 목록 ─────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader title="발자국 모음" />

      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        {/* 반려동물 이름 + 기록 수 */}
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          {pet.name}의 발자국 {entries.length}개
        </p>

        {/* 카드 목록 */}
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <EntryCard
              key={entry.entry_id}
              entry={entry}
              onClick={() => {
                router.push(`/entries/${entry.entry_id}`);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
