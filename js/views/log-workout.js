import { getChallenge, startChallenge, saveWorkout, getWorkoutByDay, getWorkoutByDate, getWorkoutCount } from '../db.js';
import { initExerciseForm, getExerciseData } from '../components/exercise-form.js';
import { showToast } from '../components/toast.js';
import { todayStr, currentDay, dayNumber, displayDate, dateForDay } from '../utils/dates.js';

export async function renderLogWorkout(container, editDay = null) {
  const challenge = await getChallenge();
  let workout = null;
  let day = null;
  let dateStr = todayStr();
  let isEditing = false;

  if (editDay && challenge.isActive && challenge.startDate) {
    // Editing a specific day
    workout = await getWorkoutByDay(editDay);
    day = editDay;
    dateStr = workout ? workout.date : dateForDay(challenge.startDate, editDay);
    isEditing = !!workout;
  } else if (challenge.isActive && challenge.startDate) {
    // Logging for today
    day = currentDay(challenge.startDate);
    dateStr = todayStr();
    workout = await getWorkoutByDate(dateStr);
    isEditing = !!workout;
  } else {
    // First workout — will start challenge
    day = 1;
    dateStr = todayStr();
  }

  const displayDayNum = Math.min(Math.max(day, 1), 90);

  container.innerHTML = `
    <h2 style="font-size:1.25rem;font-weight:700;margin-bottom:4px;">
      ${isEditing ? 'Edit' : 'Log'} — Day ${displayDayNum}
    </h2>
    <p style="font-size:0.8125rem;color:var(--text-muted);margin-bottom:16px;">${displayDate(dateStr)}</p>

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

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (btn.dataset.tab === 'quick') {
        tabQuick.classList.remove('hidden');
        tabStructured.classList.add('hidden');
      } else {
        tabQuick.classList.add('hidden');
        tabStructured.classList.remove('hidden');
      }
    });
  });

  // Init structured exercise form (pass existing exercises if editing)
  await initExerciseForm(
    container.querySelector('#exercise-entries'),
    workout?.exercises?.length ? workout.exercises : null
  );
  if (workout?.exercises?.length) {
    tabBtns[1].click();
  }

  // Save
  container.querySelector('#save-btn').addEventListener('click', async () => {
    const quickLog = container.querySelector('#quick-log').value.trim();
    const inspiringMessage = container.querySelector('#inspiring-msg').value.trim();
    const exercises = getExerciseData();

    if (!quickLog && exercises.length === 0) {
      showToast('Log a workout or add exercises first!', 'error');
      return;
    }

    // Start challenge on first workout
    if (!challenge.isActive || !challenge.startDate) {
      await startChallenge(todayStr());
    }

    await saveWorkout({
      dayNumber: displayDayNum,
      date: dateStr,
      quickLog: quickLog || null,
      exercises,
      inspiringMessage: inspiringMessage || null
    });

    showToast(isEditing ? 'Workout updated!' : 'Workout saved!', 'success');
    window.location.hash = '#/home';
  });
}
