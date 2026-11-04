import { state, el } from './state.js';
import { saveMessages, clearMessagesStorage, MAX_MESSAGES } from './storage.js';
import { uid, formatTime } from './utils.js';
import { speakText, stopSpeaking } from './tts.js';

let statusTimeout = null;

export function setStatus(msg, isError = false) {
  if (!el.statusLine) return;
  clearTimeout(statusTimeout);
  el.statusLine.textContent = msg || '';
  el.statusLine.className = 'status-line' + (isError ? ' error' : '');

  if (msg && !isError) {
    statusTimeout = setTimeout(() => {
      if (el.statusLine && el.statusLine.textContent === msg) {
        el.statusLine.textContent = '';
      }
    }, 4500);
  }
}

export function scrollToBottom(smooth = true) {
  if (!el.chatThread) return;
  // Utilizar requestAnimationFrame para asegurar que el DOM esté actualizado
  requestAnimationFrame(() => {
    el.chatThread.scrollTo({
      top: el.chatThread.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
  });
}

export function renderLiveBubble(text) {
  if (!el.chatThread) return;

  let liveBubble = document.getElementById('liveDictBubble');
  if (!liveBubble) {
    // Si había estado vacío, ocultarlo
    if (el.emptyState) {
      el.emptyState.style.display = 'none';
    }

    liveBubble = document.createElement('div');
    liveBubble.id = 'liveDictBubble';
    liveBubble.className = 'chat-bubble chat-bubble-dict live-bubble';

    const headerRow = document.createElement('div');
    headerRow.className = 'live-bubble-indicator';
    const pulseDot = document.createElement('span');
    pulseDot.className = 'live-pulse-dot';
    const pulseLabel = document.createElement('span');
    pulseLabel.textContent = 'Escuchando en vivo…';
    headerRow.appendChild(pulseDot);
    headerRow.appendChild(pulseLabel);

    const textEl = document.createElement('div');
    textEl.className = 'bubble-text live-text';
    textEl.id = 'liveBubbleText';

    liveBubble.appendChild(headerRow);
    liveBubble.appendChild(textEl);
    el.chatThread.appendChild(liveBubble);
  }

  const liveText = document.getElementById('liveBubbleText');
  if (liveText) {
    liveText.textContent = text || '…';
  }

  scrollToBottom(true);
}

export function removeLiveBubble() {
  const liveBubble = document.getElementById('liveDictBubble');
  if (liveBubble && liveBubble.parentNode) {
    liveBubble.parentNode.removeChild(liveBubble);
  }
  if (state.messages.length === 0 && el.emptyState) {
    el.emptyState.style.display = 'flex';
  }
}

/**
 * Renderiza el hilo completo de mensajes usando textContent de forma segura.
 */
export function renderChatThread() {
  if (!el.chatThread) return;

  removeLiveBubble();
  el.chatThread.innerHTML = '';

  if (state.messages.length === 0) {
    if (el.emptyState) {
      el.emptyState.style.display = 'flex';
      el.chatThread.appendChild(el.emptyState);
    }
    return;
  }

  if (el.emptyState) {
    el.emptyState.style.display = 'none';
  }

  const fragment = document.createDocumentFragment();

  state.messages.forEach((msg) => {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${msg.kind === 'dict' ? 'chat-bubble-dict' : 'chat-bubble-tts'}`;
    bubble.dataset.id = msg.id;

    if (state.speakingMessageId === msg.id) {
      bubble.classList.add('speaking-active');
    }

    // Texto con textContent para prevención de XSS
    const textDiv = document.createElement('div');
    textDiv.className = 'bubble-text';
    textDiv.textContent = msg.text;
    bubble.appendChild(textDiv);

    // Metadata: etiqueta y hora
    const metaDiv = document.createElement('div');
    metaDiv.className = 'bubble-meta';

    const tagSpan = document.createElement('span');
    tagSpan.className = 'bubble-tag';
    tagSpan.textContent = msg.kind === 'dict' ? 'Dictado' : 'Texto a voz';

    const timeSpan = document.createElement('span');
    timeSpan.className = 'bubble-time';
    timeSpan.textContent = formatTime(msg.ts);

    metaDiv.appendChild(tagSpan);
    metaDiv.appendChild(timeSpan);
    bubble.appendChild(metaDiv);

    // Acciones: Escuchar, Copiar, Borrar
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'bubble-actions';

    // 1. Escuchar
    const listenBtn = document.createElement('button');
    listenBtn.type = 'button';
    listenBtn.className = 'bubble-action-btn btn-listen';
    listenBtn.setAttribute('aria-label', `Escuchar mensaje: ${msg.text.slice(0, 30)}`);
    listenBtn.textContent = '🔊 Escuchar';
    listenBtn.addEventListener('click', () => {
      speakText(msg.text, msg.id);
    });
    actionsDiv.appendChild(listenBtn);

    // 2. Copiar
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'bubble-action-btn btn-copy';
    copyBtn.setAttribute('aria-label', 'Copiar mensaje al portapapeles');
    copyBtn.textContent = '📋 Copiar';
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(msg.text);
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✓ Copiado';
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.textContent = originalText;
          copyBtn.classList.remove('copied');
        }, 1800);
      } catch (err) {
        setStatus('No se pudo copiar al portapapeles.', true);
      }
    });
    actionsDiv.appendChild(copyBtn);

    // 3. Borrar
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'bubble-action-btn btn-delete';
    deleteBtn.setAttribute('aria-label', 'Borrar mensaje');
    deleteBtn.textContent = '🗑️ Borrar';
    deleteBtn.addEventListener('click', () => {
      deleteMessage(msg.id);
    });
    actionsDiv.appendChild(deleteBtn);

    bubble.appendChild(actionsDiv);
    fragment.appendChild(bubble);
  });

  el.chatThread.appendChild(fragment);
}

export function addMessage({ kind, text }) {
  const clean = (text || '').trim();
  if (!clean) return null;

  const msg = {
    id: uid(),
    kind: kind === 'dict' ? 'dict' : 'tts',
    text: clean,
    ts: Date.now()
  };

  state.messages.push(msg);
  if (state.messages.length > MAX_MESSAGES) {
    state.messages = state.messages.slice(-MAX_MESSAGES);
  }

  saveMessages(state.messages);
  renderChatThread();
  scrollToBottom(true);
  return msg;
}

export function deleteMessage(id) {
  if (state.speakingMessageId === id) {
    stopSpeaking();
  }
  state.messages = state.messages.filter((m) => m.id !== id);
  saveMessages(state.messages);
  renderChatThread();
}

export function clearConversation() {
  stopSpeaking();
  state.messages = [];
  clearMessagesStorage();
  renderChatThread();
  setStatus('Conversación vaciada.');
}
