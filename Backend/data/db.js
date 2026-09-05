import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initialUsers, initialChannels, initialVideos } from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'database.json');

// In-memory cache
let database = {
  users: [...initialUsers],
  channels: [...initialChannels],
  videos: [...initialVideos],
  interactions: {},
  subscriptions: {}
};

// Load from file if exists
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
    // Write initial
    saveDB();
  } catch (err) {
    console.error('Error initializing database, using seed:', err);
    saveDB();
  }
}

export function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(database, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving database to file:', err);
  }
}

export function getDB() {
  return database;
}
