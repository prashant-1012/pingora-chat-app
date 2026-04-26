# PINGORA — Progress Tracker

## Phase 1: Project Setup
- [x] Scaffold Vite + React app
- [x] Install Tailwind CSS v3 + PostCSS + Autoprefixer
- [x] Configure tailwind.config.js with shadcn/ui tokens
- [x] Install shadcn/ui dependencies (radix-ui, class-variance-authority, clsx, tailwind-merge, lucide-react)
- [x] Install React Router v6
- [x] Install Redux Toolkit + React Redux
- [x] Install Firebase SDK
- [x] Set up full folder structure (features/, firebase/, app/, pages/, hooks/, components/ui/)
- [x] Create src/firebase/config.js — Firebase init
- [x] Create src/firebase/authService.js — Auth service stub
- [x] Create src/firebase/chatService.js — Chat service stub
- [x] Create src/firebase/storageService.js — Storage service stub
- [x] Create src/app/store.js — Redux store
- [x] Create src/lib/utils.js — shadcn cn() utility
- [x] Create src/App.jsx — React Router shell
- [x] Create src/main.jsx — Entry point with Redux Provider
- [x] Create page stubs: LoginPage, RegisterPage, ChatPage
- [x] Create feature stubs: authSlice, chatSlice, presenceSlice
- [x] Create .env.example
- [x] Create all 6 docs files
- [x] Add Inter font via index.html
- [x] Verify dev server runs (npm run dev)

## Phase 2: Firebase Auth
- [x] authSlice — currentUser, authLoading, actionLoading, error + selectors
- [x] Async thunks: registerAsync, loginAsync, logoutAsync with friendly error messages
- [x] authService.js — register writes full user doc to Firestore users/{uid}
- [x] useAuth hook — subscribes to onAuthStateChanged, syncs to Redux
- [x] AuthProvider — blocks render until auth state resolved (prevents login flash)
- [x] ProtectedRoute — guards /chat, redirects to /login with return URL
- [x] LoginPage — full UI with error display, loading spinner, redirect-to-origin
- [x] RegisterPage — full UI with client-side validation, loading spinner
- [x] ChatPage stub — shows currentUser info + working logout button
- [x] App.jsx — /chat guarded by ProtectedRoute
- [x] main.jsx — AuthProvider wraps App inside Redux Provider
- [x] Auth persists across page refresh (Firebase Auth handles this automatically)
- [x] Update docs

## Phase 3: Firestore Data Model
- [x] Design users collection
- [x] Design conversations collection
- [x] Design messages sub-collection
- [x] Write Firestore data model to ARCHITECTURE.md
- [x] Create `firestore.rules` file in project root
- [x] Create `scripts/seedFirestore.js` seed script
- [x] Firestore database created in Firebase Console (test mode rules)

## Phase 4: 1-on-1 Chat
- [x] `chatSlice.js` — conversations, messages, activeConversation, userCache
- [x] `chatService.js` — getOrCreateDirectConversation, sendMessage, subscribeToConversations, subscribeToMessages
- [x] `userService.js` — searchUserByEmail, getUserById
- [x] `useConversations.js` hook — real-time Firestore onSnapshot → Redux
- [x] `useMessages.js` hook — real-time messages onSnapshot → Redux
- [x] `Sidebar.jsx` — conversation list, skeleton loader, empty state, new chat button
- [x] `ConversationItem.jsx` — avatar, name, last message preview, timestamp
- [x] `UserSearchModal.jsx` — search by email, start 1-on-1 conversation
- [x] `MessagePanel.jsx` — chat header, scrollable message list, auto-scroll
- [x] `MessageBubble.jsx` — own/received styling, hover timestamp
- [x] `MessageInput.jsx` — auto-grow textarea, Enter to send, Shift+Enter for newline
- [x] `EmptyState.jsx` — shown when no conversation selected
- [x] `ChatPage.jsx` — two-panel layout, responsive mobile, real-time subscriptions wired
- [x] `store.js` — chatReducer added
- [x] Firestore Timestamps serialized to ISO strings (no Redux serialization errors)

## Phase 5: Group Chat
- [x] `chatService.js` — addMemberToGroup, removeMemberFromGroup, updateGroupName, transferAdmin
- [x] `userService.js` — getUsersByUids batch fetch
- [x] `CreateGroupModal.jsx` — two-step: name + add members by email, create group
- [x] `GroupInfoPanel.jsx` — member list, admin badge, rename (admin), add member (admin), remove member (admin), auto-promote on admin leave, leave group
- [x] `Sidebar.jsx` — "+" dropdown with New message / New group options
- [x] `MessagePanel.jsx` — group header (rounded-square icon, member count, info button)
- [x] `ChatPage.jsx` — wires GroupInfoPanel, auto-fetches group member profiles, leave group flow


## Phase 6: Presence System
- [x] `presenceService.js` — initPresence (heartbeat + visibilitychange + beforeunload), subscribeToUserStatus, setTypingStatus, subscribeToTyping
- [x] `presenceSlice.js` — userStatuses map, setUserStatus / clearPresence reducers + selectors
- [x] `store.js` — presenceReducer added
- [x] `usePresence.js` — initializes current user's heartbeat on mount, cleans up on logout
- [x] `useUserStatus.js` — subscribes to any uid's online/offline status → Redux
- [x] `TypingIndicator.jsx` — animated bouncing dots + smart pluralization
- [x] `MessageInput.jsx` — fires setTypingStatus on keystrokes, clears after 2.5s silence or on send
- [x] `MessagePanel.jsx` — shows Online/last-seen in DM header, subscribes to typing collection, renders TypingIndicator
- [x] `ConversationItem.jsx` — green/gray online dot on avatar for DM conversations
- [x] `ChatPage.jsx` — calls usePresence, subscribes to all DM partner statuses in sidebar

## Phase 7: Rich Features
- [ ] File/image upload (Firebase Storage)
- [ ] Image preview in chat
- [ ] Message reactions (emoji)
- [ ] Read receipts

## Phase 8: Push Notifications (FCM)
- [ ] FCM token registration
- [ ] Notification permission flow
- [ ] Service worker setup
- [ ] Background notifications

## Phase 9: UI Polish
- [ ] Responsive layout (mobile-first)
- [ ] Skeleton loaders
- [ ] Error boundaries
- [ ] Empty states
- [ ] Toast notifications

## Phase 10: Security + Deployment
- [ ] Firestore security rules
- [ ] Storage security rules
- [ ] Firebase Hosting / Vercel deploy
- [ ] Environment variables on Vercel
- [ ] Final review
