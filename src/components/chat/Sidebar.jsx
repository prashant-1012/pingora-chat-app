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
import { useProfilePics } from "../../contexts/ProfileContext";
import ConversationItem from "./ConversationItem";
import UserSearchModal from "./UserSearchModal";
import CreateGroupModal from "./CreateGroupModal";
import ProfileDrawer from "./ProfileDrawer";

const SunIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
  </svg>
);

const MoonIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

// ── Mobile profile side drawer ────────────────────────────────────────────────
const MobileProfileDrawer = ({ onClose, onEditProfile }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const { photoURLs } = useProfilePics();
  const { toggle: toggleTheme, isDark } = useTheme();
  const [signingOut, setSigningOut] = useState(false);

  const myInitials = currentUser?.displayName
    ?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

  const handleSignOut = async () => {
    setSigningOut(true);
    await dispatch(logoutAsync());
    setSigningOut(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex" onClick={(e) => e.target === e.currentTarget && onClose()}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer — slides in from left */}
      <div className="relative z-10 w-72 max-w-[85vw] h-full bg-card flex flex-col shadow-2xl animate-slide-in-left">
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">My Profile</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Avatar + name + email */}
        <div className="flex flex-col items-center gap-3 px-5 py-6 border-b border-border">
          <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-primary/30 shadow-md">
            {photoURLs[currentUser?.uid] ? (
              <img src={photoURLs[currentUser.uid]} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center">
                <span className="text-xl font-bold text-white">{myInitials}</span>
              </div>
            )}
          </div>
          <div className="text-center min-w-0 w-full">
            <p className="text-sm font-semibold text-foreground truncate">{currentUser?.displayName}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{currentUser?.email}</p>
          </div>
          <button
            onClick={() => { onClose(); onEditProfile(); }}
            className="w-full py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            Edit profile
          </button>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 px-3 py-4">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-foreground hover:bg-muted transition-colors text-left"
          >
            <span className="text-muted-foreground">{isDark ? <SunIcon /> : <MoonIcon />}</span>
            <span className="text-sm font-medium">{isDark ? "Light mode" : "Dark mode"}</span>
          </button>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors text-left disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            <span className="text-sm font-medium">{signingOut ? "Signing out…" : "Sign out"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Sidebar ───────────────────────────────────────────────────────────────────
const Sidebar = ({ onSelectConversation }) => {
  const dispatch = useDispatch();
  const { toggle: toggleTheme, isDark } = useTheme();
  const currentUser = useSelector(selectCurrentUser);
  const conversations = useSelector(selectConversations);
  const conversationsLoading = useSelector(selectConversationsLoading);
  const activeConversationId = useSelector(selectActiveConversationId);

  const { photoURLs } = useProfilePics();
  const [showDmModal, setShowDmModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
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

  // Press '+' to open new message search
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "+" && !e.ctrlKey && !e.metaKey && !["INPUT", "TEXTAREA"].includes(e.target.tagName)) {
        setShowDmModal(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
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

  const AvatarButton = ({ onClick, className = "", size = "w-8 h-8", textSize = "text-xs" }) => (
    <button
      onClick={onClick}
      title="My profile"
      className={`${size} rounded-full overflow-hidden shrink-0 focus:outline-none ${className}`}
    >
      {photoURLs[currentUser?.uid] ? (
        <img src={photoURLs[currentUser.uid]} alt="Profile" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center">
          <span className={`${textSize} font-bold text-white`}>{myInitials}</span>
        </div>
      )}
    </button>
  );

  return (
    <>
      <aside className="flex flex-col h-full w-full border-r border-border bg-card">
        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border bg-card">
          {/* Mobile only: profile avatar button */}
          <div className="md:hidden w-8 h-8 shrink-0 relative">
            <span className="absolute inset-0 rounded-full bg-primary/40 pointer-events-none" />
            <AvatarButton
              onClick={() => setShowMobileDrawer(true)}
              className="absolute inset-0 ring-2 ring-primary shadow-md shadow-primary/30"
            />
          </div>

          {/* Brand — icon desktop only, text always */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="hidden md:flex w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-violet-600 items-center justify-center shrink-0 shadow-md shadow-primary/30">
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
          <button
            onClick={() => setShowDmModal(true)}
            className="w-full flex items-center gap-2 px-3 py-2 bg-muted rounded-xl text-muted-foreground text-xs hover:bg-muted/80 hover:text-foreground transition-colors text-left"
          >
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <span>Press + to search people</span>
          </button>
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

        {/* ── Footer — desktop only ── */}
        <div className="hidden md:flex items-center gap-2.5 px-4 py-3 border-t border-border bg-card sticky bottom-0">
          <AvatarButton
            onClick={() => setShowProfile(true)}
            className="ring-2 ring-transparent hover:ring-primary/50 transition-all shadow-sm"
          />

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate leading-tight">{currentUser?.displayName}</p>
            <p className="text-[10px] text-muted-foreground truncate">{currentUser?.email}</p>
          </div>

          <button
            onClick={toggleTheme}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

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
      {showProfile && <ProfileDrawer onClose={() => setShowProfile(false)} />}
      {showMobileDrawer && (
        <MobileProfileDrawer
          onClose={() => setShowMobileDrawer(false)}
          onEditProfile={() => setShowProfile(true)}
        />
      )}
    </>
  );
};

export default Sidebar;
