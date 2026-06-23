/**
 * photoStorage — resolves a writable uploads directory and centralizes photo-file
 * deletion so routes don't duplicate (or miscompute) the on-disk path.
 *
 * Photo records store the public URL in `filepath` (e.g. `/uploads/<id>.jpg` or
 * `/api/photos/file/<id>.jpg`), which is NOT a usable filesystem path. Deletion must
 * resolve the real file from the resolved upload directory using the stored `filename`.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const REPO_UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
const UPLOAD_DIR = process.env.UPLOAD_DIR || REPO_UPLOADS_DIR;

// Ensure an upload dir exists and is writable. If not, fall back to os.tmpdir().
function ensureUploadDir(dir) {
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.W_OK);
    return dir;
  } catch (err) {
    const fallback = process.env.UPLOAD_FALLBACK_DIR || os.tmpdir();
    try {
      if (!fs.existsSync(fallback)) fs.mkdirSync(fallback, { recursive: true });
      fs.accessSync(fallback, fs.constants.W_OK);
      console.warn(`Upload directory ${dir} not writable; falling back to ${fallback}`);
      return fallback;
    } catch (err2) {
      console.error('No writable upload directory available; uploads will fail');
      return null;
    }
  }
}

const FINAL_UPLOAD_DIR = ensureUploadDir(UPLOAD_DIR) || ensureUploadDir(os.tmpdir());

// Remove the on-disk file for a photo record. Resolves against FINAL_UPLOAD_DIR (so
// temp-dir fallbacks are cleaned up), and also tries the repo uploads dir in case the
// storage location changed between runs. Uses basename() to prevent path traversal.
function removePhotoFile(photo) {
  if (!photo || !FINAL_UPLOAD_DIR) return;
  const name = path.basename(photo.filename || photo.filepath || '');
  if (!name) return;
  const candidates = [path.join(FINAL_UPLOAD_DIR, name)];
  if (path.resolve(FINAL_UPLOAD_DIR) !== path.resolve(REPO_UPLOADS_DIR)) {
    candidates.push(path.join(REPO_UPLOADS_DIR, name));
  }
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) { fs.unlinkSync(p); return; }
    } catch (e) {
      console.warn('Failed to remove photo file', p, e && e.message ? e.message : e);
    }
  }
}

module.exports = { UPLOAD_DIR, FINAL_UPLOAD_DIR, REPO_UPLOADS_DIR, ensureUploadDir, removePhotoFile };
