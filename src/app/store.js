import { configureStore } from "@reduxjs/toolkit";

// Slices will be imported and added here as we build each feature.
// Phase 2: authSlice
// Phase 4: chatSlice
// Phase 6: presenceSlice

export const store = configureStore({
  reducer: {
    // auth: authReducer,   // added in Phase 2
    // chat: chatReducer,   // added in Phase 4
    // presence: presenceReducer, // added in Phase 6
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Needed because Firebase Timestamps are non-serializable.
      // We'll configure ignoredActions/paths as needed per slice.
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
        ignoredPaths: [],
      },
    }),
});

export default store;
