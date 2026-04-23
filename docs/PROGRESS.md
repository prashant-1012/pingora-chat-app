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
- [ ] Auth context / provider
- [ ] authSlice — currentUser, loading, error
- [ ] Register form (name, email, password)
- [ ] Login form
- [ ] Logout button
- [ ] Protected route wrapper
- [ ] Persist auth across page refresh
- [ ] Write user doc to Firestore on register
- [ ] Update docs

## Phase 3: Firestore Data Model
- [ ] Design users collection
- [ ] Design conversations collection
- [ ] Design messages sub-collection
- [ ] Write Firestore data model to ARCHITECTURE.md
- [ ] Seed test data

## Phase 4: 1-on-1 Chat
- [ ] Create conversation logic
- [ ] Send message
- [ ] Real-time message subscription
- [ ] Chat UI layout (sidebar + message panel)
- [ ] Message timestamps
- [ ] Auto-scroll to latest message

## Phase 5: Group Chat
- [ ] Create group conversation
- [ ] Add/remove members
- [ ] Group messaging UI
- [ ] Group metadata (name, avatar)

## Phase 6: Presence System
- [ ] Online/offline detection (Realtime DB or Firestore heartbeat)
- [ ] Last seen timestamp
- [ ] Typing indicators

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
