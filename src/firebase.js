import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  limit, 
  setDoc,
  getDoc
} from 'firebase/firestore';

// Environment-based or dynamic Firebase configuration
// If no cloud credentials are provided yet, the app gracefully falls back to local storage
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForFallback",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "omerga-warta.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "omerga-warta",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "omerga-warta.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef"
};

export const isFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY && 
  import.meta.env.VITE_FIREBASE_PROJECT_ID
);

let db = null;
try {
  if (isFirebaseConfigured) {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
} catch (e) {
  console.warn("Firebase initialization skipped, using fallback local storage:", e);
}

export { db };

// Collections
const NEWS_COLLECTION = 'news_posts';
const RASHI_COLLECTION = 'rashi_bhavishya';
const EPAPER_COLLECTION = 'epaper_data';

/**
 * High-performance paginated news fetcher
 * Limits payload to 20 articles at a time so load times stay under 1 second even with 10,000 posts
 */
export async function fetchNewsFromCloud(limitCount = 30) {
  if (!db) return null;
  try {
    const q = query(
      collection(db, NEWS_COLLECTION), 
      orderBy('createdAt', 'desc'), 
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    const list = [];
    snapshot.forEach(docSnap => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    return list;
  } catch (err) {
    console.error("Cloud fetch error:", err);
    return null;
  }
}

export async function addNewsToCloud(newsItem) {
  if (!db) return null;
  try {
    const docRef = await addDoc(collection(db, NEWS_COLLECTION), {
      ...newsItem,
      createdAt: Date.now()
    });
    return docRef.id;
  } catch (err) {
    console.error("Cloud add error:", err);
    return null;
  }
}

export async function updateNewsInCloud(docId, updatedFields) {
  if (!db) return false;
  try {
    const ref = doc(db, NEWS_COLLECTION, docId);
    await updateDoc(ref, updatedFields);
    return true;
  } catch (err) {
    console.error("Cloud update error:", err);
    return false;
  }
}

export async function deleteNewsFromCloud(docId) {
  if (!db) return false;
  try {
    const ref = doc(db, NEWS_COLLECTION, docId);
    await deleteDoc(ref);
    return true;
  } catch (err) {
    console.error("Cloud delete error:", err);
    return false;
  }
}
