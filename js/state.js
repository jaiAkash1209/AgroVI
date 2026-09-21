/**
 * AgroVI Central State Store & Event Bus
 * Manages reactive application state and event dispatching across components.
 */

class StateStore {
  constructor() {
    this.listeners = new Map();
    this.state = {
      activeTab: 'overview',
      activeField: 'North Field',
      irrigationMode: 'Auto',
      irrigationStatus: 'ARMED',
      healthScore: 82,
      nutrients: { N: 76, P: 58, K: 84 },
      weather: { temp: 30, condition: 'Clear & dry', humidity: 51, wind: 12 },
      scansNeedReview: 2
    };
  }

  /**
   * Get a copy of the current state or specific property
   * @param {string} [key]
   */
  get(key) {
    return key ? this.state[key] : { ...this.state };
  }

  /**
   * Update state property and notify listeners
   * @param {string} key
   * @param {*} value
   */
  set(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;
    this.emit(key, value, oldValue);
    this.emit('*', this.state);
  }

  /**
   * Subscribe to state changes or specific events
   * @param {string} event
   * @param {Function} callback
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe from events
   * @param {string} event
   * @param {Function} callback
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  /**
   * Emit event to all subscribers
   * @param {string} event
   * @param  {...any} args
   */
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
