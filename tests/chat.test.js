import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanSpeechChunk,
  deduplicateAdjacentWords,
  stitchSpeechTranscripts,
  uid,
  formatTime
} from '../src/utils.js';
import {
  loadMessages,
  saveMessages,
  clearMessagesStorage,
  loadSettings,
  saveSettings,
  MAX_MESSAGES,
  DEFAULT_SETTINGS
} from '../src/storage.js';

// Mock de localStorage para el entorno Node.js
class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

globalThis.window = {
  localStorage: new LocalStorageMock()
};

describe('Módulo de Utilidades de Voz y Texto (src/utils.js)', () => {
  test('uid genera identificadores únicos no vacíos', () => {
    const id1 = uid();
    const id2 = uid();
    assert.ok(id1 && typeof id1 === 'string');
    assert.notEqual(id1, id2);
  });

  test('formatTime formatea marcas de tiempo correctamente en HH:MM', () => {
    const ts = new Date('2026-11-03T14:30:00Z').getTime();
    const formatted = formatTime(ts);
    assert.match(formatted, /\d{1,2}:\d{2}/);
  });

  test('cleanSpeechChunk limpia espacios múltiples y bordes', () => {
    assert.equal(cleanSpeechChunk('   hola    mundo   '), 'hola mundo');
    assert.equal(cleanSpeechChunk(null), '');
  });

  test('deduplicateAdjacentWords elimina repeticiones no deseadas pero conserva pares naturales', () => {
    // Repetición innecesaria
    assert.equal(deduplicateAdjacentWords('hola hola cómo estás'), 'hola cómo estás');
    // Pares naturales permitidos en español
    assert.equal(deduplicateAdjacentWords('muy muy bueno'), 'muy muy bueno');
    assert.equal(deduplicateAdjacentWords('sí sí claro'), 'sí sí claro');
    // Triple repetición siempre se reduce
    assert.equal(deduplicateAdjacentWords('muy muy muy bueno'), 'muy muy bueno');
  });

  test('stitchSpeechTranscripts une fragmentos móviles y resuelve traslapes', () => {
    const chunks = ['hoy vamos', 'vamos a la playa', 'a la playa'];
    const stitched = stitchSpeechTranscripts(chunks);
    assert.equal(stitched, 'hoy vamos a la playa');
  });
});

describe('Módulo de Persistencia Local (src/storage.js)', () => {
  beforeEach(() => {
    globalThis.window.localStorage.clear();
  });

  test('loadSettings devuelve configuración por defecto si no hay datos', () => {
    const settings = loadSettings();
    assert.deepEqual(settings, DEFAULT_SETTINGS);
  });

  test('saveSettings y loadSettings persisten ajustes del usuario', () => {
    saveSettings({
      voice: 'Jorge (es-ES)',
      rate: 1.2,
      dictationLang: 'es-ES'
    });
    const loaded = loadSettings();
    assert.equal(loaded.voice, 'Jorge (es-ES)');
    assert.equal(loaded.rate, 1.2);
    assert.equal(loaded.dictationLang, 'es-ES');
  });

  test('saveMessages y loadMessages limitan a un máximo de 200 mensajes', () => {
    const messages = [];
    for (let i = 0; i < 250; i++) {
      messages.push({
        id: `msg-${i}`,
        kind: i % 2 === 0 ? 'dict' : 'tts',
        text: `Mensaje número ${i}`,
        ts: Date.now() + i
      });
    }

    saveMessages(messages);
    const loaded = loadMessages();
    assert.equal(loaded.length, MAX_MESSAGES);
    // Debe conservar los últimos 200
    assert.equal(loaded[0].id, 'msg-50');
    assert.equal(loaded[loaded.length - 1].id, 'msg-249');
  });

  test('clearMessagesStorage vacía el hilo', () => {
    saveMessages([{ id: '1', kind: 'dict', text: 'Prueba', ts: Date.now() }]);
    assert.equal(loadMessages().length, 1);
    clearMessagesStorage();
    assert.equal(loadMessages().length, 0);
  });
});

describe('Módulo de Fragmentación TTS Móvil (src/tts.js)', () => {
  test('splitTextForSpeech no divide textos cortos', async () => {
    const { splitTextForSpeech } = await import('../src/tts.js');
    const shortText = 'Hola, esto es una prueba corta.';
    const chunks = splitTextForSpeech(shortText, 200);
    assert.deepEqual(chunks, [shortText]);
  });

  test('splitTextForSpeech divide textos largos respetando oraciones y límite de 200 caracteres', async () => {
    const { splitTextForSpeech } = await import('../src/tts.js');
    const sentence1 = 'Esta es la primera oración completa de prueba que tiene suficiente contenido.';
    const sentence2 = 'Aquí viene una segunda oración para probar el encadenamiento de fragmentos móviles.';
    const sentence3 = 'Y finalmente una tercera oración para asegurar que la síntesis de voz no se corte en Android.';
    const fullText = `${sentence1} ${sentence2} ${sentence3}`;

    const chunks = splitTextForSpeech(fullText, 120);
    assert.ok(chunks.length > 1);
    for (const chunk of chunks) {
      assert.ok(chunk.length <= 120, `El fragmento supera el límite: "${chunk}" (${chunk.length} caracteres)`);
    }
    // Debe contener el texto original
    assert.equal(chunks.join(' '), fullText);
  });
});
