/**
 * IndexedDB Storage Engine for Offline Fitness Assessment Sessions & Passports
 */

export interface StoredAssessment {
  id: string;
  exerciseType: 'squat' | 'pushup';
  date: string;
  totalScore: number;
  grade: string;
  repsCompleted: number;
  validReps: number;
  durationSeconds: number;
  caloriesBurned: number;
  symmetryScore: number;
  depthScore: number;
  synced: boolean;
}

export interface StoredPassport {
  athleteId: string;
  athleteName: string;
  category: string;
  overallScore: number;
  tier: string;
  verifiedAt: string;
  qrHash: string;
  stats: {
    squatMax: number;
    pushupMax: number;
    staminaIndex: number;
    formConsistency: number;
  };
}

const DB_NAME = 'AthleteAssessmentDB';
const DB_VERSION = 1;
const STORE_ASSESSMENTS = 'assessments';
const STORE_PASSPORT = 'passport';

export class OfflineStorage {
  private static dbPromise: Promise<IDBDatabase> | null = null;

  public static getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_ASSESSMENTS)) {
          const store = db.createObjectStore(STORE_ASSESSMENTS, { keyPath: 'id' });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('synced', 'synced', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_PASSPORT)) {
          db.createObjectStore(STORE_PASSPORT, { keyPath: 'athleteId' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  public static async saveAssessment(assessment: StoredAssessment): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ASSESSMENTS, 'readwrite');
      const store = tx.objectStore(STORE_ASSESSMENTS);
      const req = store.put(assessment);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public static async getAllAssessments(): Promise<StoredAssessment[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ASSESSMENTS, 'readonly');
      const store = tx.objectStore(STORE_ASSESSMENTS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  public static async savePassport(passport: StoredPassport): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PASSPORT, 'readwrite');
      const store = tx.objectStore(STORE_PASSPORT);
      const req = store.put(passport);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public static async getPassport(athleteId: string): Promise<StoredPassport | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PASSPORT, 'readonly');
      const store = tx.objectStore(STORE_PASSPORT);
      const req = store.get(athleteId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }
}
