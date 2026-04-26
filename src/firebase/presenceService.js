// Presence service — Firestore-based online/offline status and typing indicators.
//
// PRESENCE STRATEGY:
//   • On login: set isOnline=true + start 25s heartbeat
//   • On tab hide (visibilitychange): set isOnline=false
//   • On tab show: set isOnline=true + resume heartbeat
//   • On beforeunload: set isOnline=false (best-effort)
//   • Typing: write client-side timestamp to `typing/{conversationId}`;
//     entries older than 5s are treated as stale.

import {
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  deleteField,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";

// ─── Online / Offline ─────────────────────────────────────────────────────────

const setStatus = (uid, isOnline) =>
  updateDoc(doc(db, "users", uid), {
    isOnline,
    lastSeen: serverTimestamp(),
  }).catch((err) => console.error("[presenceService] setStatus failed:", err));

/**
 * Initialize presence for the current user.
 * Sets up heartbeat, visibility listener, and beforeunload handler.
 * Returns a cleanup function — call on logout or component unmount.
 *
 * @param {string} uid - Current user's UID
 * @returns {function} cleanup
 */
export const initPresence = (uid) => {
  if (!uid) return () => {};

  const goOnline = () => setStatus(uid, true);
  const goOffline = () => setStatus(uid, false);

  goOnline();

  // Heartbeat every 25 seconds keeps lastSeen fresh while the tab is visible
  const heartbeat = setInterval(() => {
    if (document.visibilityState !== "hidden") goOnline();
  }, 25000);

  const handleVisibilityChange = () => {
    if (document.visibilityState === "hidden") goOffline();
    else goOnline();
  };

  const handleBeforeUnload = () => goOffline();

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("beforeunload", handleBeforeUnload);

  return () => {
    clearInterval(heartbeat);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("beforeunload", handleBeforeUnload);
    goOffline();
  };
};

/**
 * Subscribe to a user's online status in real time.
 * Fires immediately with the current status, then on every change.
 *
 * @param {string} uid - UID to watch
 * @param {function} callback - called with { isOnline, lastSeen (ISO string) }
 * @returns {function} unsubscribe
 */
export const subscribeToUserStatus = (uid, callback) => {
  if (!uid) return () => {};
  return onSnapshot(doc(db, "users", uid), (snap) => {
    if (!snap.exists()) return;
    const d = snap.data();
    callback({
      isOnline: d.isOnline ?? false,
      lastSeen: d.lastSeen?.toDate?.()?.toISOString() ?? null,
    });
  });
};

// ─── Typing Indicators ────────────────────────────────────────────────────────
// Stored in `typing/{conversationId}` as a map: { [uid]: ISO-string timestamp }
// Client-side ISO strings (not serverTimestamp) so stale detection works
// immediately on the receiving client without Timestamp resolution lag.

/**
 * Signal that the current user is (or is not) typing.
 *
 * @param {string} conversationId
 * @param {string} uid
 * @param {boolean} isTyping
 */
export const setTypingStatus = async (conversationId, uid, isTyping) => {
  if (!conversationId || !uid) return;
  const ref = doc(db, "typing", conversationId);
  try {
    if (isTyping) {
      await setDoc(ref, { [uid]: new Date().toISOString() }, { merge: true });
    } else {
      await updateDoc(ref, { [uid]: deleteField() });
    }
  } catch (err) {
    // Silently ignore — typing errors should never break the chat
    console.warn("[presenceService] setTypingStatus:", err.code);
  }
};

/**
 * Subscribe to typing users in a conversation.
 * Filters out stale entries (> 5 seconds old).
 *
 * @param {string} conversationId
 * @param {function} callback - called with string[] of UIDs currently typing
 * @returns {function} unsubscribe
 */
export const subscribeToTyping = (conversationId, callback) => {
  if (!conversationId) return () => {};
  return onSnapshot(doc(db, "typing", conversationId), (snap) => {
    if (!snap.exists()) { callback([]); return; }
    const data = snap.data();
    const now = Date.now();
    const activeUids = Object.entries(data)
      .filter(([, ts]) => {
        const age = now - new Date(ts).getTime();
        return age < 5000; // stale after 5 seconds
      })
      .map(([uid]) => uid);
    callback(activeUids);
  });
};
