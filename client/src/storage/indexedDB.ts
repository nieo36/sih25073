/**
 * IndexedDB Storage Engine for Offline Fitness Assessment Sessions, MediaPipe Kinematics & Passports
 */

export interface LandmarkPoint {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface LandmarkSample {
  timestampMs: number;
  repNumber?: number;
  event?: 'peak_inflection' | 'lowest_depth' | 'start' | 'finish' | 'sample';
  angle?: number;
  landmarks: LandmarkPoint[];
}

import { ExerciseType } from '../config/exercises';

export interface StoredAssessment {
  id: string; // Client UUID
  athleteId?: string;
  exerciseType: ExerciseType | string;
  date: string;
  totalScore: number;
  grade: string;
  repsCompleted: number;
  validReps: number;
  durationSeconds: number;
  caloriesBurned: number;
  symmetryScore: number;
  depthScore: number;
  formAccuracy?: number;
  cadenceScore?: number;
  angles?: {
    current: number;
    min: number;
    max: number;
    avg: number;
  };
  landmarkSamples?: LandmarkSample[];
  synced: boolean;
  syncedAt?: string;
  remoteId?: string;
  createdAt?: number;
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
const DB_VERSION = 2;
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
        let assessmentStore: IDBObjectStore;
        
        if (!db.objectStoreNames.contains(STORE_ASSESSMENTS)) {
          assessmentStore = db.createObjectStore(STORE_ASSESSMENTS, { keyPath: 'id' });
        } else {
          assessmentStore = (event.target as any).transaction.objectStore(STORE_ASSESSMENTS);
        }

        if (!assessmentStore.indexNames.contains('date')) {
          assessmentStore.createIndex('date', 'date', { unique: false });
        }
        if (!assessmentStore.indexNames.contains('synced')) {
          assessmentStore.createIndex('synced', 'synced', { unique: false });
        }
        if (!assessmentStore.indexNames.contains('createdAt')) {
          assessmentStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_PASSPORT)) {
          db.createObjectStore(STORE_PASSPORT, { keyPath: 'athleteId' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        this.dbPromise = null;
        reject(request.error);
      };
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
      req.onsuccess = () => {
        const results = (req.result || []) as StoredAssessment[];
        // Sort descending by createdAt
        results.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  }

  public static async getUnsyncedAssessments(): Promise<StoredAssessment[]> {
    const all = await this.getAllAssessments();
    return all.filter((a) => !a.synced);
  }

  public static async markAssessmentSynced(id: string, remoteId?: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ASSESSMENTS, 'readwrite');
      const store = tx.objectStore(STORE_ASSESSMENTS);
      const req = store.get(id);

      req.onsuccess = () => {
        const assessment = req.result as StoredAssessment | undefined;
        if (assessment) {
          assessment.synced = true;
          assessment.syncedAt = new Date().toISOString();
          if (remoteId) assessment.remoteId = remoteId;
          const updateReq = store.put(assessment);
          updateReq.onsuccess = () => resolve();
          updateReq.onerror = () => reject(updateReq.error);
        } else {
          resolve();
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  public static async deleteAssessment(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ASSESSMENTS, 'readwrite');
      const store = tx.objectStore(STORE_ASSESSMENTS);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
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
