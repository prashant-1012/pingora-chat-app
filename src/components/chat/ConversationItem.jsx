// ConversationItem — a single row in the sidebar conversation list.

import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { selectUserCache } from "../../features/chat/chatSlice";

const initials = (name) =>
  name
    ?.split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

const formatTime = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

const ConversationItem = ({ conversation, isActive, onClick }) => {
  const currentUser = useSelector(selectCurrentUser);
  const userCache = useSelector(selectUserCache);

  // For direct chats, the "other" user's UID is whoever is not us
  const otherUid = conversation.members?.find((uid) => uid !== currentUser?.uid);
  const otherUser = userCache[otherUid];

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
      {/* Avatar */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-semibold text-sm
          ${isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
      >
        {avatarInitials}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-1">
          <span className={`text-sm font-medium truncate ${isActive ? "text-foreground" : "text-foreground"}`}>
            {displayName}
          </span>
          <span className="text-[10px] text-muted-foreground shrink-0">{lastMessageTime}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{lastMessageText}</p>
      </div>
    </button>
  );
};

export default ConversationItem;
