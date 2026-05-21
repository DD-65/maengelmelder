
import type { Request, Response, NextFunction } from 'express';

export function basicAuth(req: Request, res: Response, next: NextFunction) {

  const auth = req.headers.authorization;
  if (auth?.startsWith('Basic ')) {
    const [user, pass] = Buffer.from(auth.slice(6), 'base64').toString().split(':');
    if (user === process.env.BASIC_AUTH_USER && pass === process.env.BASIC_AUTH_PASS) {
      return next();
    }
  }
  res.setHeader('WWW-Authenticate', 'Basic realm="Restricted"');
  return res.status(401).send('<div style="text-align: center;"><h1 style="color: red;"> Zugang nur für Mitglieder des Entwicklungsteams</h1><h2>Bitte wenden sie sich an einen Administrator</h2></div>');
}