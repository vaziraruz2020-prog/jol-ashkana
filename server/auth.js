import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const COOKIE = 'ja_token';

export function jwtSecret() {
  return process.env.JWT_SECRET || 'jol-ashkana-dev-secret';
}

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

export function checkPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

export function signToken(userId) {
  return jwt.sign({ sub: userId }, jwtSecret(), { expiresIn: '7d' });
}

export function readToken(token) {
  try {
    return jwt.verify(token, jwtSecret());
  } catch {
    return null;
  }
}

export function parseCookies(header) {
  const out = {};
  String(header || '')
    .split(';')
    .forEach((part) => {
      const i = part.indexOf('=');
      if (i > 0) {
        const k = part.slice(0, i).trim();
        const v = part.slice(i + 1).trim();
        try {
          out[k] = decodeURIComponent(v);
        } catch {
          out[k] = v;
        }
      }
    });
  return out;
}

export function tokenFromReq(req) {
  const cookies = parseCookies(req.headers?.cookie || req.headers?.Cookie);
  return cookies[COOKIE] || '';
}

export function cookieHeader(token, clear = false) {
  const secure = process.env.VERCEL || process.env.NODE_ENV === 'production' ? '; Secure' : '';
  if (clear) {
    return `${COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`;
  }
  return `${COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800${secure}`;
}
