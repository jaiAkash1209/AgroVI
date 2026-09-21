/**
 * AgroVI Toast Notification Module
 */

import { Security } from './security.js';

const toastEl = document.querySelector('.toast') || (() => {
  const el = document.createElement('div');
  el.className = 'toast';
  document.body.appendChild(el);
  return el;
})();

let timer = null;

export const showToast = (message, duration = 3000) => {
  toastEl.textContent = Security.sanitizeInput(message);
  toastEl.classList.add('show');
  window.clearTimeout(timer);
  timer = window.setTimeout(() => toastEl.classList.remove('show'), duration);
};
