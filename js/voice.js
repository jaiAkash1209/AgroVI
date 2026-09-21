/**
 * AgroVI Multilingual Voice Assistant & Speech Synthesis Module
 * Supports Web Speech API (English, Hindi, Tamil) for hands-free field operation.
 */

import { showToast } from './ui-toast.js';

export const VoiceAssistant = {
  recognition: null,
  isListening: false,
  lang: 'en-IN',

  init() {
    this.setupSpeechRecognition();
    this.bindVoiceMicButton();
  },

  setLanguage(langCode) {
    const langMap = {
      en: 'en-IN',
      hi: 'hi-IN',
      ta: 'ta-IN'
    };
    this.lang = langMap[langCode] || 'en-IN';
    if (this.recognition) {
      this.recognition.lang = this.lang;
    }
  },

  setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Web Speech API not supported in this browser. Fallback simulation mode active.');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = this.lang;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.updateMicUI(true);
      showToast('🎙️ Listening for agri voice command…');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.updateMicUI(false);
    };

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      console.log('Voice Command Received:', transcript);
      this.processVoiceCommand(transcript);
    };

    this.recognition.onerror = (err) => {
      console.warn('Speech recognition error:', err.error);
      this.isListening = false;
      this.updateMicUI(false);
      showToast('Voice listening paused. Click mic to retry.');
    };
  },

  toggleListening() {
    if (this.recognition) {
      if (this.isListening) {
        this.recognition.stop();
      } else {
        try {
          this.recognition.start();
        } catch (e) {
          this.simulateVoiceCommand();
        }
      }
    } else {
      this.simulateVoiceCommand();
    }
  },

  simulateVoiceCommand() {
    const commands = [
      'scan leaf',
      'check nutrition',
      'control water',
      'check weather',
      'show mandi prices'
    ];
    const picked = commands[Math.floor(Math.random() * commands.length)];
    showToast(`🎙️ Simulated Voice Command: "${picked}"`);
    this.processVoiceCommand(picked);
  },

  processVoiceCommand(cmd) {
    if (cmd.includes('scan') || cmd.includes('leaf') || cmd.includes('disease') || cmd.includes('पत्ता') || cmd.includes('இலை')) {
      this.triggerView('cropVision');
      this.speak('Opening Crop Vision AI Diagnostic Scanner.');
    } else if (cmd.includes('nutrition') || cmd.includes('npk') || cmd.includes('soil') || cmd.includes('पोषण') || cmd.includes('ஊட்டச்சத்து')) {
      this.triggerView('nutrition');
      this.speak('Opening Plant Nutrition and Soil N P K analytics.');
    } else if (cmd.includes('water') || cmd.includes('irrigation') || cmd.includes('drip') || cmd.includes('पानी') || cmd.includes('பாசனம்')) {
      this.triggerView('irrigation');
      this.speak('Opening Smart Drip Irrigation zone controllers.');
    } else if (cmd.includes('weather') || cmd.includes('rain') || cmd.includes('temp') || cmd.includes('मौसम') || cmd.includes('வானிலை')) {
      this.triggerView('weatherDesk');
      this.speak('Opening Micro Climate Weather Desk.');
    } else if (cmd.includes('mandi') || cmd.includes('market') || cmd.includes('price') || cmd.includes('मंडी') || cmd.includes('சந்தை')) {
      this.triggerView('marketHub');
      this.speak('Opening APMC Mandi Market Commodity Hub.');
    } else {
      showToast(`Unrecognized command: "${cmd}". Try saying "Scan Leaf" or "Check Weather".`);
    }
  },

  triggerView(viewName) {
    const navItem = document.querySelector(`.dash-nav-item[data-view="${viewName}"]`);
    if (navItem) navItem.click();
  },

  speak(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.lang;
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  },

  bindVoiceMicButton() {
    const micBtn = document.getElementById('btn-voice-mic');
    if (micBtn) {
      micBtn.addEventListener('click', () => {
        this.toggleListening();
      });
    }
  },

  updateMicUI(listening) {
    const micBtn = document.getElementById('btn-voice-mic');
    if (!micBtn) return;
    if (listening) {
      micBtn.classList.add('listening');
      micBtn.innerHTML = '🎙️ Listening…';
    } else {
      micBtn.classList.remove('listening');
      micBtn.innerHTML = '🎙️ Voice Agent';
    }
  }
};
