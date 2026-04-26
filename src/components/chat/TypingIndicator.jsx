// TypingIndicator — animated "Alice is typing…" indicator shown above the input.

const TypingIndicator = ({ typingUids, userCache, currentUserUid }) => {
  // Exclude current user from display
  const others = typingUids.filter((uid) => uid !== currentUserUid);
  if (others.length === 0) return null;

  const names = others.map((uid) => userCache[uid]?.displayName ?? "Someone");
  const label =
    names.length === 1
      ? `${names[0]} is typing`
      : names.length === 2
      ? `${names[0]} and ${names[1]} are typing`
      : `${names[0]} and ${names.length - 1} others are typing`;

  return (
    <div className="flex items-center gap-2 px-5 py-1.5 border-t border-border bg-card">
      {/* Animated bouncing dots */}
      <div className="flex items-center gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 inline-block animate-bounce"
            style={{ animationDelay: `${i * 150}ms`, animationDuration: "0.9s" }}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{label}…</span>
    </div>
  );
};

export default TypingIndicator;
