import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import bcrypt from "bcryptjs";
import session from "express-session";
import crypto from "node:crypto";
import { fileURLToPath } from "url";
import type { Request, Response, NextFunction } from "express";
import db from "./db.js";
import { sendVerificationEmail } from "./mailer.js";
import multer from "multer";
import fs from "fs";
import sharp from "sharp";

import { basicAuth } from "./middleware/basicAuth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(basicAuth); //auskommentieren um Basic Auth zu deaktivieren

const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === "production";
const allowedKategorien = ["Steckdose", "Schlagloch", "WLAN", "Mobiliar", "Andere"];
const emailTokenTtlMinutes = Number(process.env.EMAIL_TOKEN_TTL_MINUTES || 60);
const emailVerificationResendDelayMs = 60 * 1000;
// Das Regex enthält bewusst Escapes, die ESLint sonst als unnötig markiert.
// eslint-disable-next-line no-useless-escape
const emailPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

app.use(cors());
app.use(express.json());

app.set("trust proxy", 1);

// session config: 
app.use(session({
  secret: process.env.SESSION_SECRET || "sehr-geheimes-session-cookie-secret-zum-signieren",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: 1000 * 60 * 60 * 24
  }
}));

// Multer Setup für Dateiuploads
const upDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(upDir)) {
  fs.mkdirSync(upDir);
}

const storage = multer.memoryStorage();

// Storage size limit of 10MB for initial upload
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024} });

app.use("/uploads", express.static(upDir));

function hashEmailVerificationToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getAppBaseUrl(req: Request) {
  const configuredBaseUrl = process.env.APP_BASE_URL?.trim();
  const baseUrl = configuredBaseUrl || `${req.protocol}://${req.get("host")}`;
  return baseUrl.replace(/\/$/, "");
}

function createEmailVerificationToken(userId: number) {
  const now = new Date();
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashEmailVerificationToken(rawToken);
  const expiresAt = new Date(now.getTime() + emailTokenTtlMinutes * 60 * 1000).toISOString();

  const result = db.prepare(`
    INSERT INTO email_verification_tokens (user_id, token_hash, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `).run(userId, tokenHash, expiresAt, now.toISOString());

  return {
    id: Number(result.lastInsertRowid),
    rawToken,
  };
}

function markOtherEmailVerificationTokensUsed(userId: number, currentTokenId: number) {
  db.prepare(`
    UPDATE email_verification_tokens
    SET used_at = ?
    WHERE user_id = ?
      AND id <> ?
      AND used_at IS NULL
  `).run(new Date().toISOString(), userId, currentTokenId);
}

async function issueEmailVerificationMail(userId: number, email: string, req: Request) {
  const token = createEmailVerificationToken(userId);
  const verifyUrl = `${getAppBaseUrl(req)}/verify-email?token=${encodeURIComponent(token.rawToken)}`;

  await sendVerificationEmail({
    to: email,
    verifyUrl,
  });

  markOtherEmailVerificationTokensUsed(userId, token.id);
}

function canSendVerificationMail(userId: number) {
  const lastToken = db.prepare(`
    SELECT created_at
    FROM email_verification_tokens
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(userId) as { created_at: string } | undefined;

  if (!lastToken) return true;

  return Date.now() - new Date(lastToken.created_at).getTime() >= emailVerificationResendDelayMs;
}


// --- API Endpunkte
// Mängel laden
app.get("/api/mangel", (req, res) => {
  try {
    const userId = req.session.userId ?? null;
    const isArchive = req.query.archiv === "true";

    let role = "user";
    if (userId) {
      const user = db.prepare("SELECT role FROM users WHERE id = ?").get(userId) as { role: string } | undefined;
      if (user) role = user.role;
    }

    let whereClause = "";
    const params: any[] = [userId, userId];

    if (isArchive) {
      if (role === "admin") {
        whereClause = "WHERE maengel.status = 'Behoben'";
      } else if (userId) {
        whereClause = "WHERE maengel.status = 'Behoben' AND maengel.user_id = ?";
        params.push(userId);
      } else {
        return res.json([]);
      }
    } else {
      whereClause = "WHERE maengel.status != 'Behoben' OR maengel.status IS NULL";
    }

    // statement um mängel zu laden, join auf der votes tabelle um die votes zu laden / zu prüfen ob nutzer schon gevotet haben
    const stmt = db.prepare(`
      SELECT
        maengel.id,
        maengel.title,
        maengel.description,
        maengel.location,
        maengel.status,
        maengel.kategorie,
        maengel.created_at,
        maengel.votes,
        maengel.image_url,
        maengel.thumbnail_url,
        users.email AS user_email,
        CASE
          WHEN ? IS NULL THEN 0
          ELSE EXISTS (
            SELECT 1
            FROM mangel_votes
            WHERE mangel_votes.user_id = ?
              AND mangel_votes.mangel_id = maengel.id
          )
        END AS has_voted
      FROM maengel
      LEFT JOIN users ON maengel.user_id = users.id
      ${whereClause}
      ORDER BY maengel.votes DESC, maengel.created_at DESC
    `);
    const maengel = stmt.all(...params);
    res.json(maengel);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Fehler beim laden der Mängel" });
  }
});

// Status eines Mangels aktualisieren (nur Admin)
app.patch("/api/mangel/:id/status", requireAuth, (req, res) => {
  try {
    const userId = req.session.userId;
    const mangelId = Number(req.params.id);
    const { status } = req.body;

    // Prüfen, ob der Nutzer Admin ist
    const user = db.prepare("SELECT role FROM users WHERE id = ?").get(userId) as { role: string };
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Nur Administratoren dürfen den Status ändern" });
    }

    // Status validieren
    const allowedStatus = ["Gemeldet", "Akzeptiert", "Abgelehnt", "In Bearbeitung", "Behoben"];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ error: "Ungültiger Status" });
    }

    const stmt = db.prepare("UPDATE maengel SET status = ? WHERE id = ?");
    const result = stmt.run(status, mangelId);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Mangel nicht gefunden" });
    }

    res.json({ message: "Status erfolgreich aktualisiert" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Fehler beim Aktualisieren des Status" });
  }
});

// neuen Mangel anlegen
app.post("/api/mangel", requireAuth, upload.single("image"), async (req, res) => {
  try {
    const { title, description, location, kategorie } = req.body;

    // Image Pathing
    let imageUrl = null;
    let thumbnailUrl = null;

    // Image Processing
    if (req.file) {
      const baseName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
      const fileNameBig = `${baseName}-original.jpg`;
      const fileNameThumb = `${baseName}-thumb.jpg`;

      const filePathBig = path.join(upDir, fileNameBig);
      const filePathThumb = path.join(upDir, fileNameThumb);

      // Just convertion for the original file
      await sharp(req.file.buffer).jpeg({ quality: 100 }).toFile(filePathBig);

      // Thumbnails also gets resized
      await sharp(req.file.buffer).resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 80 }).toFile(filePathThumb);

      imageUrl = `/uploads/${fileNameBig}`;
      thumbnailUrl = `/uploads/${fileNameThumb}`;

    }


    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Titel darf nicht leer sein" });
    }

    if (location && location.trim().length > 255) {
      return res.status(400).json({ error: "Fundort darf maximal 255 Zeichen lang sein" });
    }

    if (description && description.trim().length > 255) {
      return res.status(400).json({ error: "Beschreibung darf maximal 255 Zeichen lang sein" });
    }

    const normalizedKategorie =
      typeof kategorie === "string" && kategorie.trim() ? kategorie.trim() : null;

    if (normalizedKategorie && !allowedKategorien.includes(normalizedKategorie)) {
      return res.status(400).json({ error: "Ungültige Kategorie" });
    }

    // userid aus sessioncookie (Durch login endpunkt gesetzt)
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

// Mangel löschen (nur Admin oder Ersteller)
app.delete("/api/mangel/:id", requireAuth, (req, res) => {


    const userId = req.session.userId;
    const mangelId = Number(req.params.id);

    if (!Number.isInteger(mangelId)) {
      return res.status(400).json({ error: "Ungültige Mangel-ID" });
    }
    
    const mangel = db
      .prepare("SELECT user_id, image_url, thumbnail_url FROM maengel WHERE id = ?")
      .get(mangelId) as { user_id: number; image_url: string | null; thumbnail_url: string | null } | undefined;
    if (!mangel) {
      return res.status(404).json({ error: "Mangel nicht gefunden" });
    }
    // Prüfen, ob der Nutzer Admin ist
    const user = db.prepare("SELECT role FROM users WHERE id = ?").get(userId) as { role: string };
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Nur Administratoren dürfen den Status ändern" });
    }

    const stmt = db.prepare("DELETE FROM maengel WHERE id = ?");
    const result = stmt.run(mangelId);

    res.json({ message: "Mangel erfolgreich gelöscht" });

    if (result.changes === 0) {
      return res.status(404).json({ error: "Mangel nicht gefunden" });
    }
    // Falls ein Bild existiert, könnte man dieses ebenfalls löschen
});

// voten (braucht login)
app.patch("/api/mangel/:id/vote", requireAuth, (req, res) => {
  try {
    const userId = req.session.userId;
    const mangelId = Number(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: "Nicht angemeldet" });
    }

    if (!Number.isInteger(mangelId)) {
      return res.status(400).json({ error: "Ungültige Mangel-ID" });
    }

    const mangel = db
      .prepare("SELECT id FROM maengel WHERE id = ?")
      .get(mangelId) as { id: number } | undefined;

    if (!mangel) {
      return res.status(404).json({ error: "Zu bewertender Mangel nicht gefunden" });    
    }

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
    if (error && typeof error === "object" && "code" in error && String(error.code).startsWith("SQLITE_CONSTRAINT")) {
      return res.status(409).json({ error: "Du hast diesen Mangel bereits bewertet" });
    }

    console.error(error)
    res.status(500).json({ error: "Fehler beim Bewerten"})
  }
});

// -- Login & Registrierung zeugs

// registrieren
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, adminSecret } = req.body;
    
    // falls email oder passwort fehlen, fehler zurückgeben
    if (!email || !password) {
      return res.status(400).json({ error: "Email und Passwort erforderlich" });
    }
    // email normalisieren
    const normalizedEmail = email.trim().toLowerCase();

    // email mit regex validieren
    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({ error: "Ungültiges Email-Format" });
    }
    
    // passwortlänge (mindestens 8 Zeichen laut neuen Regeln)
    if (password.length < 8) {
      return res.status(400).json({ error: "Passwort muss mindestens 8 Zeichen lang sein" });
    }

    // falls email schon existiert, fehler zurückgeben
    const existingUser = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(normalizedEmail) as { id: number } | undefined;

    if (existingUser) {
      return res.status(400).json({ error: "Email bereits registriert" });
    }

    // Bestimme die Rolle basierend auf dem adminSecret
    const ADMIN_REGISTRATION_SECRET = "IchBinAdmin";
    const role = adminSecret === ADMIN_REGISTRATION_SECRET ? "admin" : "user";

    // passwort hashen (bycrypt mit salt länge 12)
    const passwordHash = await bcrypt.hash(password, 12);
    const stmt = db.prepare("INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)");
    // neuen Nutzer in db speichern
    const result = stmt.run(normalizedEmail, passwordHash, role);

    const userId = Number(result.lastInsertRowid);
    let verificationEmailSent = true;

    try {
      await issueEmailVerificationMail(userId, normalizedEmail, req);
    } catch (mailError) {
      verificationEmailSent = false;
      console.error("Verifizierungs-E-Mail konnte nicht gesendet werden:", mailError);
    }

    // Erfolg zurückgeben
    res.status(201).json({
      message: verificationEmailSent
        ? "Registrierung erfolgreich. Bitte bestätige deine E-Mail-Adresse."
        : "Registrierung erfolgreich, aber die Verifizierungs-E-Mail konnte nicht gesendet werden.",
      userId,
      verificationEmailSent,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Fehler bei der Registrierung" });
  }
});

// email verifizieren
app.get("/api/auth/verify-email", (req, res) => {
  try {
    const token = typeof req.query.token === "string" ? req.query.token : "";

    if (!token) {
      return res.status(400).json({ error: "Verifizierungstoken fehlt" });
    }

    const tokenHash = hashEmailVerificationToken(token);
    const tokenRow = db.prepare(`
      SELECT
        email_verification_tokens.id,
        email_verification_tokens.user_id,
        email_verification_tokens.expires_at,
        email_verification_tokens.used_at,
        users.email_verified_at
      FROM email_verification_tokens
      JOIN users ON users.id = email_verification_tokens.user_id
      WHERE email_verification_tokens.token_hash = ?
    `).get(tokenHash) as {
      id: number;
      user_id: number;
      expires_at: string;
      used_at: string | null;
      email_verified_at: string | null;
    } | undefined;

    if (!tokenRow) {
      return res.status(400).json({ error: "Verifizierungstoken ist ungültig" });
    }

    if (tokenRow.email_verified_at) {
      if (!tokenRow.used_at) {
        db.prepare("UPDATE email_verification_tokens SET used_at = ? WHERE id = ?")
          .run(new Date().toISOString(), tokenRow.id);
      }

      return res.json({ message: "E-Mail-Adresse erfolgreich verifiziert" });
    }

    if (tokenRow.used_at) {
      return res.status(400).json({ error: "Verifizierungstoken ist ungültig" });
    }

    if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
      db.prepare("UPDATE email_verification_tokens SET used_at = ? WHERE id = ?")
        .run(new Date().toISOString(), tokenRow.id);
      return res.status(400).json({ error: "Verifizierungstoken ist abgelaufen" });
    }

    const now = new Date().toISOString();
    const verifyTransaction = db.transaction(() => {
      db.prepare(`
        UPDATE users
        SET email_verified_at = COALESCE(email_verified_at, ?)
        WHERE id = ?
      `).run(now, tokenRow.user_id);

      db.prepare(`
        UPDATE email_verification_tokens
        SET used_at = ?
        WHERE user_id = ?
          AND used_at IS NULL
      `).run(now, tokenRow.user_id);
    });

    verifyTransaction();

    res.json({ message: "E-Mail-Adresse erfolgreich verifiziert" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Fehler bei der E-Mail-Verifizierung" });
  }
});

// verifizierungs-email erneut senden
app.post("/api/auth/resend-verification-email", requireAuth, async (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, email, email_verified_at
      FROM users
      WHERE id = ?
    `).get(req.session.userId) as {
      id: number;
      email: string;
      email_verified_at: string | null;
    } | undefined;

    if (!user) {
      return res.status(401).json({ error: "Nicht angemeldet" });
    }

    if (user.email_verified_at) {
      return res.json({ message: "E-Mail-Adresse ist bereits verifiziert", emailVerified: true });
    }

    if (!canSendVerificationMail(user.id)) {
      return res.status(429).json({ error: "Bitte warte kurz, bevor du erneut eine E-Mail anforderst" });
    }

    await issueEmailVerificationMail(user.id, user.email, req);

    res.json({ message: "Verifizierungs-E-Mail wurde gesendet", emailVerified: false });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Verifizierungs-E-Mail konnte nicht gesendet werden" });
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

    // wenn man schon eingeloggt ist darf man nicht
    if (req.session.userId) {
      return res.status(400).json({ error: "Bereits eingeloggt" });
    }

    const user = db
      .prepare("SELECT id, email, password_hash, role, email_verified_at FROM users WHERE email = ?")
      .get(normalizedEmail) as { id: number; email: string; password_hash: string; role: string; email_verified_at: string | null } | undefined;

    if (!user) {
      return res.status(401).json({ error: "Ungültige Anmeldedaten" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Ungültige Anmeldedaten" });
    }
    // session speichern
    req.session.userId = user.id;

    res.json({
      message: "Login erfolgreich",
      userId: user.id,
      email: user.email,
      role: user.role,
      emailVerified: Boolean(user.email_verified_at),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Fehler beim Login" });
  }
}); 

// endpunkt um zu prüfen ob man angemeldet ist (via sessions)
app.get("/api/auth/me", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Nicht angemeldet" });
  }

  const user = db
    .prepare("SELECT id, email, role, email_verified_at FROM users WHERE id = ?")
    .get(req.session.userId) as { id: number; email: string; role: string; email_verified_at: string | null } | undefined;

  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: "Nicht angemeldet" });
  }
  
  res.json({
    userId: user.id,
    email: user.email,
    role: user.role,
    emailVerified: Boolean(user.email_verified_at),
  });
});

// logout endpunkt
app.post("/api/auth/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({ error: "Fehler beim Logout" });
    }
    
    res.clearCookie("connect.sid");
    res.json({ message: "Logout erfolgreich" });
  });
});

// helper um routes login brauchen zu lassen
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Nicht angemeldet" });
  }
  next();
}

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
  app.use((req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
});
