/**
 * AgroVI Security & Cryptography Module
 * Provides XSS sanitization, HTML entity encoding, and Web Crypto API AES-GCM encryption.
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
   * Sanitize text input for voice commands and searches
   * @param {string} input
   * @returns {string}
   */
  sanitizeInput(input) {
    return this.escapeHTML(String(input).trim().slice(0, 500));
  },

  /**
   * Encrypt sensitive field data using AES-GCM 256-bit Web Crypto API
   * @param {object} data
   * @param {string} secretKey
   * @returns {Promise<{ciphertext: string, iv: string}>}
   */
  async encryptData(data, secretKey = 'agrovi-secure-key') {
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
      console.warn('Crypto API fallback to unencrypted payload:', e);
      return { ciphertext: btoa(JSON.stringify(data)), iv: '' };
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
  }
};
