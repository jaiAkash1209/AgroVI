/**
 * AgroVI Sidebar Navigation & Mobile Drawer Component
 */

import { Store } from './state.js';

export function initSidebar() {
  const sidebar = document.querySelector('.sidebar-drawer') || document.querySelector('.sidebar');
  const menuButton = document.getElementById('menu-toggle') || document.querySelector('.menu-button');
  const navLinks = document.querySelectorAll('.dash-nav-item, .sidebar .nav-link');

  // Create backdrop overlay for mobile drawer if not exists
  let backdrop = document.querySelector('.sidebar-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    document.body.appendChild(backdrop);
  }

  const openDrawer = () => {
    sidebar?.classList.add('open');
    backdrop?.classList.add('active');
  };

  const closeDrawer = () => {
    sidebar?.classList.remove('open');
    backdrop?.classList.remove('active');
  };

  // Mobile menu drawer toggle button
  menuButton?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (sidebar?.classList.contains('open')) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });

  // Close drawer when clicking backdrop
  backdrop?.addEventListener('click', closeDrawer);

  // Sync active navigation link when view changes
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      closeDrawer();
    });
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
    const isHorizontal = Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5;

    if (isHorizontal) {
      if (touchStart.x < 30 && deltaX > 0) openDrawer();
      if (sidebar?.classList.contains('open') && deltaX < 0) closeDrawer();
    }
    touchStart = null;
  }, { passive: true });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });
}
