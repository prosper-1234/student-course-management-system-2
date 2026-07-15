/**
 * models/courseModel.js
 * ---------------------------------------------------------------
 * Data-access layer for the `courses` Firestore collection. Every
 * function returns a Promise so controllers can use async/await with
 * try/catch, exactly as before — only the storage engine changed.
 *
 * Firestore document IDs are auto-generated strings (not integers).
 * Every returned course object includes that string `id` field.
 *
 * Soft delete: documents are never removed from the collection by the
 * normal "delete" flow. Instead `deletedAt` is stamped with the
 * current time, which moves the course into the Recycle Bin. Every
 * "active" query filters on `deletedAt == null`; every "recycle bin"
 * query filters on `deletedAt != null`. A separate permanent-delete
 * function is the only thing that issues a real Firestore delete().
 *
 * NOTE ON QUERIES: Firestore doesn't support case-insensitive lookups
 * or mixing certain filters without composite indexes. Since a course
 * catalog is a small collection, we fetch the collection once per
 * call and filter/sort in memory — simple, index-free, and fast
 * enough at this scale.
 * ---------------------------------------------------------------
 */

// NOTE: we deliberately import the whole module (not `const { db } = require(...)`).
// `db` is exposed via a getter that throws until initializeDatabase() has run.
// Destructuring it here would evaluate that getter immediately, at require-time,
// before server.js gets a chance to call initializeDatabase() - crashing the
// app on startup. Referencing `database.db` lazily inside collection() below
// means it's only read once a request actually comes in, by which point the
// database is guaranteed to be ready.
const database = require("../database/database");
const { FieldValue } = require("firebase-admin").firestore;

/** Converts a Firestore doc snapshot into a plain course object with string dates. */
function toCourse(doc) {
  if (!doc.exists) return null;
  const data = doc.data();
  return {
    id: doc.id,
    courseCode: data.courseCode,
    courseTitle: data.courseTitle,
    courseUnit: data.courseUnit,
    createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
    updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
    deletedAt: data.deletedAt ? data.deletedAt.toDate().toISOString() : null,
  };
}

function collection() {
  return database.db.collection(database.COLLECTION);
}

/**
 * Fetch every ACTIVE (non-deleted) course, most recently added first.
 * @returns {Promise<Array>}
 */
async function getAllCourses() {
  const snapshot = await collection().get();
  return snapshot.docs
    .map(toCourse)
    .filter((c) => !c.deletedAt)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Fetch every course currently in the Recycle Bin (soft-deleted),
 * most recently deleted first.
 * @returns {Promise<Array>}
 */
async function getDeletedCourses() {
  const snapshot = await collection().get();
  return snapshot.docs
    .map(toCourse)
    .filter((c) => c.deletedAt)
    .sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));
}

/**
 * Find a single ACTIVE course by its course code (case-insensitive).
 * @param {string} courseCode
 * @returns {Promise<Object|undefined>}
 */
async function getCourseByCode(courseCode) {
  const snapshot = await collection().get();
  const target = (courseCode || "").toUpperCase();
  const match = snapshot.docs
    .map(toCourse)
    .find((c) => !c.deletedAt && c.courseCode.toUpperCase() === target);
  return match || undefined;
}

/**
 * Find a single course by its Firestore document id, active or not.
 * @param {string} id
 * @returns {Promise<Object|undefined>}
 */
async function getCourseById(id) {
  const doc = await collection().doc(String(id)).get();
  return toCourse(doc) || undefined;
}

/**
 * Insert a new course.
 * @param {{courseCode: string, courseTitle: string, courseUnit: number}} course
 * @returns {Promise<Object>} the newly created row
 */
async function createCourse({ courseCode, courseTitle, courseUnit }) {
  const now = FieldValue.serverTimestamp();
  const docRef = await collection().add({
    courseCode,
    courseTitle,
    courseUnit,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  });
  return getCourseById(docRef.id);
}

/**
 * Update an existing (active) course by id.
 * @param {string} id
 * @param {{courseCode: string, courseTitle: string, courseUnit: number}} course
 * @returns {Promise<Object|null>} the updated row, or null if not found/deleted
 */
async function updateCourse(id, { courseCode, courseTitle, courseUnit }) {
  const ref = collection().doc(String(id));
  const doc = await ref.get();
  if (!doc.exists || doc.data().deletedAt) return null;

  await ref.update({
    courseCode,
    courseTitle,
    courseUnit,
    updatedAt: FieldValue.serverTimestamp(),
  });
  return getCourseById(id);
}

/**
 * Soft-delete a course by id — moves it into the Recycle Bin instead
 * of removing the document. A course can only be soft-deleted once.
 * @param {string} id
 * @returns {Promise<boolean>} true if a document was moved to the recycle bin
 */
async function softDeleteCourse(id) {
  const ref = collection().doc(String(id));
  const doc = await ref.get();
  if (!doc.exists || doc.data().deletedAt) return false;

  await ref.update({ deletedAt: FieldValue.serverTimestamp() });
  return true;
}

/**
 * Restore a soft-deleted course back to the active course list.
 * @param {string} id
 * @returns {Promise<Object|null>} the restored row, or null if it wasn't found in the bin
 */
async function restoreCourse(id) {
  const ref = collection().doc(String(id));
  const doc = await ref.get();
  if (!doc.exists || !doc.data().deletedAt) return null;

  await ref.update({ deletedAt: null, updatedAt: FieldValue.serverTimestamp() });
  return getCourseById(id);
}

/**
 * Permanently remove a soft-deleted course from the database. Only
 * works on documents already in the recycle bin, so an active course
 * can never be permanently deleted by accident without going through
 * the soft-delete step first.
 * @param {string} id
 * @returns {Promise<boolean>} true if a document was permanently deleted
 */
async function permanentlyDeleteCourse(id) {
  const ref = collection().doc(String(id));
  const doc = await ref.get();
  if (!doc.exists || !doc.data().deletedAt) return false;

  await ref.delete();
  return true;
}

module.exports = {
  getAllCourses,
  getDeletedCourses,
  getCourseByCode,
  getCourseById,
  createCourse,
  updateCourse,
  softDeleteCourse,
  restoreCourse,
  permanentlyDeleteCourse,
};
