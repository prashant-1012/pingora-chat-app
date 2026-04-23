# PINGORA — Environment Variables

> Copy `.env.example` to `.env` and fill in values from the Firebase Console.
> **Never commit `.env` to version control.**

## Firebase Client SDK (Required — All Phases)

| Variable | Description | Where to find |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase project API key | Firebase Console → Project Settings → General |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain (e.g. `yourapp.firebaseapp.com`) | Firebase Console → Project Settings → General |
| `VITE_FIREBASE_PROJECT_ID` | Firestore project ID | Firebase Console → Project Settings → General |
| `VITE_FIREBASE_STORAGE_BUCKET` | Cloud Storage bucket (e.g. `yourapp.appspot.com`) | Firebase Console → Storage |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID | Firebase Console → Project Settings → Cloud Messaging |
| `VITE_FIREBASE_APP_ID` | Firebase App ID | Firebase Console → Project Settings → General |
| `VITE_FIREBASE_MEASUREMENT_ID` | Google Analytics measurement ID (optional) | Firebase Console → Project Settings → General |

## FCM — Web Push (Phase 8)

| Variable | Description | Where to find |
|---|---|---|
| `VITE_FIREBASE_VAPID_KEY` | VAPID public key for web push | Firebase Console → Project Settings → Cloud Messaging → Web Push certificates |

## Notes
- All variables are prefixed with `VITE_` — this is required by Vite to expose them to the browser bundle.
- Firebase client-side config is **not secret** — security is enforced by Firestore/Storage rules.
- For Vercel deployment: add all variables under Project → Settings → Environment Variables.
