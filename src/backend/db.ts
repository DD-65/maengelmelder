import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
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
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
    email_verified_at TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Root-Account anlegen (wird übersprungen wenn er bereits existiert)
const rootEmail = "root@team.de";
const rootPassword = "IchBinRoot";
try {
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(rootEmail);
  if (!existing) {
    const hash = bcrypt.hashSync(rootPassword, 12);
    db.prepare("INSERT INTO users (email, password_hash, role) VALUES (?, ?, 'superadmin')").run(rootEmail, hash);
  }
} catch (e) {
  console.error("Root-Account konnte nicht angelegt werden:", e);
}

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

// kategorien Tabelle
db.exec(`
  CREATE TABLE IF NOT EXISTS kategorien (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kategorieelem TEXT UNIQUE DEFAULT NULL
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
    kategorie TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    votes INTEGER NOT NULL DEFAULT 0 CHECK (votes >= 0),
    statusComment_id INTEGER,
    FOREIGN KEY (statusComment_id) REFERENCES maengel_kommentare(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (kategorie) REFERENCES kategorien(kategorieelem) ON DELETE SET NULL
  )
`);

// Migration: Benachrichtigungs-Einstellungen für User
try {
  // 0 = sofort, >0 = Intervall,Tage
  db.exec("ALTER TABLE users ADD COLUMN notification_interval INTEGER DEFAULT 0");
  // Zeitpunkt der letzten Sammel-Mail
  db.exec("ALTER TABLE users ADD COLUMN last_summary_email_at TEXT DEFAULT NULL");
} catch {
  // Falls es die Spalten schon gibt
}

// Tabelle für Status-Historie/Status-Mails
db.exec(`
  CREATE TABLE IF NOT EXISTS status_changes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mangel_id INTEGER NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    old_statusComment_id INTEGER,
    new_statusComment_id INTEGER,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    mail_sent INTEGER DEFAULT 0, -- 0 = noch nicht in Sammelmail verschickt
    FOREIGN KEY (mangel_id) REFERENCES maengel(id) ON DELETE CASCADE,
    FOREIGN KEY (old_statusComment_id) REFERENCES maengel_kommentare(id) ON DELETE SET NULL,
    FOREIGN KEY (new_statusComment_id) REFERENCES maengel_kommentare(id) ON DELETE SET NULL
  )
`);


// Migration: status Spalte hinzufügen, falls sie in einer alten Version der DB fehlt
try {
  db.exec("ALTER TABLE maengel ADD COLUMN status TEXT NOT NULL DEFAULT 'Gemeldet' CHECK (status IN ('Gemeldet', 'Akzeptiert', 'Abgelehnt', 'In Bearbeitung', 'Behoben'))");
} catch {
  // Falls die Spalte schon existiert oder ein anderer Fehler auftritt, ignorieren wir das hier
}

try {
  db.exec("ALTER TABLE maengel DROP COLUMN statusComment"); 
} catch {
  // Falls die Spalte schon gelöscht wurde oder ein anderer Fehler auftritt, ignorieren wir das hier
}
try {
  db.exec("ALTER TABLE maengel ADD COLUMN statusComment_id INTEGER"); 
} catch {
  // Falls die Spalte schon existiert oder ein anderer Fehler auftritt, ignorieren wir das hier
}
try {
  db.exec("ALTER TABLE maengel ADD COLUMN FOREIGN KEY (statusComment_id) REFERENCES maengel_kommentare(id) ON DELETE SET NULL")
} catch{/*nix machen, wie sonst auch*/}

// Migration: kategorie Spalte hinzufügen, falls sie in einer alten Version der DB fehlt
try {
  db.exec("ALTER TABLE maengel ADD COLUMN kategorie TEXT");
} catch {
  // Falls die Spalte schon existiert oder ein anderer Fehler auftritt, ignorieren wir das hier
}
// Migration: kategorie Spalte hinzufügen, falls sie in einer alten Version der DB fehlt
try {
  db.exec("FOREIGN KEY (kategorie) REFERENCES kategorien(kategorieelem) ON DELETE SET NULL");
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

// Migration: is_deleted Spalte hinzufügen, falls sie fehlt
try {
  db.exec("ALTER TABLE maengel ADD COLUMN is_deleted INTEGER DEFAULT 0");
} catch {
  // Falls die Spalte schon existiert, ignorieren
}

// Migration: is_private Spalte hinzufügen, falls sie fehlt
try {
  db.exec("ALTER TABLE maengel ADD COLUMN is_private INTEGER DEFAULT 0");
} catch {
  // Falls die Spalte schon existiert, ignorieren
}

try {
  db.exec("ALTER TABLE status_changes ADD COLUMN old_statusComment_id INTEGER")
} catch {/*nix machen, wie sonst auch*/}
try {
  db.exec("ALTER TABLE status_changes ADD COLUMN new_statusComment_id INTEGER")
} catch{/*nix machen, wie sonst auch*/}
try {
  db.exec("ALTER TABLE status_changes ADD COLUMN FOREIGN KEY (old_statusComment_id) REFERENCES maengel_kommentare(id) ON DELETE SET NULL")
} catch{/*nix machen, wie sonst auch*/}
try {
  db.exec("ALTER TABLE status_changes ADD COLUMN FOREIGN KEY (new_statusComment_id) REFERENCES maengel_kommentare(id) ON DELETE SET NULL")
} catch{/*nix machen, wie sonst auch*/}
try {
  db.exec("ALTER TABLE status_changes DROP COLUMN new_statusComment")
} catch{/*nix machen, wie sonst auch*/}
try {
  db.exec("ALTER TABLE status_changes DROP COLUMN old_statusComment")
} catch{/*nix machen, wie sonst auch*/}

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

try {
  db.exec("INSERT INTO kategorien (kategorieelem) VALUES ('Steckdose'), ('Schlagloch'), ('WLAN'), ('Mobiliar'), ('Andere')");
} catch {
  // Falls die Spalte schon existiert oder ein anderer Fehler auftritt, ignorieren wir das hier
}


db.exec(`
  CREATE TABLE IF NOT EXISTS maengel_kommentare (
    user_id INTEGER NOT NULL,
    mangel_id INTEGER NOT NULL,
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kommentar TEXT DEFAULT NULL CHECK(LENGTH(kommentar) <= 255 OR kommentar IS NULL),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mangel_id) REFERENCES maengel(id) ON DELETE CASCADE
  )
`);

try {
  db.exec("ALTER TABLE maengel_kommentare ADD COLUMN kommentar TEXT DEFAULT NULL CHECK(LENGTH(kommentar) <= 255 OR kommentar IS NULL)")
} catch{/*nix machen, wie sonst auch*/}


// Tabelle für follows, damit ein Nutzer anderen Nutzern folgen kann
db.exec(`
  CREATE TABLE IF NOT EXISTS follows (
    follower_id INTEGER NOT NULL,
    followed_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, followed_id),
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (followed_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS newsfeed (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    mangel_id INTEGER NULL,
    newskommentar TEXT DEFAULT NULL CHECK(LENGTH(newskommentar) <= 255 OR newskommentar IS NULL),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mangel_id) REFERENCES maengel(id) ON DELETE CASCADE
  )
`);

// Tabelle für Moderation
db.exec(`
  CREATE TABLE IF NOT EXISTS content_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mangel_id INTEGER,
    comment_id INTEGER,
    reporter_id INTEGER NOT NULL,
    report_reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'offen' CHECK (status IN ('offen', 'angenommen', 'abgelehnt')),
    admin_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mangel_id) REFERENCES maengel(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES maengel_kommentare(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS mangel_reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    mangel_id INTEGER NOT NULL,
    emoji TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, mangel_id, emoji),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mangel_id) REFERENCES maengel(id) ON DELETE CASCADE
  )
`);


export default db;
