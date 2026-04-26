// Sidebar — left panel with conversation list, user search, and sign-out.

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectConversations,
  selectConversationsLoading,
  selectActiveConversationId,
  cacheUser,
} from "../../features/chat/chatSlice";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { logoutAsync } from "../../features/auth/authSlice";
import { getUserById } from "../../firebase/userService";
import ConversationItem from "./ConversationItem";
import UserSearchModal from "./UserSearchModal";

const Sidebar = ({ onSelectConversation }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const conversations = useSelector(selectConversations);
  const conversationsLoading = useSelector(selectConversationsLoading);
  const activeConversationId = useSelector(selectActiveConversationId);

  const [showModal, setShowModal] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Fetch + cache user profiles for conversation participants
  useEffect(() => {
    const uidsToFetch = new Set();
    conversations.forEach((conv) => {
      conv.members?.forEach((uid) => {
        if (uid !== currentUser?.uid) uidsToFetch.add(uid);
      });
    });

    uidsToFetch.forEach(async (uid) => {
      try {
        const user = await getUserById(uid);
        if (user) dispatch(cacheUser(user));
      } catch (err) {
        console.error("[Sidebar] failed to fetch user:", uid, err);
      }
    });
  }, [conversations, currentUser?.uid, dispatch]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await dispatch(logoutAsync());
    setSigningOut(false);
  };

  // Avatar initials
  const myInitials = currentUser?.displayName
    ?.split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  return (
    <>
      <aside className="flex flex-col h-full w-full border-r border-border bg-card">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <span className="text-base font-bold text-foreground tracking-tight">PINGORA</span>
          </div>

          {/* New chat button */}
          <button
            id="new-chat-btn"
            onClick={() => setShowModal(true)}
            title="New conversation"
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {conversationsLoading ? (
            // Skeleton loaders
            <div className="space-y-1 px-1 pt-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 px-2 py-3 rounded-xl animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-2.5 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center px-4">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground">No conversations yet</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-2 text-xs text-primary hover:underline underline-offset-4"
              >
                Start a new chat →
              </button>
            </div>
          ) : (
            conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeConversationId}
                onClick={() => onSelectConversation(conv.id)}
              />
            ))
          )}
        </div>

        {/* Footer — current user + sign out */}
        <div className="flex items-center gap-3 px-4 py-3 border-t border-border">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-primary">{myInitials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{currentUser?.displayName}</p>
            <p className="text-[10px] text-muted-foreground truncate">{currentUser?.email}</p>
          </div>
          <button
            id="sidebar-logout-btn"
            onClick={handleSignOut}
            disabled={signingOut}
            title="Sign out"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>
      </aside>

      {showModal && <UserSearchModal onClose={() => setShowModal(false)} />}
    </>
  );
};

export default Sidebar;
