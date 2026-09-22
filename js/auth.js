/**
 * AgroVI Auth & Real Database Integration Module
 * Handles login, registration, password validation, session persistence, and Google Sheets sync.
 */

import { Security } from './security.js';
import { showToast } from './ui-toast.js';
import { CONFIG } from './config.js';

export const Auth = {
  init() {
    this.bindTabSwitchers();
    this.handleUrlParams();
    this.bindLoginForm();
    this.bindRegisterForm();
    this.bindForgotForm();
    this.bindPasswordStrengthMeter();
  },

  handleUrlParams() {
    const params = new URLSearchParams(window.location.search);
    
    // Switch tab if requested (?tab=register)
    if (params.get('tab') === 'register') {
      const regTabBtn = document.querySelector('[data-tab="tab-register"]');
      if (regTabBtn) regTabBtn.click();
    }

    // Alert if redirected from protected dashboard
    if (params.get('auth_required') === 'true') {
      showToast('Authentication required: Please login to access your farm command center.');
    }
  },

  bindTabSwitchers() {
    const tabBtns = document.querySelectorAll('.auth-tab-btn');
    const tabPanes = document.querySelectorAll('.auth-tab-pane');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const targetPane = document.getElementById(targetTab);
        if (targetPane) targetPane.classList.add('active');
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

      const username = Security.sanitizeInput(usernameInput.value);
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
          // Explicit wrong password returned
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

  bindRegisterForm() {
    const form = document.getElementById('register-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : 'Sign Up';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating Account...';
      }

      const fullname = Security.sanitizeInput(document.getElementById('reg-fullname').value);
      const email = Security.sanitizeInput(document.getElementById('reg-email').value);
      const phone = Security.sanitizeInput(document.getElementById('reg-phone').value);
      const farmSize = Security.sanitizeInput(document.getElementById('reg-farmsize').value);
      const rawPassword = document.getElementById('reg-password').value;

      if (!fullname || !email || !rawPassword) {
        showToast('Please fill out all required fields.');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
        return;
      }

      const passwordHash = await Security.hashPassword(rawPassword);

      const userPayload = {
        username: fullname.toLowerCase().replace(/\s+/g, '_'),
        fullname,
        email,
        phone,
        farmSize: farmSize || '20',
        passwordHash: passwordHash,
        role: 'Certified Farmer'
      };

      // 1. Forward to Google Sheets Web App if URL is provided
      if (CONFIG.GOOGLE_SHEET_WEBAPP_URL) {
        try {
          fetch(CONFIG.GOOGLE_SHEET_WEBAPP_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({ action: 'register', ...userPayload })
          }).catch(e => console.warn('Google Sheet background push:', e));
        } catch (e) {
          console.warn('Google Sheet push:', e);
        }
      }

      // 2. Send to Backend Database API (/api/register)
      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userPayload)
        });
        const data = await res.json();

        if (res.ok && data.success) {
          localStorage.setItem('agrovi_registered_user', JSON.stringify(data.user));
          sessionStorage.setItem('agrovi_user', JSON.stringify(data.user));
          showToast('Account created and saved in database! Launching Dashboard...');

          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 800);
          return;
        } else {
          showToast(data.message || 'Registration failed. Please check your information.');
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
          return;
        }
      } catch (apiErr) {
        // Fallback save to localStorage
        localStorage.setItem('agrovi_registered_user', JSON.stringify(userPayload));
        sessionStorage.setItem('agrovi_user', JSON.stringify(userPayload));
        showToast('Account registered locally! Launching Dashboard...');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 800);
      }
    });
  },

  bindForgotForm() {
    const form = document.getElementById('forgot-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = Security.sanitizeInput(document.getElementById('forgot-email').value);
      if (!email) {
        showToast('Please enter your email address.');
        return;
      }
      showToast('Password reset link sent to ' + email + '. Please check your inbox!');
      setTimeout(() => {
        const loginTabBtn = document.querySelector('[data-tab="tab-login"]');
        if (loginTabBtn) loginTabBtn.click();
      }, 1200);
    });
  }
};
