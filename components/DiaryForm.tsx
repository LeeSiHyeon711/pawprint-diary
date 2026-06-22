'use client';

/**
 * components/DiaryForm.tsx — 일기 작성 폼 (FEAT-04)
 *
 * ★ ai_summary 필드를 절대 포함하지 않는다 (보정 지시 5).
 *    AI 연동은 FEAT-06이 저장된 entry를 받아 담당한다.
 *
 * DiaryFormValues = Omit<DiaryEntry, 'entry_id' | 'pet_id' | 'created_at' | 'ai_summary'>
 */

import { useState } from 'react';
import { format } from 'date-fns';
import type { Appetite, Activity, Sleep, Toilet, DiaryEntry } from '@/lib/types';
import { SectionTitle } from './ui/SectionTitle';
import { Field } from './ui/Field';
import { Button } from './ui/Button';
import { StepSelector, APPETITE, ACTIVITY, SLEEP, TOILET } from './StepSelector';
import { MoodTagPicker } from './MoodTagPicker';
import { PhotoUpload } from './PhotoUpload';

// ────────────────────────────────────────────────
// 타입 (ai_summary 제외 — 보정 지시 5)
// ────────────────────────────────────────────────

export type DiaryFormValues = Omit<
  DiaryEntry,
  'entry_id' | 'pet_id' | 'created_at' | 'ai_summary'
>;

// ────────────────────────────────────────────────
// 유틸리티
// ────────────────────────────────────────────────

function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

// ────────────────────────────────────────────────
// 컴포넌트
// ────────────────────────────────────────────────

interface DiaryFormProps {
  initial?: Partial<DiaryFormValues>;
  /** page.tsx에서 entryRepo.save를 연결한다 */
  onSubmit: (values: DiaryFormValues) => Promise<void>;
  submitting?: boolean;
}

/**
 * 일기 작성 폼.
 * 날짜는 필수(기본값: 오늘), 나머지는 모두 선택 항목.
 * ai_summary는 어떤 경우에도 이 컴포넌트가 포함하지 않는다.
 */
export function DiaryForm({
  initial,
  onSubmit,
  submitting = false,
}: DiaryFormProps): JSX.Element {
  const [date, setDate] = useState<string>(initial?.date ?? todayStr());
  const [appetite, setAppetite] = useState<Appetite | undefined>(initial?.appetite);
  const [activity, setActivity] = useState<Activity | undefined>(initial?.activity);
  const [sleep, setSleep] = useState<Sleep | undefined>(initial?.sleep);
  const [toilet, setToilet] = useState<Toilet | undefined>(initial?.toilet);
  const [unusualBehavior, setUnusualBehavior] = useState<string>(
    initial?.unusual_behavior ?? '',
  );
  const [diaryText, setDiaryText] = useState<string>(initial?.diary_text ?? '');
  const [moodTags, setMoodTags] = useState<string[]>(initial?.mood_tags ?? []);
  const [photos, setPhotos] = useState<Blob[]>(initial?.photos ?? []);

  const today = todayStr();
  const isFutureDate = !!date && date > today;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || isFutureDate) return;

    // ★ ai_summary 미포함 — FEAT-06이 저장된 entry에 병합 (보정 지시 5)
    const values: DiaryFormValues = {
      date,
      appetite,
      activity,
      sleep,
      toilet,
      unusual_behavior: unusualBehavior.trim() || undefined,
      diary_text: diaryText.trim() || undefined,
      mood_tags: moodTags,
      photos,
    };

    await onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      {/* 날짜 */}
      <Field label="날짜" required hint="오늘 또는 과거 날짜를 선택하세요.">
        <input
          type="date"
          value={date}
          max={today}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full rounded-input px-3 py-2.5 text-sm border focus-visible:outline-none focus-visible:ring-2"
          style={{
            borderColor: isFutureDate ? 'var(--primary)' : 'var(--border)',
            backgroundColor: 'var(--surface)',
            color: 'var(--text)',
          }}
          aria-describedby={isFutureDate ? 'date-future-warn' : undefined}
        />
        {isFutureDate && (
          <p
            id="date-future-warn"
            className="text-xs"
            style={{ color: 'var(--primary)' }}
            role="alert"
          >
            미래 날짜는 선택할 수 없어요.
          </p>
        )}
      </Field>

      {/* 오늘의 컨디션 */}
      <div className="flex flex-col gap-4">
        <SectionTitle>오늘의 컨디션</SectionTitle>

        <StepSelector
          label="식욕"
          options={APPETITE}
          value={appetite}
          onChange={(v) => setAppetite(v)}
        />
        <StepSelector
          label="활동량"
          options={ACTIVITY}
          value={activity}
          onChange={(v) => setActivity(v)}
        />
        <StepSelector
          label="수면"
          options={SLEEP}
          value={sleep}
          onChange={(v) => setSleep(v)}
        />
        <StepSelector
          label="배변"
          options={TOILET}
          value={toilet}
          onChange={(v) => setToilet(v)}
        />
      </div>

      {/* 오늘의 기분 */}
      <div className="flex flex-col gap-2">
        <SectionTitle>오늘의 기분</SectionTitle>
        <MoodTagPicker value={moodTags} onChange={setMoodTags} />
      </div>

      {/* 특이행동 */}
      <Field label="특이행동">
        <textarea
          value={unusualBehavior}
          onChange={(e) => setUnusualBehavior(e.target.value)}
          placeholder="평소와 다른 행동이 있었나요?"
          rows={2}
          className="w-full rounded-input px-3 py-2.5 text-sm border resize-none focus-visible:outline-none focus-visible:ring-2"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'var(--surface)',
            color: 'var(--text)',
          }}
        />
      </Field>

      {/* 자유일기 */}
      <Field label="자유일기">
        <textarea
          value={diaryText}
          onChange={(e) => setDiaryText(e.target.value)}
          placeholder="오늘 있었던 일을 자유롭게 기록해 보세요."
          rows={4}
          className="w-full rounded-input px-3 py-2.5 text-sm border resize-none focus-visible:outline-none focus-visible:ring-2"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'var(--surface)',
            color: 'var(--text)',
          }}
        />
      </Field>

      {/* 사진 */}
      <div className="flex flex-col gap-2">
        <SectionTitle>사진</SectionTitle>
        {photos.length >= 4 && (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            사진은 최대 4장까지 추가할 수 있어요.
          </p>
        )}
        <PhotoUpload mode="multi" value={photos} onChange={setPhotos} max={4} />
      </div>

      {/* 저장 버튼 */}
      <Button
        type="submit"
        variant="primary"
        full
        disabled={!date || isFutureDate || submitting}
      >
        {submitting ? '저장 중...' : '발자국 남기기'}
      </Button>
    </form>
  );
}
