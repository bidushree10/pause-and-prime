import test from 'node:test';
import assert from 'node:assert/strict';
import { handleApiRequest } from '../server/api.js';
import { initializeDb, getSites, querySites, getSessionData } from '../server/db.js';
import { validateMicroAnchor, validateDuration } from '../server/utils.js';

// Clean test helper to invoke handleApiRequest directly without network sockets
function mockCall(method, path, body = {}) {
  return new Promise(async (resolve) => {
    const url = new URL(path, 'http://localhost:3000');
    const req = {
      method,
      url: path,
      headers: { host: 'localhost:3000' }
    };

    let statusCode = 200;
    const responseHeaders = {};
    let responseBody = '';

    const res = {
      setHeader(name, value) {
        responseHeaders[name.toLowerCase()] = value;
      },
      writeHead(code, headers = {}) {
        statusCode = code;
        for (const [k, v] of Object.entries(headers)) {
          responseHeaders[k.toLowerCase()] = v;
        }
      },
      end(chunk) {
        if (chunk) responseBody += chunk;
        let parsed = null;
        try {
          parsed = JSON.parse(responseBody);
        } catch {
          parsed = responseBody;
        }
        resolve({
          status: statusCode,
          headers: responseHeaders,
          body: parsed
        });
      }
    };

    const handled = await handleApiRequest(req, res, url.pathname, url.searchParams, body);
    if (!handled) {
      resolve({ status: 404, body: { error: 'Not Handled' } });
    }
  });
}

test.before(async () => {
  await initializeDb();
});

test('Validation: Micro-anchor rules (Acceptance Criteria #1)', () => {
  assert.equal(validateMicroAnchor('').valid, false);
  assert.equal(validateMicroAnchor('a').valid, false);
  assert.equal(validateMicroAnchor('ab').valid, false);
  assert.equal(validateMicroAnchor('   ab   ').valid, false);
  assert.equal(validateMicroAnchor('abc').valid, true);
  assert.equal(validateMicroAnchor('Fix failing login test').valid, true);
});

test('Validation: Duration limits', () => {
  assert.equal(validateDuration(0).valid, false);
  assert.equal(validateDuration(-1).valid, false);
  assert.equal(validateDuration(65).valid, false);
  assert.equal(validateDuration(3).valid, true);
  assert.equal(validateDuration(5).valid, true);
});

test('API: GET /api/health returns 200 and version 1.0.4', async () => {
  const res = await mockCall('GET', '/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.version, '1.0.4');
});

test('API: GET /api/catalog returns experiences and supports filtering', async () => {
  const allRes = await mockCall('GET', '/api/catalog');
  assert.equal(allRes.status, 200);
  assert.ok(allRes.body.count >= 12);
  assert.ok(Array.isArray(allRes.body.sites));

  // Category filter
  const calmingRes = await mockCall('GET', '/api/catalog?category=calming');
  assert.equal(calmingRes.status, 200);
  assert.ok(calmingRes.body.sites.every(s => s.category === 'calming'));

  // Duration filter (<=3m)
  const durationRes = await mockCall('GET', '/api/catalog?maxDuration=3');
  assert.equal(durationRes.status, 200);
  assert.ok(durationRes.body.sites.every(s => s.maxDurationMinutes <= 3));

  // Search filter
  const searchRes = await mockCall('GET', '/api/catalog?q=silk');
  assert.equal(searchRes.status, 200);
  assert.ok(searchRes.body.sites.length > 0);
  assert.ok(searchRes.body.sites[0].title.toLowerCase().includes('silk'));
});

test('API: POST /api/sessions/start enforces micro-anchor criteria', async () => {
  // Invalid anchor (< 3 characters)
  const invalidRes = await mockCall('POST', '/api/sessions/start', {
    siteId: 'weave-silk',
    microAnchor: 'no',
    durationMinutes: 5
  });
  assert.equal(invalidRes.status, 400);
  assert.equal(invalidRes.body.success, false);

  // Valid anchor (>= 3 characters)
  const validRes = await mockCall('POST', '/api/sessions/start', {
    siteId: 'weave-silk',
    microAnchor: 'Complete code review on PR #12',
    durationMinutes: 5
  });
  assert.equal(validRes.status, 201);
  assert.equal(validRes.body.success, true);
  assert.ok(validRes.body.sessionId);
  assert.equal(validRes.body.microAnchor, 'Complete code review on PR #12');
  assert.equal(validRes.body.durationMinutes, 5);
});

test('API: POST /api/sessions/end records session log and updates stats', async () => {
  const endRes = await mockCall('POST', '/api/sessions/end', {
    sessionId: 'test-session-mock-456',
    siteId: 'weave-silk',
    siteTitle: 'Weave Silk Generative Canvas',
    microAnchor: 'Refactor auth controller',
    durationMinutes: 5,
    elapsedSeconds: 300,
    completed: true,
    reEntryCompleted: true
  });
  assert.equal(endRes.status, 200);
  assert.equal(endRes.body.success, true);
  assert.ok(endRes.body.stats.totalSessionsCompleted >= 1);

  // Verify history endpoint
  const historyRes = await mockCall('GET', '/api/sessions/history');
  assert.equal(historyRes.status, 200);
  assert.ok(historyRes.body.sessions.length > 0);
  assert.equal(historyRes.body.sessions[0].microAnchor, 'Refactor auth controller');
});
