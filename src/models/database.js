/**
 * JSON File Database — Lightweight persistence using JSON files
 * No native dependencies required
 */

const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', '..', 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');

let db = null;

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
    console.error('DB load error, starting fresh:', e.message);
    db = JSON.parse(JSON.stringify(EMPTY_DB));
    saveDb();
  }
  return db;
}

function saveDb() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
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
  console.log('  📦 Database initialized (JSON store)');
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
