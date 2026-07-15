/**
 * database/database.js
 * ---------------------------------------------------------------
 * Sets up the Firebase Admin SDK connection and exposes a ready-to-use
 * Firestore instance for the rest of the app.
 *
 * We export the raw `db` Firestore instance. Models use it directly
 * with the Firestore client API.
 *
 * Two ways to authenticate (pick ONE, via .env):
 *   1. FIREBASE_SERVICE_ACCOUNT_PATH  -> path to a downloaded JSON key file
 *   2. FIREBASE_SERVICE_ACCOUNT_JSON  -> the JSON key file's contents,
 *                                        pasted directly as one env var
 *                                        (handy for hosts like Render/
 *                                        Railway/Vercel where you can't
 *                                        easily upload a file)
 * ---------------------------------------------------------------
 */

const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

function loadServiceAccount() {
  const jsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (jsonEnv) {
    try {
      return JSON.parse(jsonEnv);
    } catch (err) {
      console.error("❌ FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON:", err.message);
      process.exit(1);
    }
  }

  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    ? path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    : path.resolve(__dirname, "../serviceAccountKey.json");

  if (!fs.existsSync(keyPath)) {
    console.error(
      `❌ Firebase service account key not found at ${keyPath}.\n` +
      `   Set FIREBASE_SERVICE_ACCOUNT_PATH in .env, or place the file at that path.`
    );
    process.exit(1);
  }

  return require(keyPath);
}

let db;

function initializeDatabase() {
  if (admin.apps.length === 0) {
    const serviceAccount = loadServiceAccount();
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Connected to Firebase project:", serviceAccount.project_id);
  }

  db = admin.firestore();
  console.log("✅ Firestore is ready.");
  return db;
}

// Firestore collection name — kept close to the original "courses" table name.
const COLLECTION = "courses";

module.exports = {
  admin,
  get db() {
    if (!db) {
      throw new Error("Firestore has not been initialized yet. Call initializeDatabase() first.");
    }
    return db;
  },
  initializeDatabase,
  COLLECTION,
};
