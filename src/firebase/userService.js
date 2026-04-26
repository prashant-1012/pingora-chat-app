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

// Serialize Firestore Timestamps in a user doc to ISO strings for Redux safety.
const serializeUser = (uid, data) => ({
  uid,
  displayName: data.displayName ?? null,
  email: data.email ?? null,
  photoURL: data.photoURL ?? null,
  isOnline: data.isOnline ?? false,
  createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt ?? null,
  lastSeen: data.lastSeen?.toDate?.()?.toISOString() ?? data.lastSeen ?? null,
  fcmToken: data.fcmToken ?? null,
});

export const searchUserByEmail = async (email, excludeUid) => {
  const q = query(
    collection(db, "users"),
    where("email", "==", email.trim().toLowerCase())
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const found = snap.docs.find((d) => d.id !== excludeUid);
  if (!found) return null;
  return serializeUser(found.id, found.data());
};

export const getUserById = async (uid) => {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return serializeUser(snap.id, snap.data());
};

/**
 * Batch-fetch multiple user profiles by UID array.
 * Runs requests in parallel. Missing UIDs are silently skipped.
 *
 * @param {string[]} uids
 * @returns {object[]} array of user data objects
 */
export const getUsersByUids = async (uids) => {
  if (!uids?.length) return [];
  const results = await Promise.all(uids.map((uid) => getUserById(uid)));
  return results.filter(Boolean);
};

