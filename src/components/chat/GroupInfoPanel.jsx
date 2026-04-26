// GroupInfoPanel — slide-in panel showing group members and admin controls.

import { useState } from "react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { selectUserCache } from "../../features/chat/chatSlice";
import {
  addMemberToGroup,
  removeMemberFromGroup,
  updateGroupName,
  transferAdmin,
} from "../../firebase/chatService";
import { searchUserByEmail } from "../../firebase/userService";

const initials = (name) =>
  name?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

const GroupInfoPanel = ({ conversation, onClose, onLeave }) => {
  const currentUser = useSelector(selectCurrentUser);
  const userCache = useSelector(selectUserCache);

  const isAdmin = conversation?.adminId === currentUser?.uid;
  const members = conversation?.members ?? [];

  // Rename group
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(conversation?.groupName ?? "");
  const [savingName, setSavingName] = useState(false);

  // Add member
  const [addEmail, setAddEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);
  const [addSuccess, setAddSuccess] = useState(null);

  // Remove / leave
  const [removingUid, setRemovingUid] = useState(null);
  const [leaving, setLeaving] = useState(false);

  const handleSaveName = async () => {
    if (newName.trim().length < 2) return;
    setSavingName(true);
    try {
      await updateGroupName(conversation.id, newName.trim());
      setEditingName(false);
    } catch (err) {
      console.error("[GroupInfoPanel] rename failed:", err);
    } finally {
      setSavingName(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setAddError(null);
    setAddSuccess(null);
    const email = addEmail.trim().toLowerCase();
    if (!email) return;
    setAdding(true);
    try {
      const user = await searchUserByEmail(email, currentUser.uid);
      if (!user) { setAddError("No user found."); return; }
      if (members.includes(user.uid)) { setAddError("Already a member."); return; }
      await addMemberToGroup(conversation.id, user.uid);
      setAddEmail("");
      setAddSuccess(`${user.displayName} added!`);
      setTimeout(() => setAddSuccess(null), 3000);
    } catch (err) {
      console.error("[GroupInfoPanel] add failed:", err);
      setAddError("Failed to add member.");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (uid) => {
    setRemovingUid(uid);
    try {
      await removeMemberFromGroup(conversation.id, uid);
    } catch (err) {
      console.error("[GroupInfoPanel] remove failed:", err);
    } finally {
      setRemovingUid(null);
    }
  };

  const handleLeave = async () => {
    setLeaving(true);
    try {
      // If admin leaving and there are other members, auto-promote first other member
      if (isAdmin && members.length > 1) {
        const nextAdmin = members.find((uid) => uid !== currentUser.uid);
        if (nextAdmin) await transferAdmin(conversation.id, nextAdmin);
      }
      await removeMemberFromGroup(conversation.id, currentUser.uid);
      onLeave();
    } catch (err) {
      console.error("[GroupInfoPanel] leave failed:", err);
      setLeaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border shrink-0">
          <h2 className="text-base font-semibold text-foreground">Group info</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Group avatar + name */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/15 border-2 border-primary/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {(conversation?.groupName?.[0] ?? "#").toUpperCase()}
              </span>
            </div>

            {editingName ? (
              <div className="flex gap-2 w-full">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                  autoFocus
                  className="flex-1 px-3 py-1.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                <button onClick={handleSaveName} disabled={savingName || newName.trim().length < 2} className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-all">
                  Save
                </button>
                <button onClick={() => { setEditingName(false); setNewName(conversation?.groupName ?? ""); }} className="px-2 py-1.5 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground transition-all">
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-foreground">{conversation?.groupName}</p>
                {isAdmin && (
                  <button onClick={() => setEditingName(true)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Rename group">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground">{members.length} member{members.length !== 1 ? "s" : ""}</p>
          </div>

          {/* Members list */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Members</p>
            {members.map((uid) => {
              const user = uid === currentUser.uid ? currentUser : userCache[uid];
              const displayName = user?.displayName ?? uid.slice(0, 8);
              const isThisAdmin = uid === conversation?.adminId;
              const isMe = uid === currentUser.uid;
              return (
                <div key={uid} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/40 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-primary">{initials(displayName)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-foreground truncate">{displayName}{isMe ? " (you)" : ""}</p>
                      {isThisAdmin && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium shrink-0">Admin</span>
                      )}
                    </div>
                    {user?.email && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
                  </div>
                  {/* Admin can remove non-admin others */}
                  {isAdmin && !isMe && !isThisAdmin && (
                    <button
                      onClick={() => handleRemoveMember(uid)}
                      disabled={removingUid === uid}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 disabled:opacity-50"
                      title="Remove member"
                    >
                      {removingUid === uid ? (
                        <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add member (admin only) */}
          {isAdmin && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Add member</p>
              <form onSubmit={handleAddMember} className="flex gap-2">
                <input
                  id="group-add-member-email"
                  type="email"
                  value={addEmail}
                  onChange={(e) => { setAddEmail(e.target.value); setAddError(null); setAddSuccess(null); }}
                  placeholder="user@example.com"
                  className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                <button type="submit" disabled={adding || !addEmail.trim()} className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-all">
                  {adding ? <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg> : "Add"}
                </button>
              </form>
              {addError && <p className="text-xs text-destructive">{addError}</p>}
              {addSuccess && <p className="text-xs text-emerald-600">{addSuccess}</p>}
            </div>
          )}
        </div>

        {/* Footer — leave group */}
        <div className="px-5 py-4 border-t border-border shrink-0">
          <button
            id="leave-group-btn"
            onClick={handleLeave}
            disabled={leaving}
            className="w-full py-2.5 rounded-xl border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {leaving ? (
              <><svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Leaving…</>
            ) : (
              "Leave group"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupInfoPanel;
