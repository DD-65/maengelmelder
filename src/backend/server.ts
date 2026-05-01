import express from "express";
import cors from "cors";
import path from "path";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";
import db from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === "production";

app.use(cors());
app.use(express.json());

// --- API Endpunkte
// Mängel laden
app.get("/api/mangel", (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT id, title, description, location, created_at, votes
      FROM maengel
      ORDER BY created_at DESC, votes DESC
    `);
    const maengel = stmt.all();
    res.json(maengel);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Fehler beim laden der Mängel" });
  }
});

// neuen Mangel anlegen
app.post("/api/mangel", (req, res) => {
  try {
    const { title, description, location } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Titel darf nicht leer sein" });
    }

    if (location && location.trim().length > 255) {
      return res.status(400).json({ error: "Fundort darf maximal 255 Zeichen lang sein" });
    }

    if (description && description.trim().length > 255) {
      return res.status(400).json({ error: "Beschreibung darf maximal 255 Zeichen lang sein" });
    }

    const stmt = db.prepare(`
      INSERT INTO maengel (title, description, location)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(title.trim(), description, location);

    res.status(201).json({
      message: "Mangel gespeichert!",
      id: result.lastInsertRowid
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Fehler beim speichern des Mangels" });
  }
});

// voten
app.patch("/api/mangel/:id/vote", (req, res) => {
  try {
    const id = req.params.id;
    const incr = db.prepare(`
      UPDATE maengel
      SET votes = votes + 1
      WHERE id = ?
    `);
    const result = incr.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Zu bewertender Mangel nicht gefunden" });    
    }

    res.json({ message: "Bewertung erfolgreich" });
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Fehler beim Bewerten"})
  }
});

// -- Login & Registrierung zeugs

// registrieren
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // falls email oder passwort fehlen, fehler zurückgeben
    if (!email || !password) {
      return res.status(400).json({ error: "Email und Passwort erforderlich" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    // falls email schon existiert, fehler zurückgeben
    const existingUser = db.prepare("SELECT id FROM users WHERE email = ?").get(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({ error: "Email bereits registriert" });
    }

    // passwort hashen (bycrypt mit salt länge 12)
    const passwordHash = await bcrypt.hash(password, 12);
    const stmt = db.prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)");
    // neuen Nutzer in db speichern
    const result = stmt.run(normalizedEmail, passwordHash);

    // Erfolg zurückgeben
    res.status(201).json({ message: "Registrierung erfolgreich", userId: result.lastInsertRowid });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Fehler bei der Registrierung" });
  }
});

// login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email und Passwort erforderlich" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = db.prepare("SELECT id, password_hash FROM users WHERE email = ?").get(normalizedEmail);
    if (!user) {
      return res.status(400).json({ error: "Ungültige Anmeldedaten" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: "Ungültige Anmeldedaten" });
    }

    res.json({ message: "Login erfolgreich", userId: user.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Fehler beim Login" });
  }
}); 

// Vite Integration
if (!isProd) {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(__dirname, "../../dist/frontend");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
});
