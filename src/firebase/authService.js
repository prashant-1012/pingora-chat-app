// Auth service — all Firebase Auth + Firestore user-write logic lives here.
// Components and slices never import Firebase directly.

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./config";

/**
 * Register a new user.
 * 1. Creates the Firebase Auth account.
 * 2. Updates the Auth profile with displayName.
 * 3. Writes a user document to Firestore `users/{uid}`.
 */
export const registerUser = async ({ email, password, displayName }) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Set displayName on the Firebase Auth profile
  await updateProfile(user, { displayName });

  // Write the user document to Firestore
  // This is the canonical user record used throughout the app.
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    displayName,
    email: user.email,
    photoURL: null,
    createdAt: serverTimestamp(),
    lastSeen: serverTimestamp(),
    isOnline: true,
    fcmToken: null, // populated in Phase 8
  });

  return user;
};

/**
 * Sign in an existing user.
 */
export const loginUser = async ({ email, password }) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

/**
 * Sign out the current user.
 */
export const logoutUser = () => signOut(auth);

/**
 * Subscribe to Firebase auth state changes.
 * Fires immediately with current state, then on every change.
 * Returns the unsubscribe function — always call it on unmount.
 */
export const subscribeToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, callback);
};
