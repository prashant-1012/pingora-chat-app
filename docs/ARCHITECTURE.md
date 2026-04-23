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

> Populated in Phase 3. Preliminary design below.

### `users` collection
```
users/{userId}
  uid: string
  displayName: string
  email: string
  photoURL: string | null
  createdAt: timestamp
  lastSeen: timestamp
  isOnline: boolean
  fcmToken: string | null
```

### `conversations` collection
```
conversations/{conversationId}
  type: "direct" | "group"
  members: string[]          # array of user UIDs
  createdAt: timestamp
  lastMessage: {
    text: string
    senderId: string
    sentAt: timestamp
  }
  # Group only:
  groupName: string | null
  groupPhotoURL: string | null
  adminId: string | null
```

### `conversations/{id}/messages` sub-collection
```
messages/{messageId}
  senderId: string
  text: string
  mediaURL: string | null
  mediaType: "image" | "file" | null
  sentAt: timestamp
  readBy: string[]           # array of user UIDs
  reactions: {
    [emoji]: string[]        # emoji -> array of user UIDs
  }
```

## Data Flow

1. **Auth**: Firebase Auth issues JWT → stored in Auth SDK → `onAuthStateChanged` dispatches to Redux `authSlice`
2. **Conversations**: Firestore `onSnapshot` listener → real-time updates → dispatched to `chatSlice`
3. **Messages**: Sub-collection `onSnapshot` → appended to Redux messages array → rendered in UI
4. **Presence**: Firestore heartbeat (or Realtime DB) → `presenceSlice` → UI indicators
5. **Files**: Upload to Storage → get download URL → store URL in message doc
