import { getExercises, addCustomExercise } from '../db.js';
import { CATEGORIES } from '../utils/exercises.js';
import { showToast } from './toast.js';

let exerciseEntries = [];
let exerciseList = [];

export async function initExerciseForm(container, existingExercises = null) {
  exerciseList = await getExercises();
  if (existingExercises && existingExercises.length > 0) {
    exerciseEntries = existingExercises.map((ex, i) => ({
      id: i,
      name: ex.name,
      sets: ex.sets.map(s => ({ ...s }))
    }));
  } else {
    exerciseEntries = [];
  }
  renderExercises(container);
}

export function getExerciseData() {
  return exerciseEntries
    .filter(e => e.name)
    .map(e => ({
      name: e.name,
      sets: e.sets.filter(s => s.reps || s.weight || s.duration)
    }));
}

function isDurationExercise(name) {
  const ex = exerciseList.find(e => e.name === name);
  if (ex?.isDuration !== undefined) return ex.isDuration;
  // Fallback for old DB records seeded before isDuration was added
  const DURATION_NAMES = new Set(['Planks']);
  return ex?.category === 'cardio' || DURATION_NAMES.has(name);
}

function getExerciseMeta(name) {
  return exerciseList.find(e => e.name === name) || null;
}

function renderExercises(container) {
  const wrapper = container.querySelector('#exercise-entries') || container;

  let html = '';
  exerciseEntries.forEach((entry, idx) => {
    const meta = entry.name ? getExerciseMeta(entry.name) : null;
    const notesHint = meta?.notes ? `<div class="exercise-hint">${meta.notes}</div>` : '';
    const durMode = entry.name ? isDurationExercise(entry.name) : false;

    html += `
      <div class="exercise-entry" data-idx="${idx}">
        <div class="exercise-entry-header">
          <select class="form-select" style="flex:1;width:auto" data-action="select-exercise" data-idx="${idx}">
            <option value="">Select exercise...</option>
            ${CATEGORIES.map(cat => `
              <optgroup label="${cat.charAt(0).toUpperCase() + cat.slice(1)}">
                ${exerciseList.filter(e => e.category === cat).map(e => `
                  <option value="${e.name}" ${entry.name === e.name ? 'selected' : ''}>${e.name}</option>
                `).join('')}
              </optgroup>
            `).join('')}
            <option value="__custom__">+ Add Custom...</option>
          </select>
          <button class="remove-btn" data-action="remove-exercise" data-idx="${idx}" aria-label="Remove exercise">&times;</button>
        </div>
        ${notesHint}
        <div class="sets-list">
          ${entry.sets.map((set, si) => durMode ? `
            <div class="set-input-row">
              <span class="set-label">${si + 1}.</span>
              <input type="number" inputmode="numeric" class="dur-input" placeholder="Min" value="${set.duration != null ? Math.floor(set.duration / 60) || '' : ''}" data-action="set-dur-min" data-idx="${idx}" data-si="${si}">
              <span class="dur-label">m</span>
              <input type="number" inputmode="numeric" class="dur-input" placeholder="Sec" value="${set.duration != null ? set.duration % 60 || '' : ''}" data-action="set-dur-sec" data-idx="${idx}" data-si="${si}">
              <span class="dur-label">s</span>
              ${entry.sets.length > 1 ? `<button class="remove-btn" data-action="remove-set" data-idx="${idx}" data-si="${si}" aria-label="Remove set">&times;</button>` : ''}
            </div>
          ` : `
            <div class="set-input-row">
              <span class="set-label">${si + 1}.</span>
              <input type="number" inputmode="numeric" placeholder="Reps" value="${set.reps || ''}" data-action="set-reps" data-idx="${idx}" data-si="${si}">
              <input type="number" inputmode="decimal" placeholder="Weight" value="${set.weight || ''}" data-action="set-weight" data-idx="${idx}" data-si="${si}">
              ${entry.sets.length > 1 ? `<button class="remove-btn" data-action="remove-set" data-idx="${idx}" data-si="${si}" aria-label="Remove set">&times;</button>` : ''}
            </div>
          `).join('')}
        </div>
        <button class="add-link" data-action="add-set" data-idx="${idx}">+ Add Set</button>
      </div>
    `;
  });

  html += `<button class="btn btn-secondary" id="add-exercise-btn" style="margin-top:4px">+ Add Exercise</button>`;

  wrapper.innerHTML = html;
  attachExerciseListeners(wrapper);
}

function showCustomExerciseModal() {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.innerHTML = `
      <div class="dialog">
        <div class="dialog-title">Add Custom Exercise</div>
        <div class="form-group">
          <label class="form-label">Exercise Name *</label>
          <input type="text" class="form-input" id="custom-ex-name" placeholder="e.g. Box Jumps" autocomplete="off">
        </div>
        <div class="form-group">
          <label class="form-label">Category</label>
          <select class="form-select" id="custom-ex-cat">
            ${CATEGORIES.map(c => `<option value="${c}">${c.charAt(0).toUpperCase() + c.slice(1)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Exercise Type</label>
          <div style="display:flex;gap:12px;margin-top:4px">
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
              <input type="radio" name="custom-ex-type" id="custom-type-reps" value="reps" checked>
              <span style="font-size:0.875rem">Reps / Weight</span>
            </label>
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
              <input type="radio" name="custom-ex-type" id="custom-type-dur" value="duration">
              <span style="font-size:0.875rem">Duration</span>
            </label>
          </div>
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">Form Cue / Notes (optional)</label>
          <input type="text" class="form-input" id="custom-ex-notes" placeholder="e.g. Keep chest up, neutral spine">
        </div>
        <div class="dialog-actions" style="margin-top:20px">
          <button class="btn btn-secondary btn-small" id="custom-cancel">Cancel</button>
          <button class="btn btn-primary btn-small" id="custom-save">Add Exercise</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const nameInput = overlay.querySelector('#custom-ex-name');
    nameInput.focus();

    overlay.querySelector('#custom-cancel').addEventListener('click', () => {
      overlay.remove();
      resolve(null);
    });

    overlay.querySelector('#custom-save').addEventListener('click', () => {
      const name = nameInput.value.trim();
      if (!name) { nameInput.focus(); return; }
      const category = overlay.querySelector('#custom-ex-cat').value;
      const notes = overlay.querySelector('#custom-ex-notes').value.trim();
      const isDuration = overlay.querySelector('#custom-type-dur').checked;
      overlay.remove();
      resolve({ name, category, notes, isDuration });
    });

    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') overlay.querySelector('#custom-save').click();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) { overlay.remove(); resolve(null); }
    });
  });
}

function attachExerciseListeners(wrapper) {
  wrapper.addEventListener('change', async (e) => {
    const action = e.target.dataset.action;
    const idx = parseInt(e.target.dataset.idx);

    if (action === 'select-exercise') {
      if (e.target.value === '__custom__') {
        e.target.value = exerciseEntries[idx].name || '';
        const result = await showCustomExerciseModal();
        if (result) {
          try {
            await addCustomExercise(result.name, result.category, result.notes, null, null, result.isDuration);
            exerciseList = await getExercises();
            exerciseEntries[idx].name = result.name;
            // Reset sets to match the new exercise type
            const blank = result.isDuration ? { duration: null } : { reps: null, weight: null };
            exerciseEntries[idx].sets = [blank];
          } catch {
            showToast('Exercise already exists', 'error');
            return;
          }
        }
        renderExercises(wrapper);
      } else {
        const prevName = exerciseEntries[idx].name;
        exerciseEntries[idx].name = e.target.value;
        // If switching between duration/reps modes, reset sets to the correct blank type
        if (e.target.value && prevName !== e.target.value) {
          const durMode = isDurationExercise(e.target.value);
          const blank = durMode ? { duration: null } : { reps: null, weight: null };
          exerciseEntries[idx].sets = [blank];
        }
        renderExercises(wrapper);
      }
    }
  });

  wrapper.addEventListener('input', (e) => {
    const action = e.target.dataset.action;
    const idx = parseInt(e.target.dataset.idx);
    const si = parseInt(e.target.dataset.si);

    if (action === 'set-reps') {
      exerciseEntries[idx].sets[si].reps = e.target.value ? parseInt(e.target.value) : null;
    } else if (action === 'set-weight') {
      exerciseEntries[idx].sets[si].weight = e.target.value ? parseFloat(e.target.value) : null;
    } else if (action === 'set-dur-min' || action === 'set-dur-sec') {
      const minEl = wrapper.querySelector(`[data-action="set-dur-min"][data-idx="${idx}"][data-si="${si}"]`);
      const secEl = wrapper.querySelector(`[data-action="set-dur-sec"][data-idx="${idx}"][data-si="${si}"]`);
      const total = (parseInt(minEl?.value) || 0) * 60 + (parseInt(secEl?.value) || 0);
      exerciseEntries[idx].sets[si].duration = total || null;
    }
  });

  wrapper.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const idx = parseInt(btn.dataset.idx);
    const si = parseInt(btn.dataset.si);

    if (action === 'remove-exercise') {
      exerciseEntries.splice(idx, 1);
      renderExercises(wrapper);
    } else if (action === 'add-set') {
      const durMode = exerciseEntries[idx].name ? isDurationExercise(exerciseEntries[idx].name) : false;
      const blank = durMode ? { duration: null } : { reps: null, weight: null };
      exerciseEntries[idx].sets.push(blank);
      renderExercises(wrapper);
    } else if (action === 'remove-set') {
      exerciseEntries[idx].sets.splice(si, 1);
      renderExercises(wrapper);
    }
  });

  wrapper.querySelector('#add-exercise-btn').addEventListener('click', () => {
    exerciseEntries.push({ id: Date.now(), name: '', sets: [{ reps: null, weight: null }] });
    renderExercises(wrapper);
  });
}
