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
      sets: e.sets.filter(s => s.reps || s.weight)
    }));
}

function renderExercises(container) {
  const wrapper = container.querySelector('#exercise-entries') || container;

  let html = '';
  exerciseEntries.forEach((entry, idx) => {
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
        <div class="sets-list">
          ${entry.sets.map((set, si) => `
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

function attachExerciseListeners(wrapper) {
  wrapper.addEventListener('change', async (e) => {
    const action = e.target.dataset.action;
    const idx = parseInt(e.target.dataset.idx);

    if (action === 'select-exercise') {
      if (e.target.value === '__custom__') {
        const name = prompt('Exercise name:');
        if (name && name.trim()) {
          const cat = prompt('Category (push, pull, legs, core, cardio, other):') || 'other';
          const validCat = CATEGORIES.includes(cat) ? cat : 'other';
          try {
            await addCustomExercise(name.trim(), validCat);
            exerciseList = await getExercises();
            exerciseEntries[idx].name = name.trim();
          } catch {
            showToast('Exercise already exists', 'error');
            e.target.value = exerciseEntries[idx].name || '';
            return;
          }
        } else {
          e.target.value = exerciseEntries[idx].name || '';
          return;
        }
      } else {
        exerciseEntries[idx].name = e.target.value;
      }
      renderExercises(wrapper);
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
      exerciseEntries[idx].sets.push({ reps: null, weight: null });
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
