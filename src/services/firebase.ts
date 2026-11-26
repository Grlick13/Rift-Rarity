import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDocFromServer,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import type { AnswerPickCounts, GameMode, LeaderboardEntry, RankId } from '../types/game';
import { getTodayUtcKey } from '../data/questions';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();

export function subscribeAuthUser(cb: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, cb);
}

export async function signInWithGoogle(): Promise<User> {
  const cred = await signInWithPopup(auth, googleProvider);
  return cred.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

function sanitizeDocIdPart(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 60);
  return cleaned || 'unknown';
}

/**
 * Subscribes to public scoreboard entries for either Daily (today's UTC date)
 * or Unlimited (all-time top scores).
 */
export function subscribeLeaderboard(
  mode: GameMode,
  dateKey: string,
  onEntries: (entries: LeaderboardEntry[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'leaderboard_entries';
  const q =
    mode === 'daily'
      ? query(
          collection(db, path),
          where('isPublic', '==', true),
          where('mode', '==', 'daily'),
          where('dateKey', '==', dateKey),
          orderBy('score', 'desc'),
          limit(25)
        )
      : query(
          collection(db, path),
          where('isPublic', '==', true),
          where('mode', '==', 'unlimited'),
          orderBy('score', 'desc'),
          limit(25)
        );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: LeaderboardEntry[] = snapshot.docs.map((d) => {
        const data = d.data();
        const ts = data.createdAt as Timestamp | undefined;
        return {
          id: d.id,
          uid: String(data.uid ?? ''),
          summonerName: String(data.summonerName ?? 'Summoner'),
          mode: (data.mode === 'daily' ? 'daily' : 'unlimited') as GameMode,
          dateKey: String(data.dateKey ?? dateKey),
          score: Number(data.score ?? 0),
          finalRank: String(data.finalRank ?? 'iron') as RankId,
          reachedZone: String(data.reachedZone ?? 'Blue Fountain'),
          progress: Number(data.progress ?? 0),
          isPublic: Boolean(data.isPublic),
          createdAtMs: ts ? ts.toMillis() : undefined,
        };
      });
      onEntries(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError) onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

/**
 * Submits a verified user's run score to Firestore.
 */
export async function submitLeaderboardEntry(params: {
  summonerName: string;
  mode: GameMode;
  dateKey: string;
  score: number;
  finalRank: RankId;
  reachedZone: string;
  progress: number;
}): Promise<LeaderboardEntry> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    throw new Error('Sign in with a verified Google account to post to the global scoreboard.');
  }

  const safeUid = sanitizeDocIdPart(user.uid);
  const safeName = params.summonerName.trim().slice(0, 32) || 'Summoner';
  const clampedScore = Math.max(0, Math.min(25000, Math.round(params.score)));
  const clampedProgress = Math.max(0, Math.min(100, Number(params.progress.toFixed(2))));
  const safeZone = params.reachedZone.trim().slice(0, 40) || 'Blue Fountain';

  const entryId =
    params.mode === 'daily'
      ? `${safeUid}_daily_${params.dateKey}`
      : `${safeUid}_unlim_${Date.now()}`;

  const path = `leaderboard_entries/${entryId}`;
  const payload = {
    uid: user.uid,
    summonerName: safeName,
    mode: params.mode,
    dateKey: params.dateKey,
    score: clampedScore,
    finalRank: params.finalRank,
    reachedZone: safeZone,
    progress: clampedProgress,
    isPublic: true,
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'leaderboard_entries', entryId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  return {
    id: entryId,
    uid: user.uid,
    summonerName: safeName,
    mode: params.mode,
    dateKey: params.dateKey,
    score: clampedScore,
    finalRank: params.finalRank,
    reachedZone: safeZone,
    progress: clampedProgress,
    isPublic: true,
    createdAtMs: Date.now(),
  };
}

/**
 * Fetches community pick counts for a given question from Firestore.
 */
export async function fetchQuestionAnswerStats(questionId: string): Promise<AnswerPickCounts> {
  const safeQ = sanitizeDocIdPart(questionId);
  const path = 'answer_stats';
  try {
    const q = query(
      collection(db, path),
      where('isPublic', '==', true),
      where('questionId', '==', safeQ)
    );
    const snap = await getDocs(q);
    const counts: AnswerPickCounts = {};
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      const ansId = String(d.answerId ?? '');
      const count = Number(d.pickCount ?? 0);
      if (ansId && count > 0) {
        counts[ansId] = count;
      }
    });
    return counts;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Atomically records a community answer pick (+1) in Firestore when signed in.
 */
export async function recordCommunityAnswerPick(
  questionId: string,
  answerId: string,
  answerName: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const safeQ = sanitizeDocIdPart(questionId).slice(0, 64);
  const safeA = sanitizeDocIdPart(answerId).slice(0, 64);
  const statId = `${safeQ}__${safeA}`.slice(0, 128);
  const path = `answer_stats/${statId}`;
  const docRef = doc(db, 'answer_stats', statId);
  const today = getTodayUtcKey();
  const safeAnswerName = answerName.trim().slice(0, 80) || safeA;

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(docRef);
      if (!snap.exists()) {
        tx.set(docRef, {
          questionId: safeQ,
          answerId: safeA,
          answerName: safeAnswerName,
          pickCount: 1,
          lastPickedDay: today,
          isPublic: true,
          updatedAt: serverTimestamp(),
        });
      } else {
        const current = Number(snap.data().pickCount ?? 0);
        tx.update(docRef, {
          pickCount: current + 1,
          lastPickedDay: today,
          answerName: safeAnswerName,
          updatedAt: serverTimestamp(),
        });
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
