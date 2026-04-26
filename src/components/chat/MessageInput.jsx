// MessageInput — text input bar at the bottom of the message panel.
// Phase 6: typing indicators. Phase 7: file attachment button + paste handler.

import { useState, useRef, useEffect } from "react";
import { setTypingStatus } from "../../firebase/presenceService";
import { MAX_FILE_MB } from "../../firebase/storageService";

const TYPING_TIMEOUT_MS = 2500;

const MessageInput = ({ onSend, onFileSelect, disabled, conversationId, uid }) => {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
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

  // Handle paste — if user pastes a file, treat it as an attachment
  const handlePaste = (e) => {
    const items = Array.from(e.clipboardData?.items ?? []);
    const fileItem = items.find((item) => item.kind === "file");
    if (fileItem) {
      e.preventDefault();
      const file = fileItem.getAsFile();
      if (file && onFileSelect) onFileSelect(file);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onFileSelect) onFileSelect(file);
    e.target.value = ""; // reset so same file can be selected again
  };

  return (
    <div className="flex items-end gap-2 px-4 py-3 border-t border-border bg-card">
      {/* File attachment button */}
      <button
        id="attach-file-btn"
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        title={`Attach file (max ${MAX_FILE_MB} MB)`}
        className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 transition-colors shrink-0"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
        </svg>
      </button>

      {/* Hidden file input — accepts everything */}
      <input
        ref={fileInputRef}
        type="file"
        accept="*/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Textarea */}
      <textarea
        id="message-input"
        ref={textareaRef}
        rows={1}
        value={text}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
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
