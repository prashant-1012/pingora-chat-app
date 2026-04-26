// MessageBubble — a single chat message bubble.

const formatTime = (isoString) => {
  if (!isoString) return "";
  return new Date(isoString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const MessageBubble = ({ message, isOwn, senderName }) => {
  return (
    <div className={`flex items-end gap-2 group ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar — only for received messages */}
      {!isOwn && (
        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mb-0.5">
          <span className="text-[10px] font-semibold text-muted-foreground">
            {senderName?.[0]?.toUpperCase() ?? "?"}
          </span>
        </div>
      )}

      <div className={`flex flex-col gap-0.5 max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
        {/* Sender name — only for received messages */}
        {!isOwn && senderName && (
          <span className="text-[10px] text-muted-foreground px-1">{senderName}</span>
        )}

        {/* Bubble */}
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words
            ${isOwn
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted text-foreground rounded-bl-sm"
            }`}
        >
          {message.text}
        </div>

        {/* Timestamp — shown on hover */}
        <span className="text-[10px] text-muted-foreground px-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {formatTime(message.sentAt)}
        </span>
      </div>
    </div>
  );
};

export default MessageBubble;
