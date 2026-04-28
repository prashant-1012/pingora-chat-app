// MessageInput — text input bar at the bottom of the message panel.
// Phase 6: typing indicators.
// Phase 7: file attachment + paste handler — DISABLED until CORS is fixed.

import { useState, useRef, useEffect } from "react";
import { setTypingStatus } from "../../firebase/presenceService";
// import { MAX_FILE_MB } from "../../firebase/storageService"; // Phase 7 — re-enable with media

const TYPING_TIMEOUT_MS = 2500;

const MessageInput = ({ onSend, /* onFileSelect, */ disabled, conversationId, uid }) => {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);
  // const fileInputRef = useRef(null); // Phase 7
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  // Clear typing on unmount or conversation change
  useEffect(() => {
    return () => {
      clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current && conversationId && uid) {
        setTypingStatus(conversationId, uid, false);
        isTypingRef.current = false;
      }
    };
  }, [conversationId, uid]);

  const signalTyping = () => {
    if (!conversationId || !uid) return;
    if (!isTypingRef.current) {
      setTypingStatus(conversationId, uid, true);
      isTypingRef.current = true;
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus(conversationId, uid, false);
      isTypingRef.current = false;
    }, TYPING_TIMEOUT_MS);
  };

  const clearTyping = () => {
    clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current && conversationId && uid) {
      setTypingStatus(conversationId, uid, false);
      isTypingRef.current = false;
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    clearTyping();
    onSend(trimmed);
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e) => {
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
    setText(ta.value);
    if (ta.value.trim()) signalTyping();
    else clearTyping();
  };

  // Phase 7 — paste-to-attach disabled until CORS is resolved
  // const handlePaste = (e) => {
  //   const items = Array.from(e.clipboardData?.items ?? []);
  //   const fileItem = items.find((item) => item.kind === "file");
  //   if (fileItem) {
  //     e.preventDefault();
  //     const file = fileItem.getAsFile();
  //     if (file && onFileSelect) onFileSelect(file);
  //   }
  // };

  // Phase 7 — file input handler disabled until CORS is resolved
  // const handleFileChange = (e) => {
  //   const file = e.target.files?.[0];
  //   if (file && onFileSelect) onFileSelect(file);
  //   e.target.value = "";
  // };

  return (
    <div className="flex items-end gap-2 px-4 py-3 border-t border-border bg-card">
      {/* Phase 7 — attach button + file input removed until CORS is fixed */}

      {/* Textarea */}
      <textarea
        id="message-input"
        ref={textareaRef}
        rows={1}
        value={text}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        // onPaste={handlePaste} // Phase 7
        disabled={disabled}
        placeholder="Type a message… (Enter to send)"
        className="flex-1 resize-none overflow-y-auto bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50 leading-relaxed"
        style={{ maxHeight: "120px" }}
      />

      {/* Send button */}
      <button
        id="send-message-btn"
        onClick={handleSend}
        disabled={!text.trim() || disabled}
        className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
        title="Send (Enter)"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 19-7z" />
        </svg>
      </button>
    </div>
  );
};

export default MessageInput;
