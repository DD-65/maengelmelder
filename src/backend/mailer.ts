import nodemailer from "nodemailer";
 

type VerificationMailInput = {
  to: string;
  verifyUrl: string;
};

type PasswordResetMailInput = {
  to: string;
  resetPasswordUrl: string;
};

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Umgebungsvariable ${name} fehlt`);
  }
  return value;
}

function createTransporter() {
  const host = requiredEnv("SMTP_HOST");
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true";
  const user = requiredEnv("SMTP_USER");
  const pass = requiredEnv("SMTP_PASS");

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

export async function sendVerificationEmail({ to, verifyUrl }: VerificationMailInput) {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from,
    to,
    subject: "Mängelmelder: Bitte bestätige deine E-Mail-Adresse",
    text: [
      "Bitte bestätige deine E-Mail-Adresse für den RPTU-Mängelmelder.",
      "",
      `Link: ${verifyUrl}`,
      "",
      "Falls du dich nicht registriert hast, kannst du diese E-Mail ignorieren.",
    ].join("\n"),
    html: `
      <p>Bitte bestätige deine E-Mail-Adresse für den Mängelmelder.</p>
      <p><a href="${verifyUrl}">E-Mail-Adresse bestätigen</a></p>
      <p>Falls du dich nicht registriert hast, kannst du diese E-Mail ignorieren.</p>
    `,
  });
}

export async function sendPasswordResetEmail({ to, resetPasswordUrl }: PasswordResetMailInput) {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from,
    to,
    subject: "Mängelmelder: Passwort für Mängelmelder zurücksetzen",
    text: [
      "Für deinen Mängelmelder-Account wurde eine Passwort-Änderung angefordert. Falls du das warst, klicke bitte auf den folgenden Link, um dein Passwort zurückzusetzen:",
      "",
      `Link: ${resetPasswordUrl}`,
      "",
      "Falls du das nicht warst, kannst du diese E-Mail ignorieren. Dein Passwort bleibt unverändert.",
    ].join("\n"),
    html: `
      <p>Für deinen Mängelmelder-Account wurde eine Passwort-Änderung angefordert. Falls du das warst, klicke bitte auf den folgenden Link, um dein Passwort zurückzusetzen:</p>
      <p><a href="${resetPasswordUrl}">Passwort zurücksetzen</a></p>
      <p>Falls du das nicht warst, kannst du diese E-Mail ignorieren. Dein Passwort bleibt unverändert.</p>
    `,
  });
}

// Benachrichtigung bei Statusänderungen eines Mangels.

export async function sendStatusUpdateEmail(to: string, title: string, status: string, statusComment?: string) {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from,
    to,
    subject: `Status-Update: ${title}`,
    text: `Der Status deines Mangels "${title}" wurde auf "${status}" geändert. Begründung: "${statusComment}"`,
    html: `
      <p>Hallo,</p>
      <p>der Status deines Mangels <strong>"${title}"</strong> wurde auf <strong>"${status}"</strong> geändert. Begründung: <strong>"${statusComment}"</strong></p>
    `,
  });
}


// Benachrichtigung für die Inhalts-Moderation

export async function sendModerationEmail(to: string, title: string, type: 'reporter_accepted' | 'reporter_rejected' | 'creator_deleted', adminReason: string) {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  let subject = "";
  let messageHtml = "";

  if (type === 'reporter_accepted') {
    subject = `Rückmeldung zu deiner Meldung: ${title}`;
    messageHtml = `deine Meldung bezüglich des Mangels <strong>"${title}"</strong> wurde von einem Administrator <strong>akzeptiert</strong> und der betroffene Inhalt entfernt.`;
  } else if (type === 'reporter_rejected') {
    subject = `Rückmeldung zu deiner Meldung: ${title}`;
    messageHtml = `deine Meldung bezüglich des Mangels <strong>"${title}"</strong> wurde von einem Administrator <strong>abgewiesen</strong>. Der Inhalt bleibt bestehen.`;
  } else if (type === 'creator_deleted') {
    subject = `Moderations-Eingriff: ${title}`;
    messageHtml = `dein gemeldeter Mangel <strong>"${title}"</strong> wurde nach einer Überprüfung durch einen Administrator <strong>entfernt</strong>.`;
  }

  const messageText = messageHtml.replace(/<strong>/g, '').replace(/<\/strong>/g, '');

  await transporter.sendMail({
    from,
    to,
    subject,
    text: `Hallo,\n\n${messageText}\n\nBegründung der Moderation: "${adminReason}"`,
    html: `
      <p>Hallo,</p>
      <p>${messageHtml}</p>
      <p>Begründung der Moderation: <br/><strong>"${adminReason}"</strong></p>
    `,
  });
}