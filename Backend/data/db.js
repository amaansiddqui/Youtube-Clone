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

/**
 * Initializes the JSON database.
 * If database.json exists and is valid, loads its contents into memory.
 * Otherwise seeds it with initial seedData and writes the file.
 */
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

/**
 * Persists the current in-memory database state back to database.json on disk.
 */
export function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(database, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving database to file:', err);
  }
}

/**
 * Returns a reference to the active database object.
 */
export function getDB() {
  return database;
}

