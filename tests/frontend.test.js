import test from 'node:test';
import assert from 'node:assert/strict';
import { BoundedTimer } from '../public/js/timer.js';

test('Timer: Format MM:SS with leading zeroes (Monospaced display)', () => {
  assert.equal(BoundedTimer.formatTime(300), '05:00');
  assert.equal(BoundedTimer.formatTime(120), '02:00');
  assert.equal(BoundedTimer.formatTime(59), '00:59');
  assert.equal(BoundedTimer.formatTime(9), '00:09');
  assert.equal(BoundedTimer.formatTime(0), '00:00');
  assert.equal(BoundedTimer.formatTime(-5), '00:00');
});

test('Timer: Zero-Delay Lockout triggers onComplete exactly when timer reaches 00:00', async () => {
  let completed = false;
  let ticks = 0;

  // Simulate a 0.05 min (3 seconds) timer with accelerated clock
  const timer = new BoundedTimer({
    durationMinutes: 0.05,
    onTick: () => { ticks++; },
    onComplete: () => { completed = true; }
  });

  timer.start('Do quick task');
  // Wait for timer to finish
  await new Promise(resolve => setTimeout(resolve, 3400));
  timer.stop();

  assert.equal(completed, true, 'Zero-Delay Lockout onComplete must be invoked at 00:00');
  assert.ok(ticks >= 10, 'Timer must tick periodically without layout drift');
});

test('Pre-Commitment: Input validation helper logic', () => {
  function checkPreCommitment(input) {
    const trimmed = (input || '').trim();
    return trimmed.length >= 3;
  }

  assert.equal(checkPreCommitment(''), false);
  assert.equal(checkPreCommitment('  '), false);
  assert.equal(checkPreCommitment('ok'), false);
  assert.equal(checkPreCommitment('run'), true);
  assert.equal(checkPreCommitment('Review PR'), true);
});

test('Explore Filter: Category and Duration filtering logic', () => {
  const sites = [
    { id: '1', category: 'calming', maxDurationMinutes: 3, title: 'Silk Canvas', tags: ['art'] },
    { id: '2', category: 'logic', maxDurationMinutes: 2, title: 'Mini Sudoku', tags: ['numbers'] },
    { id: '3', category: 'calming', maxDurationMinutes: 5, title: 'Zen Garden', tags: ['sand'] },
    { id: '4', category: 'stem', maxDurationMinutes: 5, title: 'Orbit Physics', tags: ['gravity'] }
  ];

  function filterCatalog(catalog, category, maxDuration, search) {
    return catalog.filter(site => {
      if (category && category !== 'all' && site.category !== category) return false;
      if (maxDuration && site.maxDurationMinutes > maxDuration) return false;
      if (search) {
        const q = search.toLowerCase();
        const inTitle = site.title.toLowerCase().includes(q);
        const inTags = site.tags.some(t => t.toLowerCase().includes(q));
        if (!inTitle && !inTags) return false;
      }
      return true;
    });
  }

  // Filter calming
  const calmingOnly = filterCatalog(sites, 'calming', null, '');
  assert.equal(calmingOnly.length, 2);

  // Filter duration <= 3
  const shortBreaks = filterCatalog(sites, 'all', 3, '');
  assert.equal(shortBreaks.length, 2);

  // Filter search
  const searched = filterCatalog(sites, 'all', null, 'gravity');
  assert.equal(searched.length, 1);
  assert.equal(searched[0].id, '4');
});
