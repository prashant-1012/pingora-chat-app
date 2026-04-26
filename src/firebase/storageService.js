// Storage service — Firebase Storage uploads, downloads, and deletions.
// Phase 7: all file types, up to 50 MB.

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "./config";

export const MAX_FILE_MB = 50;
const MAX_BYTES = MAX_FILE_MB * 1024 * 1024;

/**
 * Determine a human-friendly media type category from a File object.
 * @param {File} file
 * @returns {"image"|"video"|"audio"|"file"}
 */
export const getMediaType = (file) => {
  const t = file.type;
  if (t.startsWith("image/")) return "image";
  if (t.startsWith("video/")) return "video";
  if (t.startsWith("audio/")) return "audio";
  return "file";
};

/**
 * Format a byte count to a human-readable size string.
 * @param {number} bytes
 * @returns {string}
 */
export const formatFileSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
};

/**
 * Upload a file to Firebase Storage and return metadata + download URL.
 *
 * @param {File} file
 * @param {string} conversationId
 * @param {string} uid - uploader UID
 * @param {function} [onProgress] - called with 0–100
 * @returns {Promise<{ downloadURL, mediaType, fileName, fileSize, storagePath }>}
 */
export const uploadFile = (file, conversationId, uid, onProgress) =>
  new Promise((resolve, reject) => {
    if (file.size > MAX_BYTES) {
      reject(new Error(`File too large. Maximum size is ${MAX_FILE_MB} MB.`));
      return;
    }

    const safeName = file.name.replace(/[^\w.\-]/g, "_");
    const path = `chats/${conversationId}/${uid}_${Date.now()}_${safeName}`;
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file);

    task.on(
      "state_changed",
      (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        onProgress?.(pct);
      },
      (err) => reject(err),
      async () => {
        const downloadURL = await getDownloadURL(task.snapshot.ref);
        resolve({
          downloadURL,
          mediaType: getMediaType(file),
          fileName: file.name,
          fileSize: file.size,
          storagePath: path,
        });
      }
    );
  });

/**
 * Delete a file from Firebase Storage by its path.
 * Silently ignores "object-not-found" errors.
 *
 * @param {string} storagePath
 */
export const deleteStorageFile = async (storagePath) => {
  try {
    await deleteObject(ref(storage, storagePath));
  } catch (err) {
    if (err.code !== "storage/object-not-found") throw err;
  }
};
