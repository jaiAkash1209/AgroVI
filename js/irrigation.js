/**
 * AgroVI Smart Irrigation Component
 */

import { Store } from './state.js';
import { showToast } from './ui-toast.js';

export function initIrrigation() {
  const modeButtons = document.querySelectorAll('.mode-toggle button');
  const micButton = document.querySelector('.mic-button');

  modeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      modeButtons.forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      const mode = btn.textContent.trim();
      Store.set('irrigationMode', mode);
      showToast(mode === 'Auto' ? 'Auto drip irrigation armed.' : 'Manual irrigation mode active.');
    });
  });

  micButton?.addEventListener('click', () => {
    showToast('Listening for voice command: "Start zone three irrigation"…');
  });
}
