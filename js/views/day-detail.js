import { getWorkoutByDay } from '../db.js';
import { displayDate } from '../utils/dates.js';

export async function renderDayDetail(container, dayNum) {
  const workout = await getWorkoutByDay(dayNum);

  if (!workout) {
    container.innerHTML = `
      <button class="back-btn" id="back-btn">← Back</button>
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <p class="empty-state-text">No workout found for Day ${dayNum}.</p>
      </div>
    `;
    container.querySelector('#back-btn').addEventListener('click', () => {
      window.location.hash = '#/history';
    });
    return;
  }

  let exercisesHtml = '';
  if (workout.exercises && workout.exercises.length > 0) {
    exercisesHtml = `
      <div class="detail-section">
        <div class="detail-section-title">Exercises</div>
        ${workout.exercises.map(ex => `
          <div class="exercise-item">
            <div class="exercise-name">${escapeHtml(ex.name)}</div>
            ${ex.sets.map((s, i) => `
              <div class="set-row">Set ${i + 1}: ${s.reps || '—'} reps ${s.weight ? `@ ${s.weight} lbs` : ''}</div>
            `).join('')}
          </div>
        `).join('')}
      </div>
    `;
  }

  let quickLogHtml = '';
  if (workout.quickLog) {
    quickLogHtml = `
      <div class="detail-section">
        <div class="detail-section-title">Workout Log</div>
        <p style="color:var(--text-secondary);line-height:1.6;white-space:pre-wrap;">${escapeHtml(workout.quickLog)}</p>
      </div>
    `;
  }

  let messageHtml = '';
  if (workout.inspiringMessage) {
    messageHtml = `
      <div class="detail-section">
        <div class="detail-section-title">Inspiring Message</div>
        <div class="message-quote">"${escapeHtml(workout.inspiringMessage)}"</div>
      </div>
    `;
  }

  container.innerHTML = `
    <button class="back-btn" id="back-btn">← Back</button>

    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:16px;">
      <div>
        <h2 style="font-size:1.5rem;font-weight:700;color:var(--accent);">Day ${workout.dayNumber}</h2>
        <p style="font-size:0.875rem;color:var(--text-muted);">${displayDate(workout.date)}</p>
      </div>
      <button class="btn btn-secondary btn-small" id="edit-btn">Edit</button>
    </div>

    ${quickLogHtml}
    ${exercisesHtml}
    ${messageHtml}
  `;

  container.querySelector('#back-btn').addEventListener('click', () => {
    window.location.hash = '#/history';
  });

  container.querySelector('#edit-btn').addEventListener('click', () => {
    window.location.hash = `#/log/${workout.dayNumber}`;
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
