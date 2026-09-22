/**
 * AgroVI Dashboard & Command Center Engine
 * Real APMC Mandi spot rates, ICAR Soil Health Card NPK calculations, and persistent buyer offers.
 */

import { Store } from './state.js';
import { Security } from './security.js';
import { showToast } from './ui-toast.js';
import { initLanguage } from './i18n.js';

export const APMCCommodityRates = {
  wheat: {
    name: 'Wheat (Sonalika / Sharbati)',
    rate: '₹2,275 / quintal',
    trend: '+2.4% (Nashik APMC Hub)',
    ratesHistory: [2180, 2210, 2195, 2240, 2265, 2275]
  },
  paddy: {
    name: 'Paddy Rice (Basmati 1509)',
    rate: '₹2,183 / quintal',
    trend: '+1.1% (Karnal Mandi)',
    ratesHistory: [2100, 2120, 2150, 2140, 2170, 2183]
  },
  tomato: {
    name: 'Tomato (Hybrid Red)',
    rate: '₹3,400 / quintal',
    trend: '-0.5% (Pune Hub)',
    ratesHistory: [3600, 3550, 3480, 3450, 3420, 3400]
  },
  cotton: {
    name: 'Cotton (Long Staple)',
    rate: '₹7,120 / quintal',
    trend: '+3.8% (Rajkot APMC)',
    ratesHistory: [6800, 6890, 6950, 7020, 7080, 7120]
  },
  mustard: {
    name: 'Mustard (Yellow)',
    rate: '₹5,450 / quintal',
    trend: '+1.8% (Rajasthan APMC)',
    ratesHistory: [5300, 5340, 5380, 5410, 5430, 5450]
  }
};

export const Dashboard = {
  init() {
    initLanguage();
    this.bindSidebarNavigation();
    this.bindPlotSwitcher();
    this.bindInteractiveControls();
    this.bindMandiLookup();
    this.bindBuyerOfferForm();
    this.bindDebugBadge();
    this.bindProfileMenu();
    this.renderActivePlotUI();
    this.renderChartsAndGauges();
    this.loadUserSession();

    // Subscribe to state updates
    Store.on('activePlot', () => {
      this.renderActivePlotUI();
      this.renderChartsAndGauges();
    });
  },

  bindProfileMenu() {
    const container = document.getElementById('profile-menu-container');
    const circleBtn = document.getElementById('profile-circle-btn');
    const modal = document.getElementById('farmer-profile-modal');
    const btnOpenProfile = document.getElementById('btn-open-my-profile');
    const btnCloseModal = document.getElementById('modal-close-btn');
    const btnCloseFooter = document.getElementById('modal-close-footer-btn');
    const btnModalAction = document.getElementById('modal-action-btn');
    const btnLogout = document.getElementById('btn-popup-logout');
    const btnPlots = document.getElementById('btn-popup-plots');
    const btnPrefs = document.getElementById('btn-popup-prefs');
    const btnSupport = document.getElementById('btn-popup-support');

    if (circleBtn && container) {
      circleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = container.classList.toggle('open');
        circleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
          container.classList.remove('open');
          circleBtn.setAttribute('aria-expanded', 'false');
        }
      });

      // Close on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          container.classList.remove('open');
          circleBtn.setAttribute('aria-expanded', 'false');
          if (modal) modal.style.display = 'none';
        }
      });
    }

    // Open Profile Modal
    if (btnOpenProfile && modal) {
      btnOpenProfile.addEventListener('click', () => {
        container?.classList.remove('open');
        modal.style.display = 'flex';
      });
    }

    // Close Profile Modal handlers
    const closeModal = () => {
      if (modal) modal.style.display = 'none';
    };

    btnCloseModal?.addEventListener('click', closeModal);
    btnCloseFooter?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    btnModalAction?.addEventListener('click', () => {
      closeModal();
      showToast('Farmer profile preferences updated successfully.');
    });

    // Plot Switcher trigger from dropdown
    btnPlots?.addEventListener('click', () => {
      container?.classList.remove('open');
      const plotSelect = document.getElementById('plot-switcher');
      plotSelect?.focus();
      showToast('Select active crop parcel from the top selector: North Field, South Orchard, Greenhouse B.');
    });

    // Preferences trigger from dropdown
    btnPrefs?.addEventListener('click', () => {
      container?.classList.remove('open');
      const langSelect = document.getElementById('lang-select');
      langSelect?.focus();
      showToast('You can change display language and dark/light mode from the top bar.');
    });

    // Support trigger from dropdown
    btnSupport?.addEventListener('click', () => {
      container?.classList.remove('open');
      showToast('AgroVI Agri Helpline: +91 1800-AGRO-AI (Toll-Free). Available Mon-Sat 6AM-8PM IST.');
    });

    // Logout trigger
    btnLogout?.addEventListener('click', () => {
      container?.classList.remove('open');
      sessionStorage.removeItem('agrovi_user');
      showToast('Logging out of AgroVI...');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 500);
    });
  },

  loadUserSession() {
    const sessionData = sessionStorage.getItem('agrovi_user') || localStorage.getItem('agrovi_registered_user');
    let username = 'Ramesh Patil';
    let role = 'Certified Farmer';
    let email = 'ramesh@agrovi.ai';
    let phone = '+91 98765 43210';
    let farmSize = '26.0 Acres (3 Plots)';

    if (sessionData) {
      try {
        const user = JSON.parse(sessionData);
        username = user.fullname || user.username || username;
        role = user.role || role;
        if (user.email) email = user.email;
        if (user.phone) phone = user.phone;
        if (user.farmSize) farmSize = `${user.farmSize} Acres`;
      } catch (e) {
        console.warn('Session parse fallback');
      }
    }

    const initials = username
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'RP';

    const avatarInitials = document.getElementById('user-avatar-initials');
    const popupAvatar = document.getElementById('popup-avatar-initials');
    const modalAvatar = document.getElementById('modal-avatar-initials');
    const dropdownName = document.getElementById('dropdown-user-name');
    const dropdownRole = document.getElementById('dropdown-user-role');
    const modalName = document.getElementById('modal-profile-fullname');
    const modalRole = document.getElementById('modal-profile-role');
    const modalPhone = document.getElementById('modal-profile-phone');
    const modalEmail = document.getElementById('modal-profile-email');
    const modalAcres = document.getElementById('modal-profile-acres');

    if (avatarInitials) avatarInitials.textContent = initials;
    if (popupAvatar) popupAvatar.textContent = initials;
    if (modalAvatar) modalAvatar.textContent = initials;
    if (dropdownName) dropdownName.textContent = username;
    if (dropdownRole) dropdownRole.textContent = role;
    if (modalName) modalName.textContent = username;
    if (modalRole) modalRole.textContent = `${role} • Active Operator`;
    if (modalPhone) modalPhone.textContent = phone;
    if (modalEmail) modalEmail.textContent = email;
    if (modalAcres) modalAcres.textContent = farmSize;
  },

  bindPlotSwitcher() {
    const selector = document.getElementById('plot-switcher');
    if (!selector) return;

    selector.value = Store.get('activePlotId') || 'northField';

    selector.addEventListener('change', () => {
      const plotId = selector.value;
      Store.set('activePlotId', plotId);
      const activePlot = Store.get('activePlot');
      showToast(`Active field set to: ${activePlot.name}`);
    });
  },

  renderActivePlotUI() {
    const plot = Store.get('activePlot');
    if (!plot) return;

    // Update KPI metrics
    const healthEl = document.getElementById('kpi-health-score');
    const moistureEl = document.getElementById('kpi-moisture');
    const cropEl = document.getElementById('kpi-crop-type');
    const valveEl = document.getElementById('kpi-valve-status');

    if (healthEl) healthEl.textContent = `${plot.healthScore} / 100`;
    if (moistureEl) moistureEl.textContent = `${plot.moisture}%`;
    if (cropEl) cropEl.textContent = plot.crop;
    if (valveEl) valveEl.textContent = plot.valveStatus;

    // Update NPK sliders
    const nSlider = document.getElementById('npk-n-slider');
    const pSlider = document.getElementById('npk-p-slider');
    const kSlider = document.getElementById('npk-k-slider');

    if (nSlider) nSlider.value = plot.NPK.N;
    if (pSlider) pSlider.value = plot.NPK.P;
    if (kSlider) kSlider.value = plot.NPK.K;

    this.updateNPKCalculations(plot.NPK.N, plot.NPK.P, plot.NPK.K, plot.area);
    this.renderPHGauge(plot.pH);
  },

  updateNPKCalculations(nVal, pVal, kVal, acreage = 15) {
    const nDisplay = document.getElementById('npk-n-val');
    const pDisplay = document.getElementById('npk-p-val');
    const kDisplay = document.getElementById('npk-k-val');

    if (nDisplay) nDisplay.textContent = `${nVal} kg/ha`;
    if (pDisplay) pDisplay.textContent = `${pVal} kg/ha`;
    if (kDisplay) kDisplay.textContent = `${kVal} kg/ha`;

    // Authentic ICAR Soil Health Card Target Baselines (N: 350, P: 30, K: 250 kg/ha)
    const targetN = 350;
    const targetP = 30;
    const targetK = 250;

    const ureaKg = Math.max(0, Math.round((targetN - nVal) * 2.17 * (acreage / 10)));
    const dapKg = Math.max(0, Math.round((targetP - pVal) * 2.17 * (acreage / 10)));
    const mopKg = Math.max(0, Math.round((targetK - kVal) * 1.66 * (acreage / 10)));

    const adviceEl = document.getElementById('npk-recommendation');
    if (adviceEl) {
      if (ureaKg > 0 || dapKg > 0 || mopKg > 0) {
        adviceEl.innerHTML = `<strong>ICAR Fertilizer Requirement for ${acreage} Acres:</strong> Apply ${ureaKg}kg Urea, ${dapKg}kg DAP, and ${mopKg}kg MOP potash.`;
        adviceEl.style.color = "var(--amber-500)";
      } else {
        adviceEl.innerHTML = `<strong>Optimal Soil Nutrient Balance:</strong> Soil Nitrogen, Phosphorus, and Potassium satisfy target yield standards.`;
        adviceEl.style.color = "var(--color-primary)";
      }
    }
  },

  renderPHGauge(phValue) {
    const pointer = document.getElementById('ph-gauge-pointer');
    const label = document.getElementById('ph-gauge-label');
    if (!pointer) return;

    // Map pH 4.0 -> 10.0 to 0% -> 100% position
    const percentage = Math.max(0, Math.min(100, ((phValue - 4.0) / 6.0) * 100));
    pointer.style.left = `${percentage}%`;

    if (label) {
      let status = "Slightly Acidic (Ideal for Wheat & Maize)";
      if (phValue < 6.0) status = "Acidic Soil (Apply Agricultural Lime @ 200kg/acre)";
      else if (phValue > 7.5) status = "Alkaline Soil (Apply Gypsum / Elemental Sulfur)";
      label.textContent = `${phValue} pH — ${status}`;
    }
  },

  bindMandiLookup() {
    const select = document.getElementById('mandi-crop-select');
    if (!select) return;

    select.addEventListener('change', () => {
      const crop = select.value;
      const data = APMCCommodityRates[crop] || APMCCommodityRates.wheat;
      
      const priceDisplay = document.getElementById('mandi-price-display');
      const trendDisplay = document.getElementById('mandi-trend-display');

      if (priceDisplay) priceDisplay.textContent = data.rate;
      if (trendDisplay) trendDisplay.textContent = data.trend;

      this.renderMandiChartSVG(data.ratesHistory);
    });
  },

  renderChartsAndGauges() {
    this.renderWeatherChartSVG();
    this.renderMandiChartSVG();
    this.renderSavedOffersTable();
  },

  renderWeatherChartSVG() {
    const chartContainer = document.getElementById('weather-svg-chart');
    if (!chartContainer) return;

    // 7-day temperature points (Mon-Sun)
    const temps = [30, 29, 26, 31, 33, 32, 28];
    const points = temps.map((t, i) => `${i * 45 + 20},${120 - (t - 20) * 6}`).join(' ');

    chartContainer.innerHTML = `
      <svg width="300" height="130" viewBox="0 0 300 130" style="width:100%; overflow:visible;">
        <defs>
          <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#d4b86a" stop-opacity="0.5"/>
            <stop offset="100%" stop-color="#d4b86a" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <polyline fill="url(#tempGrad)" stroke="#d4b86a" stroke-width="3" points="20,120 ${points} 290,120" />
        ${temps.map((t, i) => `
          <circle cx="${i * 45 + 20}" cy="${120 - (t - 20) * 6}" r="4" fill="#2d5a27" stroke="#ffffff" stroke-width="2"/>
          <text x="${i * 45 + 20}" y="${110 - (t - 20) * 6}" font-size="10" font-weight="700" fill="var(--color-text-main)" text-anchor="middle">${t}°C</text>
        `).join('')}
      </svg>
    `;
  },

  renderMandiChartSVG(ratesHistory = [2180, 2210, 2195, 2240, 2265, 2275]) {
    const chartContainer = document.getElementById('mandi-svg-chart');
    if (!chartContainer) return;

    const minRate = Math.min(...ratesHistory) - 50;
    const maxRate = Math.max(...ratesHistory) + 50;
    const range = maxRate - minRate;

    const points = ratesHistory.map((r, i) => `${i * 50 + 20},${100 - ((r - minRate) / range) * 80}`).join(' ');

    chartContainer.innerHTML = `
      <svg width="280" height="110" viewBox="0 0 280 110" style="width:100%;">
        <path d="M 20,100 L ${points} L 270,100 Z" fill="rgba(50, 138, 154, 0.2)"/>
        <polyline fill="none" stroke="#328a9a" stroke-width="3" points="${points}" />
        ${ratesHistory.map((r, i) => `
          <circle cx="${i * 50 + 20}" cy="${100 - ((r - minRate) / range) * 80}" r="4" fill="#328a9a" stroke="#fff" stroke-width="2"/>
        `).join('')}
      </svg>
    `;
  },

  bindInteractiveControls() {
    const nSlider = document.getElementById('npk-n-slider');
    const pSlider = document.getElementById('npk-p-slider');
    const kSlider = document.getElementById('npk-k-slider');

    const handleInput = () => {
      if (!nSlider || !pSlider || !kSlider) return;
      const nVal = parseInt(nSlider.value);
      const pVal = parseInt(pSlider.value);
      const kVal = parseInt(kSlider.value);

      const plot = Store.get('activePlot');
      Store.updateActivePlot({ NPK: { N: nVal, P: pVal, K: kVal } });
      this.updateNPKCalculations(nVal, pVal, kVal, plot.area);
    };

    [nSlider, pSlider, kSlider].forEach(s => s?.addEventListener('input', handleInput));

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
          showToast(`Irrigation Zone ${zone} ACTIVATED. Flow: 45 L/min.`);
        }
      });
    });
  },

  bindBuyerOfferForm() {
    const form = document.getElementById('buyer-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const qtyInput = form.querySelector('input[type="number"]');
      const dateInput = form.querySelector('input[type="date"]');

      const qty = Security.sanitizeInput(qtyInput?.value || '10');
      const date = dateInput?.value || new Date().toISOString().split('T')[0];

      const offers = Store.get('mandiOffers') || [];
      const newOffer = {
        id: Date.now(),
        crop: Store.get('activePlot').crop,
        qty: `${qty} Quintals`,
        date: date,
        status: 'OPEN FOR BID'
      };

      offers.unshift(newOffer);
      Store.set('mandiOffers', offers);

      showToast(`Posted supply offer for ${qty} Quintals of ${newOffer.crop}!`);
      form.reset();
      this.renderSavedOffersTable();
    });
  },

  renderSavedOffersTable() {
    const container = document.getElementById('mandi-saved-offers-list');
    if (!container) return;

    const offers = Store.get('mandiOffers') || [];
    if (offers.length === 0) {
      container.innerHTML = '<p class="text-muted text-xs">No active supply offers posted yet.</p>';
      return;
    }

    container.innerHTML = `
      <table class="table-custom">
        <thead>
          <tr><th>Crop Offer</th><th>Quantity</th><th>Date</th><th>Status</th></tr>
        </thead>
        <tbody>
          ${offers.map(o => `
            <tr>
              <td><strong>${Security.escapeHTML(o.crop)}</strong></td>
              <td>${Security.escapeHTML(o.qty)}</td>
              <td>${o.date}</td>
              <td><span class="badge badge-success">${o.status}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
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
        if (activePanel) activePanel.classList.add('active');

        Store.set('activeView', targetView);
      });
    });
  },

  bindDebugBadge() {
    const badge = document.getElementById('debug-toggle-badge');
    const panel = document.getElementById('debug-monitor-panel');
    const closeBtn = document.getElementById('debug-close-btn');

    badge?.addEventListener('click', () => panel?.classList.toggle('open'));
    closeBtn?.addEventListener('click', () => panel?.classList.remove('open'));

    document.querySelectorAll('.debug-role-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const role = btn.getAttribute('data-role');
        const userDisplay = document.getElementById('user-profile-name');
        const dropdownRole = document.getElementById('dropdown-user-role');
        if (userDisplay) {
          userDisplay.textContent = `Ramesh Patil (${role})`;
        }
        if (dropdownRole) {
          dropdownRole.textContent = role;
        }
        showToast(`Role updated to: ${role}`);
      });
    });
  }
};
