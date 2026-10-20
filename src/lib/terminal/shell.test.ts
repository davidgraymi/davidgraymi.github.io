// Run with: node --test src/lib/terminal/shell.test.ts   (Node 23.6+ strips the types)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parentPath, run, safeInternalHref, type Context } from './shell.ts';

const origin = 'https://davidmgray.com';

const ctx = (pathname: string): Context => ({
  pathname,
  theme: 'system',
  history: [],
  data: {
    host: 'davidmgray.com',
    site: { name: 'D', role: 'r', location: 'l', tagline: 't', email: 'e@x.com' },
    socials: [],
    sections: [{ name: 'work', title: 'Work', href: '/work' }],
    dirs: { work: [] },
    games: [],
  },
});

test('parentPath collapses repeated slashes', () => {
  assert.equal(parentPath('//evil.com/x'), '/evil.com');
  assert.equal(parentPath('///evil.com/x/'), '/evil.com');
  assert.equal(parentPath('/work/tetris-rl/'), '/work');
  assert.equal(parentPath('/work'), '/');
  assert.equal(parentPath('/'), '/');
});

test('cd .. on //evil.com/x stays on site', () => {
  const { effect } = run('cd ..', ctx('//evil.com/x'));
  assert.deepEqual(effect, { type: 'navigate', href: '/evil.com' });
  assert.equal(safeInternalHref((effect as { href: string }).href, origin), '/evil.com');
});

test('safeInternalHref refuses off-origin targets', () => {
  assert.equal(safeInternalHref('//evil.com', origin), undefined);
  assert.equal(safeInternalHref('//evil.com/x', origin), undefined);
  assert.equal(safeInternalHref('/\\evil.com', origin), undefined);
  assert.equal(safeInternalHref('https://evil.com/', origin), undefined);
  assert.equal(safeInternalHref('javascript:alert(1)', origin), undefined);
  assert.equal(safeInternalHref('/work/tetris-rl', origin), '/work/tetris-rl');
  assert.equal(safeInternalHref('/', origin), '/');
});
