// CreateGroupModal — two-step modal: name your group, then add members by email.

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { setActiveConversation } from "../../features/chat/chatSlice";
import { createGroupConversation } from "../../firebase/chatService";
import { searchUserByEmail } from "../../firebase/userService";

const initials = (name) =>
  name?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

const CreateGroupModal = ({ onClose }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);

  const [step, setStep] = useState(1);
  const [groupName, setGroupName] = useState("");
  const [nameError, setNameError] = useState(null);

  const [searchEmail, setSearchEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [members, setMembers] = useState([]);

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const handleNextStep = () => {
    if (groupName.trim().length < 2) {
      setNameError("Group name must be at least 2 characters.");
      return;
    }
    setNameError(null);
    setStep(2);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchError(null);
    setSearchResult(null);
    const email = searchEmail.trim().toLowerCase();
    if (!email) return;
    if (email === currentUser.email.toLowerCase()) {
      setSearchError("That's you! Search for other users.");
      return;
    }
    if (members.some((m) => m.email.toLowerCase() === email)) {
      setSearchError("This user is already added.");
      return;
    }
    setSearching(true);
    try {
      const user = await searchUserByEmail(email, currentUser.uid);
      if (!user) setSearchError("No user found with that email.");
      else setSearchResult(user);
    } catch (err) {
      console.error("[CreateGroupModal] search failed:", err);
      setSearchError("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = () => {
    if (!searchResult) return;
    setMembers((prev) => [...prev, searchResult]);
    setSearchResult(null);
    setSearchEmail("");
    setSearchError(null);
  };

  const handleRemoveMember = (uid) =>
    setMembers((prev) => prev.filter((m) => m.uid !== uid));

  const handleCreate = async () => {
    if (members.length === 0) {
      setCreateError("Add at least one member to create a group.");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const memberUids = [currentUser.uid, ...members.map((m) => m.uid)];
      const id = await createGroupConversation({
        groupName: groupName.trim(),
        memberUids,
        adminId: currentUser.uid,
      });
      dispatch(setActiveConversation(id));
      onClose();
    } catch (err) {
      console.error("[CreateGroupModal] create failed:", err);
      setCreateError("Failed to create group. Please try again.");
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-0">
          <div>
            <h2 className="text-lg font-semibold text-foreground">New group</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {step === 1 ? "Step 1 of 2 — Name your group" : "Step 2 of 2 — Add members"}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Step bar */}
        <div className="flex gap-2 px-6 mt-4 mb-5">
          {[1, 2].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* ── Step 1: Group name ── */}
          {step === 1 && (
            <>
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/15 border-2 border-primary/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {groupName.trim() ? groupName.trim()[0].toUpperCase() : "#"}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="group-name-input" className="text-sm font-medium text-foreground">Group name</label>
                <input
                  id="group-name-input"
                  type="text"
                  value={groupName}
                  onChange={(e) => { setGroupName(e.target.value); setNameError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleNextStep()}
                  placeholder="e.g. Team Alpha, Weekend Crew…"
                  autoFocus
                  maxLength={50}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
                {nameError && <p className="text-xs text-destructive">{nameError}</p>}
              </div>
              <button onClick={handleNextStep} disabled={!groupName.trim()} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                Next →
              </button>
            </>
          )}

          {/* ── Step 2: Add members ── */}
          {step === 2 && (
            <>
              {/* Email search */}
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  id="member-search-email"
                  type="email"
                  value={searchEmail}
                  onChange={(e) => { setSearchEmail(e.target.value); setSearchError(null); setSearchResult(null); }}
                  placeholder="Search by email…"
                  autoFocus
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
                <button type="submit" disabled={searching || !searchEmail.trim()} className="px-4 py-2.5 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-muted/70 disabled:opacity-50 transition-all">
                  {searching ? <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg> : "Find"}
                </button>
              </form>
              {searchError && <p className="text-xs text-destructive">{searchError}</p>}

              {/* Search result */}
              {searchResult && (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background/50">
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-primary">{initials(searchResult.displayName)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{searchResult.displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{searchResult.email}</p>
                  </div>
                  <button onClick={handleAddMember} className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all shrink-0">Add</button>
                </div>
              )}

              {/* Added members */}
              {members.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Members ({members.length})</p>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {members.map((m) => (
                      <div key={m.uid} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-muted/40">
                        <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-primary">{initials(m.displayName)}</span>
                        </div>
                        <p className="flex-1 text-sm text-foreground truncate">{m.displayName}</p>
                        <button onClick={() => handleRemoveMember(m.uid)} className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors shrink-0">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {createError && <p className="text-xs text-destructive">{createError}</p>}

              <div className="flex gap-2 pt-1">
                <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-all">← Back</button>
                <button
                  id="create-group-btn"
                  onClick={handleCreate}
                  disabled={creating || members.length === 0}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {creating ? <><svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Creating…</> : `Create (${members.length + 1})`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
