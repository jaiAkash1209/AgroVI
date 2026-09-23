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
      showToast('Listening for agri voice command…');
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
    showToast(`Simulated Voice Command: "${picked}"`);
    this.processVoiceCommand(picked);
  },

  playAcousticChime(freq = 440, duration = 0.12) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // AudioContext policy fallback
    }
  },

  processVoiceCommand(cmd) {
    this.playAcousticChime(587, 0.10);
    const lower = cmd.toLowerCase();

    // 1. Direct Valve Water Actuation
    if (lower.includes('start water') || lower.includes('open valve') || lower.includes('पानी चालू') || lower.includes('तண்ணீர் திற') || lower.includes('valve on')) {
      const btn = document.getElementById('valve-btn-1') || document.getElementById('btn-valve-z1');
      if (btn) btn.click();
      this.playAcousticChime(880, 0.15);
      this.speak('Opening Zone 1 solenoid valve. Booster pump synchronized.');
      showToast('Voice Command: Opening Zone 1 Valve');
      return;
    }
    if (lower.includes('stop water') || lower.includes('close valve') || lower.includes('पानी बंद') || lower.includes('தண்ணீர் நிறுத்து') || lower.includes('valve off')) {
      const btnAuto = document.getElementById('mode-btn-auto');
      if (btnAuto) btnAuto.click();
      this.playAcousticChime(660, 0.15);
      this.speak('Emergency stop. Switching to auto irrigation mode.');
      showToast('Voice Command: Switching to Auto Safety Mode');
      return;
    }

    // 2. Farmer Helpline & Support
    if (lower.includes('help') || lower.includes('helpline') || lower.includes('मदद') || lower.includes('कॉल') || lower.includes('உதவி') || lower.includes('सहायता')) {
      const helplineBtn = document.getElementById('btn-call-helpline-quick') || document.getElementById('btn-popup-support');
      if (helplineBtn) helplineBtn.click();
      this.playAcousticChime(880, 0.15);
      this.speak('Opening Kisan Agri Helpline support.');
      return;
    }

    // 3. Multilingual Views Navigation
    if (lower.includes('scan') || lower.includes('leaf') || lower.includes('disease') || lower.includes('पत्ता') || lower.includes('रोग') || lower.includes('ഇല') || lower.includes('രോഗം') || lower.includes('இலை')) {
      this.triggerView('cropVision');
      this.playAcousticChime(880, 0.15);
      this.speak('Opening Crop Vision AI Diagnostic Scanner.');
    } else if (lower.includes('nutrition') || lower.includes('npk') || lower.includes('fertilizer') || lower.includes('soil') || lower.includes('खाद') || lower.includes('पोषण') || lower.includes('വളം') || lower.includes('ஊட்டச்சத்து')) {
      this.triggerView('nutrition');
      this.playAcousticChime(880, 0.15);
      this.speak('Opening Plant Nutrition and Soil N P K analytics.');
    } else if (lower.includes('water') || lower.includes('irrigation') || lower.includes('drip') || lower.includes('पानी') || lower.includes('सिंचाई') || lower.includes('നനയ്ക്കുക') || lower.includes('பாசனம்')) {
      this.triggerView('irrigation');
      this.playAcousticChime(880, 0.15);
      this.speak('Opening Smart Drip Irrigation zone controllers.');
    } else if (lower.includes('weather') || lower.includes('rain') || lower.includes('temp') || lower.includes('मौसम') || lower.includes('बारिश') || lower.includes('കാലാവസ്ഥ') || lower.includes('வானிலை')) {
      this.triggerView('weatherDesk');
      this.playAcousticChime(880, 0.15);
      this.speak('Opening Micro Climate Weather Desk.');
    } else if (lower.includes('mandi') || lower.includes('market') || lower.includes('price') || lower.includes('भाव') || lower.includes('मंडी') || lower.includes('बाजार') || lower.includes('വിപണി') || lower.includes('சந்தை')) {
      this.triggerView('marketHub');
      this.playAcousticChime(880, 0.15);
      this.speak('Opening APMC Mandi Market Commodity Hub.');
    } else if (lower.includes('overview') || lower.includes('home') || lower.includes('summary') || lower.includes('फार्म') || lower.includes('होम')) {
      this.triggerView('overview');
      this.playAcousticChime(880, 0.15);
      this.speak('Opening Farm Overview and Command Center.');
    } else {
      showToast(`Unrecognized command: "${cmd}". Try saying "Scan Leaf", "Start Water", or "Mandi Bhav".`);
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
        this.playAcousticChime(440, 0.12);
        this.toggleListening();
      });
    }
  },

  updateMicUI(listening) {
    const micBtn = document.getElementById('btn-voice-mic');
    if (!micBtn) return;
    if (listening) {
      micBtn.classList.add('listening');
      micBtn.innerHTML = '<span class="status-dot-pulse"></span> Listening…';
    } else {
      micBtn.classList.remove('listening');
      micBtn.innerHTML = 'Voice Agent';
    }
  }
};
