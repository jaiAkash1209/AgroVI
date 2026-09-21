/**
 * AgroVI Crop Vision Lab Component
 */

import { showToast } from './ui-toast.js';

export function initVision() {
  const scanButton = document.querySelector('.vision-panel .subtle-button');
  const viewResultButton = document.querySelector('.view-result');
  const stageInfo = document.querySelector('.stage-info');

  scanButton?.addEventListener('click', () => {
    showToast('Scanning leaf. Keep camera steady…');
    if (stageInfo) {
      stageInfo.innerHTML = '<span class="online-dot" style="background:#f1b750"></span> ANALYZING LEAF PATTERNS…';
      setTimeout(() => {
        stageInfo.innerHTML = '<span class="online-dot"></span> LIVE VIEW · ACTIVE';
        showToast('Scan complete. Disease found with 94% confidence.');
      }, 2400);
    }
  });

  viewResultButton?.addEventListener('click', () => {
    showToast('Opened Early Blight treatment plan.');
  });
}
