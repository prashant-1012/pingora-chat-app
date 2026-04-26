// ChatPage — the full two-panel chat application layout.
// Phase 4: 1-on-1 messaging with real-time Firestore subscriptions.

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectActiveConversationId,
  selectActiveConversation,
  selectUserCache,
  setActiveConversation,
} from "../features/chat/chatSlice";
import { selectCurrentUser } from "../features/auth/authSlice";
import useConversations from "../hooks/useConversations";
import useMessages from "../hooks/useMessages";
import Sidebar from "../components/chat/Sidebar";
import MessagePanel from "../components/chat/MessagePanel";
import EmptyState from "../components/chat/EmptyState";
import UserSearchModal from "../components/chat/UserSearchModal";

const ChatPage = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const activeConversationId = useSelector(selectActiveConversationId);
  const activeConversation = useSelector(selectActiveConversation);
  const userCache = useSelector(selectUserCache);

  const [showNewChatModal, setShowNewChatModal] = useState(false);
  // Mobile: show sidebar ("sidebar") or messages ("messages")
  const [mobileView, setMobileView] = useState("sidebar");

  // Subscribe to conversations and messages (real-time Firestore)
  useConversations(currentUser?.uid);
  useMessages(activeConversationId);

  const handleSelectConversation = (id) => {
    dispatch(setActiveConversation(id));
    setMobileView("messages");
  };

  // The "other" user in a direct conversation (for MessagePanel header)
  const otherUid = activeConversation?.type === "direct"
    ? activeConversation.members?.find((uid) => uid !== currentUser?.uid)
    : null;
  const otherUser = otherUid ? userCache[otherUid] : null;

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* ── Sidebar ─────────────────────────────── */}
      <div
        className={`
          w-full md:w-80 lg:w-[320px] shrink-0 flex flex-col
          ${mobileView === "messages" ? "hidden md:flex" : "flex"}
        `}
      >
        <Sidebar onSelectConversation={handleSelectConversation} />
      </div>

      {/* ── Message panel ────────────────────────── */}
      <div
        className={`
          flex-1 flex flex-col min-w-0
          ${mobileView === "sidebar" ? "hidden md:flex" : "flex"}
        `}
      >
        {/* Mobile back button */}
        {mobileView === "messages" && (
          <div className="flex md:hidden items-center gap-2 px-4 py-3 border-b border-border bg-card">
            <button
              onClick={() => setMobileView("sidebar")}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </button>
          </div>
        )}

        {activeConversationId ? (
          <MessagePanel otherUser={otherUser} />
        ) : (
          <EmptyState onNewChat={() => setShowNewChatModal(true)} />
        )}
      </div>

      {/* New chat modal (triggered from EmptyState) */}
      {showNewChatModal && (
        <UserSearchModal onClose={() => setShowNewChatModal(false)} />
      )}
    </div>
  );
};

export default ChatPage;
