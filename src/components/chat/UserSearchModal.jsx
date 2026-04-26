// UserSearchModal — modal to find a user by email and start a 1-on-1 conversation.

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { setActiveConversation } from "../../features/chat/chatSlice";
import { searchUserByEmail } from "../../firebase/userService";
import { getOrCreateDirectConversation } from "../../firebase/chatService";

const UserSearchModal = ({ onClose }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);

  const [email, setEmail] = useState("");
  const [result, setResult] = useState(null); // found user
  const [searching, setSearching] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!email.trim()) return;
    if (email.trim().toLowerCase() === currentUser.email.toLowerCase()) {
      setError("That's your own email! Search for someone else.");
      return;
    }

    setSearching(true);
    try {
      const user = await searchUserByEmail(email, currentUser.uid);
      if (!user) {
        setError("No user found with that email address.");
      } else {
        setResult(user);
      }
    } catch (err) {
      console.error("[UserSearchModal] search failed:", err);
      setError("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const handleStartChat = async () => {
    if (!result) return;
    setStarting(true);
    try {
      const conversationId = await getOrCreateDirectConversation(
        currentUser.uid,
        result.uid
      );
      dispatch(setActiveConversation(conversationId));
      onClose();
    } catch (err) {
      console.error("[UserSearchModal] start chat failed:", err);
      setError("Failed to start conversation. Please try again.");
    } finally {
      setStarting(false);
    }
  };

  // Avatar initials helper
  const initials = (name) =>
    name
      ?.split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal card */}
      <div className="relative z-10 w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">New conversation</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Find someone by their email address</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            id="user-search-email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); setResult(null); }}
            placeholder="user@example.com"
            autoFocus
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
          <button
            type="submit"
            disabled={searching || !email.trim()}
            className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {searching ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              "Search"
            )}
          </button>
        </form>

        {/* Error */}
        {error && (
          <p className="text-sm text-destructive mb-3 px-1">{error}</p>
        )}

        {/* Result */}
        {result && (
          <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background/50">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-primary">
                {initials(result.displayName)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{result.displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{result.email}</p>
            </div>
            <button
              id="start-chat-btn"
              onClick={handleStartChat}
              disabled={starting}
              className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all shrink-0"
            >
              {starting ? "Starting…" : "Chat"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSearchModal;
