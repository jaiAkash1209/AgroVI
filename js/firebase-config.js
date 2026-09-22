/**
 * AgroVI Google Firebase Phone Authentication Module
 * Provides 10,000 free SMS OTPs per month for mobile phone verification.
 * 
 * To connect your own Firebase project:
 * 1. Go to https://console.firebase.google.com (100% Free)
 * 2. Click "Add project" -> Name it "AgroVI"
 * 3. Under "Build", click "Authentication" -> "Get Started" -> Enable "Phone"
 * 4. In Project Settings, scroll to "Your apps" -> Click the Web icon (</>) to get your firebaseConfig keys
 * 5. Paste the keys below!
 */

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBuJfMYNnf57U4Fpp3L7qigQGyKK5wbN5o",
  authDomain: "agrovi-787a4.firebaseapp.com",
  projectId: "agrovi-787a4",
  storageBucket: "agrovi-787a4.firebasestorage.app",
  messagingSenderId: "1075791469495",
  appId: "1:1075791469495:web:875068bca52e836107a632",
  measurementId: "G-VVQ03S1PKD"
};


let firebaseInitialized = false;
let recaptchaVerifier = null;
let confirmationResult = null;

export const FirebasePhoneAuth = {
  isConfigured() {
    return FIREBASE_CONFIG.apiKey && !FIREBASE_CONFIG.apiKey.includes("DummyKey");
  },

  init() {
    if (typeof firebase === 'undefined') {
      console.warn('[Firebase] Firebase SDK not loaded on this page.');
      return false;
    }

    if (!firebaseInitialized) {
      try {
        if (!firebase.apps.length) {
          firebase.initializeApp(FIREBASE_CONFIG);
        }
        firebaseInitialized = true;
        console.log('[Firebase] Initialized Firebase Phone Auth.');
      } catch (err) {
        console.error('[Firebase] Initialization error:', err);
        return false;
      }
    }
    return true;
  },

  getRecaptchaVerifier(containerId = 'recaptcha-container') {
    if (!this.init()) return null;
    if (recaptchaVerifier) return recaptchaVerifier;

    try {
      recaptchaVerifier = new firebase.auth.RecaptchaVerifier(containerId, {
        size: 'invisible',
        callback: (response) => {
          console.log('[Firebase reCAPTCHA] Solved.');
        },
        'expired-callback': () => {
          console.warn('[Firebase reCAPTCHA] Expired, resetting...');
          if (recaptchaVerifier && typeof grecaptcha !== 'undefined') {
            recaptchaVerifier.render().then(widgetId => grecaptcha.reset(widgetId));
          }
        }
      });
      return recaptchaVerifier;
    } catch (err) {
      console.error('[Firebase] Error creating RecaptchaVerifier:', err);
      return null;
    }
  },

  async sendPhoneOtp(phoneNumber, containerId = 'recaptcha-container') {
    // Ensure phone starts with +
    let formattedPhone = phoneNumber.trim().replace(/\s+/g, '');
    if (!formattedPhone.startsWith('+')) {
      // Default to India +91 if 10 digits
      if (formattedPhone.length === 10) {
        formattedPhone = '+91' + formattedPhone;
      } else {
        formattedPhone = '+' + formattedPhone;
      }
    }

    if (!this.isConfigured()) {
      console.warn('[Firebase Phone Auth] Real Firebase project keys not configured in js/firebase-config.js. Running in Demo/Test Mode.');
      confirmationResult = {
        isMock: true,
        confirm: async (code) => {
          if (code === '123456' || code === '654321') {
            return {
              user: {
                uid: 'demo_user_' + Date.now(),
                phoneNumber: formattedPhone
              }
            };
          }
          const err = new Error('Invalid verification code. (In Demo Mode, please enter 123456)');
          err.code = 'auth/invalid-verification-code';
          throw err;
        }
      };
      window._firebaseConfirmationResult = confirmationResult;
      return { success: true, phoneNumber: formattedPhone, isMock: true };
    }

    if (!this.init()) {
      throw new Error('Firebase SDK could not be initialized.');
    }

    const appVerifier = this.getRecaptchaVerifier(containerId);
    if (!appVerifier) {
      throw new Error('Could not initialize Google reCAPTCHA verifier.');
    }

    try {
      confirmationResult = await firebase.auth().signInWithPhoneNumber(formattedPhone, appVerifier);
      window._firebaseConfirmationResult = confirmationResult;
      return { success: true, phoneNumber: formattedPhone, isMock: false };
    } catch (error) {
      console.error('[Firebase Phone Auth] Error sending SMS:', error);
      if (appVerifier && appVerifier.render && typeof grecaptcha !== 'undefined') {
        appVerifier.render().then(widgetId => grecaptcha.reset(widgetId));
      }
      throw error;
    }
  },

  async verifyPhoneOtp(code) {
    const cr = confirmationResult || window._firebaseConfirmationResult;
    if (!cr) {
      throw new Error('No active verification session. Please request code again.');
    }

    try {
      const result = await cr.confirm(code);
      return {
        success: true,
        user: result.user,
        phoneNumber: result.user ? result.user.phoneNumber : null
      };
    } catch (error) {
      console.error('[Firebase Phone Auth] Error confirming code:', error);
      throw error;
    }
  }
};
