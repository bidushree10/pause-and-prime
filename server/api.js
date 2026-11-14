import crypto from 'node:crypto';
import { querySites, getSiteById, getSessionData, saveSessionLog } from './db.js';
import { validateMicroAnchor, validateDuration, checkFrameHeaders } from './utils.js';

/**
 * Handle incoming API requests.
 * Returns true if request was handled, false otherwise.
 */
export async function handleApiRequest(req, res, pathname, query, body) {
  // CORS & Security headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return true;
  }

  // Health check
  if (pathname === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      status: 'healthy',
      platform: 'Pause & Prime',
      version: '1.0.4',
      uptime: process.uptime()
    }));
    return true;
  }

  // Catalog listing with search & filters
  if (pathname === '/api/catalog' && req.method === 'GET') {
    const category = query.get('category') || 'all';
    const maxDuration = query.get('maxDuration') || null;
    const search = query.get('q') || '';

    const sites = await querySites({ category, maxDuration, search });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      count: sites.length,
      category,
      maxDuration,
      sites
    }));
    return true;
  }

  // Single catalog item
  if (pathname.startsWith('/api/catalog/') && req.method === 'GET') {
    const id = pathname.replace('/api/catalog/', '');
    const site = await getSiteById(id);
    if (!site) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Experience not found' }));
      return true;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, site }));
    return true;
  }

  // Start a new bounded break session
  if (pathname === '/api/sessions/start' && req.method === 'POST') {
    const anchorVal = validateMicroAnchor(body.microAnchor);
    if (!anchorVal.valid) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: anchorVal.message }));
      return true;
    }

    const durationVal = validateDuration(body.durationMinutes);
    if (!durationVal.valid) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: durationVal.message }));
      return true;
    }

    let site = null;
    if (body.siteId) {
      site = await getSiteById(body.siteId);
    }

    const sessionId = crypto.randomUUID();
    const now = Date.now();
    const expiresAt = now + (durationVal.value * 60 * 1000);

    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      sessionId,
      startedAt: now,
      expiresAt,
      durationMinutes: durationVal.value,
      microAnchor: anchorVal.value,
      site: site || {
        id: 'custom',
        title: body.title || 'Custom Break Activity',
        targetUrl: body.targetUrl || 'about:blank'
      }
    }));
    return true;
  }

  // End / complete a break session
  if (pathname === '/api/sessions/end' && req.method === 'POST') {
    const sessionId = body.sessionId || crypto.randomUUID();
    const sessionRecord = {
      sessionId,
      siteId: body.siteId || 'unknown',
      siteTitle: body.siteTitle || 'Micro-Break',
      microAnchor: body.microAnchor || '',
      durationMinutes: parseInt(body.durationMinutes, 10) || 5,
      elapsedSeconds: parseInt(body.elapsedSeconds, 10) || 0,
      completed: Boolean(body.completed),
      reEntryCompleted: Boolean(body.reEntryCompleted),
      endedAt: new Date().toISOString()
    };

    const updatedData = await saveSessionLog(sessionRecord);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'Session recorded successfully',
      stats: updatedData.stats
    }));
    return true;
  }

  // Get session history & statistics
  if (pathname === '/api/sessions/history' && req.method === 'GET') {
    const data = await getSessionData();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      sessions: data.sessions,
      stats: data.stats
    }));
    return true;
  }

  // Check iframe embedding compatibility for external target URLs
  if (pathname === '/api/check-frame' && req.method === 'GET') {
    const targetUrl = query.get('url');
    if (!targetUrl) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'url parameter is required' }));
      return true;
    }

    const checkResult = await checkFrameHeaders(targetUrl);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      url: targetUrl,
      ...checkResult
    }));
    return true;
  }

  return false;
}
