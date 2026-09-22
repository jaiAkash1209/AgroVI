/**
 * AgroVI Smart Irrigation Engine (FAO-56 Penman-Monteith ET₀ Water Balance Model)
 */

import { Store } from './state.js';
import { showToast } from './ui-toast.js';

/**
 * Calculate Penman-Monteith Reference Evapotranspiration (ET₀ in mm/day)
 */
export function calculateET0(tempC = 28, humidity = 58, windSpeedKmH = 12, solarRadW = 850) {
  const T = tempC;
  const u2 = windSpeedKmH * 0.27778; // convert km/h to m/s
  const es = 0.6108 * Math.exp((17.27 * T) / (T + 237.3));
  const ea = es * (humidity / 100);
  const delta = (4098 * es) / Math.pow(T + 237.3, 2);
  const gamma = 0.067;
  const Rn = (solarRadW * 0.0864) / 3.6;

  const num = 0.408 * delta * Rn + gamma * (900 / (T + 273)) * u2 * (es - ea);
  const den = delta + gamma * (1 + 0.34 * u2);

  const et0 = Math.max(1.8, Math.min(9.5, num / den));
  return parseFloat(et0.toFixed(2));
}

export function initIrrigation() {
  const modeButtons = document.querySelectorAll('.mode-toggle button');

  modeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      modeButtons.forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      const mode = btn.textContent.trim();
      Store.set('irrigationMode', mode);
      showToast(mode === 'Auto' ? 'FAO-56 Auto Drip Scheduler Armed.' : 'Manual Drip Valve Mode Active.');
    });
  });

  // Calculate ET0 water requirement
  const et0Rate = calculateET0();
  Store.set('et0Rate', et0Rate);
}
