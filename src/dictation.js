import { state, el } from './state.js';
import { cleanSpeechChunk, stitchSpeechTranscripts, deduplicateAdjacentWords } from './utils.js';
import { renderLiveBubble, removeLiveBubble, addMessage, setStatus } from './chat.js';
import { stopSpeaking } from './tts.js';

let recognition = null;
let sessionFinalChunks = [];

const SpeechRecognitionClass = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition || null)
  : null;

export function isSpeechRecognitionSupported() {
  return SpeechRecognitionClass !== null;
}

export function updateMicButtonUI() {
  if (!el.micBtn) return;

  if (!isSpeechRecognitionSupported()) {
    el.micBtn.disabled = true;
    el.micBtn.classList.remove('recording');
    el.micBtn.classList.add('disabled');
    el.micBtn.setAttribute('aria-label', 'Dictado no disponible');
    el.micBtn.setAttribute('title', 'Dictado no disponible en este navegador');
    return;
  }

  if (state.isDictating) {
    el.micBtn.classList.add('recording');
    el.micBtn.setAttribute('aria-label', 'Detener dictado');
    el.micBtn.setAttribute('title', 'Detener dictado');
  } else {
    el.micBtn.classList.remove('recording');
    el.micBtn.setAttribute('aria-label', 'Iniciar dictado');
    el.micBtn.setAttribute('title', 'Iniciar dictado');
  }
}

export function setupDictation() {
  if (!isSpeechRecognitionSupported()) {
    updateMicButtonUI();
    setStatus('Dictado no disponible en este navegador. El texto a voz sí funciona.');
    return;
  }
  updateMicButtonUI();
}

export function startDictation() {
  if (!isSpeechRecognitionSupported()) {
    setStatus('Dictado no disponible en este navegador. El texto a voz sí funciona.');
    return;
  }

  // Detener cualquier reproducción en curso para evitar retroalimentación
  stopSpeaking();

  sessionFinalChunks = [];
  state.interimTranscript = '';

  try {
    recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = state.settings.dictationLang || 'es-CL';

    recognition.onstart = () => {
      state.isDictating = true;
      updateMicButtonUI();
      renderLiveBubble('');
      setStatus('Escuchando… habla con naturalidad.');
    };

    recognition.onresult = (event) => {
      if (!event || !event.results) return;

      const finalChunks = [];
      let rawInterim = '';

      for (let i = 0; i < event.results.length; ++i) {
        const res = event.results[i];
        if (!res || !res[0]) continue;
        const transcript = cleanSpeechChunk(res[0].transcript);
        if (!transcript) continue;

        if (res.isFinal) {
          finalChunks.push(transcript);
        } else {
          rawInterim += (rawInterim ? ' ' : '') + transcript;
        }
      }

      sessionFinalChunks = finalChunks;
      const stitchedFinal = stitchSpeechTranscripts(finalChunks);
      let cleanInterim = cleanSpeechChunk(rawInterim);

      if (cleanInterim && stitchedFinal) {
        const finalLower = stitchedFinal.toLowerCase();
        const interimLower = cleanInterim.toLowerCase();
        if (finalLower.endsWith(interimLower) || finalLower === interimLower) {
          cleanInterim = '';
        } else if (interimLower.startsWith(finalLower)) {
          cleanInterim = cleanInterim.slice(stitchedFinal.length).trim();
        }
      }

      let combined = stitchedFinal;
      if (cleanInterim) {
        combined += (combined ? ' ' : '') + cleanInterim;
      }

      const deduplicated = deduplicateAdjacentWords(combined);
      state.interimTranscript = deduplicated;

      renderLiveBubble(deduplicated || 'Escuchando…');
    };

    recognition.onerror = (event) => {
      const err = event ? event.error : '';
      if (err === 'no-speech') {
        setStatus('No se detectó voz. Vuelve a intentarlo cuando estés listo.');
      } else if (err === 'not-allowed') {
        setStatus('Permiso de micrófono denegado. Permite el acceso para dictar.', true);
      } else if (err === 'audio-capture') {
        setStatus('No se encontró ningún micrófono conectado en este dispositivo.', true);
      } else if (err === 'network') {
        setStatus('Error de red en el servicio de reconocimiento de voz.', true);
      } else if (err !== 'aborted') {
        setStatus(`Error de dictado (${err || 'desconocido'}).`, true);
      }
      stopDictation();
    };

    recognition.onend = () => {
      const finalText = (state.interimTranscript || stitchSpeechTranscripts(sessionFinalChunks) || '').trim();
      removeLiveBubble();

      if (state.isDictating && finalText) {
        addMessage({ kind: 'dict', text: finalText });
        setStatus('Dictado guardado.');
      }

      state.isDictating = false;
      state.interimTranscript = '';
      sessionFinalChunks = [];
      updateMicButtonUI();
    };

    recognition.start();
  } catch (err) {
    console.warn('[Dictation] Error al iniciar reconocimiento:', err);
    setStatus('No se pudo iniciar el micrófono. Revisa los permisos.', true);
    state.isDictating = false;
    updateMicButtonUI();
    removeLiveBubble();
  }
}

export function stopDictation() {
  if (!state.isDictating) return;

  if (recognition) {
    try {
      recognition.stop();
    } catch (_) {
      try { recognition.abort(); } catch (_) {}
    }
  }

  // Respaldo de seguridad si onend no se dispara inmediatamente
  setTimeout(() => {
    if (state.isDictating) {
      const finalText = (state.interimTranscript || stitchSpeechTranscripts(sessionFinalChunks) || '').trim();
      removeLiveBubble();
      if (finalText) {
        addMessage({ kind: 'dict', text: finalText });
      }
      state.isDictating = false;
      state.interimTranscript = '';
      sessionFinalChunks = [];
      updateMicButtonUI();
    }
  }, 250);
}

export function toggleDictation() {
  if (state.isDictating) {
    stopDictation();
  } else {
    startDictation();
  }
}
