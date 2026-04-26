// MessageBubble — a single chat message bubble.
// Phase 7: reply quotes, inline media, URL links, hover reply action.

import { useDispatch, useSelector } from "react-redux";
import { setReplyingTo } from "../../features/chat/chatSlice";
import { selectUserCache } from "../../features/chat/chatSlice";
import MediaMessage, { renderTextWithLinks } from "./MediaMessage";

const formatTime = (isoString) => {
  if (!isoString) return "";
  return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const MessageBubble = ({ message, isOwn, senderName }) => {
  const dispatch = useDispatch();
  const userCache = useSelector(selectUserCache);

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

  return (
    <div className={`flex items-end gap-2 group ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar — received messages only */}
      {!isOwn && (
        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mb-0.5">
          <span className="text-[10px] font-semibold text-muted-foreground">
            {senderName?.[0]?.toUpperCase() ?? "?"}
          </span>
        </div>
      )}

      {/* Bubble content column */}
      <div className={`flex flex-col gap-0.5 max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
        {/* Sender name (group received) */}
        {!isOwn && senderName && (
          <span className="text-[10px] text-muted-foreground px-1">{senderName}</span>
        )}

        {/* Bubble */}
        <div
          className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed
            ${isOwn
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted text-foreground rounded-bl-sm"
            }
            ${hasMedia && !hasText ? "p-0 overflow-hidden" : ""}
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
            <p className="break-words whitespace-pre-wrap">
              {renderTextWithLinks(message.text)}
            </p>
          ) : null}
        </div>

        {/* Timestamp — shown on hover */}
        <span className="text-[10px] text-muted-foreground px-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {formatTime(message.sentAt)}
        </span>
      </div>

      {/* Reply button — shown on hover */}
      <button
        onClick={handleReply}
        title="Reply"
        className={`p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors opacity-0 group-hover:opacity-100 shrink-0 mb-1
          ${isOwn ? "order-first" : ""}`}
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l4 4v5"/>
          <path d="M16 17l-4 4-4-4"/>
          <path d="M12 12v9"/>
        </svg>
      </button>
    </div>
  );
};

export default MessageBubble;
