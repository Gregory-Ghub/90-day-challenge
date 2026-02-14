import { getAllWorkouts } from '../db.js';
import { shortDate } from '../utils/dates.js';

export async function renderHistory(container) {
  const workouts = await getAllWorkouts();

  if (workouts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <p class="empty-state-text">No workouts logged yet.<br>Start your challenge!</p>
        <button class="btn btn-primary" style="margin-top:16px;max-width:200px;margin-left:auto;margin-right:auto" id="go-log">Log Workout</button>
      </div>
    `;
    container.querySelector('#go-log').addEventListener('click', () => {
      window.location.hash = '#/log';
    });
    return;
  }

  let html = `<h2 style="font-size:1.25rem;font-weight:700;margin-bottom:12px;">Workout History</h2>`;

  workouts.forEach(w => {
    const summary = w.quickLog
      ? escapeHtml(w.quickLog)
      : w.exercises.map(e => e.name).join(', ') || 'No details';

    html += `
      <div class="history-card" data-day="${w.dayNumber}">
        <div class="history-card-header">
          <span class="history-day">Day ${w.dayNumber}</span>
          <span class="history-date">${shortDate(w.date)}</span>
        </div>
        <div class="history-summary">${summary}</div>
        ${w.inspiringMessage ? `<div class="history-message">"${escapeHtml(w.inspiringMessage)}"</div>` : ''}
      </div>
    `;
  });

  container.innerHTML = html;

  container.querySelectorAll('.history-card').forEach(card => {
    card.addEventListener('click', () => {
      window.location.hash = `#/day/${card.dataset.day}`;
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
