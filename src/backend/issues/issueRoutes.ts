import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import type { RequestHandler } from "express";
import multer from "multer";
import fs from "fs";
import sharp from "sharp";
import db from "../db.js";
import { sendStatusUpdateEmail } from "../mailer.js";
import { getIssueFilterOptions } from "./filterOptions.js";
import { listIssues } from "./listIssues.js";
import { getIssueMapSummary } from "./mapSummary.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const issueUploadDir = path.join(__dirname, "../../../uploads");
export const allowedKategorien = ["Steckdose", "Schlagloch", "WLAN", "Mobiliar", "Andere"];

// Upload-Ordner anlegen, falls er lokal noch nicht existiert
if (!fs.existsSync(issueUploadDir)) {
  fs.mkdirSync(issueUploadDir);
}

// Bilder erst im Speicher annehmen, danach als Original und Thumbnail speichern
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

type CreateIssueRouterOptions = {
  requireAuth: RequestHandler;
};

// bündelt alle Mängel-Endpunkte, damit server.ts nicht weiter wächst
export function createIssueRouter({ requireAuth }: CreateIssueRouterOptions) {
  const router = express.Router();

  // Filterwerte für die UI laden, unabhängig von der aktuellen Seite
  router.get("/api/mangel/filter-options", (req, res) => {
    try {
      const result = getIssueFilterOptions(req.session.userId ?? null, req.query);
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Fehler beim Laden der Filterwerte" });
    }
  });

  // mapcounter für die Karte laden, unabhängig von der aktuellen Seite
  router.get("/api/mangel/map-summary", (req, res) => {
    try {
      const result = getIssueMapSummary(req.session.userId ?? null, req.query);
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Fehler beim Laden der Kartendaten" });
    }
  });

  // Mängel laden, optional direkt paginiert über page/pageSize
  router.get("/api/mangel", (req, res) => {
    try {
      const result = listIssues({
        userId: req.session.userId ?? null,
        query: req.query,
      });

      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Fehler beim laden der Mängel" });
    }
  });

  // Status eines Mangels aktualisieren (nur Admin und Superadmin)
  router.patch("/api/mangel/:id/status", requireAuth, (req, res) => {
    try {
      // ID und neuer Status kommen aus URL und Body
      const userId = req.session.userId;
      const mangelId = Number(req.params.id);
      const { status, statusComment } = req.body;

      // nur Admins und Superadmins dürfen Status und Archiv-Zustand ändern
      const user = db.prepare("SELECT role FROM users WHERE id = ?").get(userId) as { role: string };
      if (user.role !== "admin" && user.role !== "superadmin") {
        return res.status(403).json({ error: "Nur Administratoren und Superadmins dürfen den Status ändern" });
      }

      // "Gelöscht" ist kein DB-Status, sondern wird über is_deleted abgebildet
      const allowedStatus = ["Gemeldet", "Akzeptiert", "Abgelehnt", "In Bearbeitung", "Behoben", "Gelöscht"];
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({ error: "Ungültiger Status" });
      }

      if (statusComment && statusComment.trim().length > 255) {
        return res.status(400).json({ error: "Statuskommentar darf maximal 255 Zeichen lang sein" });
      }

      // alten Status vorher laden, damit die Status-Historie stimmt
      const oldMangelData = db.prepare(`
        SELECT status, title, user_id, statusComment_id FROM maengel WHERE id = ?
      `).get(mangelId) as { status: string, title: string, user_id: number, statusComment_id: number | null } | undefined;

      if (!oldMangelData) {
        return res.status(404).json({ error: "Mangel nicht gefunden" });
      }

      // Löschen wird als Archivierung gespeichert, nicht als echter Status
      if (status === "Gelöscht") {
        db.prepare("UPDATE maengel SET is_deleted = 1 WHERE id = ?").run(mangelId);
      } else {
        db.prepare("UPDATE maengel SET status = ?, is_deleted = 0 WHERE id = ?").run(status, mangelId);
      }

      // Statuskommentar speichern und am Mangel verknüpfen
      const kommentar = db.prepare("INSERT INTO maengel_kommentare (kommentar, user_id, mangel_id) VALUES (?, ?, ?)").run(statusComment ?? null, userId, mangelId);
      const kommentarId = kommentar.lastInsertRowid;
      db.prepare("UPDATE maengel SET statusComment_id = ? WHERE id = ?").run(kommentarId, mangelId);

      // Statuswechsel für spätere Sammelmails merken
      db.prepare(`
        INSERT INTO status_changes (mangel_id, old_status, new_status, old_statusComment_id, new_statusComment_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(mangelId, oldMangelData.status, status, oldMangelData.statusComment_id, kommentarId);

      const recipient = db.prepare(`
        SELECT email, email_verified_at, notification_interval
        FROM users WHERE id = ?
      `).get(oldMangelData.user_id) as { email: string, email_verified_at: string | null, notification_interval: number } | undefined;

      if (recipient?.email_verified_at && recipient.notification_interval === 0) {
        sendStatusUpdateEmail(recipient.email, oldMangelData.title, status, statusComment).catch(err => {
          console.error("Mail-Fehler:", err);
        });
      }

      res.json({ message: "Status erfolgreich aktualisiert" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Fehler beim Aktualisieren des Status" });
    }
  });

  // neuen Mangel anlegen
  router.post("/api/mangel", requireAuth, upload.single("image"), async (req, res) => {
    try {
      // Formulardaten kommen wegen Bild-Upload aus multipart/form-data
      const { title, description, location, kategorie } = req.body;
      let imageUrl = null;
      let thumbnailUrl = null;

      // hochgeladenes Bild als Original und kleinere Vorschau ablegen
      if (req.file) {
        const baseName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
        const fileNameBig = `${baseName}-original.jpg`;
        const fileNameThumb = `${baseName}-thumb.jpg`;

        const filePathBig = path.join(issueUploadDir, fileNameBig);
        const filePathThumb = path.join(issueUploadDir, fileNameThumb);

        await sharp(req.file.buffer).jpeg({ quality: 100 }).toFile(filePathBig);
        await sharp(req.file.buffer)
          .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toFile(filePathThumb);

        imageUrl = `/uploads/${fileNameBig}`;
        thumbnailUrl = `/uploads/${fileNameThumb}`;
      }

      if (!title || !title.trim()) {
        return res.status(400).json({ error: "Titel darf nicht leer sein" });
      }

      // Textfelder auf die DB-Limits begrenzen
      if (location && location.trim().length > 255) {
        return res.status(400).json({ error: "Fundort darf maximal 255 Zeichen lang sein" });
      }

      if (description && description.trim().length > 255) {
        return res.status(400).json({ error: "Beschreibung darf maximal 255 Zeichen lang sein" });
      }

      const normalizedKategorie =
        typeof kategorie === "string" && kategorie.trim() ? kategorie.trim() : null;

      // Kategorie nur speichern, wenn sie zu unseren erlaubten Werten gehört
      if (normalizedKategorie && !allowedKategorien.includes(normalizedKategorie)) {
        return res.status(400).json({ error: "Ungültige Kategorie" });
      }

      // neuen Mangel mit dem eingeloggten Nutzer verknüpfen
      const userId = req.session.userId;
      const stmt = db.prepare(`
        INSERT INTO maengel (user_id, title, description, location, kategorie, image_url, thumbnail_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(userId, title.trim(), description, location, normalizedKategorie, imageUrl, thumbnailUrl);

      res.status(201).json({
        message: "Mangel gespeichert!",
        id: result.lastInsertRowid
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Fehler beim speichern des Mangels" });
    }
  });

  // Mangel archivieren oder endgültig löschen (nur Admin und Superadmin)
  router.delete("/api/mangel/:id", requireAuth, (req, res) => {
    // permanent=true kommt aus dem Archiv-Dialog für endgültiges Löschen
    const userId = req.session.userId;
    const mangelId = Number(req.params.id);
    const permanent = req.query.permanent === "true";

    if (!Number.isInteger(mangelId)) {
      return res.status(400).json({ error: "Ungültige Mangel-ID" });
    }

    // erst prüfen, ob der Mangel überhaupt existiert
    const mangel = db
      .prepare("SELECT user_id, image_url, thumbnail_url FROM maengel WHERE id = ?")
      .get(mangelId) as { user_id: number; image_url: string | null; thumbnail_url: string | null } | undefined;

    if (!mangel) {
      return res.status(404).json({ error: "Mangel nicht gefunden" });
    }

    // Löschaktionen bleiben admins und superadmins vorbehalten
    const user = db.prepare("SELECT role FROM users WHERE id = ?").get(userId) as { role: string };
    if (user.role !== "admin" && user.role !== "superadmin") {
      return res.status(403).json({ error: "Nur Administratoren und Superadmins dürfen den Status ändern" });
    }

    // permanent=true löscht wirklich aus der DB, sonst landet der Mangel im Archiv
    if (permanent) {
      const result = db.prepare("DELETE FROM maengel WHERE id = ?").run(mangelId);
      if (result.changes === 0) {
        return res.status(404).json({ error: "Mangel nicht gefunden" });
      }
      return res.json({ message: "Mangel endgültig gelöscht" });
    }

    const result = db.prepare("UPDATE maengel SET is_deleted = 1 WHERE id = ?").run(mangelId);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Mangel nicht gefunden" });
    }
    return res.json({ message: "Mangel erfolgreich archiviert" });
  });

  // voten (braucht login)
  router.patch("/api/mangel/:id/vote", requireAuth, (req, res) => {
      // gevotet wird immer für nur einen Mangel aus der URL
      const userId = req.session.userId;
      const mangelId = Number(req.params.id);

      if (!userId) {
        return res.status(401).json({ error: "Nicht angemeldet" });
      }

      if (!Number.isInteger(mangelId)) {
        return res.status(400).json({ error: "Ungültige Mangel-ID" });
      }

      // nicht für gelöschte IDs voten
      const mangel = db
        .prepare("SELECT id FROM maengel WHERE id = ?")
        .get(mangelId) as { id: number } | undefined;

      if (!mangel) {
        return res.status(404).json({ error: "Zu bewertender Mangel nicht gefunden" });
      }

      const existingVote = db.prepare("SELECT user_id, mangel_id FROM mangel_votes WHERE user_id = ? AND mangel_id = ?").get(userId, mangelId);

      if (existingVote) {
        try {
        // wenn schon ein Vote existiert, wird er zurückgenommen (also gelöscht) und der Zähler entsprechend dekrementiert
        const deleteTransaction = db.transaction((transactionUserId: number, transactionMangelId: number) => {
          db.prepare(`
            DELETE FROM mangel_votes
            WHERE user_id = ? AND mangel_id = ?
          `).run(transactionUserId, transactionMangelId);

          db.prepare(`
            UPDATE maengel
            SET votes = votes - 1
            WHERE id = ? and votes > 0
          `).run(transactionMangelId);
        }
        );
        deleteTransaction(userId, mangelId);
        return res.json({ message: "Bewertung zurückgenommen" });
      }catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Fehler beim Zurücknehmen der Bewertung" });
      }
      }else {
        try {

      // wenn kein Vote existiert, wird er neu angelegt und der Zähler inkrementiert

      // Insert und Zähler-Update müssen zusammen passieren
      const voteTransaction = db.transaction((transactionUserId: number, transactionMangelId: number) => {
        db.prepare(`
          INSERT INTO mangel_votes (user_id, mangel_id)
          VALUES (?, ?)
        `).run(transactionUserId, transactionMangelId);

        db.prepare(`
          UPDATE maengel
          SET votes = votes + 1
          WHERE id = ?
        `).run(transactionMangelId);
      });

      voteTransaction(userId, mangelId);

      res.json({ message: "Bewertung erfolgreich" });
    } catch (error) {
      // Unique Constraint verhindert Mehrfachvotes desselben Nutzers (auch wenn es aus der ui eh unmöglich ist)
      if (error && typeof error === "object" && "code" in error && String(error.code).startsWith("SQLITE_CONSTRAINT")) {
        return res.status(409).json({ error: "Du hast diesen Mangel bereits bewertet" });
      }

      console.error(error);
      res.status(500).json({ error: "Fehler beim Bewerten" });
    }
    }
  });

  return router;
}
