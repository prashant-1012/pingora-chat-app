// Temporary Firebase connection verification — remove after Phase 2 auth is working.
// This just confirms the Firebase app initializes without throwing.

import { useEffect, useState } from "react";
import { auth } from "../firebase/config";

const FirebaseCheck = () => {
  const [status, setStatus] = useState("checking...");

  useEffect(() => {
    // onAuthStateChanged fires immediately — if Firebase config is wrong
    // it will throw during auth initialization, not here.
    // A successful call means app + auth initialized correctly.
    const unsubscribe = auth.onAuthStateChanged(
      () => setStatus("✅ Firebase connected — auth initialized"),
      (err) => setStatus(`❌ Firebase error: ${err.message}`)
    );
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">PINGORA</h1>
        <p className="text-muted-foreground text-sm">{status}</p>
        <p className="text-xs text-muted-foreground">
          Project ID: {import.meta.env.VITE_FIREBASE_PROJECT_ID}
        </p>
      </div>
    </div>
  );
};

export default FirebaseCheck;
