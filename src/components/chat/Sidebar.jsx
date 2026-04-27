// Sidebar — left panel with conversation list, user search, and sign-out.

import { useState, useEffect, useRef } from "react";
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
import { useTheme } from "../../contexts/ThemeContext";
import ConversationItem from "./ConversationItem";
import UserSearchModal from "./UserSearchModal";
import CreateGroupModal from "./CreateGroupModal";

// ── Sun icon ──────────────────────────────────────────────────────────────────
const SunIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
  </svg>
);

// ── Moon icon ─────────────────────────────────────────────────────────────────
const MoonIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const Sidebar = ({ onSelectConversation }) => {
  const dispatch = useDispatch();
  const { toggle: toggleTheme, isDark } = useTheme();
  const currentUser = useSelector(selectCurrentUser);
  const conversations = useSelector(selectConversations);
  const conversationsLoading = useSelector(selectConversationsLoading);
  const activeConversationId = useSelector(selectActiveConversationId);

  const [showDmModal, setShowDmModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch + cache user profiles for all conversation participants
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

  const myInitials = currentUser?.displayName
    ?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

  return (
    <>
      <aside className="flex flex-col h-full w-full border-r border-border bg-card">
        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border bg-card">
          {/* Brand */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shrink-0 shadow-md shadow-primary/30">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight text-gradient">PINGORA</span>
          </div>

          {/* New chat dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              id="new-chat-btn"
              onClick={() => setShowDropdown((v) => !v)}
              title="New conversation"
              className={`p-2 rounded-xl transition-all ${
                showDropdown
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-2xl shadow-2xl shadow-black/10 z-20 py-1.5 overflow-hidden">
                <button
                  id="new-dm-btn"
                  onClick={() => { setShowDropdown(false); setShowDmModal(true); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <span className="font-medium">New message</span>
                </button>
                <button
                  id="new-group-btn"
                  onClick={() => { setShowDropdown(false); setShowGroupModal(true); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-violet-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <span className="font-medium">New group</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Search hint ── */}
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-xl text-muted-foreground text-xs">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <span>Press + to search people</span>
          </div>
        </div>

        {/* ── Conversations list ── */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {conversationsLoading ? (
            <div className="space-y-1 px-1 pt-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-xl animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-muted rounded-full w-3/4" />
                    <div className="h-2.5 bg-muted rounded-full w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-foreground">No conversations yet</p>
              <p className="text-xs text-muted-foreground mt-1">Start by messaging someone</p>
              <button
                onClick={() => setShowDmModal(true)}
                className="mt-3 text-xs font-semibold text-primary hover:underline underline-offset-4"
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

        {/* ── Footer ── */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-t border-border bg-card">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-xs font-bold text-white">{myInitials}</span>
          </div>

          {/* Name + email */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate leading-tight">{currentUser?.displayName}</p>
            <p className="text-[10px] text-muted-foreground truncate">{currentUser?.email}</p>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Sign out */}
          <button
            id="sidebar-logout-btn"
            onClick={handleSignOut}
            disabled={signingOut}
            title="Sign out"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>
      </aside>

      {showDmModal && <UserSearchModal onClose={() => setShowDmModal(false)} />}
      {showGroupModal && <CreateGroupModal onClose={() => setShowGroupModal(false)} />}
    </>
  );
};

export default Sidebar;
