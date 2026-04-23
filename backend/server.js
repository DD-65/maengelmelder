import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import db from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.join(__dirname, "../frontend/dist");

// app erzeugung
const app = express();

// Port auf dem das backend läuft
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Testen
app.get("/health", (req, res) => {
  res.send("backend läuft!!");
});

// testweise Mängel laden
app.get("/api/mangel", (req, res) => {
  try {
    // prepared statement
    const stmt = db.prepare(`
      SELECT id, title, description, location, created_at, votes
      FROM maengel
      ORDER BY created_at DESC, votes DESC
    `);
    // statement ausführen
    const maengel = stmt.all();
    res.json(maengel);
  } catch (error) {
    // fehler ausgeben falls er auftritt
    console.error(error);
    res.status(500).json({ error: "Fehler beim laden der Mängel" });
  }
});

// neuen Mangel (-> mit post request)
app.post("/api/mangel", (req, res) => {
  try {
    const { title, description, location } = req.body;

    // wenn titel leer -> fehler
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Titel darf nicht leer sein" });
    }

    if (location && location.trim().length > 255) {
      return res.status(400).json({ error: "Fundort darf maximal 255 Zeichen lang sein" });
    }

    if (description && description.trim().length > 255) {
      return res.status(400).json({ error: "Beschreibung darf maximal 255 Zeichen lang sein" });
    }

    
    // TODO: brauchen wir noch mehr validierung? (z.B. bestimmte (sonder-)zeichen, etc)

    // prepared statement für mangelerzeugung
    const stmt = db.prepare(`
      INSERT INTO maengel (title, description, location)
      VALUES (?, ?, ?)
    `);
      
    // statement ausführen und so erzeugten Datensatz speichern
    const result = stmt.run(title.trim(), description, location);

    res.status(201).json({
      message: "Mangel gespeichert!",
      // id = id des neu angelegten datensatzes
      id: result.lastInsertRowid
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Fehler beim speichern des Mangels" });
  }
});

// fetching number of votes
app.patch("/api/mangel/:id/vote", (req, res) => {
  try {
    const id = req.params.id;

    // incrementing number of votes by 1
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

app.use(express.static(frontendDistPath));

app.get(/^(?!\/api(?:\/|$)).*/, (req, res) => {
  res.sendFile(path.join(frontendDistPath, "index.html"));
});

// backend starten 
app.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
});
