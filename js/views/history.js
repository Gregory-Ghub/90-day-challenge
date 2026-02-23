import { getAllWorkouts, getChallenge } from '../db.js';
import { shortDate } from '../utils/dates.js';
import { escapeHtml } from '../utils/html.js';
import { renderHeatmap, renderWeeklyBar } from '../components/charts.js';

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

  const challenge = await getChallenge();
  const startDate = challenge?.startDate;

  let html = `<h2 style="font-size:1.25rem;font-weight:700;margin-bottom:12px;">Workout History</h2>`;

  // Charts section (only when a challenge is active and has a start date)
  if (startDate) {
    html += `
      <div class="card" style="margin-bottom:16px">
        <div class="card-title">Consistency — 13 Weeks</div>
        <canvas id="heatmap-canvas" style="display:block;max-width:100%;width:100%;margin:0 auto"></canvas>
      </div>
      <div class="card" style="margin-bottom:16px">
        <div class="card-title">Weekly Volume</div>
        <canvas id="bar-canvas" style="display:block;max-width:100%;width:100%;margin:0 auto"></canvas>
      </div>
    `;
  }

  // Workout list
  workouts.forEach(w => {
    const summary = w.quickLog
      ? escapeHtml(w.quickLog)
      : (w.exercises || []).map(e => e.name).join(', ') || 'No details';

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

  // Render charts after DOM is painted so clientWidth is accurate
  if (startDate) {
    requestAnimationFrame(() => {
      const heatmapCanvas = container.querySelector('#heatmap-canvas');
      const barCanvas = container.querySelector('#bar-canvas');
      if (heatmapCanvas) renderHeatmap(heatmapCanvas, workouts, startDate);
      if (barCanvas) renderWeeklyBar(barCanvas, workouts, startDate);
    });
  }

  container.querySelectorAll('.history-card').forEach(card => {
    card.addEventListener('click', () => {
      window.location.hash = `#/day/${card.dataset.day}`;
    });
  });
}
