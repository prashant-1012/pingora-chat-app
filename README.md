# Pingora — Real-Time Chat App

**Live Demo → [https://pingoralabs.vercel.app/chat](https://pingoralabs.vercel.app/chat)**

Pingora is a full-featured real-time messaging app built with React, Firebase, and Redux Toolkit. It supports 1-on-1 direct messages, group chats, presence indicators, emoji reactions, reply threads, and a fully responsive mobile UI.

---

## Features

### Messaging
- Real-time 1-on-1 direct messaging
- Group conversations with member management
- Emoji reactions on messages
- Reply to specific messages (threaded quotes)
- Typing indicators
- Read receipts (seen by name)
- URL auto-linking in messages
- Clear all messages (deletes for both sides instantly)

### Users & Profiles
- Email/password authentication (register & login)
- Editable display name
- Profile picture upload (stored in localStorage, up to 2 MB)
- Profile pictures shown alongside every chat message
- User search by email address to start a new conversation

### Presence
- Online / offline status indicator
- Last seen timestamp for offline users

### Groups
- Create group conversations with multiple members
- Add / remove members
- Transfer admin rights
- Group info panel

### UI & UX
- Light and dark theme toggle
- Fully responsive — works on mobile and desktop
- Mobile: slide-in profile drawer from the sidebar header
- Desktop: persistent footer with profile, theme toggle, and sign-out
- Keyboard shortcut: press `+` to open user search
- Smooth animations (drawer slide-in, ping ring on profile avatar)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 (Vite) |
| State management | Redux Toolkit + React-Redux |
| Routing | React Router v7 |
| Backend / Database | Firebase Firestore (real-time) |
| Authentication | Firebase Auth (Email/Password) |
| File storage | Firebase Storage |
| Styling | Tailwind CSS v3 |
| UI primitives | Radix UI |
| Icons | Lucide React |
| Deployment | Vercel |

---

## Project Structure

```
src/
├── app/
│   └── store.js                  # Redux store
├── components/chat/
│   ├── ConversationItem.jsx       # Sidebar conversation row
│   ├── CreateGroupModal.jsx       # New group dialog
│   ├── EmptyState.jsx             # No conversation selected
│   ├── GroupInfoPanel.jsx         # Group details & member management
│   ├── MediaGalleryDrawer.jsx     # Media gallery (Phase 7)
│   ├── MediaMessage.jsx           # Image / video / file render
│   ├── MessageBubble.jsx          # Single message bubble with reactions
│   ├── MessageInput.jsx           # Text input + send
│   ├── MessagePanel.jsx           # Full chat panel (header, messages, input)
│   ├── ProfileDrawer.jsx          # Edit profile name & picture
│   ├── ReplyBar.jsx               # Reply preview above input
│   ├── Sidebar.jsx                # Left panel — conversations + nav
│   ├── TypingIndicator.jsx        # "Someone is typing…"
│   └── UserSearchModal.jsx        # Search user by email
├── contexts/
│   ├── ProfileContext.jsx         # Profile picture localStorage store
│   └── ThemeContext.jsx           # Dark / light theme
├── features/
│   ├── auth/
│   │   ├── AuthProvider.jsx       # onAuthStateChanged listener
│   │   ├── ProtectedRoute.jsx     # Route guard
│   │   └── authSlice.js           # Auth Redux state
│   ├── chat/
│   │   └── chatSlice.js           # Conversations, messages, user cache
│   └── presence/
│       └── presenceSlice.js       # Online status state
├── firebase/
│   ├── authService.js             # Register, login, logout
│   ├── chatService.js             # Messages & conversations (Firestore)
│   ├── config.js                  # Firebase initialization
│   ├── presenceService.js         # Typing & online/offline tracking
│   ├── storageService.js          # File uploads
│   └── userService.js             # User profile reads & updates
├── hooks/
│   ├── useAuth.js                 # Auth state hook
│   ├── useConversations.js        # Real-time conversation listener
│   ├── useMessages.js             # Real-time message listener
│   ├── usePresence.js             # Presence initialization
│   └── useUserStatus.js           # Per-user online status
└── pages/
    ├── ChatPage.jsx               # Main layout (sidebar + message panel)
    ├── LoginPage.jsx              # Login form
    └── RegisterPage.jsx           # Registration form
```

---

## Firestore Data Model

```
/conversations
  /{conversationId}
    - type: "direct" | "group"
    - members: [uid, ...]
    - groupName, groupPhotoURL, adminId   (groups only)
    - lastMessage: { text, senderId, sentAt }
    - createdAt, updatedAt
    /messages
      /{messageId}
        - senderId
        - text
        - mediaURL, mediaType, fileName, fileSize
        - sentAt
        - readBy: [uid, ...]
        - reactions: { "👍": [uid, ...], ... }
        - replyTo: { messageId, text, senderId, senderName }

/users
  /{uid}
    - displayName
    - email
    - photoURL
    - isOnline
    - lastSeen
    - createdAt
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with **Email/Password Auth**, **Firestore**, and **Storage** enabled

### 1. Clone the repo

```bash
git clone https://github.com/your-username/pingora-chat-app.git
cd pingora-chat-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
# Optional
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Build for production

```bash
npm run build
```

---

## Deployment

The app is deployed on **Vercel**. To deploy your own instance:

1. Push the repo to GitHub
2. Import the project into [Vercel](https://vercel.com)
3. Add all `VITE_FIREBASE_*` environment variables in the Vercel project settings
4. Deploy — Vercel handles the Vite build automatically

---

## Firebase Setup Notes

- **Firestore rules** — restrict reads/writes to authenticated users only
- **Auth** — enable Email/Password sign-in in the Firebase console under Authentication → Sign-in method
- **Storage CORS** — configure CORS on your Storage bucket if enabling file uploads (media features are Phase 7)

---

## Roadmap

- [x] Direct messaging
- [x] Group conversations
- [x] Online presence & typing indicators
- [x] Emoji reactions & reply threads
- [x] Profile pictures & editable display name
- [x] Mobile responsive UI
- [ ] File / image / video uploads (CORS setup required)
- [ ] Media gallery drawer
- [ ] Push notifications (FCM)

---

## License

MIT
