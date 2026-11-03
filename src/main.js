import { state, initElements } from './state.js';
import { loadMessages, loadSettings } from './storage.js';
import { initTheme } from './theme.js';
import { setupTTS } from './tts.js';
import { setupDictation } from './dictation.js';
import { renderChatThread, scrollToBottom } from './chat.js';
import { setupUIEvents, syncSettingsUI } from './ui.js';

(async function init() {
  // 1. Inicializar referencias al DOM
  initElements();

  // 2. Inicializar soporte de tema oscuro automático
  initTheme();

  // 3. Cargar ajustes guardados
  state.settings = loadSettings();
  syncSettingsUI();

  // 4. Inicializar motores de Voz (TTS y Dictado)
  setupTTS();
  setupDictation();

  // 5. Vincular eventos de la interfaz
  setupUIEvents();

  // 6. Cargar mensajes del historial y renderizar hilo
  state.messages = loadMessages();
  renderChatThread();
  scrollToBottom(false);

  // 7. Registro de Service Worker para capacidades PWA offline
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        console.warn('[SW] Error al registrar service worker:', err);
      });
    });
  }
})();
