import { getWorkoutCount, getChallenge } from '../db.js';
import { MILESTONES } from '../components/milestone-badge.js';
import { ACHIEVEMENTS } from '../utils/achievements.js';

export async function renderMilestones(container) {
  const count = await getWorkoutCount();
  const challenge = await getChallenge();
  const earnedAchievements = new Map(
    (challenge.achievements || []).map(a => [a.id, a])
  );

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

  // Achievement badges section
  html += `
    <h2 style="font-size:1.125rem;font-weight:700;margin:24px 0 12px;">Achievements</h2>
    <div class="milestones-grid">
  `;

  ACHIEVEMENTS.forEach(a => {
    const earnedRecord = earnedAchievements.get(a.id);
    const earned = !!earnedRecord;
    const earnedDate = earned ? new Date(earnedRecord.earnedAt).toLocaleDateString() : null;
    html += `
      <div class="milestone-badge achievement-badge ${earned ? 'earned' : 'locked'}">
        <span class="milestone-emoji">${a.emoji}</span>
        <div class="milestone-day">${a.label}</div>
        <div class="milestone-label">${earned ? earnedDate : a.description}</div>
      </div>
    `;
  });

  html += `</div>`;

  container.innerHTML = html;

  container.querySelector('#back-btn').addEventListener('click', () => {
    window.location.hash = '#/home';
  });
}
