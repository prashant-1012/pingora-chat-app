// EmptyState — shown in the message panel when no conversation is selected.

const EmptyState = ({ onNewChat }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8 bg-background">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-primary"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>

      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold text-foreground">Your messages</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Select a conversation from the sidebar, or start a new one to begin chatting.
        </p>
      </div>

      <button
        id="empty-new-chat-btn"
        onClick={onNewChat}
        className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-95 transition-all"
      >
        Start a conversation
      </button>
    </div>
  );
};

export default EmptyState;
