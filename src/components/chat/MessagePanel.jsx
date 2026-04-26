// MessagePanel — the right side chat panel with header, messages, and input.
// Phase 6: real-time online status in header + typing indicators above input.

import { useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectMessages,
  selectMessagesLoading,
  selectActiveConversation,
  selectUserCache,
  sendMessageAsync,
} from "../../features/chat/chatSlice";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { selectUserStatus } from "../../features/presence/presenceSlice";
import { subscribeToTyping } from "../../firebase/presenceService";
import useUserStatus from "../../hooks/useUserStatus";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";

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
  const date = new Date(isoString);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "last seen just now";
  if (diffMins < 60) return `last seen ${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `last seen ${diffHours}h ago`;
  return `last seen ${date.toLocaleDateString([], { month: "short", day: "numeric" })}`;
};

// ── Component ─────────────────────────────────────────────────────────────────

const MessagePanel = ({ otherUser, onShowGroupInfo }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const conversation = useSelector(selectActiveConversation);
  const messages = useSelector(selectMessages);
  const messagesLoading = useSelector(selectMessagesLoading);
  const userCache = useSelector(selectUserCache);

  const isGroup = conversation?.type === "group";

  // ── Online status (DM only) ──────────────────────────────────────────────
  const otherUid = !isGroup
    ? conversation?.members?.find((uid) => uid !== currentUser?.uid)
    : null;

  // Subscribe to the DM partner's status (no-op for groups)
  useUserStatus(otherUid);
  const otherStatus = useSelector(selectUserStatus(otherUid));

  // ── Typing indicator ──────────────────────────────────────────────────────
  const [typingUids, setTypingUids] = useState([]);

  useEffect(() => {
    if (!conversation?.id) return;
    const unsubscribe = subscribeToTyping(conversation.id, (uids) => {
      setTypingUids(uids);
    });
    return () => {
      unsubscribe();
      setTypingUids([]);
    };
  }, [conversation?.id]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUids]);

  // ── Send ──────────────────────────────────────────────────────────────────
  const [sending, setSending] = useState(false);
  const handleSend = async (text) => {
    if (!conversation || !text.trim()) return;
    setSending(true);
    await dispatch(
      sendMessageAsync({
        conversationId: conversation.id,
        senderId: currentUser.uid,
        text: text.trim(),
      })
    );
    setSending(false);
  };

  // ── Header ────────────────────────────────────────────────────────────────
  const headerName = isGroup
    ? conversation.groupName
    : otherUser?.displayName ?? "Chat";

  const headerInitials = headerName
    ?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

  const memberCount = conversation?.members?.length ?? 0;

  // Status line for DM header
  const dmStatusLine = (() => {
    if (!otherStatus) return null;
    if (otherStatus.isOnline) return { text: "Online", color: "text-emerald-500" };
    const lastSeenText = formatLastSeen(otherStatus.lastSeen);
    return lastSeenText ? { text: lastSeenText, color: "text-muted-foreground" } : null;
  })();

  const grouped = groupMessages(messages);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-card">
        {/* Avatar */}
        <div className={`w-9 h-9 flex items-center justify-center shrink-0 bg-primary/20
          ${isGroup ? "rounded-xl border border-primary/20" : "rounded-full"}`}>
          <span className="text-sm font-semibold text-primary">{headerInitials}</span>
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{headerName}</p>
          {isGroup ? (
            <p className="text-xs text-muted-foreground">
              {memberCount} member{memberCount !== 1 ? "s" : ""}
            </p>
          ) : dmStatusLine ? (
            <p className={`text-xs font-medium ${dmStatusLine.color}`}>{dmStatusLine.text}</p>
          ) : null}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {isGroup ? (
            <button
              id="group-info-btn"
              onClick={onShowGroupInfo}
              title="Group info"
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </button>
          ) : (
            // Online indicator dot in header
            <div
              className={`w-2 h-2 rounded-full transition-colors ${
                otherStatus?.isOnline ? "bg-emerald-500" : "bg-muted-foreground/40"
              }`}
              title={otherStatus?.isOnline ? "Online" : "Offline"}
            />
          )}
        </div>
      </div>

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
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
            const senderName = isOwn
              ? null
              : sender?.displayName ?? group[0].senderId.slice(0, 8);

            return (
              <div key={gi} className="space-y-1">
                {group.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={isOwn}
                    senderName={senderName}
                  />
                ))}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Typing indicator (shown above input, slides in) ── */}
      <TypingIndicator
        typingUids={typingUids}
        userCache={userCache}
        currentUserUid={currentUser?.uid}
      />

      {/* ── Input ── */}
      <MessageInput
        onSend={handleSend}
        disabled={sending || messagesLoading}
        conversationId={conversation?.id}
        uid={currentUser?.uid}
      />
    </div>
  );
};

export default MessagePanel;
