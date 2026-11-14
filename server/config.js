import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

export const CONFIG = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  HOST: process.env.HOST || 'localhost',
  ROOT_DIR,
  DATA_DIR: path.join(ROOT_DIR, 'data'),
  PUBLIC_DIR: path.join(ROOT_DIR, 'public'),
  SITES_FILE: path.join(ROOT_DIR, 'data', 'sites.json'),
  SESSIONS_FILE: path.join(ROOT_DIR, 'data', 'sessions.json'),
  ENV: process.env.NODE_ENV || 'development'
};
