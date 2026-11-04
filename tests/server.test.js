import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { precachePlugin } from '../vite.config.js';
import { app } from '../server.js';

describe('Vite Precache Manifest Plugin', () => {
  test('precachePlugin genera precache-manifest.json con los archivos de assets/', () => {
    const plugin = precachePlugin();
    let emitted = null;

    const mockContext = {
      emitFile(fileObj) {
        emitted = fileObj;
      }
    };

    const bundle = {
      'assets/index-D8Yk91.js': { type: 'chunk' },
      'assets/style-Bo4o12.css': { type: 'asset' },
      'index.html': { type: 'asset' },
      'favicon.ico': { type: 'asset' }
    };

    plugin.generateBundle.call(mockContext, {}, bundle);

    assert.ok(emitted, 'emitFile debe haber sido llamado');
    assert.equal(emitted.fileName, 'precache-manifest.json');
    const parsed = JSON.parse(emitted.source);
    assert.deepEqual(parsed, ['assets/index-D8Yk91.js', 'assets/style-Bo4o12.css']);
  });
});

describe('Servidor Express (server.js)', () => {
  let server;
  let baseUrl;

  before(async () => {
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('Ruta con extensión inexistente devuelve 404 Not Found', async () => {
    const res = await fetch(`${baseUrl}/assets/archivo-que-no-existe.js`);
    assert.equal(res.status, 404);
  });

  test('Ruta SPA sin extensión devuelve fallback 200 (index.html)', async () => {
    const res = await fetch(`${baseUrl}/conversacion/activa`);
    assert.equal(res.status, 200);
    const body = await res.text();
    // Debe devolver el contenido de index.html
    assert.ok(body.includes('BH Chat'));
  });
});
