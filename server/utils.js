import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';

/**
 * Validates a micro-anchor task string.
 * Acceptance criteria #1: Must be at least 3 characters long.
 */
export function validateMicroAnchor(anchor) {
  if (typeof anchor !== 'string') {
    return { valid: false, message: 'Micro-anchor must be a text string.' };
  }
  const trimmed = anchor.trim();
  if (trimmed.length < 3) {
    return { valid: false, message: 'Micro-anchor must contain at least 3 characters.' };
  }
  if (trimmed.length > 280) {
    return { valid: false, message: 'Micro-anchor must not exceed 280 characters.' };
  }
  return { valid: true, value: trimmed };
}

/**
 * Validates break duration in minutes.
 */
export function validateDuration(duration) {
  const num = parseInt(duration, 10);
  if (isNaN(num) || num < 1 || num > 60) {
    return { valid: false, message: 'Duration must be an integer between 1 and 60 minutes.' };
  }
  return { valid: true, value: num };
}

/**
 * Checks whether an external URL can be safely framed in an iframe or requires popup fallback.
 * Checks X-Frame-Options and Content-Security-Policy headers.
 */
export async function checkFrameHeaders(targetUrl) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(targetUrl);
      const isHttps = parsed.protocol === 'https:';
      const client = isHttps ? https : http;

      const req = client.request(
        targetUrl,
        {
          method: 'HEAD',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PauseAndPrime-FrameChecker/1.0'
          },
          timeout: 4000
        },
        (res) => {
          const headers = res.headers;
          const xFrame = (headers['x-frame-options'] || '').toLowerCase();
          const csp = (headers['content-security-policy'] || '').toLowerCase();

          let canFrame = true;
          let reason = '';

          if (xFrame.includes('deny') || xFrame.includes('sameorigin')) {
            canFrame = false;
            reason = `Blocked by X-Frame-Options: ${xFrame}`;
          } else if (csp.includes("frame-ancestors 'none'") || csp.includes("frame-ancestors 'self'")) {
            canFrame = false;
            reason = 'Blocked by Content-Security-Policy frame-ancestors';
          }

          resolve({
            canFrame,
            reason: reason || 'Site headers allow embedding',
            statusCode: res.statusCode,
            fallbackStrategy: canFrame ? 'iframe' : 'popup'
          });
        }
      );

      req.on('timeout', () => {
        req.destroy();
        // If timeout on HEAD, recommend fallback or test
        resolve({
          canFrame: true,
          reason: 'Timed out checking headers; defaulting to direct iframe with error listener',
          fallbackStrategy: 'iframe'
        });
      });

      req.on('error', (err) => {
        resolve({
          canFrame: true,
          reason: `Unable to probe headers (${err.message}); fallback will catch iframe errors`,
          fallbackStrategy: 'iframe'
        });
      });

      req.end();
    } catch (err) {
      resolve({
        canFrame: false,
        reason: 'Invalid URL provided',
        fallbackStrategy: 'popup'
      });
    }
  });
}
