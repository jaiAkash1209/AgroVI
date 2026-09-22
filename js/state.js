/**
 * AgroVI Central State Store & Persistence Layer
 * Manages multi-plot field data models, reactive state updates, and localStorage auto-persistence.
 * Uses real Indian Soil Health Card standards and agronomic baselines.
 */

const STORAGE_KEY = 'agrovi_app_state';

const REAL_PLOTS = {
  northField: {
    id: 'northField',
    name: 'North Field — Wheat (Sonalika)',
    crop: 'Wheat (Sonalika)',
    area: 15,
    healthScore: 94.2,
    moisture: 42,
    pH: 6.5,
    NPK: { N: 320, P: 22, K: 210 }, // Soil Health Card kg/ha baseline
    valveStatus: 'Zone 2 Drip Active (45 L/min)',
    et0Rate: 4.8
  },
  southOrchard: {
    id: 'southOrchard',
    name: 'South Orchard — Pomegranate (Bhagawa)',
    crop: 'Pomegranate (Bhagawa)',
    area: 8,
    healthScore: 88.4,
    moisture: 58,
    pH: 6.8,
    NPK: { N: 380, P: 28, K: 260 },
    valveStatus: 'Idle (Moisture Optimal)',
    et0Rate: 3.9
  },
  greenhouseB: {
    id: 'greenhouseB',
    name: 'Greenhouse B — Tomato (Hybrid Red)',
    crop: 'Tomato (Hybrid Red)',
    area: 3,
    healthScore: 76.1,
    moisture: 31,
    pH: 6.2,
    NPK: { N: 260, P: 14, K: 180 },
    valveStatus: 'Zone 3 Drip Active (20 L/min)',
    et0Rate: 5.2
  }
};

class StateStore {
  constructor() {
    this.listeners = new Map();
    this.state = this.loadPersistedState();
  }

  loadPersistedState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          activePlotId: parsed.activePlotId || 'northField',
          plots: parsed.plots || REAL_PLOTS,
          currentLang: parsed.currentLang || 'en',
          theme: parsed.theme || 'light',
          mandiOffers: parsed.mandiOffers || [],
          valveLogs: parsed.valveLogs || [
            { time: '14:30 IST', zone: 'Zone 2', action: 'ACTIVATED', rate: '45 L/min' },
            { time: '12:00 IST', zone: 'Zone 1', action: 'DEACTIVATED', rate: '0 L/min' }
          ]
        };
      }
    } catch (e) {
      console.warn('localStorage parse fallback:', e);
    }

    return {
      activePlotId: 'northField',
      plots: REAL_PLOTS,
      currentLang: 'en',
      theme: 'light',
      mandiOffers: [],
      valveLogs: [
        { time: '14:30 IST', zone: 'Zone 2', action: 'ACTIVATED', rate: '45 L/min' }
      ]
    };
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('localStorage save failed:', e);
    }
  }

  get(key) {
    if (!key) return { ...this.state };
    if (key === 'activePlot') {
      return this.state.plots[this.state.activePlotId] || this.state.plots.northField;
    }
    return this.state[key];
  }

  set(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;
    this.save();
    this.emit(key, value, oldValue);
    this.emit('*', this.state);
  }

  updateActivePlot(updates) {
    const activeId = this.state.activePlotId;
    if (this.state.plots[activeId]) {
      this.state.plots[activeId] = {
        ...this.state.plots[activeId],
        ...updates
      };
      this.save();
      this.emit('activePlot', this.state.plots[activeId]);
      this.emit('*', this.state);
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, ...args) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => {
        try {
          cb(...args);
        } catch (e) {
          console.error(`Error in listener for event "${event}":`, e);
        }
      });
    }
  }
}

export const Store = new StateStore();
