/**
 * Firestore Seed Script — PINGORA Phase 3
 *
 * Creates 2 test users + 1 conversation + sample messages in Firestore.
 * Run once with: node scripts/seedFirestore.js
 *
 * Prerequisites:
 * 1. Create a Firebase service account key:
 *    Firebase Console → Project Settings → Service Accounts → Generate new private key
 * 2. Save it as scripts/serviceAccountKey.json
 * 3. npm install firebase-admin (if not already installed)
 *
 * NOTE: This script uses the Firebase Admin SDK (server-side).
 * It bypasses Firestore security rules entirely.
 */

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function seed() {
  console.log("🌱 Seeding Firestore...\n");

  const now = admin.firestore.FieldValue.serverTimestamp();

  // ── Test Users ────────────────────────────────────────────────────────────
  // These are Firestore user docs only — not Firebase Auth accounts.
  // To test login, register these emails via the Register page in the app.

  const user1 = {
    uid: "seed-user-alice",
    displayName: "Alice Seed",
    email: "alice@pingora.test",
    photoURL: null,
    createdAt: now,
    lastSeen: now,
    isOnline: false,
    fcmToken: null,
  };

  const user2 = {
    uid: "seed-user-bob",
    displayName: "Bob Seed",
    email: "bob@pingora.test",
    photoURL: null,
    createdAt: now,
    lastSeen: now,
    isOnline: false,
    fcmToken: null,
  };

  await db.collection("users").doc(user1.uid).set(user1);
  console.log("✅ Created user: alice@pingora.test");

  await db.collection("users").doc(user2.uid).set(user2);
  console.log("✅ Created user: bob@pingora.test");

  // ── Conversation ──────────────────────────────────────────────────────────
  const conversationId = [user1.uid, user2.uid].sort().join("_");
  const conversationRef = db.collection("conversations").doc(conversationId);

  await conversationRef.set({
    type: "direct",
    members: [user1.uid, user2.uid],
    createdAt: now,
    updatedAt: now,
    lastMessage: {
      text: "Hey Bob! How are you?",
      senderId: user1.uid,
      sentAt: now,
    },
  });
  console.log(`✅ Created conversation: ${conversationId}`);

  // ── Messages ──────────────────────────────────────────────────────────────
  const messagesRef = conversationRef.collection("messages");

  const messages = [
    { senderId: user1.uid, text: "Hey Bob! How are you?", readBy: [user1.uid] },
    { senderId: user2.uid, text: "Alice! Good, just testing PINGORA 🚀", readBy: [user2.uid] },
    { senderId: user1.uid, text: "It works! Real-time messaging is live 🎉", readBy: [user1.uid] },
  ];

  for (const msg of messages) {
    await messagesRef.add({
      ...msg,
      mediaURL: null,
      mediaType: null,
      sentAt: now,
      reactions: {},
    });
  }
  console.log(`✅ Created ${messages.length} seed messages`);

  console.log("\n🎉 Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
