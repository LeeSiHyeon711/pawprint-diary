'use client';

/**
 * components/ProfileForm.tsx — 반려동물 프로필 등록/수정 폼 (FEAT-03)
 *
 * new/edit 페이지에서 공용으로 사용.
 * 필수: name, species, age, gender → 미충족 시 저장 비활성 + 안내 문구
 */

import { useState } from 'react';
import type { Pet, Species, Gender } from '@/lib/types';
import { Field } from './ui/Field';
import { Tag } from './ui/Tag';
import { Button } from './ui/Button';
import { PhotoUpload } from './PhotoUpload';

// ────────────────────────────────────────────────
// 타입
// ────────────────────────────────────────────────

export type ProfileFormValues = Omit<Pet, 'pet_id' | 'created_at'>;

interface ProfileFormProps {
  /** 수정 시 기존 값 프리필 */
  initial?: Pet;
  /** 제출 버튼 레이블 — '등록하기' | '수정 저장' */
  submitLabel: string;
  onSubmit: (values: ProfileFormValues) => Promise<void>;
}

// ────────────────────────────────────────────────
// 상수
// ────────────────────────────────────────────────

const SPECIES_OPTIONS: Species[] = ['강아지', '고양이', '기타'];
const GENDER_OPTIONS: Gender[] = ['수컷', '암컷', '중성화 수컷', '중성화 암컷'];

// ────────────────────────────────────────────────
// 컴포넌트
// ────────────────────────────────────────────────

/** 반려동물 프로필 입력 폼 — 등록/수정 공용 */
export function ProfileForm({ initial, submitLabel, onSubmit }: ProfileFormProps): JSX.Element {
  // 필드 상태
  const [name, setName] = useState(initial?.name ?? '');
  const [species, setSpecies] = useState<Species | ''>(initial?.species ?? '');
  const [breed, setBreed] = useState(initial?.breed ?? '');
  const [age, setAge] = useState(initial?.age ?? '');
  const [gender, setGender] = useState<Gender | ''>(initial?.gender ?? '');
  const [personality, setPersonality] = useState(initial?.personality ?? '');
  const [likes, setLikes] = useState(initial?.likes ?? '');
  const [dislikes, setDislikes] = useState(initial?.dislikes ?? '');
  const [healthNotes, setHealthNotes] = useState(initial?.health_notes ?? '');
  const [profileImage, setProfileImage] = useState<Blob | undefined>(initial?.profile_image);

  // 제출 상태
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<'name' | 'species' | 'age' | 'gender', string>>>({});

  // 필수항목 모두 채워졌는지 (저장 버튼 활성 조건)
  const isValid =
    name.trim() !== '' &&
    species !== '' &&
    age.trim() !== '' &&
    gender !== '';

  // 유효성 검사 — 폼 제출 시 재검증
  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = '이름을 입력해 주세요.';
    if (!species) errs.species = '종을 선택해 주세요.';
    if (!age.trim()) errs.age = '나이를 입력해 주세요.';
    if (!gender) errs.gender = '성별을 선택해 주세요.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    if (submitting) return;

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        species: species as Species,
        breed: breed.trim() || undefined,
        age: age.trim(),
        gender: gender as Gender,
        personality: personality.trim() || undefined,
        likes: likes.trim() || undefined,
        dislikes: dislikes.trim() || undefined,
        health_notes: healthNotes.trim() || undefined,
        profile_image: profileImage,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-input border px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/40';
  const inputStyle = {
    borderColor: 'var(--border)',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {/* 프로필 이미지 */}
      <div className="flex flex-col items-center pt-2">
        <PhotoUpload
          mode="single"
          value={profileImage}
          onChange={setProfileImage}
        />
      </div>

      {/* 이름 (필수) */}
      <Field label="이름" required hint={errors.name}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 몽이"
          className={inputClass}
          style={inputStyle}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
      </Field>

      {/* 종 (필수) */}
      <Field label="종" required hint={errors.species}>
        <div className="flex gap-2 flex-wrap" role="group" aria-label="종 선택">
          {SPECIES_OPTIONS.map((s) => (
            <Tag
              key={s}
              label={s}
              selected={species === s}
              onClick={() => {
                setSpecies(s);
                setErrors((prev) => ({ ...prev, species: undefined }));
              }}
            />
          ))}
        </div>
      </Field>

      {/* 품종 (선택) */}
      <Field label="품종">
        <input
          type="text"
          value={breed}
          onChange={(e) => setBreed(e.target.value)}
          placeholder="예: 말티즈, 페르시안 고양이"
          className={inputClass}
          style={inputStyle}
        />
      </Field>

      {/* 나이 (필수) */}
      <Field label="나이" required hint={errors.age}>
        <input
          type="text"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="예: 3살, 생후 6개월"
          className={inputClass}
          style={inputStyle}
          aria-invalid={!!errors.age}
        />
      </Field>

      {/* 성별 (필수) */}
      <Field label="성별" required hint={errors.gender}>
        <div className="flex gap-2 flex-wrap" role="group" aria-label="성별 선택">
          {GENDER_OPTIONS.map((g) => (
            <Tag
              key={g}
              label={g}
              selected={gender === g}
              onClick={() => {
                setGender(g);
                setErrors((prev) => ({ ...prev, gender: undefined }));
              }}
            />
          ))}
        </div>
      </Field>

      {/* 성격 (선택) */}
      <Field label="성격">
        <input
          type="text"
          value={personality}
          onChange={(e) => setPersonality(e.target.value)}
          placeholder="예: 활발하고 장난기 많음"
          className={inputClass}
          style={inputStyle}
        />
      </Field>

      {/* 좋아하는 것 (선택) */}
      <Field label="좋아하는 것">
        <input
          type="text"
          value={likes}
          onChange={(e) => setLikes(e.target.value)}
          placeholder="예: 공 놀이, 산책"
          className={inputClass}
          style={inputStyle}
        />
      </Field>

      {/* 싫어하는 것 (선택) */}
      <Field label="싫어하는 것">
        <input
          type="text"
          value={dislikes}
          onChange={(e) => setDislikes(e.target.value)}
          placeholder="예: 큰 소리, 낯선 사람"
          className={inputClass}
          style={inputStyle}
        />
      </Field>

      {/* 건강 메모 (선택) */}
      <Field label="건강 메모">
        <textarea
          value={healthNotes}
          onChange={(e) => setHealthNotes(e.target.value)}
          placeholder="예: 슬개골 약함, 알러지 있음"
          rows={3}
          className={`${inputClass} resize-none`}
          style={inputStyle}
        />
      </Field>

      {/* 저장 버튼 — 필수항목 미충족 시 비활성 */}
      <Button
        type="submit"
        variant="primary"
        full
        disabled={!isValid || submitting}
      >
        {submitting ? '저장 중...' : submitLabel}
      </Button>
    </form>
  );
}
