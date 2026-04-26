// MessagePanel — the right side chat panel with header, messages, and input.

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
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

// Group consecutive messages by the same sender
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

const MessagePanel = ({ otherUser }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const conversation = useSelector(selectActiveConversation);
  const messages = useSelector(selectMessages);
  const messagesLoading = useSelector(selectMessagesLoading);
  const userCache = useSelector(selectUserCache);

  const messagesEndRef = useRef(null);
  const [sending, setSending] = useState(false);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  // Header display info
  const headerName =
    conversation?.type === "group"
      ? conversation.groupName
      : otherUser?.displayName ?? "Chat";

  const headerInitials = headerName
    ?.split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  const grouped = groupMessages(messages);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-card">
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <span className="text-sm font-semibold text-primary">{headerInitials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{headerName}</p>
          {otherUser?.email && (
            <p className="text-xs text-muted-foreground truncate">{otherUser.email}</p>
          )}
        </div>
        {/* Placeholder for future actions (search, video call, etc.) */}
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500" title="Online (Phase 6)" />
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messagesLoading ? (
          // Skeleton messages
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                <div
                  className={`h-8 rounded-2xl bg-muted animate-pulse
                    ${i % 2 === 0 ? "w-40" : "w-56"}`}
                />
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
            const senderName = isOwn ? currentUser?.displayName : sender?.displayName;

            return (
              <div key={gi} className="space-y-1">
                {group.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={isOwn}
                    senderName={!isOwn ? senderName : null}
                  />
                ))}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput onSend={handleSend} disabled={sending || messagesLoading} />
    </div>
  );
};

export default MessagePanel;
