import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setUserStatus } from "../features/presence/presenceSlice";
import { subscribeToUserStatus } from "../firebase/presenceService";

/**
 * useUserStatus — subscribes to a user's online/offline status in real time.
 *
 * Syncs the status into Redux presenceSlice.userStatuses[uid].
 * Automatically unsubscribes when uid changes or component unmounts.
 *
 * @param {string|null} uid - UID to watch (null = no-op)
 */
const useUserStatus = (uid) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = subscribeToUserStatus(uid, ({ isOnline, lastSeen }) => {
      dispatch(setUserStatus({ uid, isOnline, lastSeen }));
    });
    return unsubscribe;
  }, [uid, dispatch]);
};

export default useUserStatus;
