import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { sendMessage } from "../../firebase/chatService";

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const sendMessageAsync = createAsyncThunk(
  "chat/sendMessage",
  async ({ conversationId, senderId, text }, { rejectWithValue }) => {
    try {
      await sendMessage(conversationId, { senderId, text });
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
    // List of conversations the current user belongs to (serialized from Firestore)
    conversations: [],
    conversationsLoading: true,

    // The conversation currently open in the message panel
    activeConversationId: null,

    // Messages for the active conversation (serialized from Firestore)
    messages: [],
    messagesLoading: false,

    // Cached user data for conversation participants (uid → {displayName, email, photoURL})
    userCache: {},

    // Error from sendMessage
    error: null,
  },
  reducers: {
    // Called by useConversations hook (onSnapshot)
    setConversations(state, action) {
      state.conversations = action.payload;
      state.conversationsLoading = false;
    },

    // Called when user clicks a conversation in the sidebar
    setActiveConversation(state, action) {
      state.activeConversationId = action.payload;
      state.messages = [];
      state.messagesLoading = true;
    },

    // Called by useMessages hook (onSnapshot)
    setMessages(state, action) {
      state.messages = action.payload;
      state.messagesLoading = false;
    },

    // Cache a fetched user profile (to show names in conversations)
    cacheUser(state, action) {
      const user = action.payload; // { uid, displayName, email, photoURL }
      state.userCache[user.uid] = user;
    },

    clearChat(state) {
      state.conversations = [];
      state.activeConversationId = null;
      state.messages = [];
      state.conversationsLoading = true;
      state.userCache = {};
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessageAsync.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const {
  setConversations,
  setActiveConversation,
  setMessages,
  cacheUser,
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
