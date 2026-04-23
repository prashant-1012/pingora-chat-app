# PINGORA — Project Phases & Milestones

## Phase 1 — Project Setup ✅
**Goal**: Working dev environment, all packages installed, folder structure ready.
- Vite + React scaffold
- Tailwind v3 + shadcn/ui
- Firebase SDK
- Redux Toolkit
- React Router v6
- Folder structure
- Docs initialized

**Milestone**: `npm run dev` runs without errors. Routing shell works.

---

## Phase 2 — Firebase Authentication
**Goal**: Users can register, log in, and log out. Protected routes work.
- Register (email + password + display name)
- Login / Logout
- `authSlice` with currentUser, loading, error
- ProtectedRoute component
- Auth persistence on refresh
- User doc written to Firestore on register
- Auth-aware navbar

**Milestone**: New user can register → lands on /chat. Unauthenticated user redirected to /login.

---

## Phase 3 — Firestore Data Model
**Goal**: Collections designed, seeded with test data, security rules drafted.
- `users`, `conversations`, `messages` collections
- Seed script for local testing
- Data model documented in ARCHITECTURE.md

**Milestone**: Firestore console shows correct structure.

---

## Phase 4 — 1-on-1 Chat
**Goal**: Two users can find each other and exchange messages in real time.
- User search
- Create/find direct conversation
- Send message
- Real-time `onSnapshot` listener
- Chat UI: sidebar (conversation list) + message panel
- Message timestamps
- Auto-scroll

**Milestone**: End-to-end: search user → start chat → send and receive messages in real time.

---

## Phase 5 — Group Chat
**Goal**: Users can create groups and chat together.
- Create group (name, select members)
- Group conversation list item
- Group message thread
- Add/remove members
- Admin controls

**Milestone**: 3+ users in a group can send and receive messages in real time.

---

## Phase 6 — Presence System
**Goal**: Users see who is online. Typing indicators appear.
- Online/offline status (Firestore heartbeat or Realtime DB)
- Last seen timestamp
- Typing indicators (debounced writes to Firestore)
- Presence UI in sidebar and chat header

**Milestone**: Online status updates within 5 seconds. Typing indicator appears while user types.

---

## Phase 7 — Rich Features
**Goal**: Media sharing, reactions, read receipts.
- Image upload → Firebase Storage → displayed in chat
- File upload (PDF, etc.)
- Emoji reactions on messages
- Read receipts (seen by X)

**Milestone**: User can send an image, react to a message, and see read receipts.

---

## Phase 8 — Push Notifications (FCM)
**Goal**: Users receive notifications for new messages when app is in background.
- FCM token registration + stored on user doc
- Service worker (`firebase-messaging-sw.js`)
- Notification permission request flow
- Background message handler

**Milestone**: Message received → push notification shown when browser is in background.

---

## Phase 9 — UI Polish
**Goal**: Production-quality UI with loading states and error handling.
- Responsive layout (mobile + desktop)
- Skeleton loaders for conversations and messages
- Error boundaries
- Empty states (no conversations, no messages)
- Toast notifications (react-hot-toast or sonner)
- Keyboard accessibility

**Milestone**: App works and looks great on mobile and desktop. No unhandled error states.

---

## Phase 10 — Security + Deployment
**Goal**: App is secure and live on Vercel.
- Firestore security rules — tested and deployed
- Storage security rules — tested and deployed
- Environment variables on Vercel
- Production build tested (`npm run build`)
- Deploy to Vercel

**Milestone**: App is live. Firestore rules block unauthorized access. Build passes.
