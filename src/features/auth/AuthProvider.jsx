import { useSelector } from "react-redux";
import useAuth from "../../hooks/useAuth";
import { selectAuthLoading } from "./authSlice";

/**
 * AuthProvider — sets up the Firebase auth listener and blocks the app
 * from rendering until the initial auth state is known.
 *
 * WHY block render?
 * Firebase Auth is async. On first load, we don't know if the user is
 * logged in until onAuthStateChanged fires (~200ms). Without this block,
 * the app would flash the Login page before redirecting to /chat for
 * already-authenticated users. This is a bad UX pattern.
 *
 * Wrap this around <App /> in main.jsx.
 */
const AuthProvider = ({ children }) => {
  // Sets up the Firebase auth state listener → syncs to Redux
  useAuth();

  const authLoading = useSelector(selectAuthLoading);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          {/* Spinner */}
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground font-medium tracking-wide">
            Loading PINGORA...
          </span>
        </div>
      </div>
    );
  }

  return children;
};

export default AuthProvider;
