// Chat service — all Firestore operations for conversations and messages.
// Phase 4: 1-on-1 conversations + messages
// Phase 5: group conversations

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import { db } from "./config";

// ─── Conversations ────────────────────────────────────────────────────────────

/**
 * Find an existing 1-on-1 conversation between two users, or create one.
 * Uses a deterministic conversation ID (sorted UIDs joined by "_") so we never
 * create duplicates — querying is not needed, we just check by known ID.
 *
 * @param {string} uid1 - Current user's UID
 * @param {string} uid2 - Other user's UID
 * @returns {string} conversationId
 */
export const getOrCreateDirectConversation = async (uid1, uid2) => {
  // Deterministic ID: always sort UIDs so both users get the same doc ID
  const conversationId = [uid1, uid2].sort().join("_");
  const ref = doc(db, "conversations", conversationId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      type: "direct",
      members: [uid1, uid2],
      createdAt: serverTimestamp(),
      lastMessage: null,
    });
  }

  return conversationId;
};

/**
 * Create a new group conversation.
 *
 * @param {object} params
 * @param {string} params.groupName
 * @param {string[]} params.memberUids - All member UIDs including the creator
 * @param {string} params.adminId - Creator's UID
 * @returns {string} conversationId
 */
export const createGroupConversation = async ({ groupName, memberUids, adminId }) => {
  const ref = await addDoc(collection(db, "conversations"), {
    type: "group",
    groupName,
    groupPhotoURL: null,
    members: memberUids,
    adminId,
    createdAt: serverTimestamp(),
    lastMessage: null,
  });
  return ref.id;
};

/**
 * Subscribe to all conversations for a user.
 * Returns an unsubscribe function — call on unmount.
 *
 * @param {string} uid - Current user's UID
 * @param {function} callback - Called with conversations array on every update
 */
export const subscribeToConversations = (uid, callback) => {
  const q = query(
    collection(db, "conversations"),
    where("members", "array-contains", uid),
    orderBy("lastMessage.sentAt", "desc")
  );

  return onSnapshot(q, (snap) => {
    const conversations = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(conversations);
  });
};

// ─── Messages ────────────────────────────────────────────────────────────────

/**
 * Send a message to a conversation.
 * Also updates the conversation's lastMessage field (for sidebar preview).
 *
 * @param {string} conversationId
 * @param {object} params
 * @param {string} params.senderId
 * @param {string} params.text
 * @param {string|null} params.mediaURL
 * @param {"image"|"file"|null} params.mediaType
 */
export const sendMessage = async (conversationId, { senderId, text, mediaURL = null, mediaType = null }) => {
  const messagesRef = collection(db, "conversations", conversationId, "messages");
  const conversationRef = doc(db, "conversations", conversationId);

  // Write the message
  await addDoc(messagesRef, {
    senderId,
    text,
    mediaURL,
    mediaType,
    sentAt: serverTimestamp(),
    readBy: [senderId],
    reactions: {},
  });

  // Update the conversation's lastMessage preview
  await updateDoc(conversationRef, {
    lastMessage: {
      text: text || (mediaType === "image" ? "📷 Photo" : "📎 File"),
      senderId,
      sentAt: serverTimestamp(),
    },
  });
};

/**
 * Subscribe to messages in a conversation (real-time).
 * Returns unsubscribe function — call on unmount or conversation change.
 *
 * @param {string} conversationId
 * @param {function} callback - Called with messages array on every update
 * @param {number} messageLimit - Number of recent messages to load (default 50)
 */
export const subscribeToMessages = (conversationId, callback, messageLimit = 50) => {
  const q = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("sentAt", "asc"),
    limit(messageLimit)
  );

  return onSnapshot(q, (snap) => {
    const messages = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(messages);
  });
};

/**
 * Mark a message as read by the current user.
 * Adds uid to the message's readBy array (no duplicates via arrayUnion).
 *
 * @param {string} conversationId
 * @param {string} messageId
 * @param {string} uid
 */
export const markMessageAsRead = async (conversationId, messageId, uid) => {
  const ref = doc(db, "conversations", conversationId, "messages", messageId);
  await updateDoc(ref, { readBy: arrayUnion(uid) });
};
