/**
 * AgroVI Dashboard & View Manager
 * Handles individual view switching for every option, interactive controls, and Debug Badge Monitor.
 */

import { Store } from './state.js';
import { Security } from './security.js';
import { showToast } from './ui-toast.js';

export const Dashboard = {
  init() {
    this.bindSidebarNavigation();
    this.bindInteractiveControls();
    this.bindDebugBadge();
    this.loadUserSession();
  },

  loadUserSession() {
    const sessionData = sessionStorage.getItem('agrovi_user');
    const userDisplay = document.getElementById('user-profile-name');
    const tokenDisplay = document.getElementById('debug-hash-token');

    if (sessionData && userDisplay) {
      try {
        const user = JSON.parse(sessionData);
        userDisplay.textContent = user.username + ' (' + (user.role || 'Farmer') + ')';
        if (tokenDisplay) {
          tokenDisplay.textContent = user.token || 'SHA256_e89a32c7bf14';
        }
      } catch (e) {
        console.warn('Session parse fallback');
      }
    }
  },

  bindSidebarNavigation() {
    const navItems = document.querySelectorAll('.dash-nav-item');
    const viewPanels = document.querySelectorAll('.dash-view-panel');

    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = item.getAttribute('data-view');
        if (!targetView) return;

        navItems.forEach(n => n.classList.remove('active'));
        viewPanels.forEach(p => p.classList.remove('active'));

        item.classList.add('active');
        const activePanel = document.getElementById(`view-${targetView}`);
        if (activePanel) {
          activePanel.classList.add('active');
        }

        // Update active view in reactive state store
        Store.set('activeView', targetView);
        showToast(`Viewing ${item.textContent.trim()} section`);
      });
    });
  },

  bindInteractiveControls() {
    // Plant Nutrition NPK Sliders
    const nSlider = document.getElementById('npk-n-slider');
    const pSlider = document.getElementById('npk-p-slider');
    const kSlider = document.getElementById('npk-k-slider');

    const updateNPK = () => {
      if (!nSlider || !pSlider || !kSlider) return;
      const nVal = parseInt(nSlider.value);
      const pVal = parseInt(pSlider.value);
      const kVal = parseInt(kSlider.value);

      document.getElementById('npk-n-val').textContent = `${nVal} kg/ha`;
      document.getElementById('npk-p-val').textContent = `${pVal} kg/ha`;
      document.getElementById('npk-k-val').textContent = `${kVal} kg/ha`;

      const statusEl = document.getElementById('npk-recommendation');
      if (statusEl) {
        if (nVal < 40) {
          statusEl.textContent = "Deficiency Alert: Low Nitrogen (N). Add 15kg Urea or Organic Compost per acre.";
          statusEl.style.color = "var(--amber-500)";
        } else if (kVal < 30) {
          statusEl.textContent = "Potassium Warning: Add Potash to strengthen stem resilience.";
          statusEl.style.color = "var(--amber-500)";
        } else {
          statusEl.textContent = "Optimal Nutrient Balance achieved for current crop cycle.";
          statusEl.style.color = "var(--color-primary)";
        }
      }
    };

    [nSlider, pSlider, kSlider].forEach(slider => {
      if (slider) slider.addEventListener('input', updateNPK);
    });

    // Smart Irrigation Switches
    document.querySelectorAll('.valve-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const zone = btn.getAttribute('data-zone');
        const isActive = btn.classList.contains('active');
        if (isActive) {
          btn.classList.remove('active');
          btn.textContent = 'VALVE OFF';
          btn.style.backgroundColor = 'var(--grey-400)';
          showToast(`Irrigation Zone ${zone} deactivated.`);
        } else {
          btn.classList.add('active');
          btn.textContent = 'VALVE ON';
          btn.style.backgroundColor = 'var(--green-500)';
          showToast(`Irrigation Zone ${zone} ACTIVATED. Flow rate: 45 L/min.`);
        }
      });
    });

    // Market Mandi Price Filter
    const mandiSelect = document.getElementById('mandi-crop-select');
    if (mandiSelect) {
      mandiSelect.addEventListener('change', () => {
        const crop = mandiSelect.value;
        const prices = {
          wheat: { rate: '₹2,275 / quintal', trend: '+2.4% (Nashik APMC)' },
          paddy: { rate: '₹2,183 / quintal', trend: '+1.1% (Punjab Mandi)' },
          tomato: { rate: '₹3,400 / quintal', trend: '-0.5% (Pune Hub)' },
          cotton: { rate: '₹7,120 / quintal', trend: '+3.8% (Gujarat APMC)' }
        };
        const res = prices[crop] || prices.wheat;
        document.getElementById('mandi-price-display').textContent = res.rate;
        document.getElementById('mandi-trend-display').textContent = res.trend;
      });
    }
  },

  bindDebugBadge() {
    const badge = document.getElementById('debug-toggle-badge');
    const panel = document.getElementById('debug-monitor-panel');
    const closeBtn = document.getElementById('debug-close-btn');

    if (badge && panel) {
      badge.addEventListener('click', () => {
        panel.classList.toggle('open');
      });
    }

    if (closeBtn && panel) {
      closeBtn.addEventListener('click', () => {
        panel.classList.remove('open');
      });
    }

    // Bind debug role switches
    document.querySelectorAll('.debug-role-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const role = btn.getAttribute('data-role');
        const userDisplay = document.getElementById('user-profile-name');
        if (userDisplay) {
          userDisplay.textContent = `Demo User (${role})`;
        }
        showToast(`Switched active debug role to: ${role}`);
      });
    });
  }
};
