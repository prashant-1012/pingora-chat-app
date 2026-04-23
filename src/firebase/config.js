// Firebase configuration and initialization.
// All values come from environment variables — never hardcode secrets.
// Vite exposes env vars prefixed with VITE_ to the browser bundle.

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  // measurementId is optional — omitted if Analytics is disabled
  ...(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID && {
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  }),
};

// Initialize Firebase — single instance for the entire app.
const app = initializeApp(firebaseConfig);

// Export individual services for use throughout the app.
// messaging is NOT initialized here — added in Phase 8 when VAPID key is ready.
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
