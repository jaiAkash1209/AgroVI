const toast = document.querySelector('.toast');
const showToast = (message) => {
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2800);
};

document.querySelectorAll('.command-card, .nav-link').forEach((link) => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.command-card, .nav-link').forEach((item) => item.classList.remove('active'));
    const target = link.getAttribute('href');
    link.classList.add('active');
    document.querySelectorAll(`[href="${target}"]`).forEach((item) => item.classList.add('active'));
  });
});

document.querySelectorAll('.mode-toggle button').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.mode-toggle button').forEach((item) => item.classList.remove('selected'));
    button.classList.add('selected');
    showToast(button.textContent === 'Auto' ? 'Auto irrigation is now armed.' : 'Manual water controls are ready.');
  });
});

document.querySelector('.mic-button')?.addEventListener('click', () => showToast('Listening for voice command: "Start zone three irrigation"…'));
document.querySelectorAll('.subtle-button').forEach((button) => {
  button.addEventListener('click', () => {
    if (button.textContent.includes('report') || button.textContent.includes('Report')) {
      showToast('Opening nutrition report…');
    } else {
      showToast('Scanning leaf. Keep camera steady…');
    }
  });
});
document.querySelector('.view-result')?.addEventListener('click', () => showToast('Opened Early Blight treatment plan.'));

const menu = document.querySelector('.menu-button');
const sidebar = document.querySelector('.sidebar');
menu?.addEventListener('click', () => sidebar.classList.toggle('open'));
document.querySelectorAll('.sidebar a').forEach((link) => link.addEventListener('click', () => sidebar.classList.remove('open')));

// Native scrolling handles the tool cards. These small edge gestures only open
// or close the menu, so they do not compete with normal vertical scrolling.
let swipeOrigin = null;
document.addEventListener('touchstart', (event) => {
  const touch = event.touches[0];
  swipeOrigin = { x: touch.clientX, y: touch.clientY };
}, { passive: true });

document.addEventListener('touchend', (event) => {
  if (!swipeOrigin) return;
  const touch = event.changedTouches[0];
  const horizontalDistance = touch.clientX - swipeOrigin.x;
  const verticalDistance = touch.clientY - swipeOrigin.y;
  const isHorizontalSwipe = Math.abs(horizontalDistance) > 72 && Math.abs(horizontalDistance) > Math.abs(verticalDistance) * 1.5;

  if (isHorizontalSwipe && swipeOrigin.x < 28 && horizontalDistance > 0) sidebar.classList.add('open');
  if (isHorizontalSwipe && sidebar.classList.contains('open') && horizontalDistance < 0) sidebar.classList.remove('open');
  swipeOrigin = null;
}, { passive: true });

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') sidebar.classList.remove('open');
});
