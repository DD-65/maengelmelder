import nodemailer from "nodemailer";

// TODO: function sendStatusUpdateEmail implementieren, die createTransporter() nutzt 

type VerificationMailInput = {
  to: string;
  verifyUrl: string;
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
