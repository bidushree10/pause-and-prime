import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = process.env.VERCEL ? '/tmp' : path.join(ROOT_DIR, 'data');

export const CONFIG = {
  PORT: process.env.PORT || 3000,
  PUBLIC_DIR: path.join(ROOT_DIR, 'public'),
  SEED_SITES_FILE: path.join(ROOT_DIR, 'data', 'sites.json'),
  SITES_FILE: path.join(DATA_DIR, 'sites.json'),
  SESSIONS_FILE: path.join(DATA_DIR, 'sessions.json')
};