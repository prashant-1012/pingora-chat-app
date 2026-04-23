// Auth service — wraps Firebase Auth SDK calls.
// All auth logic lives here; never call Firebase Auth directly from components.
// Phase 2 will populate these functions fully.

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { auth } from "./config";

/**
 * Register a new user with email and password.
 * Also sets the displayName on the Firebase user object.
 */
export const registerUser = async ({ email, password, displayName }) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName });
  return userCredential.user;
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
 * Subscribe to auth state changes.
 * Returns the unsubscribe function — call it on component unmount.
 */
export const subscribeToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, callback);
};
