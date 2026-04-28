// MessageBubble — a single chat message bubble.
// Phase 7: reply quotes, inline media, URL links, hover reply action, emoji reactions, seen indicator.

import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setReplyingTo, selectUserCache, toggleReactionAsync } from "../../features/chat/chatSlice";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { useProfilePics } from "../../contexts/ProfileContext";
import MediaMessage, { renderTextWithLinks } from "./MediaMessage";

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

const formatTime = (isoString) => {
  if (!isoString) return "";
  return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const EmojiPicker = ({ onSelect, onClose }) => {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full mb-1 bg-card border border-border rounded-xl shadow-lg px-2 py-1.5 flex gap-1 z-20"
    >
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => { onSelect(emoji); onClose(); }}
          className="text-base hover:scale-125 transition-transform leading-none p-0.5"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

const MessageBubble = ({ message, isOwn, senderName, conversationId, showSeen, seenByName }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const userCache = useSelector(selectUserCache);
  const { photoURLs } = useProfilePics();
  const [showPicker, setShowPicker] = useState(false);

  const senderPhoto = isOwn
    ? photoURLs[currentUser?.uid] ?? null
    : photoURLs[message.senderId] ?? null;
  const senderInitial = isOwn
    ? currentUser?.displayName?.[0]?.toUpperCase() ?? "?"
    : senderName?.[0]?.toUpperCase() ?? "?";

  const hasMedia = !!message.mediaURL;
  const hasText = !!message.text;

  // Reply-to quote block
  const replyTo = message.replyTo;
  const replyQuoteText = replyTo
    ? replyTo.text?.slice(0, 80) +
      (replyTo.text?.length > 80 ? "…" : "") ||
      { image: "📷 Photo", video: "🎥 Video", audio: "🎵 Audio", file: "📎 File" }[replyTo.mediaType] ||
      "Message"
    : null;
  const replyQuoteSender =
    replyTo?.senderName ?? userCache[replyTo?.senderId]?.displayName ?? "Someone";

  const handleReply = () => {
    dispatch(setReplyingTo({
      messageId: message.id,
      text: message.text,
      mediaType: message.mediaType,
      fileName: message.fileName,
      senderId: message.senderId,
      senderName: senderName ?? "Someone",
    }));
  };

  const handleReaction = (emoji) => {
    if (!conversationId || !currentUser?.uid) return;
    const currentUids = message.reactions?.[emoji] ?? [];
    const alreadyReacted = currentUids.includes(currentUser.uid);
    dispatch(toggleReactionAsync({
      conversationId,
      messageId: message.id,
      uid: currentUser.uid,
      emoji,
      add: !alreadyReacted,
    }));
  };

  // Build reaction summary: [{ emoji, count, isMine }]
  const reactionSummary = Object.entries(message.reactions ?? {})
    .filter(([, uids]) => uids.length > 0)
    .map(([emoji, uids]) => ({
      emoji,
      count: uids.length,
      isMine: uids.includes(currentUser?.uid),
    }));

  return (
    <div className={`flex items-end gap-2 group ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 mb-0.5 bg-muted flex items-center justify-center">
        {senderPhoto ? (
          <img src={senderPhoto} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-[10px] font-semibold text-muted-foreground">{senderInitial}</span>
        )}
      </div>

      {/* Bubble content column */}
      <div className={`flex flex-col gap-0.5 max-w-[70%] min-w-0 ${isOwn ? "items-end" : "items-start"}`}>
        {/* Sender name (group received) */}
        {!isOwn && senderName && (
          <span className="text-[10px] text-muted-foreground px-1">{senderName}</span>
        )}

        {/* Bubble */}
        <div
          className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed w-full overflow-hidden
            ${isOwn
              ? "bubble-own text-white shadow-md shadow-primary/20 rounded-br-sm"
              : "bg-muted text-foreground rounded-bl-sm"
            }
            ${hasMedia && !hasText ? "p-0" : ""}
          `}
        >
          {/* ── Reply quote ── */}
          {replyTo && (
            <div
              className={`flex mb-2 rounded-xl overflow-hidden border-l-2 ${
                isOwn ? "border-white/50 bg-white/10" : "border-primary/50 bg-primary/5"
              }`}
            >
              <div className="px-3 py-1.5">
                <p className={`text-[10px] font-semibold mb-0.5 ${isOwn ? "text-white/80" : "text-primary"}`}>
                  {replyQuoteSender}
                </p>
                <p className={`text-xs leading-snug ${isOwn ? "text-white/70" : "text-muted-foreground"}`}>
                  {replyQuoteText}
                </p>
              </div>
            </div>
          )}

          {/* ── Media + text ── */}
          {hasMedia ? (
            <MediaMessage message={message} isOwn={isOwn} />
          ) : hasText ? (
            <p className="break-words whitespace-pre-wrap min-w-0 w-full">
              {renderTextWithLinks(message.text)}
            </p>
          ) : null}
        </div>

        {/* ── Reactions row ── */}
        {reactionSummary.length > 0 && (
          <div className={`flex flex-wrap gap-1 px-1 ${isOwn ? "justify-end" : "justify-start"}`}>
            {reactionSummary.map(({ emoji, count, isMine }) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full border transition-colors
                  ${isMine
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-muted border-border text-muted-foreground hover:bg-muted/80"
                  }`}
              >
                <span>{emoji}</span>
                {count > 1 && <span className="font-medium">{count}</span>}
              </button>
            ))}
          </div>
        )}

        {/* ── Timestamp + Seen ── */}
        <div className={`flex items-center gap-1.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-[10px] text-muted-foreground">{formatTime(message.sentAt)}</span>
          {isOwn && showSeen && (
            <span className="text-[10px] text-primary font-medium">
              Seen{seenByName ? ` by ${seenByName}` : ""}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons — reply + emoji */}
      <div className={`flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mb-1 relative
        ${isOwn ? "order-last" : ""}`}
      >
        {/* Emoji picker trigger */}
        <div className="relative">
          <button
            onClick={() => setShowPicker((v) => !v)}
            title="React"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 13s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
          </button>
          {showPicker && (
            <EmojiPicker
              onSelect={handleReaction}
              onClose={() => setShowPicker(false)}
            />
          )}
        </div>

        {/* Reply button */}
        <button
          onClick={handleReply}
          title="Reply"
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l4 4v5"/>
            <path d="M16 17l-4 4-4-4"/>
            <path d="M12 12v9"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MessageBubble;
