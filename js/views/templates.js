import { getTemplates, addTemplate, updateTemplate, deleteTemplate } from '../db.js';
import { initExerciseForm, getExerciseData } from '../components/exercise-form.js';
import { showToast } from '../components/toast.js';
import { escapeHtml } from '../utils/html.js';

// View state: 'list' | 'create' | 'edit'
let mode = 'list';
let editingTemplate = null;
let mainContainer = null;

export async function renderTemplates(container) {
  mainContainer = container;
  mode = 'list';
  editingTemplate = null;
  await renderView();
}

async function renderView() {
  if (mode === 'list') {
    await renderList();
  } else {
    await renderForm();
  }
}

async function renderList() {
  const templates = await getTemplates();

  let html = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h2 style="font-size:1.25rem;font-weight:700">Templates</h2>
      <button class="btn btn-primary btn-small" id="new-template-btn">+ New</button>
    </div>
  `;

  if (templates.length === 0) {
    html += `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <p class="empty-state-text">No templates yet.<br>Save a workout structure to reuse it later.</p>
      </div>
    `;
  } else {
    templates.forEach(t => {
      const exCount = t.exercises?.length || 0;
      html += `
        <div class="card" style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div style="flex:1;min-width:0">
              <div style="font-weight:700;font-size:1rem;margin-bottom:2px">${escapeHtml(t.name)}</div>
              ${t.description ? `<div style="font-size:0.8125rem;color:var(--text-muted);margin-bottom:4px">${escapeHtml(t.description)}</div>` : ''}
              <div style="font-size:0.8125rem;color:var(--text-secondary)">${exCount} exercise${exCount !== 1 ? 's' : ''}</div>
              ${t.exercises?.length ? `
                <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                  ${t.exercises.map(e => escapeHtml(e.name)).join(', ')}
                </div>
              ` : ''}
            </div>
            <div style="display:flex;gap:8px;flex-shrink:0;margin-left:12px">
              <button class="btn btn-secondary btn-small" data-action="edit" data-id="${t.id}">Edit</button>
              <button class="remove-btn" data-action="delete" data-id="${t.id}" style="font-size:1.25rem;padding:4px 8px" aria-label="Delete template">&times;</button>
            </div>
          </div>
        </div>
      `;
    });
  }

  mainContainer.innerHTML = html;

  mainContainer.querySelector('#new-template-btn').addEventListener('click', () => {
    mode = 'create';
    editingTemplate = null;
    renderForm();
  });

  mainContainer.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.id);
      const all = await getTemplates();
      editingTemplate = all.find(t => t.id === id) || null;
      mode = 'edit';
      renderForm();
    });
  });

  mainContainer.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.id);
      if (!confirm('Delete this template?')) return;
      await deleteTemplate(id);
      showToast('Template deleted', 'success');
      renderList();
    });
  });
}

async function renderForm() {
  const isEdit = mode === 'edit' && editingTemplate;

  mainContainer.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h2 style="font-size:1.25rem;font-weight:700">${isEdit ? 'Edit Template' : 'New Template'}</h2>
      <button class="btn btn-secondary btn-small" id="cancel-btn">Cancel</button>
    </div>

    <div class="form-group">
      <label class="form-label">Template Name *</label>
      <input type="text" class="form-input" id="template-name" placeholder="e.g. Push Day A" value="${isEdit ? escapeHtml(editingTemplate.name) : ''}">
    </div>
    <div class="form-group">
      <label class="form-label">Description (optional)</label>
      <input type="text" class="form-input" id="template-desc" placeholder="e.g. Chest, shoulders, triceps" value="${isEdit ? escapeHtml(editingTemplate.description || '') : ''}">
    </div>

    <div style="font-size:0.875rem;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Exercises</div>
    <div id="exercise-entries"></div>

    <button class="btn btn-primary" id="save-template-btn" style="margin-top:16px">${isEdit ? 'Update Template' : 'Save Template'}</button>
  `;

  mainContainer.querySelector('#cancel-btn').addEventListener('click', () => {
    mode = 'list';
    renderList();
  });

  const exerciseContainer = mainContainer.querySelector('#exercise-entries');
  await initExerciseForm(exerciseContainer, isEdit ? (editingTemplate.exercises || []) : null);

  mainContainer.querySelector('#save-template-btn').addEventListener('click', async () => {
    const name = mainContainer.querySelector('#template-name').value.trim();
    const description = mainContainer.querySelector('#template-desc').value.trim();
    const exercises = getExerciseData();

    if (!name) {
      showToast('Please enter a template name', 'error');
      return;
    }

    const templateData = { name, description: description || '', exercises };

    if (isEdit) {
      await updateTemplate({ ...editingTemplate, ...templateData });
      showToast('Template updated!', 'success');
    } else {
      await addTemplate(templateData);
      showToast('Template saved!', 'success');
    }

    mode = 'list';
    editingTemplate = null;
    renderList();
  });
}
