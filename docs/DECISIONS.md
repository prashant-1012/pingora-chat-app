# PINGORA — Technical Decisions

## D-001: Frontend Framework — Vite + React
**Decision**: Use Vite with React template (not CRA).
**Why**: Vite is significantly faster for HMR and build times. CRA is deprecated.
**Alternatives considered**: Next.js (SSR overkill for a chat app where all data is real-time client-side).

---

## D-002: Styling — Tailwind CSS v3 + shadcn/ui
**Decision**: Tailwind v3 (not v4) + shadcn/ui for component primitives.
**Why**: Tailwind v3 is stable and shadcn/ui has first-class v3 support. v4 was released recently and shadcn compatibility is not fully settled. shadcn/ui gives unstyled Radix UI primitives with Tailwind classes — no black-box component library lock-in.
**Alternatives considered**: MUI (too opinionated), Chakra (runtime CSS-in-JS overhead), plain CSS (too slow to build with).

---

## D-003: State Management — Redux Toolkit
**Decision**: RTK for global state (auth, chat, presence).
**Why**: RTK eliminates Redux boilerplate. Scales well as features grow. RTK Query available if we need caching layers later.
**Alternatives considered**: Zustand (simpler but less ecosystem), React Context (not suitable for high-frequency updates like messages/presence).

---

## D-004: Backend — Firebase (Firestore + Auth + Storage + FCM)
**Decision**: Firebase as the entire backend.
**Why**: No-server deployment. Firestore real-time listeners are purpose-built for chat. Auth, Storage, and FCM are tightly integrated. Firebase free tier covers development.
**Alternatives considered**: Supabase (good but Firebase real-time is more battle-tested for chat), custom Node.js/Socket.io (too much infra to manage).

---

## D-005: Routing — React Router v6
**Decision**: React Router v6 with `<BrowserRouter>` + `<Routes>`.
**Why**: Industry standard. v6 declarative API is clean. Protected routes are straightforward to implement.
**Alternatives considered**: TanStack Router (newer, but overkill for our route count).

---

## D-006: Folder Structure — Feature-Based
**Decision**: Feature-based structure (`features/auth/`, `features/chat/`) not layer-based (`actions/`, `reducers/`, `components/`).
**Why**: Features scale better. All related code (slice, hooks, components) lives together. Easier to delete a feature cleanly.

---

## D-007: Firebase Config Security
**Decision**: Expose Firebase client config via `VITE_` env vars. Commit `.env.example`, never `.env`.
**Why**: Firebase client SDK keys are designed to be public — security is enforced by Firestore/Storage rules, not by hiding keys. Env vars still prevent accidental hardcoding and allow environment-specific configs (dev/staging/prod).

---

## D-008: Firestore Message Structure — Sub-Collection
**Decision**: Messages stored as a sub-collection under `conversations/{id}/messages/`.
**Why**: Firestore charges per document read. A sub-collection lets us query only the messages we need (paginated). Embedding messages in the conversation document would hit the 1MB document size limit quickly.

---

## D-009: Deployment — Vercel
**Decision**: Deploy frontend to Vercel.
**Why**: Zero-config Vite deployment, automatic preview URLs, fast CDN, free tier generous. Firebase Hosting is an alternative but Vercel is faster to set up and has better DX.
