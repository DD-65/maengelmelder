import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import db from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === "production";

app.use(cors());
app.use(express.json());

// API Routes
app.get("/health", (req, res) => {
  res.send("backend läuft!!");
});

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
