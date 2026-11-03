import { state, el } from './state.js';
import { saveSettings } from './storage.js';
import { addMessage, clearConversation } from './chat.js';
import { speakText, stopSpeaking, populateVoices } from './tts.js';
import { toggleDictation, stopDictation } from './dictation.js';

export function autoResizeTextarea() {
  if (!el.composerTextarea) return;
  el.composerTextarea.style.height = 'auto';
  const newHeight = Math.min(el.composerTextarea.scrollHeight, 140);
  el.composerTextarea.style.height = `${newHeight}px`;
}

export function resetComposerTextarea() {
  if (!el.composerTextarea) return;
  el.composerTextarea.value = '';
  el.composerTextarea.style.height = 'auto';
}

export function handleSendTts() {
  if (!el.composerTextarea) return;
  const rawText = el.composerTextarea.value || '';
  const text = rawText.trim();
  if (!text) {
    el.composerTextarea.focus();
    return;
  }

  // 1. Agregar mensaje tipo 'tts'
  const msg = addMessage({ kind: 'tts', text });

  // 2. Limpiar campo y restablecer tamaño
  resetComposerTextarea();
  el.composerTextarea.focus();

  // 3. Reproducir inmediatamente en voz alta
  if (msg) {
    speakText(msg.text, msg.id);
  }
}

export function toggleSettingsPanel() {
  if (!el.settingsPanel) return;
  const isOpen = el.settingsPanel.classList.contains('open');
  if (isOpen) {
    closeSettingsPanel();
  } else {
    openSettingsPanel();
  }
}

export function openSettingsPanel() {
  if (!el.settingsPanel) return;
  populateVoices();
  el.settingsPanel.classList.add('open');
  el.settingsBtn?.setAttribute('aria-expanded', 'true');
}

export function closeSettingsPanel() {
  if (!el.settingsPanel) return;
  el.settingsPanel.classList.remove('open');
  el.settingsBtn?.setAttribute('aria-expanded', 'false');
}

export function setupUIEvents() {
  // Auto-crecimiento del textarea
  if (el.composerTextarea) {
    el.composerTextarea.addEventListener('input', autoResizeTextarea);

    // Enter envía, Shift+Enter añade salto de línea
    el.composerTextarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendTts();
      }
    });
  }

  // Botón Parlante (enviar y leer en voz alta)
  if (el.sendTtsBtn) {
    el.sendTtsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleSendTts();
    });
  }

  // Botón Micrófono (dictado)
  if (el.micBtn) {
    el.micBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleDictation();
    });
  }

  // Botón de Vaciar Conversación
  if (el.clearChatBtn) {
    el.clearChatBtn.addEventListener('click', () => {
      stopDictation();
      stopSpeaking();
      clearConversation();
    });
  }

  // Botón de Ajustes (deslizadores)
  if (el.settingsBtn) {
    el.settingsBtn.addEventListener('click', toggleSettingsPanel);
  }

  if (el.settingsCloseBtn) {
    el.settingsCloseBtn.addEventListener('click', closeSettingsPanel);
  }

  // Cerrar panel de ajustes con tecla Escape o al hacer clic fuera
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && el.settingsPanel && el.settingsPanel.classList.contains('open')) {
      closeSettingsPanel();
    }
  });

  document.addEventListener('click', (e) => {
    if (
      el.settingsPanel &&
      el.settingsPanel.classList.contains('open') &&
      !el.settingsPanel.contains(e.target) &&
      el.settingsBtn &&
      !el.settingsBtn.contains(e.target)
    ) {
      closeSettingsPanel();
    }
  });

  // Cambio de ajustes: Voz
  if (el.voiceSelect) {
    el.voiceSelect.addEventListener('change', () => {
      state.settings.voice = el.voiceSelect.value;
      saveSettings(state.settings);
    });
  }

  // Cambio de ajustes: Velocidad
  if (el.speedSelect) {
    el.speedSelect.addEventListener('change', () => {
      state.settings.rate = parseFloat(el.speedSelect.value) || 1.0;
      saveSettings(state.settings);
    });
  }

  // Cambio de ajustes: Idioma de dictado
  if (el.dictationLangSelect) {
    el.dictationLangSelect.addEventListener('change', () => {
      state.settings.dictationLang = el.dictationLangSelect.value;
      saveSettings(state.settings);
    });
  }
}

export function syncSettingsUI() {
  if (el.speedSelect) {
    el.speedSelect.value = String(state.settings.rate || 1.0);
  }
  if (el.dictationLangSelect) {
    el.dictationLangSelect.value = state.settings.dictationLang || 'es-CL';
  }
  if (el.voiceSelect) {
    el.voiceSelect.value = state.settings.voice || 'auto';
  }
}
