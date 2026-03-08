import { getChallenge, startChallenge, saveWorkout, getWorkoutByDay, getWorkoutByDate, getTemplates } from '../db.js';
import { initExerciseForm, getExerciseData } from '../components/exercise-form.js';
import { showToast } from '../components/toast.js';
import { todayStr, currentDay, displayDate, dateForDay } from '../utils/dates.js';
import { escapeHtml } from '../utils/html.js';
import { checkAchievements } from '../utils/achievements.js';
import { showAchievementCelebration } from '../components/milestone-badge.js';

export async function renderLogWorkout(container, editDay = null) {
  const challenge = await getChallenge();
  let workout = null;
  let day = null;
  let dateStr = todayStr();
  let isEditing = false;
  const challengeActive = challenge.isActive && challenge.startDate;

  if (editDay && challengeActive) {
    workout = await getWorkoutByDay(editDay);
    day = editDay;
    dateStr = workout ? workout.date : dateForDay(challenge.startDate, editDay);
    isEditing = !!workout;
  } else if (challengeActive) {
    day = currentDay(challenge.startDate);
    dateStr = todayStr();
    workout = await getWorkoutByDate(dateStr);
    isEditing = !!workout;
  } else {
    day = 1;
    dateStr = todayStr();
  }

  let displayDayNum = Math.min(Math.max(day, 1), 90);

  // Date picker constraints: up to 90 days before challenge start, through today
  let minDate = todayStr();
  if (challengeActive) {
    const start = new Date(challenge.startDate + 'T00:00:00');
    start.setDate(start.getDate() - 90);
    const y = start.getFullYear();
    const m = String(start.getMonth() + 1).padStart(2, '0');
    const d = String(start.getDate()).padStart(2, '0');
    minDate = `${y}-${m}-${d}`;
  }
  const maxDate = todayStr();

  container.innerHTML = `
    <h2 id="log-heading" style="font-size:1.25rem;font-weight:700;margin-bottom:4px;">
      ${isEditing ? 'Edit' : 'Log'} — Day ${displayDayNum}
    </h2>
    <p id="log-date-display" style="font-size:0.8125rem;color:var(--text-muted);margin-bottom:16px;">${displayDate(dateStr)}</p>

    ${challengeActive ? `
    <div class="form-group date-picker-group">
      <label class="form-label" for="workout-date">Workout date <span style="font-weight:400;color:var(--text-muted)">(backdate if you forgot to log)</span></label>
      <input type="date" class="form-input" id="workout-date" value="${dateStr}" min="${minDate}" max="${maxDate}">
    </div>
    ` : ''}

    <div class="tab-bar">
      <button class="tab-btn active" data-tab="quick">Quick Log</button>
      <button class="tab-btn" data-tab="structured">Structured</button>
    </div>

    <div id="tab-quick">
      <div class="form-group">
        <label class="form-label">What did you do?</label>
        <textarea class="form-textarea" id="quick-log" placeholder="e.g. Push day — bench 135x10, OHP 95x8, dips 3x12">${workout?.quickLog || ''}</textarea>
      </div>
    </div>

    <div id="tab-structured" class="hidden">
      <button class="btn btn-secondary btn-small" id="load-template-btn" style="margin-bottom:12px;width:auto">Load Template</button>
      <div id="exercise-entries"></div>
    </div>

    <div class="form-group" style="margin-top:16px">
      <label class="form-label">Inspiring message to future you</label>
      <textarea class="form-textarea" id="inspiring-msg" rows="3" placeholder="Write something motivating...">${workout?.inspiringMessage || ''}</textarea>
    </div>

    <button class="btn btn-primary" id="save-btn">${isEditing ? 'Update Workout' : 'Save Workout'}</button>
  `;

  // Tab switching
  const tabBtns = container.querySelectorAll('.tab-btn');
  const tabQuick = container.querySelector('#tab-quick');
  const tabStructured = container.querySelector('#tab-structured');

  function switchTab(name) {
    tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    tabQuick.classList.toggle('hidden', name !== 'quick');
    tabStructured.classList.toggle('hidden', name !== 'structured');
  }

  tabBtns.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

  // Wire up date picker to recalculate day number
  const datePicker = container.querySelector('#workout-date');
  if (datePicker) {
    datePicker.addEventListener('click', () => {
      if (datePicker.showPicker) datePicker.showPicker();
    });
    datePicker.addEventListener('change', async () => {
      const newDate = datePicker.value;
      if (!newDate) return;

      dateStr = newDate;

      // Check if a workout already exists for the selected date
      const existingWorkout = await getWorkoutByDate(newDate);
      isEditing = !!existingWorkout;

      // Update heading and date display
      container.querySelector('#log-heading').textContent =
        `${isEditing ? 'Edit' : 'Log'} Workout`;
      container.querySelector('#log-date-display').textContent = displayDate(newDate);
      container.querySelector('#save-btn').textContent =
        isEditing ? 'Update Workout' : 'Save Workout';

      // If there's an existing workout for this date, populate the form
      if (existingWorkout) {
        container.querySelector('#quick-log').value = existingWorkout.quickLog || '';
        container.querySelector('#inspiring-msg').value = existingWorkout.inspiringMessage || '';
        if (existingWorkout.exercises?.length) {
          switchTab('structured');
          await initExerciseForm(
            container.querySelector('#exercise-entries'),
            existingWorkout.exercises
          );
        }
        workout = existingWorkout;
      } else {
        workout = null;
      }
    });
  }

  // Init exercise form
  await initExerciseForm(
    container.querySelector('#exercise-entries'),
    workout?.exercises?.length ? workout.exercises : null
  );
  if (workout?.exercises?.length) {
    switchTab('structured');
  }

  // Load Template button
  container.querySelector('#load-template-btn').addEventListener('click', async () => {
    const templates = await getTemplates();
    if (templates.length === 0) {
      showToast('No templates saved yet — create one in the Templates tab!', 'success');
      return;
    }
    showTemplatePicker(templates, async (template) => {
      switchTab('structured');
      await initExerciseForm(
        container.querySelector('#exercise-entries'),
        template.exercises || []
      );
      showToast(`Loaded: ${template.name}`, 'success');
    });
  });

  // Save
  container.querySelector('#save-btn').addEventListener('click', async () => {
    const quickLog = container.querySelector('#quick-log').value.trim();
    const inspiringMessage = container.querySelector('#inspiring-msg').value.trim();
    const exercises = getExerciseData();

    if (!quickLog && exercises.length === 0) {
      showToast('Log a workout or add exercises first!', 'error');
      return;
    }

    if (!challenge.isActive || !challenge.startDate) {
      await startChallenge(dateStr);
    }

    await saveWorkout({
      dayNumber: 0,
      date: dateStr,
      quickLog: quickLog || null,
      exercises,
      inspiringMessage: inspiringMessage || null
    });

    // Check for new achievements and show celebrations
    const savedWorkout = await getWorkoutByDate(dateStr);
    if (savedWorkout) {
      const newAchievements = await checkAchievements(savedWorkout);
      for (const achievement of newAchievements) {
        await showAchievementCelebration(achievement);
      }
    }

    showToast(isEditing ? 'Workout updated!' : 'Workout saved!', 'success');
    window.location.hash = '#/home';
  });
}

function showTemplatePicker(templates, onSelect) {
  const overlay = document.createElement('div');
  overlay.className = 'dialog-overlay';
  overlay.innerHTML = `
    <div class="dialog" style="max-width:380px;max-height:80vh;overflow-y:auto">
      <div class="dialog-title">Load Template</div>
      <div id="template-list">
        ${templates.map(t => `
          <div class="template-pick-item" data-id="${t.id}" style="padding:12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px;cursor:pointer;transition:background 0.15s">
            <div style="font-weight:700">${escapeHtml(t.name)}</div>
            ${t.description ? `<div style="font-size:0.8125rem;color:var(--text-muted)">${escapeHtml(t.description)}</div>` : ''}
            <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:4px">${(t.exercises || []).map(e => escapeHtml(e.name)).join(', ') || 'No exercises'}</div>
          </div>
        `).join('')}
      </div>
      <button class="btn btn-secondary btn-small" id="picker-cancel" style="margin-top:4px">Cancel</button>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelectorAll('.template-pick-item').forEach(item => {
    item.addEventListener('mouseenter', () => item.style.background = 'var(--bg-secondary)');
    item.addEventListener('mouseleave', () => item.style.background = '');
    item.addEventListener('click', () => {
      const id = parseInt(item.dataset.id);
      const template = templates.find(t => t.id === id);
      overlay.remove();
      if (template) onSelect(template);
    });
  });

  overlay.querySelector('#picker-cancel').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}
