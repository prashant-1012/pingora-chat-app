import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // chat: chatReducer,     — Phase 4
    // presence: presenceReducer, — Phase 6
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Firebase Timestamps in actions would fail the serializable check.
        // We serialize users in authSlice before storing, so no issues there.
        // We'll add specific ignoredPaths here if needed as we grow.
        ignoredActions: ["persist/PERSIST"],
      },
    }),
});

export default store;
