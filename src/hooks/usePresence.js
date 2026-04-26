import { useEffect } from "react";
import { initPresence } from "../firebase/presenceService";

/**
 * usePresence — initializes the current user's online/offline presence.
 *
 * Sets up the Firestore heartbeat, visibility listener, and beforeunload handler.
 * Must be called once at the app root (inside ChatPage, after auth is resolved).
 * Automatically cleans up on unmount (logout).
 *
 * @param {string|null} uid - Current user's UID
 */
const usePresence = (uid) => {
  useEffect(() => {
    if (!uid) return;
    const cleanup = initPresence(uid);
    return cleanup;
  }, [uid]);
};

export default usePresence;
