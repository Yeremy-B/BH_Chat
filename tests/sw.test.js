import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const swSource = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');

describe('Service Worker (public/sw.js)', () => {
  test('toda llamada a caches.match ignora Vary para encontrar assets precacheados', () => {
    const calls = swSource.match(/caches\.match\([^;]*\)/g) || [];
    assert.ok(calls.length >= 4, 'se esperaban al menos 4 llamadas a caches.match');
    for (const call of calls) {
      assert.ok(call.includes('MATCH_OPTS'), `falta MATCH_OPTS en: ${call}`);
    }
    assert.match(swSource, /MATCH_OPTS\s*=\s*\{\s*ignoreVary:\s*true\s*\}/);
  });
});
