/**
 * AgroVI Main Application Entry Point
 * Initializes all ES6 component modules and purges stale caches.
 */

import { initSidebar } from './sidebar.js';
import { initVision } from './vision.js';
import { initIrrigation } from './irrigation.js';
import { setLanguage } from './i18n.js';
import { showToast } from './ui-toast.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('🌱 AgroVI Smart Farming System Initialized');
  initSidebar();
  initVision();
  initIrrigation();

  // Language Switcher (EN | हिन्दी | தமிழ்)
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      setLanguage(lang);
      const names = { en: 'English', hi: 'हिन्दी (Hindi)', ta: 'தமிழ் (Tamil)' };
      showToast(`Language set to ${names[lang] || lang}`);
    });
  });

  // Purge any stale service worker caches to ensure fresh page updates
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (let registration of registrations) {
        registration.update();
      }
    });
  }
});
