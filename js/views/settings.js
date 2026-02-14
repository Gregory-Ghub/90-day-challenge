import { exportAllData, importAllData, resetAllData, getChallenge, getWorkoutCount } from '../db.js';
import { showToast } from '../components/toast.js';
import { displayDate } from '../utils/dates.js';

export async function renderSettings(container) {
  const challenge = await getChallenge();
  const count = await getWorkoutCount();

  container.innerHTML = `
    <button class="back-btn" id="back-btn">← Back</button>
    <h2 style="font-size:1.25rem;font-weight:700;margin-bottom:20px;">Settings</h2>

    <div class="card">
      <div class="card-title">Challenge Info</div>
      <div style="font-size:0.875rem;color:var(--text-secondary);">
        ${challenge.isActive && challenge.startDate
          ? `Started: ${displayDate(challenge.startDate)}<br>Workouts logged: ${count}`
          : 'No active challenge'}
      </div>
    </div>

    <div class="settings-section" style="margin-top:24px">
      <div class="settings-section-title">Data</div>
      <div class="settings-item">
        <button class="btn btn-secondary" id="export-btn">Export Data (JSON)</button>
      </div>
      <div class="settings-item">
        <button class="btn btn-secondary" id="import-btn">Import Data (JSON)</button>
        <input type="file" id="import-file" accept=".json" style="display:none">
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-title">Danger Zone</div>
      <div class="settings-item">
        <button class="btn btn-danger" id="reset-btn">Reset All Data</button>
      </div>
    </div>
  `;

  // Back
  container.querySelector('#back-btn').addEventListener('click', () => {
    window.location.hash = '#/home';
  });

  // Export
  container.querySelector('#export-btn').addEventListener('click', async () => {
    const data = await exportAllData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `90-day-challenge-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported!', 'success');
  });

  // Import
  const importBtn = container.querySelector('#import-btn');
  const importFile = container.querySelector('#import-file');
  importBtn.addEventListener('click', () => importFile.click());

  importFile.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.workouts || !data.challenge) {
        showToast('Invalid backup file', 'error');
        return;
      }

      // Confirm
      showConfirmDialog(
        'Import Data',
        'This will replace ALL current data. Are you sure?',
        async () => {
          await importAllData(data);
          showToast('Data imported!', 'success');
          window.location.hash = '#/home';
        }
      );
    } catch {
      showToast('Failed to read file', 'error');
    }
  });

  // Reset
  container.querySelector('#reset-btn').addEventListener('click', () => {
    showConfirmDialog(
      'Reset All Data',
      'This will permanently delete all workouts, messages, and progress. This cannot be undone.',
      async () => {
        await resetAllData();
        showToast('All data reset', 'success');
        window.location.hash = '#/home';
      }
    );
  });
}

function showConfirmDialog(title, text, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'dialog-overlay';
  overlay.innerHTML = `
    <div class="dialog">
      <div class="dialog-title">${title}</div>
      <div class="dialog-text">${text}</div>
      <div class="dialog-actions">
        <button class="btn btn-secondary btn-small" id="dialog-cancel">Cancel</button>
        <button class="btn btn-danger btn-small" id="dialog-confirm">Confirm</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#dialog-cancel').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#dialog-confirm').addEventListener('click', () => {
    overlay.remove();
    onConfirm();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}
