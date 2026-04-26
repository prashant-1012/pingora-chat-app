// ConversationItem — a single row in the sidebar conversation list.
// Phase 6: shows online status dot for direct conversation partners.

import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { selectUserCache } from "../../features/chat/chatSlice";
import { selectUserStatuses } from "../../features/presence/presenceSlice";

const initials = (name) =>
  name?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

const formatTime = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

const ConversationItem = ({ conversation, isActive, onClick }) => {
  const currentUser = useSelector(selectCurrentUser);
  const userCache = useSelector(selectUserCache);
  const userStatuses = useSelector(selectUserStatuses);

  const otherUid = conversation.type === "direct"
    ? conversation.members?.find((uid) => uid !== currentUser?.uid)
    : null;
  const otherUser = otherUid ? userCache[otherUid] : null;
  const otherStatus = otherUid ? userStatuses[otherUid] : null;
  const isOtherOnline = otherStatus?.isOnline ?? false;

  const displayName =
    conversation.type === "group"
      ? conversation.groupName
      : otherUser?.displayName ?? otherUid?.slice(0, 8) ?? "Unknown";

  const lastMessageText = conversation.lastMessage?.text ?? "No messages yet";
  const lastMessageTime = conversation.lastMessage?.sentAt
    ? formatTime(conversation.lastMessage.sentAt)
    : formatTime(conversation.createdAt);

  const avatarInitials =
    conversation.type === "group"
      ? (conversation.groupName?.[0] ?? "G").toUpperCase()
      : initials(displayName);

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left group
        ${isActive
          ? "bg-primary/15 border border-primary/20"
          : "hover:bg-muted/60 border border-transparent"
        }`}
    >
      {/* Avatar with online dot */}
      <div className="relative shrink-0">
        <div
          className={`w-10 h-10 flex items-center justify-center font-semibold text-sm
            ${conversation.type === "group" ? "rounded-xl" : "rounded-full"}
            ${isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          {avatarInitials}
        </div>
        {/* Online dot — only for direct conversations */}
        {conversation.type === "direct" && (
          <span
            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card transition-colors
              ${isOtherOnline ? "bg-emerald-500" : "bg-muted-foreground/40"}`}
          />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-1">
          <span className="text-sm font-medium text-foreground truncate">{displayName}</span>
          <span className="text-[10px] text-muted-foreground shrink-0">{lastMessageTime}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{lastMessageText}</p>
      </div>
    </button>
  );
};

export default ConversationItem;
