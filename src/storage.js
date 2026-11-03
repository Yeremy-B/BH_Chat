const MESSAGES_KEY = 'bh_chat_messages';
const SETTINGS_KEY = 'bh_chat_settings';
export const MAX_MESSAGES = 200;

export const DEFAULT_SETTINGS = {
  voice: 'auto',
  rate: 1.0,
  dictationLang: 'es-CL'
};

/**
 * Carga los mensajes guardados de localStorage con límite de 200 elementos.
 * @returns {Array<{id: string, kind: 'dict'|'tts', text: string, ts: number}>}
 */
export function loadMessages() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const raw = window.localStorage.getItem(MESSAGES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Asegurar estructura válida y recortar a máximo 200
    const valid = parsed.filter(m => m && typeof m.id === 'string' && (m.kind === 'dict' || m.kind === 'tts') && typeof m.text === 'string');
    return valid.slice(-MAX_MESSAGES);
  } catch (err) {
    console.warn('[Storage] Error al leer mensajes:', err);
    return [];
  }
}

/**
 * Guarda los mensajes en localStorage asegurando el límite de 200.
 * @param {Array} messages 
 */
export function saveMessages(messages) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const toSave = Array.isArray(messages) ? messages.slice(-MAX_MESSAGES) : [];
    window.localStorage.setItem(MESSAGES_KEY, JSON.stringify(toSave));
  } catch (err) {
    console.warn('[Storage] Error al guardar mensajes:', err);
  }
}

/**
 * Elimina todos los mensajes guardados en localStorage.
 */
export function clearMessagesStorage() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.removeItem(MESSAGES_KEY);
  } catch (err) {
    console.warn('[Storage] Error al vaciar mensajes:', err);
  }
}

/**
 * Carga los ajustes de localStorage.
 */
export function loadSettings() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return { ...DEFAULT_SETTINGS };
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      voice: typeof parsed.voice === 'string' ? parsed.voice : DEFAULT_SETTINGS.voice,
      rate: typeof parsed.rate === 'number' ? parsed.rate : DEFAULT_SETTINGS.rate,
      dictationLang: typeof parsed.dictationLang === 'string' ? parsed.dictationLang : DEFAULT_SETTINGS.dictationLang
    };
  } catch (err) {
    console.warn('[Storage] Error al leer ajustes:', err);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Guarda los ajustes en localStorage.
 * @param {object} settings 
 */
export function saveSettings(settings) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('[Storage] Error al guardar ajustes:', err);
  }
}
