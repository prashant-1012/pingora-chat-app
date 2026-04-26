import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setConversations } from "../features/chat/chatSlice";
import { subscribeToConversations } from "../firebase/chatService";

/**
 * useConversations — subscribes to the current user's conversations in real time.
 *
 * Sets up a Firestore onSnapshot listener and dispatches the serialized
 * conversations array to Redux on every change.
 * Automatically unsubscribes on unmount or when uid changes.
 *
 * @param {string|null} uid - Current user's UID (null if not logged in)
 */
const useConversations = (uid) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!uid) return;

    const unsubscribe = subscribeToConversations(uid, (conversations) => {
      dispatch(setConversations(conversations));
    });

    return () => unsubscribe();
  }, [uid, dispatch]);
};

export default useConversations;
