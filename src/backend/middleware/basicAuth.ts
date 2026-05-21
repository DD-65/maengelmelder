
import type { Request, Response, NextFunction } from 'express';

export function basicAuth(req: Request, res: Response, next: NextFunction) {

  const auth = req.headers.authorization;
  if (auth?.startsWith('Basic ')) {
    const [user, pass] = Buffer.from(auth.slice(6), 'base64').toString().split(':');
    // if (user === process.env.BASIC_AUTH_USER && pass === process.env.BASIC_AUTH_PASS) {  // <-- besser! aber braucht .env mit BASIC_AUTH_USER und BASIC_AUTH_PASS 
    //   return next();
    // }
    if (user === "team" && pass === "pam2") { // HARDCODED BASIC AUTH, UM DEN LOGIN AUCH IN PROD ZU ERMÖGLICHEN
        return next();
    }
  }
  res.setHeader('WWW-Authenticate', 'Basic realm="Restricted"');
  return res.status(401).send('<div style="text-align: center;"><h1 style="color: red;"> 401 - Zugang nur für Mitglieder des Entwicklungsteams</h1><h2>Bitte wenden sie sich an einen Administrator!</h2></div>');
}