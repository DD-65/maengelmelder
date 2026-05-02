import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pfad zur Datenbank relativ zu src/server/db.ts
const dbPath = path.join(__dirname, "../../database/app.db");
const db = new Database(dbPath);
// settings: write-ahead logging aktivieren und foreign keys erzwingen
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Benutzer-Tabelle erstellen (falls sie noch nicht existiert)
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Mängel-Tabelle erstellen (falls sie noch nicht existiert)
db.exec(`
  CREATE TABLE IF NOT EXISTS maengel (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT NOT NULL,
    location TEXT DEFAULT NULL CHECK(LENGTH(location) <= 255 OR location IS NULL),     
    description TEXT DEFAULT NULL CHECK(LENGTH(description) <= 255 OR description IS NULL),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    votes INTEGER NOT NULL DEFAULT 0 CHECK (votes >= 0),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  )
`);

// Tabelle für votes, damit ein Nutzer nur einmal voten kann
db.exec(`
  CREATE TABLE IF NOT EXISTS mangel_votes (
    user_id INTEGER NOT NULL,
    mangel_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, mangel_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mangel_id) REFERENCES maengel(id) ON DELETE CASCADE
  )
`);

export default db;
