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
import { sendVerificationEmail, sendStatusUpdateEmail } from "./mailer.js";

import { basicAuth } from "./middleware/basicAuth.js";
import { createIssueRouter, issueUploadDir } from "./issues/issueRoutes.js";


// TODO: Nach DB Update prüfen, ob E-Mail des Users verifiziert ist, ob notification_interval === 0 und nur falls ja dann sendStatusUpdateEmail aufrufen
// TODO: Hintergrundskript/setInterval implementieren für die Sammelmails

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === "production";
const emailTokenTtlMinutes = Number(process.env.EMAIL_TOKEN_TTL_MINUTES || 60);
const emailVerificationResendDelayMs = 60 * 1000;
// Das Regex enthält bewusst Escapes, die ESLint sonst als unnötig markiert.
// eslint-disable-next-line no-useless-escape
const emailPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

type UserToNotify = {
  id: number;
  email: string;
  notification_interval: number;
  last_summary_email_at: string | null;
};

type StatusChangeToNotify = {
  id: number;
  new_status: string;
  title: string;
};

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

app.use(basicAuth); //AUSKOMMENTIEREN UM BASIC AUTH ZU DEAKTIVIEREN

app.use("/uploads", express.static(issueUploadDir));
app.use(createIssueRouter({ requireAuth }));

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

// -- Login & Registrierung zeugs

// registrieren
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, 
      password, 
      // adminSecret 
    } = req.body;
    
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
    // const ADMIN_REGISTRATION_SECRET = "IchBinAdmin";
    // const role = adminSecret === ADMIN_REGISTRATION_SECRET ? "admin" : "user";
    const role = "user";
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
    .prepare("SELECT id, email, role, email_verified_at, notification_interval AS notificationInterval FROM users WHERE id = ?")
    .get(req.session.userId) as { id: number; email: string; role: string; email_verified_at: string | null; notificationInterval: number } | undefined;

  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: "Nicht angemeldet" });
  }
  
  res.json({
    userId: user.id,
    email: user.email,
    role: user.role,
    emailVerified: Boolean(user.email_verified_at),
    notificationInterval: user.notificationInterval,
  });
});

// logout endpunkt
app.post("/api/auth/logout", (req, res) => {
  //Nicht die ganze Session zerstören, da sonst auch die Basic Auth (isTeamAuthenticated) verloren geht und Chromium sofort ein neues Popup zeigt.
  // Nur userId löschen, um den Nutzer auszuloggen.
  if (req.session) {
    req.session.userId = undefined;
    // Optional: Falls  die Session trotzdem weggeschrieben werden soll
    req.session.save((err) => {
      if (err) {
        return res.status(500).json({ error: "Fehler beim Logout" });
      }
      res.json({ message: "Logout erfolgreich" });
    });
  } else {
    res.json({ message: "Logout erfolgreich" });
  }
});

// helper um routes login brauchen zu lassen
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Nicht angemeldet" });
  }
  next();
}

// Benachrichtigungs-Intervall ändern
app.patch("/api/auth/settings/notifications", requireAuth, (req, res) => {
  try {
    const { interval } = req.body;
    const userId = req.session.userId;

    // 0 = sofort, >0 = Tage
    if (typeof interval !== "number" || interval < 0) {
      return res.status(400).json({ error: "Ungültiges Intervall" });
    }

    db.prepare("UPDATE users SET notification_interval = ? WHERE id = ?")
      .run(interval, userId);

    res.json({ message: "Benachrichtigungs-Einstellungen erfolgreich gespeichert" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Fehler beim Speichern der Einstellungen" });
  }
});




// Kommentare laden aktuell einfach kopie von mangel laden
app.get("/api/comment/:mangelId", (req, res) => {
  try {
    const mangelId = Number(req.params.mangelId);


const stmt = db.prepare(`
      SELECT
        status_changes.new_status AS status,
        maengel_kommentare.kommentar,
        users.email AS userEmail, 
        maengel_kommentare.created_at AS timestamp,
        maengel_kommentare.id AS commentId
      FROM maengel_kommentare LEFT JOIN status_changes
      ON maengel_kommentare.id = status_changes.new_statusComment_id
      LEFT JOIN users
      ON maengel_kommentare.user_id = users.id
      WHERE maengel_kommentare.mangel_id = ?
      ORDER BY maengel_kommentare.created_at ASC
    `);
    const kommentare = stmt.all(mangelId);
    res.json(kommentare);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Fehler beim laden der Kommentare" });
  }
});
// Kommentar schreiben (jede*r)
app.patch("/api/mangel/:id/comment", requireAuth, (req, res) => {
  try {
    const userId = req.session.userId;
    const mangelId = Number(req.params.id);
    const { comment } = req.body;

    // Länge des Kommentar checken
    if (comment && comment.trim().length > 255) {
      return res.status(400).json({ error: "Kommentar darf maximal 255 Zeichen lang sein" });
    }

    //  Prüfen, ob der Mangel noch existiert
    const mangelData = db.prepare(`
      SELECT title, user_id FROM maengel WHERE id = ?
    `).get(mangelId) as { title: string, user_id: number } | undefined;
    if (!mangelData) {
      return res.status(404).json({ error: "Kommentar kann keinem existierenden Mangel zugeordnet werden"})}

    // Update durchführen
    const result = db.prepare("INSERT INTO maengel_kommentare (kommentar, user_id, mangel_id) VALUES (?, ?, ?)").run(comment, userId, mangelId);

    const createdComment = db.prepare(`SELECT mk.kommentar,
                                              users.email AS userEmail, 
                                              mk.created_at AS timestamp,
                                              mk.id AS commentId
                                              FROM maengel_kommentare mk JOIN users ON mk.user_id=users.id WHERE mk.id = ?`).get(result.lastInsertRowid);
    res.status(200).json(createdComment);

  }catch (error) {
    console.error(error);
    res.status(500).json({ error: "Fehler beim Abschicken der Kommentar" });}
});

// Kommentar löschen (nur Admin oder Ersteller)
app.delete("/api/comment/:id", requireAuth, (req, res) => {

    const userId = req.session.userId;
    const commentId = Number(req.params.id);

    if (!Number.isInteger(commentId)) {
      return res.status(400).json({ error: "Ungültige Kommentar-ID" });
    }
    
    const kommentar = db
      .prepare("SELECT user_id, mangel_id FROM maengel_kommentare WHERE id = ?")
      .get(commentId) as { user_id: number; mangel_id: number;} | undefined;
    if (!kommentar) {
      return res.status(404).json({ error: "Kommentar nicht gefunden" });
    }
    // Prüfen, ob der Nutzer Admin ist oder Kommentator*in
    const user = db.prepare("SELECT role FROM users WHERE id = ?").get(userId) as { role: string };
    if (user.role !== "admin" && user.role !== "manager" && userId !== kommentar.user_id) {
      return res.status(403).json({ error: "Nur Administratoren dürfen den Status ändern" });
    }

    const stmt = db.prepare("DELETE FROM maengel_kommentare WHERE id = ?");
    const result = stmt.run(commentId);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Kommentar nicht gefunden" });
    }
    return res.json({ message: "Kommentar endgültig gelöscht" });
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
  app.use((req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}


// Intervallcheck -> Sammelmails
setInterval(async () => {
  console.log("Prüfe auf fällige Sammel-Mails");

  try {
    const usersToNotify = db.prepare(`
      SELECT id, email, notification_interval, last_summary_email_at 
      FROM users 
      WHERE notification_interval > 0 
        AND email_verified_at IS NOT NULL
        AND (last_summary_email_at IS NULL OR 
             datetime(last_summary_email_at, '+' || notification_interval || ' days') <= datetime('now'))
    `).all() as UserToNotify[];

    for (const user of usersToNotify) {
      const changes = db.prepare(`
        SELECT sc.id, sc.new_status, m.title 
        FROM status_changes sc
        JOIN maengel m ON sc.mangel_id = m.id
        WHERE m.user_id = ? AND sc.mail_sent = 0
      `).all(user.id) as StatusChangeToNotify[];

      if (changes.length > 0) {
        const summaryText = changes
          .map(c => `• ${c.title}: Status geändert auf "${c.new_status}"`)
          .join("\n");

        await sendStatusUpdateEmail(user.email, "Deine Mängel-Zusammenfassung", summaryText); 

        const changeIds = changes.map(c => c.id);
        const placeholders = changeIds.map(() => "?").join(",");
        
        db.prepare(`UPDATE status_changes SET mail_sent = 1 WHERE id IN (${placeholders})`)
          .run(...changeIds);
          
        db.prepare("UPDATE users SET last_summary_email_at = ? WHERE id = ?")
          .run(new Date().toISOString(), user.id);

        console.log(`Sammel-Mail an ${user.email} verschickt.`);
      }
    }
  } catch (error) {
    console.error("Fehler im Sammelmail-Job:", error);
  }
}, 1000 * 60 * 60 * 24); // Default: alle 24h

app.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
});
