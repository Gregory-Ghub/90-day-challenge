import { renderNav } from './components/nav.js';
import { renderDashboard } from './views/dashboard.js';
import { renderLogWorkout } from './views/log-workout.js';
import { renderHistory } from './views/history.js';
import { renderDayDetail } from './views/day-detail.js';
import { renderMilestones } from './views/milestones.js';
import { renderSettings } from './views/settings.js';
import { renderTemplates } from './views/templates.js';
import { initDB, getWorkoutCount, importAllData } from './db.js';
import { getAutoBackup, shouldShowBackupReminder, markReminderShown } from './utils/backup.js';
import { showToast } from './components/toast.js';

const content = document.getElementById('app-content');

function parseHash() {
  const hash = window.location.hash || '#/home';
  const parts = hash.replace('#/', '').split('/');
  return { route: parts[0], param: parts[1] || null };
}

async function route() {
  const { route: r, param } = parseHash();

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
    case 'templates':
      await renderTemplates(content);
      break;
    default:
      await renderDashboard(content);
  }

  // 7-day manual export reminder (only on main views, not during critical flows)
  if (['home', 'history', 'milestones'].includes(r) && shouldShowBackupReminder()) {
    const count = await getWorkoutCount();
    if (count > 0) {
      markReminderShown();
      setTimeout(() => {
        showToast('Tip: Export your data in Settings to keep a safe backup file.', 'success', 6000);
      }, 1500);
    }
  }
}

// Settings gear button
document.getElementById('settings-btn').addEventListener('click', () => {
  window.location.hash = '#/settings';
});

window.addEventListener('hashchange', route);

async function showRestoreDialog(backup) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.innerHTML = `
      <div class="dialog">
        <div class="dialog-title">Restore Your Data?</div>
        <div class="dialog-text">
          Your workout history was found in a local backup
          (${backup.workouts?.length || 0} workouts, exported ${backup.exportedAt ? new Date(backup.exportedAt).toLocaleDateString() : 'recently'}).
          <br><br>
          Restore it now?
        </div>
        <div class="dialog-actions">
          <button class="btn btn-secondary btn-small" id="restore-skip">Skip</button>
          <button class="btn btn-primary btn-small" id="restore-confirm">Restore</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#restore-skip').addEventListener('click', () => {
      overlay.remove();
      resolve(false);
    });

    overlay.querySelector('#restore-confirm').addEventListener('click', async () => {
      overlay.remove();
      try {
        await importAllData(backup);
        showToast('Data restored from backup!', 'success');
      } catch {
        showToast('Restore failed — backup may be corrupted.', 'error');
      }
      resolve(true);
    });
  });
}

async function init() {
  await initDB();

  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('./sw.js');
    } catch {
      // Service worker registration failed — app still works
    }
  }

  // Check if IndexedDB is empty but a localStorage backup exists
  const count = await getWorkoutCount();
  if (count === 0) {
    const backup = getAutoBackup();
    if (backup && backup.workouts && backup.workouts.length > 0) {
      await showRestoreDialog(backup);
    }
  }

  if (!window.location.hash) {
    window.location.hash = '#/home';
  } else {
    route();
  }
}

init();
