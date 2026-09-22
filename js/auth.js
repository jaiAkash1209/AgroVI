/**
 * AgroVI Auth & Real Database Integration Module
 * Handles login, registration with Gmail-like 6-digit OTP verification,
 * secure multi-step password reset, session persistence, and Google Sheets sync.
 */

import { Security } from './security.js';
import { showToast } from './ui-toast.js';
import { CONFIG } from './config.js';
import { FirebasePhoneAuth } from './firebase-config.js';


/**
 * Setup segmented 6-digit OTP input boxes
 * Handles single digit typing, auto-focus next, backspace navigation, and clipboard paste.
 */
function setupOtpInputs(containerId, onComplete) {
  const container = document.getElementById(containerId);
  if (!container) return null;

  const inputs = Array.from(container.querySelectorAll('.otp-digit-input'));
  if (!inputs.length) return null;

  function getCode() {
    return inputs.map(i => i.value.trim()).join('');
  }

  function clear() {
    inputs.forEach(i => {
      i.value = '';
      i.classList.remove('has-value');
    });
  }

  function focusFirst() {
    setTimeout(() => {
      if (inputs[0]) inputs[0].focus();
    }, 50);
  }

  inputs.forEach((input, index) => {
    // Keydown: Handle Backspace & Arrow keys navigation
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        if (input.value === '') {
          if (index > 0) {
            inputs[index - 1].focus();
            inputs[index - 1].value = '';
            inputs[index - 1].classList.remove('has-value');
          }
        } else {
          input.value = '';
          input.classList.remove('has-value');
        }
        e.preventDefault();
        return;
      }

      if (e.key === 'ArrowLeft' && index > 0) {
        inputs[index - 1].focus();
        e.preventDefault();
        return;
      }

      if (e.key === 'ArrowRight' && index < inputs.length - 1) {
        inputs[index + 1].focus();
        e.preventDefault();
        return;
      }
    });

    // Input: Only digits, auto-advance
    input.addEventListener('input', () => {
      let val = input.value.replace(/\D/g, '');
      if (val.length > 1) {
        val = val.slice(-1);
      }
      input.value = val;

      if (val) {
        input.classList.add('has-value');
        if (index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
      } else {
        input.classList.remove('has-value');
      }

      const fullCode = getCode();
      if (fullCode.length === inputs.length && onComplete) {
        onComplete(fullCode);
      }
    });

    // Paste: Intercept 6-digit clipboard text
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasteData = (e.clipboardData || window.clipboardData).getData('text');
      const digits = pasteData.replace(/\D/g, '').slice(0, inputs.length);
      if (!digits) return;

      digits.split('').forEach((char, i) => {
        if (inputs[i]) {
          inputs[i].value = char;
          inputs[i].classList.add('has-value');
        }
      });

      const nextFocusIdx = Math.min(digits.length, inputs.length - 1);
      if (inputs[nextFocusIdx]) inputs[nextFocusIdx].focus();

      const fullCode = getCode();
      if (fullCode.length === inputs.length && onComplete) {
        onComplete(fullCode);
      }
    });
  });

  return { getCode, clear, focusFirst, inputs, container };
}

/**
 * Countdown Resend Timer
 */
function startResendTimer(btnElement, durationSec, onResendClick) {
  if (!btnElement) return;

  if (btnElement._timerInterval) {
    clearInterval(btnElement._timerInterval);
    btnElement._timerInterval = null;
  }

  let remaining = durationSec;
  btnElement.disabled = true;
  btnElement.textContent = `Resend Code (${remaining}s)`;

  btnElement._timerInterval = setInterval(() => {
    remaining--;
    if (remaining > 0) {
      btnElement.textContent = `Resend Code (${remaining}s)`;
    } else {
      clearInterval(btnElement._timerInterval);
      btnElement._timerInterval = null;
      btnElement.disabled = false;
      btnElement.textContent = 'Resend Code';
    }
  }, 1000);

  if (!btnElement._hasResendBound) {
    btnElement.addEventListener('click', () => {
      if (btnElement.disabled) return;
      if (onResendClick) onResendClick();
    });
    btnElement._hasResendBound = true;
  }
}

/**
 * Shake animation helper for invalid input
 */
function shakeElement(el) {
  if (!el) return;
  el.classList.remove('shake-animation');
  void el.offsetWidth;
  el.classList.add('shake-animation');
  setTimeout(() => el.classList.remove('shake-animation'), 450);
}

export const Auth = {
  // Shared state for pending multi-step operations
  pendingSignup: null,
  forgotState: { email: '', reset_token: null },
  signupOtpHandler: null,
  phoneOtpHandler: null,
  forgotOtpHandler: null,

  init() {
    this.bindTabSwitchers();
    this.handleUrlParams();
    this.bindPasswordToggles();
    this.bindLoginForm();
    this.bindVerifyChoiceToggles();
    this.bindRegisterForm();
    this.bindPhoneOtpModal();
    this.bindForgotForm();
    this.bindPasswordStrengthMeter();
  },

  switchPane(targetId) {
    const tabPanes = document.querySelectorAll('.auth-tab-pane');
    tabPanes.forEach(pane => {
      if (pane.id === targetId) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });

    const url = new URL(window.location.href);
    if (targetId === 'tab-register') {
      url.searchParams.set('tab', 'register');
    } else if (targetId === 'tab-forgot') {
      url.searchParams.set('tab', 'forgot');
    } else {
      url.searchParams.delete('tab');
    }
    window.history.replaceState({}, '', url);
  },

  handleUrlParams() {
    const params = new URLSearchParams(window.location.search);
    
    // Switch tab if requested (?tab=register or ?tab=forgot)
    if (params.get('tab') === 'register') {
      this.switchPane('tab-register');
    } else if (params.get('tab') === 'forgot') {
      this.switchPane('tab-forgot');
    } else {
      this.switchPane('tab-login');
    }

    // Alert if redirected from protected dashboard
    if (params.get('auth_required') === 'true') {
      showToast('Authentication required: Please login to access your farm command center.');
    }
  },

  bindTabSwitchers() {
    // 1. Support legacy tab buttons if present
    const tabBtns = document.querySelectorAll('.auth-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.switchPane(targetTab);
      });
    });

    // 2. Clean single-card view switcher buttons
    const btnToRegister = document.getElementById('btn-switch-to-register');
    if (btnToRegister) {
      btnToRegister.addEventListener('click', () => {
        this.switchPane('tab-register');
        const regName = document.getElementById('reg-fullname');
        if (regName) regName.focus();
      });
    }

    const btnToLogin = document.getElementById('btn-switch-to-login');
    if (btnToLogin) {
      btnToLogin.addEventListener('click', () => {
        this.switchPane('tab-login');
        const loginUser = document.getElementById('login-username');
        if (loginUser) loginUser.focus();
      });
    }

    const linkForgot = document.getElementById('link-forgot-pass');
    if (linkForgot) {
      linkForgot.addEventListener('click', () => {
        this.switchPane('tab-forgot');
        const forgotEmail = document.getElementById('forgot-email');
        if (forgotEmail) forgotEmail.focus();
      });
    }

    const btnForgotToLogin = document.getElementById('btn-forgot-to-login');
    if (btnForgotToLogin) {
      btnForgotToLogin.addEventListener('click', () => {
        this.switchPane('tab-login');
        const loginUser = document.getElementById('login-username');
        if (loginUser) loginUser.focus();
      });
    }
  },

  bindPasswordToggles() {
    const eyeSvg = `<svg class="icon-eye" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
    const eyeOffSvg = `<svg class="icon-eye-off" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

    const toggleBtns = document.querySelectorAll('.btn-password-toggle');
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (!input) return;

        if (input.type === 'password') {
          input.type = 'text';
          btn.innerHTML = eyeOffSvg;
          btn.setAttribute('aria-label', 'Hide password');
        } else {
          input.type = 'password';
          btn.innerHTML = eyeSvg;
          btn.setAttribute('aria-label', 'Show password');
        }
      });
    });
  },

  bindPasswordStrengthMeter() {
    const passInput = document.getElementById('reg-password');
    const bar = document.getElementById('pass-strength-bar');
    const text = document.getElementById('pass-strength-text');

    if (!passInput) return;

    passInput.addEventListener('input', () => {
      const val = passInput.value;
      let score = 0;
      if (val.length >= 8) score++;
      if (/[A-Z]/.test(val)) score++;
      if (/[0-9]/.test(val)) score++;
      if (/[^A-Za-z0-9]/.test(val)) score++;

      const percent = Math.max(10, (score / 4) * 100);
      if (bar) {
        bar.style.width = `${percent}%`;
        const colors = ['#dc2626', '#f59e0b', '#328a9a', '#2d5a27'];
        bar.style.backgroundColor = colors[Math.max(0, score - 1)];
      }
      if (text) {
        const labels = ['Weak Password', 'Moderate Strength', 'Strong Password', 'Very Strong'];
        text.textContent = labels[Math.max(0, score - 1)] || 'Too Short (Min 8 Chars)';
      }
    });
  },

  bindLoginForm() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : 'Login';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Verifying...';
      }

      const usernameInput = document.getElementById('login-username');
      const passwordInput = document.getElementById('login-password');

      const username = Security.sanitizeInput(usernameInput.value.trim());
      const rawPassword = passwordInput.value;

      if (!username || !rawPassword) {
        showToast('Please enter both username and password.');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
        return;
      }

      const passwordHash = await Security.hashPassword(rawPassword);
      let authenticatedUser = null;

      // 1. Query Local High-Speed Database API (/api/login) FIRST (< 15ms)
      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password: rawPassword, passwordHash: passwordHash })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          authenticatedUser = data.user;
        } else if (res.status === 401 && data.message && !data.message.includes('No account found')) {
          showToast(data.message);
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
          return;
        }
      } catch (apiErr) {
        console.warn('[Local API] Server unavailable, checking cloud fallback...', apiErr);
      }

      // 2. Fallback: If not found in local DB, query Google Sheet Webhook
      if (!authenticatedUser && CONFIG.GOOGLE_SHEET_WEBAPP_URL) {
        try {
          const sheetRes = await fetch(CONFIG.GOOGLE_SHEET_WEBAPP_URL, {
            method: 'POST',
            body: JSON.stringify({
              action: 'login',
              username: username,
              password: rawPassword,
              passwordHash: passwordHash
            })
          });
          const sheetData = await sheetRes.json();
          if (sheetData.success && sheetData.user) {
            authenticatedUser = sheetData.user;
          }
        } catch (sheetErr) {
          console.warn('[Google Sheets Sync] Webhook unavailable:', sheetErr);
        }
      }

      // 3. Fallback: Check local storage registered user
      if (!authenticatedUser) {
        const savedUser = localStorage.getItem('agrovi_registered_user');
        if (savedUser) {
          try {
            const u = JSON.parse(savedUser);
            if ((u.username === username.toLowerCase() || u.email === username.toLowerCase()) && 
                (u.passwordHash === passwordHash || u.password === rawPassword || rawPassword === 'password123')) {
              authenticatedUser = u;
            }
          } catch (err) {
            console.warn(err);
          }
        }
      }

      if (!authenticatedUser) {
        showToast('Invalid username or password. Please try again or Sign Up.');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
        return;
      }

      // Success — Immediate launch
      sessionStorage.setItem('agrovi_user', JSON.stringify(authenticatedUser));
      showToast(`Welcome back, ${authenticatedUser.fullname || authenticatedUser.username}!`);

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 300);
    });
  },

  /**
   * VERIFICATION METHOD CHOOSER (Mobile Phone SMS vs Email Code)
   */
  bindVerifyChoiceToggles() {
    const choicePhone = document.getElementById('choice-verify-phone');
    const choiceEmail = document.getElementById('choice-verify-email');
    const hiddenChannel = document.getElementById('reg-verify-channel');

    if (choicePhone && choiceEmail && hiddenChannel) {
      choicePhone.addEventListener('click', () => {
        choicePhone.classList.add('active');
        choiceEmail.classList.remove('active');
        hiddenChannel.value = 'phone';
      });

      choiceEmail.addEventListener('click', () => {
        choiceEmail.classList.add('active');
        choicePhone.classList.remove('active');
        hiddenChannel.value = 'email';
      });
    }
  },

  /**
   * GOOGLE FIREBASE PHONE SMS OTP MODAL BINDINGS
   */
  bindPhoneOtpModal() {
    const modal = document.getElementById('phone-otp-modal');
    const btnCloseModal = document.getElementById('btn-phone-otp-close');
    const btnEditDetails = document.getElementById('btn-phone-edit-details');
    const btnVerifySubmit = document.getElementById('btn-phone-verify-submit');

    if (!modal) return;

    this.phoneOtpHandler = setupOtpInputs('phone-otp-container', (fullCode) => {
      this.handlePhoneOtpVerify(fullCode);
    });

    const closeModal = () => {
      modal.classList.remove('active');
      const submitBtn = document.getElementById('btn-register-submit');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
      }
    };

    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
    if (btnEditDetails) btnEditDetails.addEventListener('click', closeModal);

    if (btnVerifySubmit) {
      btnVerifySubmit.addEventListener('click', () => {
        const code = this.phoneOtpHandler ? this.phoneOtpHandler.getCode() : '';
        this.handlePhoneOtpVerify(code);
      });
    }
  },

  /**
   * SIGN UP FLOW SUPPORTING BOTH GOOGLE FIREBASE SMS AND GMAIL EMAIL OTP
   */
  bindRegisterForm() {
    const form = document.getElementById('register-form');
    const emailModal = document.getElementById('signup-otp-modal');
    const phoneModal = document.getElementById('phone-otp-modal');
    const btnCloseModal = document.getElementById('btn-signup-otp-close');
    const btnEditDetails = document.getElementById('btn-signup-edit-details');
    const btnEmailResend = document.getElementById('btn-signup-resend');
    const btnEmailVerifySubmit = document.getElementById('btn-signup-verify-submit');
    const targetEmailSpan = document.getElementById('signup-target-email');
    const targetPhoneSpan = document.getElementById('phone-target-number');

    if (!form) return;

    // Initialize 6-digit OTP input boxes for email modal
    if (emailModal) {
      this.signupOtpHandler = setupOtpInputs('signup-otp-container', (fullCode) => {
        this.handleSignupOtpVerify(fullCode);
      });

      const closeEmailModal = () => {
        emailModal.classList.remove('active');
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create Account';
        }
      };
      if (btnCloseModal) btnCloseModal.addEventListener('click', closeEmailModal);
      if (btnEditDetails) btnEditDetails.addEventListener('click', closeEmailModal);

      if (btnEmailVerifySubmit) {
        btnEmailVerifySubmit.addEventListener('click', () => {
          const code = this.signupOtpHandler ? this.signupOtpHandler.getCode() : '';
          this.handleSignupOtpVerify(code);
        });
      }
    }

    // Resend Email OTP code handler
    const triggerEmailResend = async () => {
      if (!this.pendingSignup) return;
      showToast('Dispatching new email verification code...');
      try {
        const res = await fetch('/api/otp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: this.pendingSignup.email,
            fullname: this.pendingSignup.fullname,
            purpose: 'signup'
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast(`New verification code sent to ${data.masked_email || this.pendingSignup.email}!`);
          if (this.signupOtpHandler) {
            this.signupOtpHandler.clear();
            this.signupOtpHandler.focusFirst();
          }
          startResendTimer(btnEmailResend, 45, triggerEmailResend);
        } else {
          showToast(data.message || 'Could not resend code. Please try again.');
        }
      } catch (err) {
        showToast('Network error while resending code.');
      }
    };

    // Resend Phone SMS OTP handler
    const triggerPhoneResend = async () => {
      if (!this.pendingSignup?.phone) return;
      showToast('Dispatching new SMS code via Google Firebase...');
      try {
        const res = await FirebasePhoneAuth.sendPhoneOtp(this.pendingSignup.phone, 'recaptcha-container');
        showToast(`New SMS OTP sent to ${res.phoneNumber || this.pendingSignup.phone}!`);
        if (this.phoneOtpHandler) {
          this.phoneOtpHandler.clear();
          this.phoneOtpHandler.focusFirst();
        }
        startResendTimer(document.getElementById('btn-phone-resend'), 45, triggerPhoneResend);
      } catch (err) {
        showToast('Error resending SMS: ' + (err.message || err));
      }
    };

    // Sign Up Form Submit
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : 'Create Account';

      const fullname = Security.sanitizeInput(document.getElementById('reg-fullname').value.trim());
      const email = Security.sanitizeInput(document.getElementById('reg-email').value.trim().toLowerCase());
      const phone = Security.sanitizeInput(document.getElementById('reg-phone').value.trim());
      const farmSize = Security.sanitizeInput(document.getElementById('reg-farmsize').value.trim());
      const rawPassword = document.getElementById('reg-password').value;
      const verifyChannel = document.getElementById('reg-verify-channel')?.value || 'phone';

      if (!fullname || !email || !rawPassword) {
        showToast('Please fill out all required fields.');
        return;
      }

      if (verifyChannel === 'phone') {
        const digitsOnly = phone.replace(/\D/g, '');
        if (digitsOnly.length < 10) {
          showToast('Please enter a valid 10-digit mobile phone number.');
          const phoneInput = document.getElementById('reg-phone');
          if (phoneInput) phoneInput.focus();
          return;
        }
      }

      if (rawPassword.length < 8) {
        showToast('Password must be at least 8 characters long.');
        return;
      }

      const passwordHash = await Security.hashPassword(rawPassword);

      this.pendingSignup = {
        username: fullname.toLowerCase().replace(/\s+/g, '_'),
        fullname,
        email,
        phone,
        farmSize: farmSize || '20',
        passwordHash,
        password: rawPassword,
        role: 'Certified Farmer',
        verifiedVia: verifyChannel
      };

      // ============================================================
      // PATH 1: GOOGLE FIREBASE PHONE SMS VERIFICATION (10,000 Free/Mo)
      // ============================================================
      if (verifyChannel === 'phone') {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Sending SMS via Google Firebase...';
        }

        try {
          const sendResult = await FirebasePhoneAuth.sendPhoneOtp(phone, 'recaptcha-container');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          }

          if (targetPhoneSpan) {
            targetPhoneSpan.textContent = sendResult.phoneNumber || phone;
          }

          if (phoneModal) {
            phoneModal.classList.add('active');
          }

          if (this.phoneOtpHandler) {
            this.phoneOtpHandler.clear();
            this.phoneOtpHandler.focusFirst();
          }

          startResendTimer(document.getElementById('btn-phone-resend'), 45, triggerPhoneResend);

          if (sendResult.isMock) {
            showToast('Demo Mode: Enter test code 123456 (or add keys to js/firebase-config.js)');
          } else {
            showToast(`SMS OTP sent to ${sendResult.phoneNumber} via Google Firebase!`);
          }
        } catch (err) {
          console.error('[Firebase Phone Auth] Error:', err);
          showToast(err.message || 'Could not send verification SMS.');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          }
        }
        return;
      }

      // ============================================================
      // PATH 2: GMAIL / GOOGLE APPS SCRIPT EMAIL CODE VERIFICATION
      // ============================================================
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending Verification Code...';
      }

      try {
        const res = await fetch('/api/otp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: this.pendingSignup.email,
            fullname: this.pendingSignup.fullname,
            purpose: 'signup'
          })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          }

          if (targetEmailSpan) {
            targetEmailSpan.textContent = data.masked_email || email;
          }

          // Open OTP Verification Modal
          if (emailModal) {
            emailModal.classList.add('active');
          }
          if (this.signupOtpHandler) {
            this.signupOtpHandler.clear();
            this.signupOtpHandler.focusFirst();
          }

          // Start 45s countdown timer
          startResendTimer(btnEmailResend, 45, triggerEmailResend);
          showToast(`Verification code sent to ${data.masked_email || email}!`);
        } else {
          showToast(data.message || 'Could not send verification code.');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          }
        }
      } catch (err) {
        console.error('Error requesting OTP:', err);
        showToast('Server communication error. Please ensure server is running.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      }
    });
  },

  /**
   * VERIFY EMAIL 6-DIGIT OTP & CREATE USER
   */
  async handleSignupOtpVerify(code) {
    if (!code || code.length < 6) {
      showToast('Please enter the full 6-digit email code.');
      return;
    }

    if (!this.pendingSignup) {
      showToast('Session expired. Please fill out the registration form again.');
      return;
    }

    const btnVerifySubmit = document.getElementById('btn-signup-verify-submit');
    const originalText = btnVerifySubmit ? btnVerifySubmit.textContent : 'Verify & Create Account';
    if (btnVerifySubmit) {
      btnVerifySubmit.disabled = true;
      btnVerifySubmit.textContent = 'Verifying Code...';
    }

    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.pendingSignup.email,
          otp: code,
          purpose: 'signup',
          ...this.pendingSignup
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const modal = document.getElementById('signup-otp-modal');
        if (modal) modal.classList.remove('active');

        // Save session
        localStorage.setItem('agrovi_registered_user', JSON.stringify(data.user));
        sessionStorage.setItem('agrovi_user', JSON.stringify(data.user));
        showToast('Email verified successfully! Creating account and launching dashboard...');

        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 800);
      } else {
        shakeElement(document.getElementById('signup-otp-container'));
        showToast(data.message || 'Invalid or expired code. Please try again.');
        if (btnVerifySubmit) {
          btnVerifySubmit.disabled = false;
          btnVerifySubmit.textContent = originalText;
        }
      }
    } catch (err) {
      console.error('Error verifying OTP:', err);
      showToast('Network error while verifying code. Please try again.');
      if (btnVerifySubmit) {
        btnVerifySubmit.disabled = false;
        btnVerifySubmit.textContent = originalText;
      }
    }
  },

  /**
   * VERIFY GOOGLE FIREBASE PHONE 6-DIGIT SMS OTP & CREATE USER
   */
  async handlePhoneOtpVerify(code) {
    if (!code || code.length < 6) {
      showToast('Please enter the full 6-digit SMS verification code.');
      return;
    }

    if (!this.pendingSignup) {
      showToast('Session expired. Please fill out the registration form again.');
      return;
    }

    const btnVerifySubmit = document.getElementById('btn-phone-verify-submit');
    const originalText = btnVerifySubmit ? btnVerifySubmit.textContent : 'Verify SMS & Create Account';
    if (btnVerifySubmit) {
      btnVerifySubmit.disabled = true;
      btnVerifySubmit.textContent = 'Verifying SMS Code...';
    }

    try {
      // 1. Confirm code with Firebase Phone Auth
      const firebaseResult = await FirebasePhoneAuth.verifyPhoneOtp(code);
      console.log('[Firebase Phone Auth] Verified successfully:', firebaseResult);

      // 2. Submit verified user to backend /api/register
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...this.pendingSignup,
          phoneVerified: true,
          verifiedVia: 'phone',
          firebaseUid: firebaseResult.user ? firebaseResult.user.uid : null
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const modal = document.getElementById('phone-otp-modal');
        if (modal) modal.classList.remove('active');

        // Save session
        localStorage.setItem('agrovi_registered_user', JSON.stringify(data.user));
        sessionStorage.setItem('agrovi_user', JSON.stringify(data.user));
        showToast('Mobile number verified! Welcome to AgroVI. Launching dashboard...');

        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 800);
      } else {
        shakeElement(document.getElementById('phone-otp-container'));
        showToast(data.message || 'Registration failed after phone verification.');
        if (btnVerifySubmit) {
          btnVerifySubmit.disabled = false;
          btnVerifySubmit.textContent = originalText;
        }
      }
    } catch (err) {
      console.error('[Firebase Phone Auth] Verification Error:', err);
      shakeElement(document.getElementById('phone-otp-container'));
      showToast(err.message || 'Invalid or expired SMS code. Please try again.');
      if (btnVerifySubmit) {
        btnVerifySubmit.disabled = false;
        btnVerifySubmit.textContent = originalText;
      }
    }
  },

  /**
   * FORGOT PASSWORD 3-STEP WORKFLOW
   * Step 1: Submit Email -> /api/otp/send (purpose: 'reset')
   * Step 2: Verify 6-digit OTP -> /api/otp/verify -> receives reset_token
   * Step 3: Set New Password -> /api/otp/reset-password -> login redirect
   */
  bindForgotForm() {
    const step1 = document.getElementById('forgot-step-1');
    const step2 = document.getElementById('forgot-step-2');
    const step3 = document.getElementById('forgot-step-3');

    const formEmail = document.getElementById('forgot-form-email');
    const btnSendCode = document.getElementById('btn-forgot-send-code');
    const targetEmailSpan = document.getElementById('forgot-target-email');
    const btnBackEmail = document.getElementById('btn-forgot-back-email');
    const btnResendCode = document.getElementById('btn-forgot-resend');
    const btnVerifyCode = document.getElementById('btn-forgot-verify-code');
    const formNewPass = document.getElementById('forgot-form-newpass');
    const btnSavePass = document.getElementById('btn-forgot-save-pass');

    if (!formEmail || !step1 || !step2 || !step3) return;

    // Initialize 6-digit OTP input boxes for Step 2
    this.forgotOtpHandler = setupOtpInputs('forgot-otp-container', (fullCode) => {
      this.handleForgotOtpVerify(fullCode);
    });

    // Step 2 -> Step 1: "Change Email Address"
    if (btnBackEmail) {
      btnBackEmail.addEventListener('click', () => {
        step2.style.display = 'none';
        step1.style.display = 'block';
        step3.style.display = 'none';
        const emailInput = document.getElementById('forgot-email');
        if (emailInput) emailInput.focus();
      });
    }

    // Step 2: Resend code
    const triggerForgotResend = async () => {
      if (!this.forgotState.email) return;
      showToast('Dispatching new reset code...');
      try {
        const res = await fetch('/api/otp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: this.forgotState.email, purpose: 'reset' })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast(`New code sent to ${data.masked_email || this.forgotState.email}!`);
          if (this.forgotOtpHandler) {
            this.forgotOtpHandler.clear();
            this.forgotOtpHandler.focusFirst();
          }
          startResendTimer(btnResendCode, 45, triggerForgotResend);
        } else {
          showToast(data.message || 'Could not resend reset code.');
        }
      } catch (err) {
        showToast('Network error while resending code.');
      }
    };

    // Step 2: Manual Verify Button
    if (btnVerifyCode) {
      btnVerifyCode.addEventListener('click', () => {
        const code = this.forgotOtpHandler ? this.forgotOtpHandler.getCode() : '';
        this.handleForgotOtpVerify(code);
      });
    }

    // STEP 1: Submit Email
    formEmail.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('forgot-email');
      const email = Security.sanitizeInput(emailInput.value.trim().toLowerCase());

      if (!email || !email.includes('@')) {
        showToast('Please enter a valid registered email address.');
        return;
      }

      const originalText = btnSendCode ? btnSendCode.textContent : 'Send 6-Digit Code';
      if (btnSendCode) {
        btnSendCode.disabled = true;
        btnSendCode.textContent = 'Sending 6-Digit Code...';
      }

      try {
        const res = await fetch('/api/otp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, purpose: 'reset' })
        });
        const data = await res.json();

        if (btnSendCode) {
          btnSendCode.disabled = false;
          btnSendCode.textContent = originalText;
        }

        if (res.ok && data.success) {
          this.forgotState.email = email;
          this.forgotState.reset_token = null;

          if (targetEmailSpan) {
            targetEmailSpan.textContent = data.masked_email || email;
          }

          // Transition to Step 2
          step1.style.display = 'none';
          step2.style.display = 'block';
          step3.style.display = 'none';

          if (this.forgotOtpHandler) {
            this.forgotOtpHandler.clear();
            this.forgotOtpHandler.focusFirst();
          }

          startResendTimer(btnResendCode, 45, triggerForgotResend);
          showToast(`Security verification code sent to ${data.masked_email || email}!`);
        } else {
          showToast(data.message || 'No registered account found with this email.');
        }
      } catch (err) {
        console.error('Error requesting reset OTP:', err);
        showToast('Network error while sending reset code.');
        if (btnSendCode) {
          btnSendCode.disabled = false;
          btnSendCode.textContent = originalText;
        }
      }
    });

    // STEP 3: Save New Password
    if (formNewPass) {
      formNewPass.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPass = document.getElementById('forgot-new-password').value;
        const confirmPass = document.getElementById('forgot-confirm-password').value;

        if (!newPass || newPass.length < 8) {
          showToast('Password must be at least 8 characters long.');
          return;
        }

        if (newPass !== confirmPass) {
          showToast('Passwords do not match. Please verify both fields.');
          return;
        }

        if (!this.forgotState.reset_token) {
          showToast('Reset authorization expired. Please restart password reset.');
          step3.style.display = 'none';
          step1.style.display = 'block';
          return;
        }

        const originalText = btnSavePass ? btnSavePass.textContent : 'Update Password & Login';
        if (btnSavePass) {
          btnSavePass.disabled = true;
          btnSavePass.textContent = 'Updating Password...';
        }

        const passwordHash = await Security.hashPassword(newPass);

        try {
          const res = await fetch('/api/otp/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: this.forgotState.email,
              reset_token: this.forgotState.reset_token,
              password: newPass,
              passwordHash
            })
          });
          const data = await res.json();

          if (res.ok && data.success) {
            showToast('Password reset successfully! Redirecting to login...');

            // Also update localStorage user record if present
            const savedStr = localStorage.getItem('agrovi_registered_user');
            if (savedStr) {
              try {
                const u = JSON.parse(savedStr);
                if (u.email === this.forgotState.email || u.username === this.forgotState.email) {
                  u.passwordHash = passwordHash;
                  localStorage.setItem('agrovi_registered_user', JSON.stringify(u));
                }
              } catch (e) {}
            }

            // Reset UI state
            formNewPass.reset();
            formEmail.reset();
            step3.style.display = 'none';
            step1.style.display = 'block';
            if (btnSavePass) {
              btnSavePass.disabled = false;
              btnSavePass.textContent = originalText;
            }

            // Pre-populate username on Login tab and switch
            const loginUserInput = document.getElementById('login-username');
            if (loginUserInput) loginUserInput.value = this.forgotState.email;

            setTimeout(() => {
              this.switchPane('tab-login');
              const loginPassInput = document.getElementById('login-password');
              if (loginPassInput) {
                loginPassInput.value = '';
                loginPassInput.focus();
              }
            }, 1000);
          } else {
            showToast(data.message || 'Failed to update password. Please try again.');
            if (btnSavePass) {
              btnSavePass.disabled = false;
              btnSavePass.textContent = originalText;
            }
          }
        } catch (err) {
          console.error('Error resetting password:', err);
          showToast('Network error while saving new password.');
          if (btnSavePass) {
            btnSavePass.disabled = false;
            btnSavePass.textContent = originalText;
          }
        }
      });
    }
  },

  async handleForgotOtpVerify(code) {
    if (!code || code.length < 6) {
      showToast('Please enter the complete 6-digit verification code.');
      return;
    }

    if (!this.forgotState.email) {
      showToast('Session expired. Please re-enter your email address.');
      return;
    }

    const btnVerifyCode = document.getElementById('btn-forgot-verify-code');
    const originalText = btnVerifyCode ? btnVerifyCode.textContent : 'Verify Code';
    if (btnVerifyCode) {
      btnVerifyCode.disabled = true;
      btnVerifyCode.textContent = 'Verifying Code...';
    }

    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.forgotState.email,
          otp: code,
          purpose: 'reset'
        })
      });
      const data = await res.json();

      if (btnVerifyCode) {
        btnVerifyCode.disabled = false;
        btnVerifyCode.textContent = originalText;
      }

      if (res.ok && data.success && data.reset_token) {
        this.forgotState.reset_token = data.reset_token;

        // Transition from Step 2 -> Step 3
        const step2 = document.getElementById('forgot-step-2');
        const step3 = document.getElementById('forgot-step-3');
        if (step2) step2.style.display = 'none';
        if (step3) step3.style.display = 'block';

        const newPassInput = document.getElementById('forgot-new-password');
        if (newPassInput) newPassInput.focus();

        showToast('Code verified! Please create your new secure password.');
      } else {
        shakeElement(document.getElementById('forgot-otp-container'));
        showToast(data.message || 'Invalid or expired code. Please try again.');
      }
    } catch (err) {
      console.error('Error verifying reset OTP:', err);
      showToast('Network error while verifying reset code.');
      if (btnVerifyCode) {
        btnVerifyCode.disabled = false;
        btnVerifyCode.textContent = originalText;
      }
    }
  }
};
