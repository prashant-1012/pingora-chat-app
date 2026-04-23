import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser } from "../features/auth/authSlice";
import { logoutAsync } from "../features/auth/authSlice";

// Temporary placeholder — replaced with full chat UI in Phase 4.
const ChatPage = () => {
  const currentUser = useSelector(selectCurrentUser);
  const dispatch = useDispatch();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-2">
          <svg className="w-7 h-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground">PINGORA</h1>
        <p className="text-muted-foreground text-sm">
          ✅ Authenticated as <span className="text-foreground font-medium">{currentUser?.displayName}</span>
        </p>
        <p className="text-xs text-muted-foreground">{currentUser?.email}</p>
      </div>

      <div className="bg-card border border-border rounded-2xl px-6 py-4 text-sm text-muted-foreground text-center max-w-sm">
        <p>🔧 Chat UI coming in <strong className="text-foreground">Phase 4</strong>.</p>
        <p className="mt-1">Auth is working — you can safely close and reopen the browser.</p>
      </div>

      <button
        id="logout-btn"
        onClick={() => dispatch(logoutAsync())}
        className="px-5 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
      >
        Sign out
      </button>
    </div>
  );
};

export default ChatPage;
