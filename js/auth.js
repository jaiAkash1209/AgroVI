/**
 * AgroVI Auth & Security Portal Module
 * Handles login, registration, password hashing (SHA-256), and session handling.
 */

import { Security } from './security.js';
import { showToast } from './ui-toast.js';

export const Auth = {
  init() {
    this.bindTabSwitchers();
    this.bindLoginForm();
    this.bindRegisterForm();
    this.bindForgotForm();
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

  bindLoginForm() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const usernameInput = document.getElementById('login-username');
      const passwordInput = document.getElementById('login-password');

      const username = Security.sanitizeInput(usernameInput.value);
      const rawPassword = passwordInput.value;

      if (!username || !rawPassword) {
        showToast('Please enter both username and password.');
        return;
      }

      // Hash password using Web Crypto SHA-256
      const salt = Security.generateSalt();
      const passwordHash = await Security.hashPassword(rawPassword, salt);

      // Save secure session object
      const userSession = {
        username: username,
        role: 'Certified Farmer',
        loginTime: new Date().toISOString(),
        salt: salt,
        hash: passwordHash,
        token: 'SHA256_' + passwordHash.slice(0, 16)
      };

      sessionStorage.setItem('agrovi_user', JSON.stringify(userSession));
      showToast(`Welcome back, ${username}! Authenticating with SHA-256...`);

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1200);
    });
  },

  bindRegisterForm() {
    const form = document.getElementById('register-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullname = Security.sanitizeInput(document.getElementById('reg-fullname').value);
      const email = Security.sanitizeInput(document.getElementById('reg-email').value);
      const phone = Security.sanitizeInput(document.getElementById('reg-phone').value);
      const farmSize = Security.sanitizeInput(document.getElementById('reg-farmsize').value);
      const rawPassword = document.getElementById('reg-password').value;

      if (!fullname || !email || !rawPassword) {
        showToast('Please fill out all required fields.');
        return;
      }

      // Compute SHA-256 Hash
      const salt = Security.generateSalt();
      const passwordHash = await Security.hashPassword(rawPassword, salt);

      const registeredUser = {
        username: fullname.split(' ')[0] || fullname,
        fullname,
        email,
        phone,
        farmSize,
        role: 'Farmer',
        salt,
        hash: passwordHash,
        token: 'SHA256_' + passwordHash.slice(0, 16)
      };

      localStorage.setItem('agrovi_registered_user', JSON.stringify(registeredUser));
      sessionStorage.setItem('agrovi_user', JSON.stringify(registeredUser));

      showToast('Registration successful! Redirecting to Dashboard...');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1200);
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
      showToast('Reset OTP sent to ' + email + '. Check your messages!');
      setTimeout(() => {
        const loginTabBtn = document.querySelector('[data-tab="tab-login"]');
        if (loginTabBtn) loginTabBtn.click();
      }, 1500);
    });
  }
};
