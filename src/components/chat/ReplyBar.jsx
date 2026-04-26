// ReplyBar — shown above MessageInput when user is replying to a message.

import { useDispatch, useSelector } from "react-redux";
import { selectReplyingTo, clearReplyingTo } from "../../features/chat/chatSlice";
import { selectUserCache } from "../../features/chat/chatSlice";

const ReplyBar = () => {
  const dispatch = useDispatch();
  const replyingTo = useSelector(selectReplyingTo);
  const userCache = useSelector(selectUserCache);

  if (!replyingTo) return null;

  const senderName = replyingTo.senderName ?? userCache[replyingTo.senderId]?.displayName ?? "Someone";
  const preview = replyingTo.text
    ? replyingTo.text.slice(0, 80) + (replyingTo.text.length > 80 ? "…" : "")
    : replyingTo.mediaType
    ? { image: "📷 Photo", video: "🎥 Video", audio: "🎵 Audio", file: "📎 File" }[replyingTo.mediaType] ?? "📎 Attachment"
    : "Message";

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-t border-border bg-card/80">
      {/* Left accent bar */}
      <div className="w-0.5 h-8 rounded-full bg-primary shrink-0" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-primary leading-none mb-0.5">{senderName}</p>
        <p className="text-xs text-muted-foreground truncate">{preview}</p>
      </div>

      {/* Close button */}
      <button
        onClick={() => dispatch(clearReplyingTo())}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
        title="Cancel reply"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default ReplyBar;
