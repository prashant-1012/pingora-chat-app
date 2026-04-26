// Chat service — all Firestore operations for conversations and messages.
// Phase 4: 1-on-1 conversations + messages
// Phase 5: group conversations

import {
  collection,
  doc,
  addDoc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "./config";

// ─── Timestamp serializer ─────────────────────────────────────────────────────
// Firestore Timestamp objects are not Redux-serializable.
// We convert them to ISO strings immediately when reading from Firestore.
export const serializeTimestamp = (ts) => {
  if (!ts) return null;
  if (ts.toDate) return ts.toDate().toISOString();
  return ts;
};

const serializeConversation = (id, data) => ({
  id,
  type: data.type ?? "direct",
  members: data.members ?? [],
  groupName: data.groupName ?? null,
  groupPhotoURL: data.groupPhotoURL ?? null,
  adminId: data.adminId ?? null,
  createdAt: serializeTimestamp(data.createdAt),
  updatedAt: serializeTimestamp(data.updatedAt),
  lastMessage: data.lastMessage
    ? {
        text: data.lastMessage.text ?? "",
        senderId: data.lastMessage.senderId ?? "",
        sentAt: serializeTimestamp(data.lastMessage.sentAt),
      }
    : null,
});

const serializeMessage = (id, data) => ({
  id,
  senderId: data.senderId ?? "",
  text: data.text ?? "",
  mediaURL: data.mediaURL ?? null,
  mediaType: data.mediaType ?? null,
  fileName: data.fileName ?? null,
  fileSize: data.fileSize ?? null,
  sentAt: serializeTimestamp(data.sentAt),
  readBy: data.readBy ?? [],
  reactions: data.reactions ?? {},
  // Phase 7: message reply
  replyTo: data.replyTo ?? null, // { messageId, text, senderId, senderName }
});

// ─── Conversations ────────────────────────────────────────────────────────────

/**
 * Find an existing 1-on-1 conversation between two users, or create one.
 * Uses a deterministic conversation ID (sorted UIDs joined by "_") so we never
 * create duplicates — no query needed, we just check by known ID.
 */
export const getOrCreateDirectConversation = async (uid1, uid2) => {
  const conversationId = [uid1, uid2].sort().join("_");
  const ref = doc(db, "conversations", conversationId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      type: "direct",
      members: [uid1, uid2],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: null,
    });
  }

  return conversationId;
};

/**
 * Create a new group conversation.
 */
export const createGroupConversation = async ({ groupName, memberUids, adminId }) => {
  const ref = await addDoc(collection(db, "conversations"), {
    type: "group",
    groupName,
    groupPhotoURL: null,
    members: memberUids,
    adminId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: null,
  });
  return ref.id;
};

/**
 * Subscribe to all conversations for a user (real-time).
 * Conversations are returned sorted by updatedAt (most recent first).
 * Client-side sort to avoid requiring a Firestore composite index.
 *
 * @param {string} uid - Current user's UID
 * @param {function} callback - Called with serialized conversations array
 * @returns {function} unsubscribe
 */
export const subscribeToConversations = (uid, callback) => {
  const q = query(
    collection(db, "conversations"),
    where("members", "array-contains", uid)
  );

  return onSnapshot(q, (snap) => {
    const conversations = snap.docs
      .map((d) => serializeConversation(d.id, d.data()))
      .sort((a, b) => {
        const aTime = a.updatedAt ?? a.createdAt ?? "";
        const bTime = b.updatedAt ?? b.createdAt ?? "";
        return bTime.localeCompare(aTime); // most recent first
      });
    callback(conversations);
  });
};

// ─── Messages ────────────────────────────────────────────────────────────────

/**
 * Send a message to a conversation.
 * Also updates the conversation's lastMessage + updatedAt fields.
 */
export const sendMessage = async (
  conversationId,
  { senderId, text, mediaURL = null, mediaType = null, fileName = null, fileSize = null, replyTo = null }
) => {
  const messagesRef = collection(db, "conversations", conversationId, "messages");
  const conversationRef = doc(db, "conversations", conversationId);

  await addDoc(messagesRef, {
    senderId,
    text: text || "",
    mediaURL,
    mediaType,
    fileName,
    fileSize,
    sentAt: serverTimestamp(),
    readBy: [senderId],
    reactions: {},
    replyTo,
  });

  // Derive a sensible lastMessage preview based on media type
  const lastMsgText =
    text ||
    (mediaType === "image" ? "📷 Photo" :
     mediaType === "video" ? "🎥 Video" :
     mediaType === "audio" ? "🎵 Audio" :
     mediaType === "file"  ? `📎 ${fileName ?? "File"}` :
     "📎 Attachment");

  await updateDoc(conversationRef, {
    lastMessage: { text: lastMsgText, senderId, sentAt: serverTimestamp() },
    updatedAt: serverTimestamp(),
  });
};

/**
 * Subscribe to messages in a conversation (real-time).
 * Returns unsubscribe function — call on unmount or conversation change.
 *
 * @param {string} conversationId
 * @param {function} callback - Called with serialized messages array
 * @param {number} messageLimit - Number of recent messages to load
 */
export const subscribeToMessages = (conversationId, callback, messageLimit = 100) => {
  const q = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("sentAt", "asc"),
    limit(messageLimit)
  );

  return onSnapshot(q, (snap) => {
    const messages = snap.docs.map((d) => serializeMessage(d.id, d.data()));
    callback(messages);
  });
};

/**
 * Mark a message as read by the current user.
 */
export const markMessageAsRead = async (conversationId, messageId, uid) => {
  const ref = doc(db, "conversations", conversationId, "messages", messageId);
  await updateDoc(ref, { readBy: arrayUnion(uid) });
};

// ─── Group Management (Phase 5) ──────────────────────────────────────────────

/**
 * Add a member to a group conversation.
 */
export const addMemberToGroup = async (conversationId, uid) => {
  const ref = doc(db, "conversations", conversationId);
  await updateDoc(ref, {
    members: arrayUnion(uid),
    updatedAt: serverTimestamp(),
  });
};

/**
 * Remove a member from a group conversation.
 * Also used for leaving a group (pass current user's own UID).
 */
export const removeMemberFromGroup = async (conversationId, uid) => {
  const ref = doc(db, "conversations", conversationId);
  await updateDoc(ref, {
    members: arrayRemove(uid),
    updatedAt: serverTimestamp(),
  });
};

/**
 * Update a group's display name.
 */
export const updateGroupName = async (conversationId, groupName) => {
  const ref = doc(db, "conversations", conversationId);
  await updateDoc(ref, {
    groupName,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Transfer admin rights to another member.
 */
export const transferAdmin = async (conversationId, newAdminId) => {
  const ref = doc(db, "conversations", conversationId);
  await updateDoc(ref, {
    adminId: newAdminId,
    updatedAt: serverTimestamp(),
  });
};
