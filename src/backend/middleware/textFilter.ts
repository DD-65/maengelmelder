import { Request, Response, NextFunction } from 'express';
import { Profanity } from '@2toad/profanity';

const filter = new Profanity({
  languages: ['de', 'en'], 
  wholeWord: true,         // Only whole words get filter, not substrings
  grawlix: '***', 
});

// Whitelist
// profanityFilter.whitelist.addWords(['okay', 'word']);

// Blacklist
// profanityFilter.blacklist.addWords(['bad', 'word']);

// Fields that should never be altered by the profanity filter
const EXCLUDED_KEYS = ['password', 'email', 'token', 'adminsecret'];


function scrubPayload(data: any): any {
  // If it's a string, clean it
  if (typeof data === 'string') {
    return filter.censor(data);
  }

  // All items in an array
  if (Array.isArray(data)) {
    return data.map(item => scrubPayload(item));
  }

  // All keys in an object, except for excluded keys
  if (data !== null && typeof data === 'object') {
    const cleanedObject: any = {};
    for (const key of Object.keys(data)) {
      if (EXCLUDED_KEYS.includes(key.toLowerCase())) {
        cleanedObject[key] = data[key];
      } else {
        cleanedObject[key] = scrubPayload(data[key]);
      }
    }
    return cleanedObject;
  }

  // Everything else (numbers, booleans, null, undefined) is returned unaltered
  return data;
}


export function filterMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only scrub requests that actually send data (POST, PUT, PATCH)
  if (req.body && typeof req.body === 'object' && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
    req.body = scrubPayload(req.body);
  }
  
  next(); 
}