import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { sendMessage } from "../../firebase/chatService";

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const sendMessageAsync = createAsyncThunk(
  "chat/sendMessage",
  async (
    { conversationId, senderId, text, mediaURL, mediaType, fileName, fileSize, replyTo },
    { getState, dispatch, rejectWithValue }
  ) => {
    try {
      await sendMessage(conversationId, {
        senderId,
        text: text ?? "",
        mediaURL: mediaURL ?? null,
        mediaType: mediaType ?? null,
        fileName: fileName ?? null,
        fileSize: fileSize ?? null,
        replyTo: replyTo ?? null,
      });
      // Clear reply-to after successful send
      dispatch(clearReplyingTo());
    } catch (err) {
      console.error("[chatSlice] sendMessage failed:", err);
      return rejectWithValue(err.message);
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────
const chatSlice = createSlice({
  name: "chat",
  initialState: {
    conversations: [],
    conversationsLoading: true,

    activeConversationId: null,

    messages: [],
    messagesLoading: false,

    // Cached user data for conversation participants
    userCache: {},

    // Phase 7: message being replied to
    // { messageId, text, senderId, senderName } | null
    replyingTo: null,

    error: null,
  },
  reducers: {
    setConversations(state, action) {
      state.conversations = action.payload;
      state.conversationsLoading = false;
    },

    setActiveConversation(state, action) {
      state.activeConversationId = action.payload;
      state.messages = [];
      state.messagesLoading = true;
      state.replyingTo = null; // clear reply when switching conversations
    },

    setMessages(state, action) {
      state.messages = action.payload;
      state.messagesLoading = false;
    },

    cacheUser(state, action) {
      const user = action.payload;
      state.userCache[user.uid] = user;
    },

    // Phase 7: set the message being replied to
    setReplyingTo(state, action) {
      state.replyingTo = action.payload; // { messageId, text, senderId, senderName }
    },

    clearReplyingTo(state) {
      state.replyingTo = null;
    },

    clearChat(state) {
      state.conversations = [];
      state.activeConversationId = null;
      state.messages = [];
      state.conversationsLoading = true;
      state.userCache = {};
      state.replyingTo = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(sendMessageAsync.rejected, (state, action) => {
      state.error = action.payload;
    });
  },
});

export const {
  setConversations,
  setActiveConversation,
  setMessages,
  cacheUser,
  setReplyingTo,
  clearReplyingTo,
  clearChat,
} = chatSlice.actions;

export default chatSlice.reducer;

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectConversations = (state) => state.chat.conversations;
export const selectConversationsLoading = (state) => state.chat.conversationsLoading;
export const selectActiveConversationId = (state) => state.chat.activeConversationId;
export const selectActiveConversation = (state) =>
  state.chat.conversations.find((c) => c.id === state.chat.activeConversationId) ?? null;
export const selectMessages = (state) => state.chat.messages;
export const selectMessagesLoading = (state) => state.chat.messagesLoading;
export const selectUserCache = (state) => state.chat.userCache;
export const selectReplyingTo = (state) => state.chat.replyingTo;

// Media messages only (for gallery)
export const selectMediaMessages = (state) =>
  state.chat.messages.filter((m) => m.mediaURL);
