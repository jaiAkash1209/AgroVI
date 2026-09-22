/**
 * AgroVI Main Application Entry Point
 * Initializes all ES6 component modules and purges stale caches.
 */

import { initSidebar } from './sidebar.js';
import { initVision } from './vision.js';
import { initIrrigation } from './irrigation.js';
import { initLanguage } from './i18n.js';
import { showToast } from './ui-toast.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('AgroVI Smart Farming System Initialized');
  initSidebar();
  initVision();
  initIrrigation();
  initLanguage();

  // Purge any stale service worker caches to ensure fresh page updates
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (let registration of registrations) {
        registration.update();
      }
    });
  }
});
