/**
 * Photo Routes — Upload, manage site photos
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');

// Determine an uploads directory that is writable. Allow override via UPLOAD_DIR env var.
const DEFAULT_UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
const UPLOAD_DIR = process.env.UPLOAD_DIR || DEFAULT_UPLOAD_DIR;

// Ensure upload dir exists and is writable. If not, fallback to os.tmpdir().
const os = require('os');
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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!FINAL_UPLOAD_DIR) return cb(new Error('No writable upload directory'));
    cb(null, FINAL_UPLOAD_DIR);
  },
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/\.(jpg|jpeg|png|heic|heif|webp|tiff|gif)$/i.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// POST upload photo(s)
router.post('/upload/:projectId', upload.array('photos', 20), (req, res) => {
  try {
    const projectId = req.params.projectId;
    const project = db.findById('projects', projectId);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    const { photo_type, description, tags, latitude, longitude } = req.body;
    const photos = [];

    for (const file of req.files) {
      const id = uuidv4();
      const photo = db.insert('photos', {
        id,
        project_id: projectId,
        filename: file.filename,
        original_name: file.originalname,
        // store a relative path (no leading slash) so path.join works reliably
        filepath: `uploads/${file.filename}`,
        photo_type: photo_type || 'site',
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        bearing: null,
        description: description || null,
        tags: tags || null,
        analysis_data: null
      });
      photos.push(photo);
    }

    res.json({ success: true, photos });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all photos for a project
router.get('/project/:projectId', (req, res) => {
  try {
    const photos = db.findAll('photos', { project_id: req.params.projectId });
    res.json({ success: true, photos });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update photo metadata
router.put('/:id', (req, res) => {
  try {
    const { description, tags, photo_type, latitude, longitude, bearing } = req.body;
    const photo = db.update('photos', req.params.id, { description, tags, photo_type, latitude, longitude, bearing });
    res.json({ success: true, photo });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE photo
router.delete('/:id', (req, res) => {
  try {
    const photo = db.findById('photos', req.params.id);
    if (photo) {
      const fullPath = path.join(__dirname, '..', '..', photo.filepath);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      db.removeById('photos', req.params.id);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
