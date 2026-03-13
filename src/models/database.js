/**
 * JSON File Database — Lightweight persistence using JSON files
 * No native dependencies required
 */

const fs = require('fs');
const path = require('path');

const os = require('os');

// prefer explicit env override (useful in serverless/container environments)
let DB_DIR = process.env.DB_DIR || path.join(__dirname, '..', '..', 'data');
let DB_FILE = path.join(DB_DIR, 'database.json');

let db = null;
let readOnlyFS = false;

const EMPTY_DB = {
  projects: [],
  photos: [],
  survey_points: [],
  property_boundaries: [],
  structures: [],
  drainage_plans: [],
  drainage_elements: [],
  water_flow_analysis: []
};

function loadDb() {
  if (db) return db;
  try {
    // Ensure DB_DIR exists and is writable. If not, try a writable fallback (os.tmpdir()).
    try {
      if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
      // test write access by attempting to open (without truncating)
      fs.accessSync(DB_DIR, fs.constants.W_OK);
    } catch (err) {
      // fallback to temp dir
      const fallback = process.env.DB_FALLBACK_DIR || os.tmpdir();
      try {
        if (!fs.existsSync(fallback)) fs.mkdirSync(fallback, { recursive: true });
        fs.accessSync(fallback, fs.constants.W_OK);
        console.warn(`DB directory ${DB_DIR} not writable; falling back to ${fallback}`);
        DB_DIR = fallback;
        DB_FILE = path.join(DB_DIR, 'database.json');
      } catch (err2) {
        // no writable directory available — operate in-memory only
        console.warn('No writable DB directory available, running in in-memory (non-persistent) mode');
        readOnlyFS = true;
        db = JSON.parse(JSON.stringify(EMPTY_DB));
        return db;
      }
    }

    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      db = JSON.parse(raw);
      for (const key of Object.keys(EMPTY_DB)) {
        if (!db[key]) db[key] = [];
      }
    } else {
      db = JSON.parse(JSON.stringify(EMPTY_DB));
      saveDb();
    }
  } catch (e) {
    console.error('DB load error, starting fresh (in-memory):', e && e.message ? e.message : e);
    db = JSON.parse(JSON.stringify(EMPTY_DB));
    try { saveDb(); } catch (e2) { /* ignore */ }
  }
  return db;
}

function saveDb() {
  if (readOnlyFS) return; // don't attempt to write when flagged read-only
  try {
    if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    // If write fails (e.g., EROFS on /var/task in serverless), attempt fallback to tmp dir once
    console.warn('Failed to write DB file to', DB_FILE, '-', err.message);
    const fallback = process.env.DB_FALLBACK_DIR || os.tmpdir();
    try {
      if (!fs.existsSync(fallback)) fs.mkdirSync(fallback, { recursive: true });
      const fallbackFile = path.join(fallback, 'database.json');
      fs.writeFileSync(fallbackFile, JSON.stringify(db, null, 2), 'utf8');
      console.warn(`Wrote DB to fallback location: ${fallbackFile}`);
      // switch DB_FILE to fallback for subsequent writes
      DB_DIR = fallback;
      DB_FILE = fallbackFile;
    } catch (err2) {
      console.error('Unable to persist DB to fallback location. Operating in-memory only.');
      readOnlyFS = true;
    }
  }
}

function getDb() {
  return loadDb();
}

function findAll(table, filter = {}) {
  const data = getDb()[table] || [];
  return data.filter(row => {
    for (const [key, val] of Object.entries(filter)) {
      if (row[key] !== val) return false;
    }
    return true;
  });
}

function findOne(table, filter = {}) {
  return findAll(table, filter)[0] || null;
}

function findById(table, id) {
  return findOne(table, { id });
}

function insert(table, record) {
  const data = getDb();
  if (!data[table]) data[table] = [];
  record.created_at = record.created_at || new Date().toISOString();
  record.updated_at = record.updated_at || record.created_at;
  data[table].push(record);
  saveDb();
  return record;
}

function update(table, id, changes) {
  const data = getDb();
  const arr = data[table] || [];
  const idx = arr.findIndex(r => r.id === id);
  if (idx === -1) return null;
  arr[idx] = { ...arr[idx], ...changes, updated_at: new Date().toISOString() };
  saveDb();
  return arr[idx];
}

function remove(table, filter = {}) {
  const data = getDb();
  if (!data[table]) return 0;
  const before = data[table].length;
  data[table] = data[table].filter(row => {
    for (const [key, val] of Object.entries(filter)) {
      if (row[key] === val) return false;
    }
    return true;
  });
  saveDb();
  return before - data[table].length;
}

function removeById(table, id) {
  return remove(table, { id });
}

function count(table, filter = {}) {
  return findAll(table, filter).length;
}

function initDatabase() {
  loadDb();
  console.log(`  📦 Database initialized (JSON store) at ${DB_FILE}${readOnlyFS ? ' [IN-MEMORY - not persistent]' : ''}`);
}

module.exports = {
  getDb,
  initDatabase,
  findAll,
  findOne,
  findById,
  insert,
  update,
  remove,
  removeById,
  count
};
