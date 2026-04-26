// User service — Firestore operations for user data.
// Used for user search, profile reads, etc.

import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "./config";

/**
 * Search for a user by exact email address.
 * Returns the user doc data or null if not found.
 *
 * @param {string} email - Exact email to search for
 * @param {string} excludeUid - UID to exclude from results (current user)
 * @returns {object|null} user data or null
 */
export const searchUserByEmail = async (email, excludeUid) => {
  const q = query(
    collection(db, "users"),
    where("email", "==", email.trim().toLowerCase())
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const found = snap.docs.find((d) => d.id !== excludeUid);
  if (!found) return null;

  return { uid: found.id, ...found.data() };
};

/**
 * Get a single user document by UID.
 * Returns null if user doesn't exist.
 *
 * @param {string} uid
 * @returns {object|null}
 */
export const getUserById = async (uid) => {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() };
};
