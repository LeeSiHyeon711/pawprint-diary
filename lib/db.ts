/**
 * lib/db.ts — IndexedDB 초기화 (FEAT-02)
 *
 * pawprint-diary v1 스키마:
 *   pets         — keyPath: pet_id
 *   entries      — keyPath: entry_id; index by-pet(pet_id), by-pet-date([pet_id, date])
 *   conversations— keyPath: conversation_id; index by-pet(pet_id)
 *   meta         — keyPath: key  (activePetId 등 앱 전역 설정)
 */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Pet, DiaryEntry, AIConversation, MetaRecord } from './types';

// ────────────────────────────────────────────────
// 스키마 타입
// ────────────────────────────────────────────────

interface PawprintDiaryDB extends DBSchema {
  pets: {
    key: string;
    value: Pet;
  };
  entries: {
    key: string;
    value: DiaryEntry;
    indexes: {
      'by-pet': string;
      'by-pet-date': [string, string];
    };
  };
  conversations: {
    key: string;
    value: AIConversation;
    indexes: {
      'by-pet': string;
    };
  };
  meta: {
    key: string;
    value: MetaRecord;
  };
}

// ────────────────────────────────────────────────
// 싱글톤 DB 접근자
// ────────────────────────────────────────────────

let dbPromise: Promise<IDBPDatabase<PawprintDiaryDB>> | null = null;

/**
 * IndexedDB 싱글톤 접근자.
 * 최초 호출 시 스토어·인덱스를 생성하고, 이후 캐시된 Promise를 반환한다.
 *
 * 실패 시 캐시를 초기화(다음 호출에서 재시도 가능)하고
 * 한국어 에러 메시지를 포함한 Error를 throw한다.
 * 호출 측에서 "이 브라우저에서는 저장이 어려워요" 안내에 사용할 것.
 */
export function getDB(): Promise<IDBPDatabase<PawprintDiaryDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PawprintDiaryDB>('pawprint-diary', 1, {
      upgrade(db) {
        // pets 스토어
        db.createObjectStore('pets', { keyPath: 'pet_id' });

        // entries 스토어 + 인덱스
        const entriesStore = db.createObjectStore('entries', { keyPath: 'entry_id' });
        entriesStore.createIndex('by-pet', 'pet_id');
        entriesStore.createIndex('by-pet-date', ['pet_id', 'date']);

        // conversations 스토어 + 인덱스
        const convStore = db.createObjectStore('conversations', {
          keyPath: 'conversation_id',
        });
        convStore.createIndex('by-pet', 'pet_id');

        // meta 스토어 (activePetId 등 앱 전역 키-값 설정)
        db.createObjectStore('meta', { keyPath: 'key' });
      },
    });

    // 실패 시 캐시 초기화 → 다음 호출에서 재시도 가능
    dbPromise.catch(() => {
      dbPromise = null;
    });
  }

  return dbPromise;
}
