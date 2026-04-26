import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { registerUser, loginUser, logoutUser } from "../../firebase/authService";

// ─── Helpers ────────────────────────────────────────────────────────────────
// Firebase User objects are not serializable (they contain methods & Timestamps).
// We extract only the plain data we need for the Redux store.
const serializeUser = (user) => ({
  uid: user.uid,
  email: user.email,
  displayName: user.displayName,
  photoURL: user.photoURL,
});

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const registerAsync = createAsyncThunk(
  "auth/register",
  async ({ email, password, displayName }, { rejectWithValue }) => {
    try {
      const user = await registerUser({ email, password, displayName });
      return serializeUser(user);
    } catch (err) {
      return rejectWithValue(getFriendlyError(err.code));
    }
  }
);

export const loginAsync = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const user = await loginUser({ email, password });
      return serializeUser(user);
    } catch (err) {
      return rejectWithValue(getFriendlyError(err.code));
    }
  }
);

export const logoutAsync = createAsyncThunk("auth/logout", async (_, { rejectWithValue }) => {
  try {
    await logoutUser();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

// ─── Friendly Error Messages ─────────────────────────────────────────────────
const getFriendlyError = (code) => {
  const map = {
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/invalid-credential": "Invalid email or password.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/configuration-not-found":
      "Firebase Auth is not configured. Enable Email/Password in Firebase Console → Authentication → Sign-in method.",
    "auth/operation-not-allowed":
      "Email/Password sign-in is disabled. Enable it in Firebase Console → Authentication → Sign-in method.",
  };
  return map[code] || `Something went wrong. (${code || "unknown"})`;
};

// ─── Slice ───────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: "auth",
  initialState: {
    currentUser: null,
    // authLoading: true means we're waiting for the first onAuthStateChanged
    // fire. We MUST block rendering until this resolves to prevent
    // flashing the login page for an already-authenticated user.
    authLoading: true,
    // actionLoading: true while a register/login/logout thunk is pending.
    actionLoading: false,
    error: null,
  },
  reducers: {
    // Called by AuthProvider via onAuthStateChanged
    setUser(state, action) {
      state.currentUser = action.payload; // null or serialized user
      state.authLoading = false;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ── Register ──
    builder
      .addCase(registerAsync.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(registerAsync.fulfilled, (state) => {
        // onAuthStateChanged will set currentUser — we just clear loading.
        state.actionLoading = false;
      })
      .addCase(registerAsync.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // ── Login ──
    builder
      .addCase(loginAsync.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // ── Logout ──
    builder
      .addCase(logoutAsync.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        state.currentUser = null;
        state.actionLoading = false;
        state.error = null;
      })
      .addCase(logoutAsync.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setUser, clearError } = authSlice.actions;
export default authSlice.reducer;

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectCurrentUser = (state) => state.auth.currentUser;
export const selectAuthLoading = (state) => state.auth.authLoading;
export const selectActionLoading = (state) => state.auth.actionLoading;
export const selectAuthError = (state) => state.auth.error;
