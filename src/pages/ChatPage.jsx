// ChatPage — the full two-panel chat application layout.
// Phase 4: 1-on-1 messaging. Phase 5: Group chat. Phase 6: Presence.

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectActiveConversationId,
  selectActiveConversation,
  selectConversations,
  selectUserCache,
  setActiveConversation,
  cacheUser,
  clearChat,
} from "../features/chat/chatSlice";
import { setUserStatus } from "../features/presence/presenceSlice";
import { selectCurrentUser } from "../features/auth/authSlice";
import useConversations from "../hooks/useConversations";
import useMessages from "../hooks/useMessages";
import usePresence from "../hooks/usePresence";
import { getUsersByUids } from "../firebase/userService";
import { subscribeToUserStatus } from "../firebase/presenceService";
import Sidebar from "../components/chat/Sidebar";
import MessagePanel from "../components/chat/MessagePanel";
import EmptyState from "../components/chat/EmptyState";
import UserSearchModal from "../components/chat/UserSearchModal";
import GroupInfoPanel from "../components/chat/GroupInfoPanel";

const ChatPage = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const activeConversationId = useSelector(selectActiveConversationId);
  const activeConversation = useSelector(selectActiveConversation);
  const conversations = useSelector(selectConversations);
  const userCache = useSelector(selectUserCache);

  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [mobileView, setMobileView] = useState("sidebar");

  // ── Phase 6: Initialize current user's presence ────────────────────────────
  usePresence(currentUser?.uid);

  // ── Phase 4/5: Real-time conversations + messages ─────────────────────────
  useConversations(currentUser?.uid);
  useMessages(activeConversationId);

  // ── Phase 5: Fetch group members into cache when entering a group ─────────
  useEffect(() => {
    if (!activeConversation || activeConversation.type !== "group") return;
    const uncachedUids = (activeConversation.members ?? []).filter(
      (uid) => uid !== currentUser?.uid && !userCache[uid]
    );
    if (uncachedUids.length === 0) return;
    getUsersByUids(uncachedUids).then((users) => {
      users.forEach((u) => dispatch(cacheUser(u)));
    });
  }, [activeConversationId]); // eslint-disable-line

  // ── Phase 6: Subscribe to online status of all sidebar conversation partners
  useEffect(() => {
    if (!conversations.length) return;

    // Collect unique UIDs from all DM conversations (not current user)
    const dmUids = new Set();
    conversations.forEach((conv) => {
      if (conv.type === "direct") {
        conv.members?.forEach((uid) => {
          if (uid !== currentUser?.uid) dmUids.add(uid);
        });
      }
    });

    const unsubscribers = Array.from(dmUids).map((uid) =>
      subscribeToUserStatus(uid, ({ isOnline, lastSeen }) => {
        dispatch(setUserStatus({ uid, isOnline, lastSeen }));
      })
    );

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [conversations, currentUser?.uid, dispatch]);

  // Close group info when switching conversations
  useEffect(() => {
    setShowGroupInfo(false);
  }, [activeConversationId]);

  const handleSelectConversation = (id) => {
    dispatch(setActiveConversation(id));
    setMobileView("messages");
  };

  const handleLeaveGroup = () => {
    dispatch(clearChat());
    setShowGroupInfo(false);
    setMobileView("sidebar");
  };

  const otherUid =
    activeConversation?.type === "direct"
      ? activeConversation.members?.find((uid) => uid !== currentUser?.uid)
      : null;
  const otherUser = otherUid ? userCache[otherUid] : null;

  return (
    <div className="h-screen h-dvh flex overflow-hidden bg-background">
      {/* ── Sidebar ─────────────────────────────── */}
      <div
        className={`
          w-full md:w-80 lg:w-[320px] shrink-0 flex flex-col overflow-hidden
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
        {activeConversationId ? (
          <MessagePanel
            otherUser={otherUser}
            onShowGroupInfo={() => setShowGroupInfo(true)}
            onBack={mobileView === "messages" ? () => setMobileView("sidebar") : undefined}
          />
        ) : (
          <EmptyState onNewChat={() => setShowNewChatModal(true)} />
        )}
      </div>

      {/* ── Modals ──────────────────────────────── */}
      {showNewChatModal && (
        <UserSearchModal onClose={() => setShowNewChatModal(false)} />
      )}
      {showGroupInfo && activeConversation?.type === "group" && (
        <GroupInfoPanel
          conversation={activeConversation}
          onClose={() => setShowGroupInfo(false)}
          onLeave={handleLeaveGroup}
        />
      )}
    </div>
  );
};

export default ChatPage;
