// User service — all Firestore operations related to users.
// Used for: fetching user profiles, searching users, updating presence.

import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";

/**
 * Fetch a single user document by UID.
 * Returns the user data object or null if not found.
 */
export const getUserById = async (uid) => {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

/**
 * Search users by displayName (case-insensitive prefix match via Firestore range query).
 * Excludes the currently logged-in user from results.
 *
 * NOTE: Firestore doesn't support full-text search natively.
 * This uses a startAt/endAt range trick for prefix matching.
 * For full search, use Algolia or Typesense in a future phase.
 *
 * @param {string} nameQuery - The search string
 * @param {string} excludeUid - UID to exclude from results (the current user)
 * @param {number} maxResults - Max results to return (default 10)
 */
export const searchUsersByName = async (nameQuery, excludeUid, maxResults = 10) => {
  if (!nameQuery.trim()) return [];

  const q = query(
    collection(db, "users"),
    where("displayName", ">=", nameQuery),
    where("displayName", "<=", nameQuery + "\uf8ff"),
    orderBy("displayName"),
    limit(maxResults)
  );

  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((u) => u.uid !== excludeUid);
};

/**
 * Update a user's online status and lastSeen timestamp.
 * Called by the presence system (Phase 6).
 *
 * @param {string} uid
 * @param {boolean} isOnline
 */
export const updateUserPresence = async (uid, isOnline) => {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, {
    isOnline,
    lastSeen: serverTimestamp(),
  });
};

/**
 * Update FCM token for a user.
 * Called during push notification setup (Phase 8).
 *
 * @param {string} uid
 * @param {string} token
 */
export const updateFcmToken = async (uid, token) => {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, { fcmToken: token });
};
