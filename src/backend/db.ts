import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pfad zur Datenbank relativ zu src/server/db.ts
const dbPath = path.join(__dirname, "../../database/app.db");
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Tabelle erstellen
db.exec(`
  CREATE TABLE IF NOT EXISTS maengel (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    location TEXT DEFAULT NULL CHECK(LENGTH(location) <= 255 OR location IS NULL),     
    description TEXT DEFAULT NULL CHECK(LENGTH(description) <= 255 OR description IS NULL),
    kategorie TEXT CHECK(kategorie IS '' OR kategorie IN ('Steckdose','Schlagloch', 'WLAN', 'Mobiliar')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    votes INTEGER NOT NULL DEFAULT 0 CHECK (votes >= 0)
  )
`);

export default db;
