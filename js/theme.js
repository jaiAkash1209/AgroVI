/**
 * AgroVI Theme Engine (System / Light / Dark)
 * Supports auto-detection of OS preferences, localStorage persistence, and WCAG-compliant contrast tokens.
 */

const THEME_KEY = 'agrovi-theme';
const root = document.documentElement;
const mql = window.matchMedia('(prefers-color-scheme: dark)');

function getSystemTheme() {
  return mql.matches ? 'dark' : 'light';
}

export function applyTheme(mode) {
  // mode: 'system' | 'light' | 'dark'
  const resolved = mode === 'system' ? getSystemTheme() : mode;
  root.setAttribute('data-theme', resolved);
  localStorage.setItem(THEME_KEY, mode);

  // Update theme toggle button ARIA label and icon state if button exists
  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.setAttribute(
      'aria-label',
      resolved === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
    );
    const sunIcon = toggleBtn.querySelector('.icon-sun');
    const moonIcon = toggleBtn.querySelector('.icon-moon');
    if (sunIcon && moonIcon) {
      sunIcon.style.display = resolved === 'dark' ? 'inline-block' : 'none';
      moonIcon.style.display = resolved === 'dark' ? 'none' : 'inline-block';
    }
  }
}

export function initTheme() {
  // Restore saved theme preference or default to system
  const saved = localStorage.getItem(THEME_KEY) || 'system';
  applyTheme(saved);

  // Listen for OS theme changes when in system mode
  mql.addEventListener('change', () => {
    if (localStorage.getItem(THEME_KEY) === 'system') {
      applyTheme('system');
    }
  });

  // Handle theme toggle button click
  const toggleBtn = document.getElementById('theme-toggle');
  toggleBtn?.addEventListener('click', () => {
    const current = root.getAttribute('data-theme') || 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
}
