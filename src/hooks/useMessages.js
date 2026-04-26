import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setMessages } from "../features/chat/chatSlice";
import { subscribeToMessages } from "../firebase/chatService";

/**
 * useMessages — subscribes to messages for the active conversation in real time.
 *
 * Sets up a Firestore onSnapshot listener on the messages sub-collection and
 * dispatches the serialized messages array to Redux on every change.
 * Automatically unsubscribes and clears when conversationId changes or
 * the component unmounts.
 *
 * @param {string|null} conversationId - Active conversation ID (null = no conversation open)
 */
const useMessages = (conversationId) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = subscribeToMessages(conversationId, (messages) => {
      dispatch(setMessages(messages));
    });

    return () => {
      unsubscribe();
      // Clear messages when switching conversations so stale data
      // doesn't flash while the new subscription loads.
      dispatch(setMessages([]));
    };
  }, [conversationId, dispatch]);
};

export default useMessages;
