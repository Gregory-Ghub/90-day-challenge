import { getShameStatus, wasShameShownThisSession, markShameShown, getShameContent, msUntilShameThreshold } from '../utils/shame.js';
import { showToast } from './toast.js';

/**
 * Call once per dashboard load. Shows the shame overlay if the user hasn't
 * logged a workout in 14+ hours and hasn't seen it this session.
 */
export async function checkAndShowShame() {
  if (wasShameShownThisSession()) return;

  const status = await getShameStatus();
  if (!status) {
    // Not past threshold yet — schedule an in-page nudge if the tab stays open
    scheduleInPageNudge();
    return;
  }

  markShameShown();
  await showShameModal(status);
}

function showShameModal(status) {
  return new Promise((resolve) => {
    const { hours, streak } = status;
    const { headline, roast, streakLine, logLabel, dismissLabel } = getShameContent(hours, streak);

    const overlay = document.getElementById('celebration-overlay');
    overlay.classList.remove('hidden');

    overlay.innerHTML = `
      <div class="shame-content">
        <div class="shame-skull">💀</div>

        <div class="shame-hours-block">
          <span class="shame-hours-number">${hours}</span>
          <span class="shame-hours-unit">hours</span>
        </div>
        <div class="shame-hours-caption">since your last workout</div>

        <h2 class="shame-headline">${headline}</h2>
        <p class="shame-roast">${roast}</p>
        <p class="shame-streak-line">${streakLine}</p>

        <div class="shame-actions">
          <button class="shame-btn-log" id="shame-log-now">${logLabel}</button>
          <button class="shame-btn-dismiss" id="shame-dismiss">${dismissLabel}</button>
        </div>
      </div>
    `;

    overlay.querySelector('#shame-log-now').addEventListener('click', () => {
      overlay.classList.add('hidden');
      overlay.innerHTML = '';
      resolve();
      window.location.hash = '#/log';
    });

    overlay.querySelector('#shame-dismiss').addEventListener('click', () => {
      overlay.classList.add('hidden');
      overlay.innerHTML = '';
      resolve();
    });
  });
}

/**
 * If the 14-hour threshold will be crossed while the page is open,
 * schedule a toast reminder for that moment.
 */
async function scheduleInPageNudge() {
  const ms = await msUntilShameThreshold();
  if (ms === null || ms <= 0) return;

  setTimeout(() => {
    showToast("14 hours. No workout. The streak is waiting on you.", 'error', 8000);
  }, ms);
}
