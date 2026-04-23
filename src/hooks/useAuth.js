import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setUser } from "../features/auth/authSlice";
import { subscribeToAuthChanges } from "../firebase/authService";

/**
 * useAuth — sets up the Firebase auth state listener.
 *
 * Must be called once at the app root (inside AuthProvider).
 * Syncs Firebase auth state to Redux on every change.
 *
 * Why here and not directly in AuthProvider?
 * Separating the subscription logic into a hook makes it independently
 * testable and keeps AuthProvider as a clean wrapper component.
 */
const useAuth = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((firebaseUser) => {
      if (firebaseUser) {
        // Serialize only the plain data we need — no Firebase User methods.
        dispatch(
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          })
        );
      } else {
        // User is signed out
        dispatch(setUser(null));
      }
    });

    // Cleanup: unsubscribe from Firebase listener on unmount.
    return () => unsubscribe();
  }, [dispatch]);
};

export default useAuth;
