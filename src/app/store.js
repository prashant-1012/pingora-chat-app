import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import chatReducer from "../features/chat/chatSlice";
import presenceReducer from "../features/presence/presenceSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,        // Phase 4
    presence: presenceReducer, // Phase 6
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // All Firestore data is serialized (Timestamps → ISO strings)
        // before being dispatched to Redux, so no serialization issues.
        ignoredActions: ["persist/PERSIST"],
      },
    }),
});

export default store;
