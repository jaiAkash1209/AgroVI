/**
 * AgroVI Smart Irrigation & IoT Telemetry Engine
 * FAO-56 Penman-Monteith ET₀ Model, Solenoid Valve Actuation,
 * Real-time ESP32 Sensor Ingestion, and Virtual Hardware Simulator.
 */

import { Store } from './state.js';
import { showToast } from './ui-toast.js';

let telemetryData = null;
let syncInterval = null;
let simInterval = null;
let isSimulating = false;
let isDraggingSlider = false;

/**
 * Crop Coefficient (Kc) Growth Stage Progression Matrix
 * Standard FAO-56 Irrigation Paper 56
 */
export const CropKcCoefficients = {
  wheat: { initial: 0.35, mid: 1.15, late: 0.40, currentStage: 'mid' },
  pomegranate: { initial: 0.50, mid: 0.85, late: 0.65, currentStage: 'mid' },
  tomato: { initial: 0.60, mid: 1.15, late: 0.80, currentStage: 'mid' }
};

/**
 * Calculate Penman-Monteith Reference Evapotranspiration (ET₀ in mm/day)
 * FAO-56 Irrigation and Drainage Paper 56 standard
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

/**
 * Calculate Crop Water Stress Index (CWSI)
 * CWSI ranges from 0.0 (non-stressed, optimal transpiration) to 1.0 (severe stress)
 */
export function calculateCWSI(canopyTemp = 25, airTemp = 28, lowerBaseline = -2.5, upperBaseline = 4.0) {
  const diff = canopyTemp - airTemp;
  const cwsi = (diff - lowerBaseline) / (upperBaseline - lowerBaseline);
  return parseFloat(Math.max(0.0, Math.min(1.0, cwsi)).toFixed(2));
}

/**
 * Calculate Estimated Hours Before Soil Drops Below Critical Irrigation Threshold
 */
export function calculateHoursToWilting(currentMoisture, threshold = 35.0, et0 = 5.2, kc = 1.05) {
  if (currentMoisture <= threshold) return 0;
  const dailyDepletionRate = (et0 * kc) * 0.45; // % soil moisture loss per 24 hours
  const hourlyRate = dailyDepletionRate / 24;
  const hours = (currentMoisture - threshold) / Math.max(0.05, hourlyRate);
  return Math.round(hours);
}

/**
 * Initialize Smart Irrigation & IoT Telemetry
 */
export function initIrrigation() {
  const et0 = calculateET0();
  Store.set('et0Rate', et0);

  bindModeControls();
  bindValveControls();
  bindThresholdControls();
  bindSimulatorControls();

  // Initial fetch and start 3s polling
  fetchTelemetry();
  if (syncInterval) clearInterval(syncInterval);
  syncInterval = setInterval(fetchTelemetry, 3000);
}

/**
 * Fetch latest telemetry and valves status from API
 */
async function fetchTelemetry() {
  try {
    const res = await fetch('/api/iot/telemetry');
    if (!res.ok) return;
    const data = await res.json();
    if (data.success && data.telemetry) {
      telemetryData = data.telemetry;
      renderTelemetryUI(telemetryData);
    }
  } catch (err) {
    // Silent failover during offline/simulated mode
    console.debug('[IoT Sync] Telemetry fetch fallback:', err.message);
  }
}

/**
 * Update the Dashboard Irrigation UI with Live Telemetry
 */
function renderTelemetryUI(telem) {
  if (!telem) return;
  const system = telem.system || {};
  const zones = telem.zones || {};

  // 1. System Mode (AUTO vs MANUAL)
  const mode = system.irrigationMode || 'AUTO';
  const btnAuto = document.getElementById('mode-btn-auto');
  const btnManual = document.getElementById('mode-btn-manual');
  if (btnAuto && btnManual) {
    if (mode === 'AUTO') {
      btnAuto.classList.add('active');
      btnManual.classList.remove('active');
    } else {
      btnManual.classList.add('active');
      btnAuto.classList.remove('active');
    }
  }

  // 2. Booster Pump Status
  const pumpLed = document.getElementById('pump-led-indicator');
  const pumpLabel = document.getElementById('pump-status-label');
  if (pumpLed && pumpLabel) {
    if (system.pumpActive) {
      pumpLed.classList.add('active');
      pumpLabel.textContent = `ACTIVE (${system.pumpPressureBar || 2.4} Bar)`;
      pumpLabel.style.color = 'var(--color-primary)';
    } else {
      pumpLed.classList.remove('active');
      pumpLabel.textContent = 'STANDBY (0.0 Bar)';
      pumpLabel.style.color = 'var(--color-text-muted)';
    }
  }

  // 3. Water Consumed Today
  const waterToday = document.getElementById('system-water-today');
  if (waterToday && system.totalWaterUsedTodayLiters !== undefined) {
    waterToday.textContent = `${Number(system.totalWaterUsedTodayLiters).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} L`;
  }

  // 4. Node Status Pill
  const nodePill = document.getElementById('iot-node-id');
  if (nodePill && system.nodeId) {
    nodePill.textContent = system.nodeId;
  }
  const lastPing = document.getElementById('iot-last-ping');
  if (lastPing) {
    lastPing.textContent = 'Live';
  }

  // 5. Zone Cards (1, 2, 3)
  Object.keys(zones).forEach((zid) => {
    const z = zones[zid];
    renderZoneCard(zid, z);
  });
}

/**
 * Render an Individual Zone Card
 */
function renderZoneCard(zid, z) {
  const card = document.getElementById(`zone-card-${zid}`);
  if (!card) return;

  const moisture = Number(z.moisture || 0);
  const temp = Number(z.temperature || 24);
  const flow = Number(z.flowRate || 0);
  const valveOpen = Boolean(z.valveOpen);
  const threshold = Number(z.threshold || 35);
  const waterUsed = Number(z.waterUsedLiters || 0);

  // Moisture Badge
  const badge = document.getElementById(`zone-badge-${zid}`);
  if (badge) {
    badge.textContent = `${moisture.toFixed(1)}% Moisture`;
    badge.className = 'badge zone-moisture-badge ' + (moisture < threshold ? 'badge-warning' : 'badge-success');
  }

  // Gauge Fill & Value
  const gaugeFill = document.getElementById(`gauge-fill-${zid}`);
  const gaugeVal = document.getElementById(`gauge-val-${zid}`);
  if (gaugeFill) {
    const clampedPct = Math.max(0, Math.min(100, moisture));
    gaugeFill.style.width = `${clampedPct}%`;
    gaugeFill.className = 'gauge-arc-fill ' + (moisture < threshold ? 'dry' : (valveOpen ? 'wet' : ''));
  }
  if (gaugeVal) {
    gaugeVal.textContent = `${moisture.toFixed(1)}%`;
  }

  // Temperature & Flow Pills
  const tempVal = document.getElementById(`zone-temp-${zid}`);
  if (tempVal) {
    tempVal.textContent = `${temp.toFixed(1)} °C`;
  }
  const flowVal = document.getElementById(`zone-flow-${zid}`);
  const flowPill = document.getElementById(`flow-pill-${zid}`);
  if (flowVal) {
    flowVal.textContent = `${flow.toFixed(2)} L/m`;
  }
  if (flowPill) {
    if (valveOpen && flow > 0) {
      flowPill.classList.add('watering');
    } else {
      flowPill.classList.remove('watering');
    }
  }

  // Threshold Slider & Display (only update slider if user isn't actively sliding)
  const threshVal = document.getElementById(`thresh-val-${zid}`);
  const threshSlider = document.getElementById(`thresh-slider-${zid}`);
  if (threshVal) {
    threshVal.textContent = Math.round(threshold);
  }
  if (threshSlider && !isDraggingSlider) {
    threshSlider.value = Math.round(threshold);
  }

  // Solenoid Valve Button
  const valveBtn = document.getElementById(`valve-btn-${zid}`);
  if (valveBtn) {
    const btnText = valveBtn.querySelector('.valve-btn-text');
    const led = valveBtn.querySelector('.valve-status-light');
    if (valveOpen) {
      valveBtn.classList.add('active');
      if (btnText) btnText.textContent = 'VALVE ON (DRIPPING)';
      if (led) led.classList.add('active');
    } else {
      valveBtn.classList.remove('active');
      if (btnText) btnText.textContent = 'VALVE OFF (CLOSED)';
      if (led) led.classList.remove('active');
    }
  }

  // Active Watering Card Glow
  if (valveOpen) {
    card.classList.add('active-watering');
  } else {
    card.classList.remove('active-watering');
  }

  // Water Dispensed & Last Irrigated Footer
  const waterElem = document.getElementById(`zone-water-${zid}`);
  if (waterElem) {
    waterElem.textContent = `${waterUsed.toFixed(1)} L`;
  }
  const lastElem = document.getElementById(`zone-last-${zid}`);
  if (lastElem && z.lastIrrigated) {
    try {
      const d = new Date(z.lastIrrigated);
      lastElem.textContent = valveOpen ? 'Active Now' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      lastElem.textContent = 'Recent';
    }
  }

  // Sync simulator slider if not dragging
  if (!isDraggingSlider) {
    const simSlider = document.getElementById(`sim-slider-${zid}`);
    const simLabel = document.getElementById(`sim-label-${zid}`);
    if (simSlider) simSlider.value = moisture;
    if (simLabel) simLabel.textContent = `${moisture.toFixed(1)}%`;
  }
}

/**
 * Bind Mode Selection Controls (AUTO vs MANUAL)
 */
function bindModeControls() {
  const btnAuto = document.getElementById('mode-btn-auto');
  const btnManual = document.getElementById('mode-btn-manual');

  if (btnAuto) {
    btnAuto.addEventListener('click', async () => {
      await updateSystemMode('AUTO');
    });
  }
  if (btnManual) {
    btnManual.addEventListener('click', async () => {
      await updateSystemMode('MANUAL');
    });
  }
}

/**
 * Send Mode Change to Backend
 */
async function updateSystemMode(mode) {
  try {
    const res = await fetch('/api/iot/valves', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode })
    });
    const data = await res.json();
    if (data.success && data.telemetry) {
      telemetryData = data.telemetry;
      renderTelemetryUI(telemetryData);
      showToast(mode === 'AUTO' ? '⚡ FAO-56 Auto Drip Active (Sensors Actuating Relays)' : '🖐️ Manual Override Mode Enabled.');
    }
  } catch (err) {
    showToast('Failed to switch irrigation mode', 'error');
  }
}

/**
 * Bind Solenoid Valve Toggle Buttons
 */
function bindValveControls() {
  const valveBtns = document.querySelectorAll('.valve-toggle-btn');
  valveBtns.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const zoneId = btn.getAttribute('data-zone');
      if (!zoneId || !telemetryData) return;

      const currentZone = telemetryData.zones?.[zoneId];
      const currentlyOpen = currentZone ? Boolean(currentZone.valveOpen) : false;
      const targetState = !currentlyOpen;

      btn.disabled = true;
      try {
        const res = await fetch('/api/iot/valves', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            zoneId: parseInt(zoneId, 10),
            valveOpen: targetState
          })
        });
        const data = await res.json();
        if (data.success && data.telemetry) {
          telemetryData = data.telemetry;
          renderTelemetryUI(telemetryData);
          showToast(targetState ? `Zone ${zoneId} Solenoid Valve: OPEN (Dripping)` : `Zone ${zoneId} Solenoid Valve: CLOSED`);
          logSimulatorConsole(`[ACTUATION] Zone ${zoneId} valve set to ${targetState ? 'OPEN' : 'CLOSED'}`);
        }
      } catch (err) {
        showToast(`Valve control error: ${err.message}`, 'error');
      } finally {
        btn.disabled = false;
      }
    });
  });
}

/**
 * Bind Threshold Sliders (20% to 60%)
 */
function bindThresholdControls() {
  const sliders = document.querySelectorAll('.zone-thresh-slider');
  sliders.forEach((slider) => {
    const zoneId = slider.getAttribute('data-zone');
    const label = document.getElementById(`thresh-val-${zoneId}`);

    slider.addEventListener('mousedown', () => { isDraggingSlider = true; });
    slider.addEventListener('touchstart', () => { isDraggingSlider = true; });

    slider.addEventListener('input', () => {
      if (label) label.textContent = slider.value;
    });

    slider.addEventListener('change', async () => {
      isDraggingSlider = false;
      const newThreshold = parseFloat(slider.value);
      try {
        const res = await fetch('/api/iot/valves', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            zoneId: parseInt(zoneId, 10),
            threshold: newThreshold
          })
        });
        const data = await res.json();
        if (data.success && data.telemetry) {
          telemetryData = data.telemetry;
          renderTelemetryUI(telemetryData);
          showToast(`Zone ${zoneId} threshold updated: ${newThreshold}%`);
          logSimulatorConsole(`[CONFIG] Zone ${zoneId} threshold changed to ${newThreshold}%`);
        }
      } catch (err) {
        console.error('Threshold update error:', err);
      }
    });

    slider.addEventListener('mouseup', () => { isDraggingSlider = false; });
    slider.addEventListener('touchend', () => { isDraggingSlider = false; });
  });
}

/**
 * Bind Virtual ESP32 Hardware Simulator Controls
 */
function bindSimulatorControls() {
  const btnToggle = document.getElementById('btn-toggle-simulator');
  const btnClose = document.getElementById('btn-close-simulator');
  const panel = document.getElementById('iot-simulator-panel');

  if (btnToggle && panel) {
    btnToggle.addEventListener('click', () => {
      const isVisible = panel.style.display !== 'none';
      panel.style.display = isVisible ? 'none' : 'block';
      if (!isVisible) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  if (btnClose && panel) {
    btnClose.addEventListener('click', () => {
      panel.style.display = 'none';
    });
  }

  // Stream Toggle
  const btnStream = document.getElementById('btn-sim-stream-toggle');
  if (btnStream) {
    btnStream.addEventListener('click', () => {
      if (isSimulating) {
        stopSimulationStream();
      } else {
        startSimulationStream();
      }
    });
  }

  // Preset Buttons
  const presetDrought = document.getElementById('preset-drought');
  const presetBalanced = document.getElementById('preset-balanced');
  const presetRain = document.getElementById('preset-rain');

  if (presetDrought) {
    presetDrought.addEventListener('click', () => {
      injectPresetTelemetry({ 1: 22.0, 2: 24.5, 3: 21.0 }, 'Drought condition triggered. Auto-valves should engage!');
    });
  }
  if (presetBalanced) {
    presetBalanced.addEventListener('click', () => {
      injectPresetTelemetry({ 1: 48.0, 2: 44.0, 3: 46.5 }, 'Field moisture normalized.');
    });
  }
  if (presetRain) {
    presetRain.addEventListener('click', () => {
      injectPresetTelemetry({ 1: 68.0, 2: 72.0, 3: 65.0 }, 'Heavy rainfall simulated. Valves should shut off.');
    });
  }

  // Manual Sliders
  const simSliders = document.querySelectorAll('.sim-range');
  simSliders.forEach((slider) => {
    const zid = slider.getAttribute('data-zone');
    const label = document.getElementById(`sim-label-${zid}`);

    slider.addEventListener('mousedown', () => { isDraggingSlider = true; });
    slider.addEventListener('touchstart', () => { isDraggingSlider = true; });

    slider.addEventListener('input', () => {
      if (label) label.textContent = `${parseFloat(slider.value).toFixed(1)}%`;
    });

    slider.addEventListener('change', async () => {
      isDraggingSlider = false;
      const moisture = parseFloat(slider.value);
      await sendSensorUpdate(zid, moisture);
    });

    slider.addEventListener('mouseup', () => { isDraggingSlider = false; });
    slider.addEventListener('touchend', () => { isDraggingSlider = false; });
  });
}

/**
 * Send Individual Sensor Update to Server
 */
async function sendSensorUpdate(zoneId, moisture) {
  try {
    const t0 = performance.now();
    const res = await fetch('/api/iot/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        zoneId: parseInt(zoneId, 10),
        moisture: parseFloat(moisture)
      })
    });
    const data = await res.json();
    const latency = Math.round(performance.now() - t0);

    if (data.success && data.telemetry) {
      telemetryData = data.telemetry;
      renderTelemetryUI(telemetryData);
      logSimulatorConsole(`[ESP32 -> POST /api/iot/telemetry] Zone ${zoneId} Moisture: ${moisture}% (${latency}ms)`);
    }
  } catch (err) {
    logSimulatorConsole(`[ESP32 ERROR] ${err.message}`);
  }
}

/**
 * Inject Batch Presets
 */
async function injectPresetTelemetry(zoneMoistures, toastMsg) {
  try {
    for (const [zid, m] of Object.entries(zoneMoistures)) {
      await fetch('/api/iot/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zoneId: parseInt(zid, 10), moisture: m })
      });
    }
    await fetchTelemetry();
    showToast(toastMsg);
    logSimulatorConsole(`[PRESET APPLIED] Zones updated: ${JSON.stringify(zoneMoistures)}`);
  } catch (err) {
    showToast('Failed to apply preset', 'error');
  }
}

/**
 * Start Virtual Telemetry Stream (3s Ticks)
 */
function startSimulationStream() {
  isSimulating = true;
  const btn = document.getElementById('btn-sim-stream-toggle');
  const icon = document.getElementById('sim-stream-icon');
  const text = document.getElementById('sim-stream-text');
  const statusPing = document.getElementById('sim-status-ping');

  if (icon) icon.textContent = '⏸';
  if (text) text.textContent = 'Pause Telemetry Stream';
  if (statusPing) {
    statusPing.textContent = 'Status: Streaming active (3s)';
    statusPing.style.color = '#22c55e';
  }
  showToast('Virtual ESP32 Telemetry Stream Started (3s interval).');

  simInterval = setInterval(async () => {
    if (!telemetryData || !telemetryData.zones) return;
    const zones = telemetryData.zones;

    for (const zid of Object.keys(zones)) {
      const z = zones[zid];
      let m = Number(z.moisture || 40);
      let t = Number(z.temperature || 24);

      if (z.valveOpen) {
        // Soil absorbs water when valve is open
        m = Math.min(85, m + (Math.random() * 2.2 + 0.8));
      } else {
        // Natural soil evaporation
        m = Math.max(12, m - (Math.random() * 0.4 + 0.1));
      }

      // Slight temperature variation
      t = Math.max(18, Math.min(38, t + (Math.random() * 0.2 - 0.1)));

      await fetch('/api/iot/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zoneId: parseInt(zid, 10),
          moisture: parseFloat(m.toFixed(1)),
          temperature: parseFloat(t.toFixed(1))
        })
      });
    }

    await fetchTelemetry();
    logSimulatorConsole(`[TICK ${new Date().toLocaleTimeString()}] Telemetry dispatched for Zones 1-3. System pump: ${telemetryData.system.pumpActive ? 'ON' : 'OFF'}`);
  }, 3000);
}

/**
 * Stop Virtual Telemetry Stream
 */
function stopSimulationStream() {
  isSimulating = false;
  if (simInterval) clearInterval(simInterval);
  simInterval = null;

  const icon = document.getElementById('sim-stream-icon');
  const text = document.getElementById('sim-stream-text');
  const statusPing = document.getElementById('sim-status-ping');

  if (icon) icon.textContent = '▶';
  if (text) text.textContent = 'Start Telemetry Ticks (3s)';
  if (statusPing) {
    statusPing.textContent = 'Status: Stream paused';
    statusPing.style.color = 'var(--color-text-muted)';
  }
  showToast('Virtual Telemetry Stream Paused.');
}

/**
 * Append Message to Simulator Output Console
 */
function logSimulatorConsole(msg) {
  const consoleElem = document.getElementById('sim-console-log');
  if (!consoleElem) return;
  const time = new Date().toLocaleTimeString();
  consoleElem.textContent = `[${time}] ${msg}\n` + consoleElem.textContent.slice(0, 1500);
}
