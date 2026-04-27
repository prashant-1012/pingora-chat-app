// MessagePanel — the right side chat panel with header, messages, and input.
// Phase 6: online status, typing indicators.
// Phase 7: file upload, reply system, media gallery drawer.

import { useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectMessages,
  selectMessagesLoading,
  selectActiveConversation,
  selectUserCache,
  selectReplyingTo,
  selectMediaMessages,
  sendMessageAsync,
} from "../../features/chat/chatSlice";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { selectUserStatus } from "../../features/presence/presenceSlice";
import { subscribeToTyping } from "../../firebase/presenceService";
import { markMessageAsRead } from "../../firebase/chatService";
import { uploadFile } from "../../firebase/storageService";
import useUserStatus from "../../hooks/useUserStatus";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";
import ReplyBar from "./ReplyBar";
import MediaGalleryDrawer from "./MediaGalleryDrawer";

// ── Helpers ───────────────────────────────────────────────────────────────────

const groupMessages = (messages) => {
  const groups = [];
  messages.forEach((msg, i) => {
    const prev = messages[i - 1];
    if (prev && prev.senderId === msg.senderId) {
      groups[groups.length - 1].push(msg);
    } else {
      groups.push([msg]);
    }
  });
  return groups;
};

const formatLastSeen = (isoString) => {
  if (!isoString) return null;
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "last seen just now";
  if (mins < 60) return `last seen ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `last seen ${hrs}h ago`;
  return `last seen ${new Date(isoString).toLocaleDateString([], { month: "short", day: "numeric" })}`;
};

// ── Component ─────────────────────────────────────────────────────────────────

const MessagePanel = ({ otherUser, onShowGroupInfo, onBack }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const conversation = useSelector(selectActiveConversation);
  const messages = useSelector(selectMessages);
  const messagesLoading = useSelector(selectMessagesLoading);
  const userCache = useSelector(selectUserCache);
  const replyingTo = useSelector(selectReplyingTo);
  const mediaMessages = useSelector(selectMediaMessages);

  const isGroup = conversation?.type === "group";

  // ── Online status (DM only) ────────────────────────────────────────────────
  const otherUid = !isGroup
    ? conversation?.members?.find((uid) => uid !== currentUser?.uid)
    : null;
  useUserStatus(otherUid);
  const otherStatus = useSelector(selectUserStatus(otherUid));

  // ── Typing indicator ───────────────────────────────────────────────────────
  const [typingUids, setTypingUids] = useState([]);
  useEffect(() => {
    if (!conversation?.id) return;
    const unsub = subscribeToTyping(conversation.id, (uids) => setTypingUids(uids));
    return () => { unsub(); setTypingUids([]); };
  }, [conversation?.id]);

  // ── Mark incoming messages as read (DM only) ──────────────────────────────
  useEffect(() => {
    if (!conversation?.id || !currentUser?.uid || isGroup) return;
    const unread = messages.filter(
      (m) => m.senderId !== currentUser.uid && !m.readBy?.includes(currentUser.uid)
    );
    unread.forEach((m) => markMessageAsRead(conversation.id, m.id, currentUser.uid).catch(() => {}));
  }, [messages, conversation?.id, currentUser?.uid, isGroup]);

  // ── Seen indicator — own last message seen by other user (DM only) ────────
  const seenInfo = (() => {
    if (isGroup || !otherUid) return {};
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.senderId === currentUser?.uid) {
        const seen = m.readBy?.includes(otherUid);
        return { seenMessageId: seen ? m.id : null, seenByName: otherUser?.displayName };
      }
    }
    return {};
  })();

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUids]);

  // ── Text send ──────────────────────────────────────────────────────────────
  const [sending, setSending] = useState(false);
  const handleSend = async (text) => {
    if (!conversation || !text.trim()) return;
    setSending(true);
    await dispatch(sendMessageAsync({
      conversationId: conversation.id,
      senderId: currentUser.uid,
      text: text.trim(),
      replyTo: replyingTo,
    }));
    setSending(false);
  };

  // ── File upload ────────────────────────────────────────────────────────────
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);

  const handleFileSelect = async (file) => {
    if (!conversation?.id || !currentUser?.uid) return;
    console.log("[MessagePanel] File selected:", { name: file.name, size: file.size, type: file.type });
    console.log("[MessagePanel] Upload context:", { conversationId: conversation.id, uid: currentUser.uid });
    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);
    try {
      const { downloadURL, mediaType, fileName, fileSize } = await uploadFile(
        file,
        conversation.id,
        currentUser.uid,
        setUploadProgress
      );
      await dispatch(sendMessageAsync({
        conversationId: conversation.id,
        senderId: currentUser.uid,
        text: "",
        mediaURL: downloadURL,
        mediaType,
        fileName,
        fileSize,
        replyTo: replyingTo,
      }));
    } catch (err) {
      console.error("[MessagePanel] Upload failed:", err.code, err.message, err);
      setUploadError(err.message ?? "Upload failed.");
      setTimeout(() => setUploadError(null), 6000);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // ── Gallery drawer ─────────────────────────────────────────────────────────
  const [showGallery, setShowGallery] = useState(false);

  // ── Header info ────────────────────────────────────────────────────────────
  const headerName = isGroup ? conversation.groupName : otherUser?.displayName ?? "Chat";
  const headerInitials = headerName?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  const memberCount = conversation?.members?.length ?? 0;
  const dmStatusLine = (() => {
    if (!otherStatus) return null;
    if (otherStatus.isOnline) return { text: "Online", color: "text-emerald-500" };
    const t = formatLastSeen(otherStatus.lastSeen);
    return t ? { text: t, color: "text-muted-foreground" } : null;
  })();

  const grouped = groupMessages(messages);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-card shrink-0">
        {/* Back button — mobile only */}
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden p-1.5 -ml-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
        )}
        <div className={`w-9 h-9 flex items-center justify-center shrink-0
          ${isGroup
            ? "rounded-xl bg-gradient-to-br from-violet-500/20 to-primary/20 border border-primary/20"
            : "rounded-full bg-gradient-to-br from-primary/20 to-violet-500/20"
          }`}>
          <span className="text-sm font-bold text-primary">{headerInitials}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{headerName}</p>
          {isGroup
            ? <p className="text-xs text-muted-foreground">{memberCount} member{memberCount !== 1 ? "s" : ""}</p>
            : dmStatusLine
            ? <p className={`text-xs font-medium ${dmStatusLine.color}`}>{dmStatusLine.text}</p>
            : null}
        </div>

        <div className="flex items-center gap-1">
          {/* Media gallery button — always shown */}
          <button
            id="media-gallery-btn"
            onClick={() => setShowGallery(true)}
            title="Shared media"
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
            {mediaMessages.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-bold">
                {mediaMessages.length > 9 ? "9+" : mediaMessages.length}
              </span>
            )}
          </button>

          {isGroup ? (
            <button id="group-info-btn" onClick={onShowGroupInfo} title="Group info" className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </button>
          ) : (
            <div className={`w-2 h-2 rounded-full transition-colors ${otherStatus?.isOnline ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
          )}
        </div>
      </div>

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0">
        {messagesLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                <div className={`h-8 rounded-2xl bg-muted animate-pulse ${i % 2 === 0 ? "w-40" : "w-56"}`} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">No messages yet.</p>
            <p className="text-xs text-muted-foreground mt-0.5">Say hello! 👋</p>
          </div>
        ) : (
          grouped.map((group, gi) => {
            const isOwn = group[0].senderId === currentUser?.uid;
            const sender = userCache[group[0].senderId];
            const senderName = isOwn ? null : sender?.displayName ?? group[0].senderId.slice(0, 8);

            return (
              <div key={gi} className="space-y-1">
                {group.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={isOwn}
                    senderName={senderName}
                    conversationId={conversation?.id}
                    showSeen={isOwn && seenInfo.seenMessageId === msg.id}
                    seenByName={seenInfo.seenByName}
                  />
                ))}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Typing indicator ── */}
      <TypingIndicator typingUids={typingUids} userCache={userCache} currentUserUid={currentUser?.uid} />

      {/* ── Upload progress bar ── */}
      {uploading && (
        <div className="flex items-center gap-3 px-5 py-2 border-t border-border bg-card/80">
          <svg className="w-3.5 h-3.5 text-primary animate-pulse shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
          </svg>
          <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground shrink-0 w-8 text-right">{uploadProgress}%</span>
        </div>
      )}

      {/* ── Upload error ── */}
      {uploadError && (
        <div className="flex items-center gap-2 px-5 py-2 border-t border-border bg-destructive/10 text-destructive text-xs">
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {uploadError}
        </div>
      )}

      {/* ── Reply bar (above input) ── */}
      <ReplyBar />

      {/* ── Input ── */}
      <MessageInput
        onSend={handleSend}
        onFileSelect={handleFileSelect}
        disabled={sending || messagesLoading || uploading}
        conversationId={conversation?.id}
        uid={currentUser?.uid}
      />

      {/* ── Media gallery drawer ── */}
      {showGallery && <MediaGalleryDrawer onClose={() => setShowGallery(false)} />}
    </div>
  );
};

export default MessagePanel;
