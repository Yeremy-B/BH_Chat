import { state, el } from './state.js';

let keepAliveTimer = null;

function startKeepAlive() {
  stopKeepAlive();
  keepAliveTimer = setInterval(() => {
    if ('speechSynthesis' in window && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }
  }, 9000);
}

function stopKeepAlive() {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
}

export function isSpanishVoice(v) {
  if (!v) return false;
  const lang = (v.lang || '').toLowerCase().replace(/_/g, '-');
  const name = (v.name || '').toLowerCase();
  return lang.startsWith('es') || lang.startsWith('spa') || name.includes('spanish') || name.includes('español');
}

export function getVoiceDisplayName(v) {
  const name = v.name || 'Voz';
  const lang = (v.lang || '').replace(/_/g, '-');
  let flag = '🎙️';
  if (lang.startsWith('es-ES')) flag = '🇪🇸';
  else if (lang.startsWith('es-MX')) flag = '🇲🇽';
  else if (lang.startsWith('es-US')) flag = '🇺🇸';
  else if (lang.startsWith('es-CL')) flag = '🇨🇱';
  else if (lang.startsWith('es-AR')) flag = '🇦🇷';
  else if (lang.startsWith('es-CO')) flag = '🇨🇴';
  else if (lang.startsWith('es')) flag = '🌎';

  return `${flag} ${name} (${lang || 'es'})`;
}

export function populateVoices() {
  if (!('speechSynthesis' in window)) {
    if (el.voiceSelect) {
      el.voiceSelect.innerHTML = '<option value="auto">Síntesis no disponible</option>';
      el.voiceSelect.disabled = true;
    }
    if (el.sendTtsBtn) {
      el.sendTtsBtn.disabled = true;
      el.sendTtsBtn.title = 'Síntesis de voz no disponible en este navegador';
    }
    return;
  }

  const allVoices = window.speechSynthesis.getVoices() || [];
  state.voices = allVoices;

  if (!el.voiceSelect) return;

  const spanishVoices = allVoices.filter(isSpanishVoice);
  el.voiceSelect.innerHTML = '';

  const autoOpt = document.createElement('option');
  autoOpt.value = 'auto';
  autoOpt.textContent = 'Automática (Recomendada)';
  el.voiceSelect.appendChild(autoOpt);

  if (spanishVoices.length > 0) {
    const esGroup = document.createElement('optgroup');
    esGroup.label = 'Voces en Español disponibles';
    spanishVoices.forEach((v) => {
      const opt = document.createElement('option');
      opt.value = v.name;
      opt.textContent = getVoiceDisplayName(v);
      esGroup.appendChild(opt);
    });
    el.voiceSelect.appendChild(esGroup);
  } else if (allVoices.length > 0) {
    const otherGroup = document.createElement('optgroup');
    otherGroup.label = 'Otras voces del dispositivo';
    allVoices.forEach((v) => {
      const opt = document.createElement('option');
      opt.value = v.name;
      opt.textContent = `${v.name} (${v.lang || 'idioma'})`;
      otherGroup.appendChild(opt);
    });
    el.voiceSelect.appendChild(otherGroup);
  }

  // Restaurar valor guardado si existe en las opciones
  const savedVoice = state.settings.voice;
  if (savedVoice && Array.from(el.voiceSelect.options).some(o => o.value === savedVoice)) {
    el.voiceSelect.value = savedVoice;
  } else {
    el.voiceSelect.value = 'auto';
  }
}

export function updateBubbleHighlight() {
  const bubbles = document.querySelectorAll('.chat-bubble');
  bubbles.forEach((b) => {
    if (state.speakingMessageId && b.dataset.id === state.speakingMessageId) {
      b.classList.add('speaking-active');
    } else {
      b.classList.remove('speaking-active');
    }
  });
}

export function stopSpeaking() {
  stopKeepAlive();
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (_) {}
  }
  state.speakingMessageId = null;
  updateBubbleHighlight();
}

export function speakText(text, messageId = null) {
  if (!('speechSynthesis' in window)) return;
  const clean = (text || '').trim();
  if (!clean) return;

  // Llama a cancel() antes de cada lectura para que no se superpongan
  stopSpeaking();

  const allVoices = state.voices.length > 0 ? state.voices : (window.speechSynthesis.getVoices() || []);
  const chosenName = state.settings.voice;

  let selectedVoice = null;
  if (chosenName && chosenName !== 'auto') {
    selectedVoice = allVoices.find(v => v.name === chosenName);
  }

  // Si es "auto" o la seleccionada no se encontró, buscar la mejor según el idioma
  if (!selectedVoice) {
    const prefLang = (state.settings.dictationLang || 'es-CL').toLowerCase();
    selectedVoice = allVoices.find(v => (v.lang || '').toLowerCase().replace(/_/g, '-') === prefLang);
    if (!selectedVoice) {
      selectedVoice = allVoices.find(isSpanishVoice);
    }
    if (!selectedVoice && allVoices.length > 0) {
      selectedVoice = allVoices[0];
    }
  }

  const utter = new SpeechSynthesisUtterance(clean);
  if (selectedVoice) {
    utter.voice = selectedVoice;
    utter.lang = selectedVoice.lang || 'es-ES';
  } else {
    utter.lang = state.settings.dictationLang || 'es-ES';
  }

  utter.rate = Number(state.settings.rate) || 1.0;

  state.speakingMessageId = messageId;
  updateBubbleHighlight();

  utter.onstart = () => {
    startKeepAlive();
    updateBubbleHighlight();
  };

  utter.onend = () => {
    stopKeepAlive();
    if (state.speakingMessageId === messageId) {
      state.speakingMessageId = null;
      updateBubbleHighlight();
    }
  };

  utter.onerror = () => {
    stopKeepAlive();
    if (state.speakingMessageId === messageId) {
      state.speakingMessageId = null;
      updateBubbleHighlight();
    }
  };

  try {
    window.speechSynthesis.speak(utter);
  } catch (err) {
    console.warn('[TTS] Error al reproducir audio:', err);
    stopKeepAlive();
    state.speakingMessageId = null;
    updateBubbleHighlight();
  }
}

export function setupTTS() {
  if (!('speechSynthesis' in window)) {
    if (el.sendTtsBtn) {
      el.sendTtsBtn.disabled = true;
      el.sendTtsBtn.title = 'Síntesis de voz no compatible';
    }
    return;
  }

  populateVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      populateVoices();
    };
  }

  // Reintento diferido para móviles (Android/iOS cargan voces asíncronamente)
  setTimeout(populateVoices, 300);
  setTimeout(populateVoices, 1000);
}
