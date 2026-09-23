/**
 * AgroVI Security & Cryptography Module
 * Provides XSS sanitization, HTML entity encoding, Web Crypto API AES-GCM 256-bit
 * encryption/decryption, password entropy scoring, multi-tab sync, and inactivity timeout.
 */

export const Security = {
  /**
   * Escape HTML strings to prevent XSS attacks
   * @param {string} str
   * @returns {string}
   */
  escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * Sanitize text input for voice commands, form fields, and search queries
   * @param {string} input
   * @returns {string}
   */
  sanitizeInput(input) {
    return this.escapeHTML(String(input || '').trim().slice(0, 500));
  },

  /**
   * Encrypt sensitive field data using AES-GCM 256-bit Web Crypto API
   * @param {object} data
   * @param {string} secretKey
   * @returns {Promise<{ciphertext: string, iv: string}>}
   */
  async encryptData(data, secretKey = 'agrovi-secure-key-2026-prod') {
    try {
      const enc = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(secretKey.padEnd(32, '0').slice(0, 32)),
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        keyMaterial,
        enc.encode(JSON.stringify(data))
      );
      return {
        ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
        iv: btoa(String.fromCharCode(...iv))
      };
    } catch (e) {
      console.warn('[Security Crypto] Encryption fallback to encoded payload:', e);
      return { ciphertext: btoa(unescape(encodeURIComponent(JSON.stringify(data)))), iv: '' };
    }
  },

  /**
   * Decrypt AES-GCM 256-bit encrypted data
   * @param {string} ciphertextB64
   * @param {string} ivB64
   * @param {string} secretKey
   * @returns {Promise<any>}
   */
  async decryptData(ciphertextB64, ivB64, secretKey = 'agrovi-secure-key-2026-prod') {
    try {
      if (!ivB64) {
        return JSON.parse(decodeURIComponent(escape(atob(ciphertextB64))));
      }
      const enc = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(secretKey.padEnd(32, '0').slice(0, 32)),
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
      const iv = new Uint8Array(atob(ivB64).split('').map(c => c.charCodeAt(0)));
      const rawCipher = new Uint8Array(atob(ciphertextB64).split('').map(c => c.charCodeAt(0)));
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        keyMaterial,
        rawCipher
      );
      return JSON.parse(new TextDecoder().decode(decrypted));
    } catch (e) {
      console.warn('[Security Crypto] Decryption error:', e);
      return null;
    }
  },

  /**
   * Generate a random 16-byte hex salt for password hashing
   * @returns {string}
   */
  generateSalt() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Hash a password with salt using SHA-256 Web Crypto API
   * @param {string} password
   * @param {string} salt
   * @returns {Promise<string>} Hex representation of SHA-256 hash
   */
  async hashPassword(password, salt = ':agrovi_salt_2026') {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password + salt);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.error('SHA-256 hashing error:', e);
      return '';
    }
  },

  /**
   * Calculate password entropy (bits) and qualitative strength
   * @param {string} password
   * @returns {{bits: number, score: number, strength: string, color: string}}
   */
  calculatePasswordEntropy(password) {
    if (!password) {
      return { bits: 0, score: 0, strength: 'Empty', color: '#94a3b8' };
    }
    let poolSize = 0;
    if (/[a-z]/.test(password)) poolSize += 26;
    if (/[A-Z]/.test(password)) poolSize += 26;
    if (/[0-9]/.test(password)) poolSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;

    const bits = Math.round(password.length * Math.log2(Math.max(1, poolSize)));
    let score = 0;
    let strength = 'Weak';
    let color = '#ef4444';

    if (bits >= 60) {
      score = 4;
      strength = 'Very Strong';
      color = '#22c55e';
    } else if (bits >= 45) {
      score = 3;
      strength = 'Strong';
      color = '#10b981';
    } else if (bits >= 30) {
      score = 2;
      strength = 'Moderate';
      color = '#f59e0b';
    } else {
      score = 1;
      strength = 'Weak';
      color = '#ef4444';
    }

    return { bits, score, strength, color };
  },

  /**
   * Initialize Inactivity Auto-Logout Guard (30 min idle timeout)
   * @param {number} timeoutMinutes
   * @param {function} onWarning
   * @param {function} onLogout
   */
  initInactivityGuard(timeoutMinutes = 30, onWarning, onLogout) {
    const idleLimitMs = timeoutMinutes * 60 * 1000;
    const warnLimitMs = (timeoutMinutes - 2) * 60 * 1000;
    let lastActivity = Date.now();
    let warnFired = false;

    const resetActivity = () => {
      lastActivity = Date.now();
      warnFired = false;
    };

    ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'].forEach(evt => {
      window.addEventListener(evt, resetActivity, { passive: true });
    });

    setInterval(() => {
      const elapsed = Date.now() - lastActivity;
      if (elapsed > idleLimitMs) {
        if (typeof onLogout === 'function') onLogout();
      } else if (elapsed > warnLimitMs && !warnFired) {
        warnFired = true;
        if (typeof onWarning === 'function') onWarning();
      }
    }, 15000);
  },

  /**
   * Cross-Tab Logout Synchronization using BroadcastChannel & Storage Event
   * @param {function} onRemoteLogout
   */
  initMultiTabSync(onRemoteLogout) {
    try {
      const channel = new BroadcastChannel('agrovi_auth_bus');
      channel.onmessage = (event) => {
        if (event.data && event.data.type === 'LOGOUT') {
          if (typeof onRemoteLogout === 'function') onRemoteLogout();
        }
      };
    } catch (e) {
      // Fallback to storage event for older browsers
      window.addEventListener('storage', (event) => {
        if (event.key === 'agrovi_session_active' && !event.newValue) {
          if (typeof onRemoteLogout === 'function') onRemoteLogout();
        }
      });
    }
  },

  /**
   * Broadcast logout event across tabs
   */
  broadcastLogout() {
    try {
      const channel = new BroadcastChannel('agrovi_auth_bus');
      channel.postMessage({ type: 'LOGOUT', timestamp: Date.now() });
    } catch (e) {}
    localStorage.removeItem('agrovi_session_active');
  }
};
