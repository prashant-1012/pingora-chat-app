import { createSlice } from "@reduxjs/toolkit";

// ─── Slice ────────────────────────────────────────────────────────────────────
const presenceSlice = createSlice({
  name: "presence",
  initialState: {
    // uid → { isOnline: bool, lastSeen: ISO string | null }
    userStatuses: {},
  },
  reducers: {
    setUserStatus(state, action) {
      const { uid, isOnline, lastSeen } = action.payload;
      state.userStatuses[uid] = { isOnline, lastSeen };
    },
    clearPresence(state) {
      state.userStatuses = {};
    },
  },
});

export const { setUserStatus, clearPresence } = presenceSlice.actions;
export default presenceSlice.reducer;

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectUserStatuses = (state) => state.presence.userStatuses;
export const selectUserStatus = (uid) => (state) =>
  state.presence.userStatuses[uid] ?? { isOnline: false, lastSeen: null };
