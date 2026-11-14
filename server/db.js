import fs from 'node:fs/promises';
import { existsSync, writeFileSync } from 'node:fs';
import { CONFIG } from './config.js';

// Ensure data files exist with default structures if missing
export async function initializeDb() {
  if (!existsSync(CONFIG.SITES_FILE)) {
    if (existsSync(CONFIG.SEED_SITES_FILE)) {
      await fs.copyFile(CONFIG.SEED_SITES_FILE, CONFIG.SITES_FILE);
    } else {
      await fs.writeFile(CONFIG.SITES_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  }
  if (!existsSync(CONFIG.SESSIONS_FILE)) {
    const initialSessions = {
      sessions: [],
      stats: {
        totalSessionsCompleted: 0,
        totalMinutesSpent: 0,
        totalAnchorsReturned: 0
      }
    };
    await fs.writeFile(CONFIG.SESSIONS_FILE, JSON.stringify(initialSessions, null, 2), 'utf-8');
  }
}

// Read all catalog items
export async function getSites() {
  try {
    const raw = await fs.readFile(CONFIG.SITES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading sites:', err);
    return [];
  }
}

// Filter catalog items
export async function querySites({ category, maxDuration, search }) {
  const allSites = await getSites();
  return allSites.filter(site => {
    // Category filter
    if (category && category !== 'all' && site.category.toLowerCase() !== category.toLowerCase()) {
      return false;
    }

    // Max duration filter (<= 3, <= 5, <= 10)
    if (maxDuration) {
      const durNum = parseInt(maxDuration, 10);
      if (!isNaN(durNum) && site.maxDurationMinutes > durNum) {
        return false;
      }
    }

    // Search query filter (matches title, description, tags, categoryLabel)
    if (search && search.trim().length > 0) {
      const term = search.toLowerCase().trim();
      const inTitle = site.title.toLowerCase().includes(term);
      const inDesc = site.description.toLowerCase().includes(term);
      const inCat = (site.categoryLabel || '').toLowerCase().includes(term);
      const inTags = Array.isArray(site.tags) && site.tags.some(tag => tag.toLowerCase().includes(term));
      if (!inTitle && !inDesc && !inCat && !inTags) {
        return false;
      }
    }

    return true;
  });
}

// Get single site by ID
export async function getSiteById(id) {
  const allSites = await getSites();
  return allSites.find(s => s.id === id) || null;
}

// Read session history & aggregate stats
export async function getSessionData() {
  try {
    const raw = await fs.readFile(CONFIG.SESSIONS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading sessions:', err);
    return {
      sessions: [],
      stats: { totalSessionsCompleted: 0, totalMinutesSpent: 0, totalAnchorsReturned: 0 }
    };
  }
}

// Save a new session log
export async function saveSessionLog(session) {
  const data = await getSessionData();
  data.sessions.unshift(session);

  // Keep last 100 sessions to avoid unbounded growth
  if (data.sessions.length > 100) {
    data.sessions = data.sessions.slice(0, 100);
  }

  // Update aggregated statistics
  if (session.completed) {
    data.stats.totalSessionsCompleted = (data.stats.totalSessionsCompleted || 0) + 1;
  }
  if (session.reEntryCompleted) {
    data.stats.totalAnchorsReturned = (data.stats.totalAnchorsReturned || 0) + 1;
  }
  const minutes = Math.round((session.elapsedSeconds || 0) / 60);
  data.stats.totalMinutesSpent = (data.stats.totalMinutesSpent || 0) + minutes;

  // Atomic write to prevent file corruption
  const tempPath = `${CONFIG.SESSIONS_FILE}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  await fs.rename(tempPath, CONFIG.SESSIONS_FILE);

  return data;
}
