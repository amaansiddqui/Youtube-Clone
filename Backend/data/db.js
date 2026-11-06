import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initialUsers, initialChannels, initialVideos } from './seedData.js';

// Derive __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'database.json');

/**
 * In-memory database cache.
 * Provides immediate zero-configuration operation without requiring MongoDB.
 */
let database = {
  users: [...initialUsers],
  channels: [...initialChannels],
  videos: [...initialVideos],
  interactions: {},
  subscriptions: {}
};

/** Loads or initializes the JSON database. */
export function initDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (parsed.videos && parsed.channels && parsed.users) {
        database = parsed;
        return;
      }
    }
    // Write initial seed data to file
    saveDB();
  } catch (err) {
    console.error('Error initializing database from file, using in-memory seed:', err);
    saveDB();
  }
}

/** Persists the in-memory database to disk. */
export function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(database, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving database to file:', err);
  }
}

/** Returns the active database object. */
export function getDB() {
  return database;
}
