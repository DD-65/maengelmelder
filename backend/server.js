import express from "express";
import cors from "cors";
import db from "./db.js";

// app erzeugung
const app = express();

// Port auf dem das backend läuft
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Testen
app.get("/", (req, res) => {
  res.send("backend läuft!!");
});

// testweise Mängel laden
app.get("/api/mangel", (req, res) => {
  try {
    // prepared statement
    const stmt = db.prepare(`
      SELECT id, title, created_at
      FROM maengel
      ORDER BY created_at DESC
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
    const { title } = req.body;

    // wenn titel leer -> fehler
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Titel darf nicht leer sein" });
    }
    // TODO: brauchen wir noch mehr validierung? (z.B. max länge, bestimmte (sonder-)zeichen, etc)

    // prepared statement für mangelerzeugung
    const stmt = db.prepare(`
      INSERT INTO maengel (title)
      VALUES (?)
    `);

    // statement ausführen und so erzeugten Datensatz speichern
    const result = stmt.run(title.trim());

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

// backend starten 
app.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
});
