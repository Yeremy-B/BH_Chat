import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { state, el } from '../src/state.js';
import {
  setSpeechRecognitionClass,
  startDictation,
  finalizeSession,
  stopDictation,
  getCurrentSessionId
} from '../src/dictation.js';

// Mock de DOM mínimo para las pruebas de UI y estado de dictado
class ElementMock {
  constructor(id) {
    this.id = id;
    this.dataset = {};
    this.style = { display: '' };
    this.children = [];
    this.parentNode = null;
    this.className = '';
    this.textContent = '';
    this.classList = {
      add: (cls) => { this.className += ' ' + cls; },
      remove: (cls) => { this.className = this.className.replace(cls, '').trim(); }
    };
  }
  addEventListener(_event, _handler) {}
  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }
  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) this.children.splice(idx, 1);
    child.parentNode = null;
    return child;
  }
  setAttribute(_k, _v) {}
  scrollTo() {}
}

const mockElements = {
  emptyState: new ElementMock('emptyState'),
  chatThread: new ElementMock('chatThread'),
  statusLine: new ElementMock('statusLine'),
  micBtn: new ElementMock('micBtn')
};

globalThis.document = {
  querySelectorAll: () => [],
  getElementById: (id) => {
    if (mockElements[id]) return mockElements[id];
    const found = mockElements.chatThread.children.find(c => c.id === id);
    return found || null;
  },
  createElement: (tag) => new ElementMock(tag),
  createDocumentFragment: () => new ElementMock('fragment')
};

globalThis.window = globalThis.window || {};
globalThis.window.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};
globalThis.requestAnimationFrame = (cb) => cb();

describe('Módulo de Dictado y Carrera de Sesiones (src/dictation.js)', () => {
  let createdInstances = [];

  class MockSpeechRecognition {
    constructor() {
      this.continuous = true;
      this.interimResults = true;
      this.lang = 'es-CL';
      this.onstart = null;
      this.onresult = null;
      this.onerror = null;
      this.onend = null;
      createdInstances.push(this);
    }
    start() {
      if (this.onstart) this.onstart();
    }
    stop() {
      if (this.onend) this.onend();
    }
    abort() {}
  }

  beforeEach(() => {
    createdInstances = [];
    state.messages = [];
    state.isDictating = false;
    state.interimTranscript = '';
    mockElements.emptyState.style.display = 'flex';
    mockElements.chatThread.children = [];
    el.emptyState = mockElements.emptyState;
    el.chatThread = mockElements.chatThread;
    el.statusLine = mockElements.statusLine;
    el.micBtn = mockElements.micBtn;
    setSpeechRecognitionClass(MockSpeechRecognition);
  });

  test('Dictado sin voz en conversación vacía deja visible #emptyState', () => {
    assert.equal(el.emptyState.style.display, 'flex');

    // Iniciar dictado (oculta emptyState al crear la burbuja en vivo)
    startDictation();
    assert.equal(state.isDictating, true);
    assert.equal(el.emptyState.style.display, 'none');

    // Finalizar sesión sin resultados de voz
    const sid = getCurrentSessionId();
    finalizeSession(sid);

    // Debe restaurar el estado vacío y no dejar pantalla en blanco
    assert.equal(state.isDictating, false);
    assert.equal(state.messages.length, 0);
    assert.equal(el.emptyState.style.display, 'flex');
  });

  test('Sesión anterior de dictado no interfiere con sesión nueva ni duplica mensajes', () => {
    // 1. Iniciar sesión 1
    startDictation();
    const session1Id = getCurrentSessionId();
    const inst1 = createdInstances[0];

    // Simular que el usuario detiene y de inmediato arranca sesión 2
    startDictation();
    const session2Id = getCurrentSessionId();
    const inst2 = createdInstances[1];

    assert.notEqual(session1Id, session2Id);
    assert.equal(session2Id, getCurrentSessionId());

    // 2. Llega un evento tardío de la sesión 1 con texto viejo
    state.interimTranscript = 'Texto sesión 1';
    inst1.onend(); // onend de sesión 1

    // No debe haberse guardado el texto de la sesión 1
    assert.equal(state.messages.length, 0);

    // 3. Llega el evento de la sesión 2 con su texto
    state.interimTranscript = 'Texto sesión 2 válido';
    inst2.onend(); // onend de sesión 2

    // Debe haberse guardado exactamente 1 mensaje correspondiente a sesión 2
    assert.equal(state.messages.length, 1);
    assert.equal(state.messages[0].text, 'Texto sesión 2 válido');

    // 4. Si el respaldo tardío de stopDictation() se ejecuta, no debe duplicar el mensaje
    stopDictation(session2Id);
    finalizeSession(session2Id);
    assert.equal(state.messages.length, 1);
  });
});
