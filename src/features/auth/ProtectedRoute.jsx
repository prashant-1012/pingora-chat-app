import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { selectCurrentUser, selectAuthLoading } from "./authSlice";

/**
 * ProtectedRoute — guards routes that require authentication.
 *
 * Usage:
 *   <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
 *
 * Behavior:
 * - authLoading=true  → renders nothing (AuthProvider already shows spinner)
 * - currentUser=null  → redirects to /login, preserving the intended URL
 * - currentUser set   → renders children
 *
 * The `state={{ from: location }}` pattern allows LoginPage to redirect
 * back to the originally requested URL after successful login.
 */
const ProtectedRoute = ({ children }) => {
  const currentUser = useSelector(selectCurrentUser);
  const authLoading = useSelector(selectAuthLoading);
  const location = useLocation();

  if (authLoading) return null;

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
