import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "../database/app.db");
const db = new Database(dbPath);

// tabelle erstellen
db.exec(`
  CREATE TABLE IF NOT EXISTS maengel (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    -- titel des mangels, darf nicht leer sein
    title TEXT NOT NULL,
    -- constraint für location: entweder leer oder max 255 zeichen, also feld leer ist okay aber kein leerer string. 
    -- standardwert ist NULL
    location TEXT DEFAULT NULL CHECK(LENGTH(location) <= 255 OR location IS NULL),

    -- beschreibung des mangels, optional, max 255 zeichen, standardwert NULL (gleiches wie bei location)
    description TEXT DEFAULT NULL CHECK(LENGTH(description) <= 255 OR description IS NULL),

    -- timestamp wann mangel gemeldet wurde, wird automatisch gesetzt bei anlegen
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- anzahl der bewertungen/likes/upvotes
    votes INTEGER DEFAULT 0
  )
`);

export default db;
