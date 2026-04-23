# PINGORA — Architecture

## System Overview

PINGORA is a real-time chat application built on Firebase backend services with a React/Vite frontend.

```
┌─────────────────────────────────────────┐
│              Client (Browser)           │
│  React + Vite + Redux Toolkit           │
│  Tailwind CSS + shadcn/ui               │
│  React Router v6                        │
└────────────────┬────────────────────────┘
                 │ HTTPS + WebSocket
┌────────────────▼────────────────────────┐
│           Firebase Services             │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │  Auth       │  │  Firestore       │  │
│  │  (JWT)      │  │  (real-time DB)  │  │
│  └─────────────┘  └──────────────────┘  │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │  Storage    │  │  FCM             │  │
│  │  (files)    │  │  (push notifs)   │  │
│  └─────────────┘  └──────────────────┘  │
└─────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│         Deployment                      │
│  Frontend: Vercel                       │
│  Backend: Firebase (managed)            │
└─────────────────────────────────────────┘
```

## Folder Structure

```
src/
├── app/
│   └── store.js              # Redux store config
├── features/
│   ├── auth/
│   │   └── authSlice.js      # Auth state (user, loading, error)
│   ├── chat/
│   │   └── chatSlice.js      # Conversations + messages state
│   └── presence/
│       └── presenceSlice.js  # Online status, typing indicators
├── firebase/
│   ├── config.js             # Firebase app init, service exports
│   ├── authService.js        # Auth CRUD wrappers
│   ├── chatService.js        # Firestore chat operations
│   └── storageService.js     # File upload/download
├── components/
│   └── ui/                   # Shared UI (shadcn + custom)
├── hooks/                    # Custom React hooks
├── lib/
│   └── utils.js              # cn() Tailwind merge utility
├── pages/
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   └── ChatPage.jsx
└── main.jsx                  # App entry point
docs/                         # Living documentation
```

## Firestore Data Model

### `users` collection
```
users/{uid}                     ← doc ID = Firebase Auth UID
  uid: string                   ← same as doc ID (for convenience)
  displayName: string
  email: string
  photoURL: string | null       ← null until user uploads avatar (Phase 7)
  createdAt: timestamp
  lastSeen: timestamp           ← updated by presence system (Phase 6)
  isOnline: boolean             ← updated by presence system (Phase 6)
  fcmToken: string | null       ← updated on notification setup (Phase 8)
```

### `conversations` collection
```
conversations/{conversationId}

  For DIRECT conversations:
    conversationId = [uid1, uid2].sort().join("_")  ← deterministic, no duplicates
    type: "direct"
    members: string[]           ← [uid1, uid2]
    createdAt: timestamp
    lastMessage: {
      text: string              ← message preview for sidebar
      senderId: string
      sentAt: timestamp
    } | null

  For GROUP conversations:
    conversationId = auto-generated Firestore ID
    type: "group"
    groupName: string
    groupPhotoURL: string | null
    members: string[]           ← all member UIDs including admin
    adminId: string             ← creator's UID
    createdAt: timestamp
    lastMessage: { ... } | null
```

### `conversations/{id}/messages` sub-collection
```
messages/{messageId}            ← auto-generated Firestore ID
  senderId: string              ← UID of the sender
  text: string                  ← message content (empty string if media-only)
  mediaURL: string | null       ← Firebase Storage download URL (Phase 7)
  mediaType: "image"|"file"|null
  sentAt: timestamp
  readBy: string[]              ← UIDs of users who have read this message
  reactions: {                  ← Phase 7
    [emoji: string]: string[]   ← e.g. { "👍": ["uid1", "uid2"] }
  }
```

### Key Design Decisions
- **Direct conversation ID is deterministic** (`[uid1,uid2].sort().join("_")`) — no query needed to find or create it.
- **Messages are a sub-collection** (not embedded in conversation doc) — avoids the 1MB Firestore document limit and allows independent pagination.
- **lastMessage is denormalized** onto the conversation doc — sidebar previews read one doc, not sub-collections.
- **readBy is an array** on each message — simple to update with `arrayUnion`, supports multi-device.
- **members is an array** — Firestore `array-contains` query powers the "conversations for current user" subscription.

## Data Flow

1. **Auth**: Firebase Auth issues JWT → stored in Auth SDK → `onAuthStateChanged` dispatches to Redux `authSlice`
2. **Conversations**: Firestore `onSnapshot` listener → real-time updates → dispatched to `chatSlice`
3. **Messages**: Sub-collection `onSnapshot` → appended to Redux messages array → rendered in UI
4. **Presence**: Firestore heartbeat (or Realtime DB) → `presenceSlice` → UI indicators
5. **Files**: Upload to Storage → get download URL → store URL in message doc
