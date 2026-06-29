/**
 * lib/repos.ts — 저장소(Repository) 함수 (FEAT-02)
 *
 * 네 개 스토어를 각각 petRepo / entryRepo / conversationRepo / metaRepo 로 노출한다.
 * 사진(photos)·프로필 이미지(profile_image)는 Blob 그대로 IndexedDB에 저장한다.
 *
 * ★ 정렬 기준(보정 지시 7):
 *   - DiaryEntry: date desc → (동일 날짜) created_at desc
 *   - AIConversation: timestamp desc
 */

import { getDB } from './db';
import type { Pet, DiaryEntry, AIConversation, MetaRecord } from './types';

// ────────────────────────────────────────────────
// 내부 유틸리티
// ────────────────────────────────────────────────

/**
 * UUID 생성.
 * crypto.randomUUID 지원 환경에서는 표준 UUID, 미지원 시 타임스탬프+랜덤 폴백.
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // 폴백: 타임스탬프(base36) + 랜덤 6자리
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * DiaryEntry 배열을 date desc → created_at desc 정렬해 복사본을 반환 (보정 지시 7).
 * YYYY-MM-DD / ISO 문자열은 사전식 비교 = 시간순 비교.
 */
function sortEntriesDesc(entries: DiaryEntry[]): DiaryEntry[] {
  return [...entries].sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return b.created_at.localeCompare(a.created_at);
  });
}

// ────────────────────────────────────────────────
// metaRepo (petRepo보다 먼저 정의 — petRepo.getActive가 사용)
// ────────────────────────────────────────────────

/**
 * 앱 전역 키-값 설정 저장소.
 * 현재 사용 키: 'activePetId'
 */
export const metaRepo = {
  /** key로 meta 값(문자열) 조회. 없으면 undefined. */
  async get(key: string): Promise<string | undefined> {
    const db = await getDB();
    const record = await db.get('meta', key);
    return record?.value;
  },

  /** key-value 쌍 저장 (없으면 생성, 있으면 갱신). */
  async set(key: string, value: string): Promise<void> {
    const db = await getDB();
    const record: MetaRecord = { key, value };
    await db.put('meta', record);
  },
};

// ────────────────────────────────────────────────
// rainbowRepo (FEAT-10) — metaRepo 얇은 래퍼
// ────────────────────────────────────────────────

/**
 * 무지개연결 모드 활성화 플래그를 meta 스토어로 관리한다.
 * 사용 키: 'rainbowMode' ('on' | 'off'), 'rainbowActivatedAt' (ISO 문자열)
 */
export const rainbowRepo = {
  /** 무지개연결 모드가 켜져 있으면 true. rainbowMode 키가 없으면 false (에러 아님). */
  async isOn(): Promise<boolean> {
    return (await metaRepo.get('rainbowMode')) === 'on';
  },

  /** 무지개연결 모드를 켠다. 활성화 시각을 rainbowActivatedAt에 기록한다. */
  async turnOn(): Promise<void> {
    await metaRepo.set('rainbowMode', 'on');
    await metaRepo.set('rainbowActivatedAt', new Date().toISOString());
  },

  /** 무지개연결 모드를 끈다. */
  async turnOff(): Promise<void> {
    await metaRepo.set('rainbowMode', 'off');
  },
};

// ────────────────────────────────────────────────
// petRepo
// ────────────────────────────────────────────────

export const petRepo = {
  /**
   * 새 Pet 생성 후 저장.
   * pet_id / created_at은 내부에서 자동 생성한다.
   * profile_image(Blob)는 IndexedDB에 그대로 저장한다.
   */
  async create(input: Omit<Pet, 'pet_id' | 'created_at'>): Promise<Pet> {
    const db = await getDB();
    const pet: Pet = {
      ...input,
      pet_id: generateId(),
      created_at: new Date().toISOString(),
    };
    await db.put('pets', pet);
    return pet;
  },

  /** Pet 전체를 갱신(덮어쓰기). */
  async update(pet: Pet): Promise<Pet> {
    const db = await getDB();
    await db.put('pets', pet);
    return pet;
  },

  /** pet_id로 Pet 조회. 없으면 undefined. */
  async get(pet_id: string): Promise<Pet | undefined> {
    const db = await getDB();
    return db.get('pets', pet_id);
  },

  /**
   * 현재 활성 Pet 조회.
   * meta 'activePetId' → petRepo.get() 순으로 연계.
   * activePetId 없거나 해당 Pet 없으면 undefined 반환(에러 아님).
   */
  async getActive(): Promise<Pet | undefined> {
    const activePetId = await metaRepo.get('activePetId');
    if (!activePetId) return undefined;
    const db = await getDB();
    return db.get('pets', activePetId);
  },
};

// ────────────────────────────────────────────────
// entryRepo
// ────────────────────────────────────────────────

export const entryRepo = {
  /**
   * 새 DiaryEntry 저장.
   * entry_id / created_at은 내부에서 자동 생성한다.
   * photos(Blob[])는 IndexedDB에 그대로 저장한다 — AI 전송 금지(보정 지시 4).
   */
  async save(input: Omit<DiaryEntry, 'entry_id' | 'created_at'>): Promise<DiaryEntry> {
    const db = await getDB();
    const entry: DiaryEntry = {
      ...input,
      entry_id: generateId(),
      created_at: new Date().toISOString(),
    };
    await db.put('entries', entry);
    return entry;
  },

  /** DiaryEntry 전체를 갱신(덮어쓰기). */
  async update(entry: DiaryEntry): Promise<DiaryEntry> {
    const db = await getDB();
    await db.put('entries', entry);
    return entry;
  },

  /** entry_id로 DiaryEntry 조회. 없으면 undefined. */
  async get(entry_id: string): Promise<DiaryEntry | undefined> {
    const db = await getDB();
    return db.get('entries', entry_id);
  },

  /** entry_id로 DiaryEntry 삭제. */
  async remove(entry_id: string): Promise<void> {
    const db = await getDB();
    await db.delete('entries', entry_id);
  },

  /**
   * 특정 pet의 모든 일기를 반환.
   * 정렬: date desc, 동일 날짜는 created_at desc (보정 지시 7).
   */
  async listByPet(pet_id: string): Promise<DiaryEntry[]> {
    const db = await getDB();
    const entries = await db.getAllFromIndex('entries', 'by-pet', pet_id);
    return sortEntriesDesc(entries);
  },

  /**
   * 특정 pet의 최신 n개 일기 반환 (AI 질문 컨텍스트용).
   * 정렬: date desc, 동일 날짜는 created_at desc (보정 지시 7).
   */
  async recentByPet(pet_id: string, n: number): Promise<DiaryEntry[]> {
    const db = await getDB();
    const all = await db.getAllFromIndex('entries', 'by-pet', pet_id);
    return sortEntriesDesc(all).slice(0, n);
  },
};

// ────────────────────────────────────────────────
// conversationRepo
// ────────────────────────────────────────────────

export const conversationRepo = {
  /**
   * 새 AIConversation 저장.
   * conversation_id / timestamp는 내부에서 자동 생성한다.
   */
  async add(
    input: Omit<AIConversation, 'conversation_id' | 'timestamp'>,
  ): Promise<AIConversation> {
    const db = await getDB();
    const conversation: AIConversation = {
      ...input,
      conversation_id: generateId(),
      timestamp: new Date().toISOString(),
    };
    await db.put('conversations', conversation);
    return conversation;
  },

  /**
   * 특정 pet의 모든 AI 대화를 반환.
   * 정렬: timestamp desc (최신 먼저).
   * mode 미지정 레코드(기존 /ask 대화)도 포함된다.
   */
  async listByPet(pet_id: string): Promise<AIConversation[]> {
    const db = await getDB();
    const conversations = await db.getAllFromIndex('conversations', 'by-pet', pet_id);
    return [...conversations].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  },

  /**
   * 특정 pet의 무지개연결 대화만 반환 (FEAT-10).
   * by-pet 인덱스로 조회 후 mode==='rainbow'인 항목만 필터.
   * 정렬: timestamp desc.
   * mode 미지정(기존 /ask) 레코드는 제외되어 /ask 대화와 섞이지 않는다.
   */
  async listByPetRainbow(pet_id: string): Promise<AIConversation[]> {
    const db = await getDB();
    const conversations = await db.getAllFromIndex('conversations', 'by-pet', pet_id);
    return conversations
      .filter((c) => c.mode === 'rainbow')
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  },
};
