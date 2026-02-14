import { getWorkoutCount } from '../db.js';
import { MILESTONES } from '../components/milestone-badge.js';

export async function renderMilestones(container) {
  const count = await getWorkoutCount();

  let html = `
    <button class="back-btn" id="back-btn">← Back</button>
    <h2 style="font-size:1.25rem;font-weight:700;margin-bottom:16px;">Milestones</h2>
    <div class="milestones-grid">
  `;

  MILESTONES.forEach(ms => {
    const earned = count >= ms.day;
    html += `
      <div class="milestone-badge ${earned ? 'earned' : 'locked'}">
        <span class="milestone-emoji">${ms.emoji}</span>
        <div class="milestone-day">Day ${ms.day}</div>
        <div class="milestone-label">${ms.label}</div>
      </div>
    `;
  });

  html += `</div>`;

  container.innerHTML = html;

  container.querySelector('#back-btn').addEventListener('click', () => {
    window.location.hash = '#/home';
  });
}
