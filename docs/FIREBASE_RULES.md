# PINGORA — Firebase Security Rules

> Rules are written and finalized in Phase 10.
> This file documents them in advance for review before deployment.

---

## Firestore Rules

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ── Users ─────────────────────────────────────────────
    // A user can read any user profile (needed for search/display).
    // A user can only write their own profile.
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // ── Conversations ──────────────────────────────────────
    // A user can only read/write conversations they are a member of.
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null
        && request.auth.uid in resource.data.members;

      // Allow creation if the requesting user includes themselves as a member.
      allow create: if request.auth != null
        && request.auth.uid in request.resource.data.members;

      // ── Messages sub-collection ──────────────────────────
      // Only conversation members can read/write messages.
      match /messages/{messageId} {
        allow read: if request.auth != null
          && request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.members;

        allow create: if request.auth != null
          && request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.members
          && request.resource.data.senderId == request.auth.uid;

        // Messages are immutable after creation (no editing for now).
        allow update, delete: if false;
      }
    }
  }
}
```

**Key decisions:**
- Messages are write-once (no edits/deletes in Phase 1–9 — added in Phase 10 review).
- Conversation membership check on messages uses `get()` to validate the parent document.
- Any authenticated user can read any user profile (required for user search).

---

## Storage Rules

```js
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // ── Profile photos ─────────────────────────────────────
    // Users can read any profile photo, write only their own.
    match /profile-photos/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // ── Chat media ─────────────────────────────────────────
    // Only authenticated users can upload.
    // Max file size: 10MB.
    // Allowed types: images and common files.
    match /chat-media/{conversationId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && request.resource.size < 10 * 1024 * 1024
        && (request.resource.contentType.matches('image/.*')
            || request.resource.contentType.matches('application/pdf')
            || request.resource.contentType.matches('application/.*'));
    }
  }
}
```

---

> ⚠️ These rules will be tested against real scenarios in Phase 10 before deployment.
