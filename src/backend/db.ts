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
    email_verified_at TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Migration: email_verified_at hinzufügen, falls sie in einer alten Version der DB fehlt
try {
  db.exec("ALTER TABLE users ADD COLUMN email_verified_at TEXT DEFAULT NULL");
} catch {
  // Falls die Spalte schon existiert, ignorieren
}

// Tabelle für E-Mail-Verifizierungstokens
db.exec(`
  CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    used_at TEXT DEFAULT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id
  ON email_verification_tokens(user_id)
`);

// Benutzer-Tabelle erstellen (falls sie noch nicht existiert)
db.exec(`
  CREATE TABLE IF NOT EXISTS kategorien (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kategorie TEXT NOT NULL
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
    status TEXT NOT NULL DEFAULT 'Gemeldet' CHECK (status IN ('Gemeldet', 'Akzeptiert', 'Abgelehnt', 'In Bearbeitung', 'Behoben')),
    kategorie TEXT DEFAULT NULL CHECK (kategorie IS NULL OR kategorie = '' OR kategorie IN ('Steckdose', 'Schlagloch', 'WLAN', 'Mobiliar', 'Andere')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    votes INTEGER NOT NULL DEFAULT 0 CHECK (votes >= 0),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  )
`);

// Migration: status Spalte hinzufügen, falls sie in einer alten Version der DB fehlt
try {
  db.exec("ALTER TABLE maengel ADD COLUMN status TEXT NOT NULL DEFAULT 'Gemeldet' CHECK (status IN ('Gemeldet', 'Akzeptiert', 'Abgelehnt', 'In Bearbeitung', 'Behoben'))");
} catch {
  // Falls die Spalte schon existiert oder ein anderer Fehler auftritt, ignorieren wir das hier
}

// Migration: kategorie Spalte hinzufügen, falls sie in einer alten Version der DB fehlt
try {
  db.exec("ALTER TABLE maengel ADD COLUMN kategorie TEXT DEFAULT NULL CHECK (kategorie IS NULL OR kategorie = '' OR kategorie IN ('Steckdose', 'Schlagloch', 'WLAN', 'Mobiliar', 'Andere'))");
} catch {
  // Falls die Spalte schon existiert oder ein anderer Fehler auftritt, ignorieren wir das hier
}

// Migration: image_url Spalte hinzufügen, falls sie fehlt
try {
  db.exec("ALTER TABLE maengel ADD COLUMN image_url TEXT DEFAULT NULL");
} catch {
  // Falls die Spalte schon existiert, ignorieren
}

// Migration: thumbnail_url Spalte hinzufügen, falls sie fehlt
try {
  db.exec("ALTER TABLE maengel ADD COLUMN thumbnail_url TEXT DEFAULT NULL");
} catch {
  // Falls die Spalte schon existiert, ignorieren
}

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
