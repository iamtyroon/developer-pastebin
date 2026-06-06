import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc,
  serverTimestamp,
  Timestamp,
  Firestore
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Paste } from './types';

export const isFirebaseConfigured = 
  firebaseConfig && 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== '' && 
  !firebaseConfig.apiKey.includes('placeholder') &&
  !firebaseConfig.apiKey.includes('YOUR_API_KEY');

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

// Global database reference
export let db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId || 'default');
    console.log("Firebase initialized successfully with DB ID:", firebaseConfig.firestoreDatabaseId);
  } catch (error) {
    console.warn("Failed to initialize Firebase SDK:", error);
  }
}

/**
 * Standard Firestore error handler conforming to the system skill instructions.
 */
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null, 
      email: null,
      emailVerified: null,
      isAnonymous: null
    },
    operationType,
    path
  };
  console.error('Firestore Security / Protocol Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Generate a cryptographically randomized 12-character ID for custom client pastes
 */
function generateRandomId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Saves a new paste. If Firebase Firestore is active, writes to Firestore.
 * Otherwise, persists it directly in LocalStorage.
 */
export async function savePaste(code: string, language: string): Promise<string> {
  const pasteId = generateRandomId();
  
  if (isFirebaseConfigured && db) {
    const docPath = `pastes/${pasteId}`;
    try {
      const pasteRef = doc(db, 'pastes', pasteId);
      await setDoc(pasteRef, {
        code,
        language,
        createdAt: serverTimestamp()
      });
      return pasteId;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, docPath);
    }
  } else {
    // Falls back to LocalStorage
    const localPastes = JSON.parse(localStorage.getItem('pastebin_items') || '{}');
    const newPaste: Paste = {
      id: pasteId,
      code,
      language,
      createdAt: new Date().toISOString()
    };
    localPastes[pasteId] = newPaste;
    localStorage.setItem('pastebin_items', JSON.stringify(localPastes));
    return pasteId;
  }
}

/**
 * Fetches a paste by its generated random ID.
 */
export async function getPaste(pasteId: string): Promise<Paste | null> {
  if (isFirebaseConfigured && db) {
    const docPath = `pastes/${pasteId}`;
    try {
      const pasteRef = doc(db, 'pastes', pasteId);
      const docSnap = await getDoc(pasteRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        let createdAtStr = new Date().toISOString();
        
        if (data.createdAt) {
          if (data.createdAt instanceof Timestamp) {
            createdAtStr = data.createdAt.toDate().toISOString();
          } else if (data.createdAt.seconds) {
            createdAtStr = new Date(data.createdAt.seconds * 1000).toISOString();
          } else {
            createdAtStr = String(data.createdAt);
          }
        }
        
        return {
          id: pasteId,
          code: data.code || '',
          language: data.language || 'plain',
          createdAt: createdAtStr
        };
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, docPath);
    }
  } else {
    // Falls back to LocalStorage
    const localPastes = JSON.parse(localStorage.getItem('pastebin_items') || '{}');
    const paste = localPastes[pasteId];
    return paste || null;
  }
}
