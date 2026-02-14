import { renderNav } from './components/nav.js';
import { renderDashboard } from './views/dashboard.js';
import { renderLogWorkout } from './views/log-workout.js';
import { renderHistory } from './views/history.js';
import { renderDayDetail } from './views/day-detail.js';
import { renderMilestones } from './views/milestones.js';
import { renderSettings } from './views/settings.js';
import { initDB } from './db.js';

const content = document.getElementById('app-content');

function parseHash() {
  const hash = window.location.hash || '#/home';
  const parts = hash.replace('#/', '').split('/');
  return { route: parts[0], param: parts[1] || null };
}

async function route() {
  const { route: r, param } = parseHash();

  // Determine active tab for nav highlighting
  let activeTab = r;
  if (r === 'day') activeTab = 'history';
  if (r === 'milestones' || r === 'settings') activeTab = null;

  renderNav(activeTab);

  switch (r) {
    case 'home':
      await renderDashboard(content);
      break;
    case 'log':
      await renderLogWorkout(content, param ? parseInt(param) : null);
      break;
    case 'history':
      await renderHistory(content);
      break;
    case 'day':
      await renderDayDetail(content, parseInt(param));
      break;
    case 'milestones':
      await renderMilestones(content);
      break;
    case 'settings':
      await renderSettings(content);
      break;
    default:
      await renderDashboard(content);
  }
}

// Settings gear button
document.getElementById('settings-btn').addEventListener('click', () => {
  window.location.hash = '#/settings';
});

// Listen for hash changes
window.addEventListener('hashchange', route);

// Initialize
async function init() {
  await initDB();

  // Register service worker
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('./sw.js');
    } catch (e) {
      // Service worker registration failed — app still works
    }
  }

  // Route to current hash (or default)
  if (!window.location.hash) {
    window.location.hash = '#/home';
  } else {
    route();
  }
}

init();
