import { DEFAULT_SETTINGS } from './storage.js';

export const state = {
  messages: [],
  settings: { ...DEFAULT_SETTINGS },
  isDictating: false,
  speakingMessageId: null,
  interimTranscript: '',
  voices: []
};

export const el = {};

export function initElements() {
  el.chatThread = document.getElementById('chatThread');
  el.composerForm = document.getElementById('composerForm');
  el.composerTextarea = document.getElementById('composerTextarea');
  el.micBtn = document.getElementById('micBtn');
  el.sendTtsBtn = document.getElementById('sendTtsBtn');
  el.statusLine = document.getElementById('statusLine');
  el.settingsBtn = document.getElementById('settingsBtn');
  el.settingsPanel = document.getElementById('settingsPanel');
  el.settingsCloseBtn = document.getElementById('settingsCloseBtn');
  el.voiceSelect = document.getElementById('voiceSelect');
  el.speedSelect = document.getElementById('speedSelect');
  el.dictationLangSelect = document.getElementById('dictationLangSelect');
  el.clearChatBtn = document.getElementById('clearChatBtn');
  el.emptyState = document.getElementById('emptyState');
}
