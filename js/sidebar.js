/**
 * AgroVI Sidebar Navigation Component
 */

import { Store } from './state.js';

export function initSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const menuButton = document.querySelector('.menu-button');
  const navLinks = document.querySelectorAll('.sidebar .nav-link, .command-card');

  // Sync active navigation link when state changes
  Store.on('activeTab', (newTab) => {
    document.querySelectorAll('.nav-link, .command-card').forEach((link) => {
      const target = link.getAttribute('href')?.replace('#', '');
      if (target === newTab) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  });

  // Handle click navigation
  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        const tab = href.replace('#', '');
        Store.set('activeTab', tab);
        sidebar?.classList.remove('open');
      }
    });
  });

  // Handle mobile menu drawer toggle
  menuButton?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
  });

  // Touch swipe gesture logic
  let touchStart = null;
  document.addEventListener('touchstart', (e) => {
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    if (!touchStart) return;
    const deltaX = e.changedTouches[0].clientX - touchStart.x;
    const deltaY = e.changedTouches[0].clientY - touchStart.y;
    const isHorizontal = Math.abs(deltaX) > 70 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5;

    if (isHorizontal) {
      if (touchStart.x < 30 && deltaX > 0) sidebar?.classList.add('open');
      if (sidebar?.classList.contains('open') && deltaX < 0) sidebar?.classList.remove('open');
    }
    touchStart = null;
  }, { passive: true });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') sidebar?.classList.remove('open');
  });
}
