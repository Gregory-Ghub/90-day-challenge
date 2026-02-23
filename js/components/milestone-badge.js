import { getChallenge, updateChallenge } from '../db.js';

export const MILESTONES = [
  { day: 7,  emoji: '⭐', label: 'First Week',        title: 'One Week Strong!' },
  { day: 14, emoji: '🔥', label: 'Two Weeks',          title: 'Two Weeks of Fire!' },
  { day: 30, emoji: '🏆', label: 'One Month',          title: 'One Month Champion!' },
  { day: 45, emoji: '⛰️', label: 'Halfway',            title: 'Halfway There!' },
  { day: 60, emoji: '⚡', label: 'Two Months',         title: 'Two Months of Power!' },
  { day: 75, emoji: '🚀', label: 'Final Stretch',      title: 'The Final Stretch!' },
  { day: 90, emoji: '👑', label: 'Challenge Complete',  title: 'Challenge Conquered!' },
];

export async function checkAndShowMilestone(workoutCount) {
  const challenge = await getChallenge();
  const shown = challenge.milestonesShown || [];

  for (const ms of MILESTONES) {
    if (workoutCount >= ms.day && !shown.includes(ms.day)) {
      shown.push(ms.day);
      await updateChallenge({ milestonesShown: shown });
      await showCelebration(ms);
      return;
    }
  }
}

/**
 * Gold milestone celebration. Returns a Promise that resolves when dismissed.
 */
function showCelebration(milestone) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('celebration-overlay');
    overlay.classList.remove('hidden');

    const colors = ['#c8860a', '#e6a817', '#f0c040', '#d4a020', '#b87a08', '#ffd700'];
    let confettiHtml = '';
    for (let i = 0; i < 30; i++) {
      const color = colors[i % colors.length];
      const left = Math.random() * 100;
      const delay = Math.random() * 1;
      const duration = 2 + Math.random() * 2;
      confettiHtml += `<div class="confetti" style="left:${left}%;background:${color};animation-delay:${delay}s;animation-duration:${duration}s;"></div>`;
    }

    overlay.innerHTML = `
      ${confettiHtml}
      <div class="celebration-content">
        <span class="celebration-emoji">${milestone.emoji}</span>
        <h2 class="celebration-title">${milestone.title}</h2>
        <p class="celebration-subtitle">You've completed ${milestone.day} days!<br>Keep pushing forward.</p>
        <button class="celebration-dismiss" id="dismiss-celebration">Keep Going</button>
      </div>
    `;

    overlay.querySelector('#dismiss-celebration').addEventListener('click', () => {
      overlay.classList.add('hidden');
      overlay.innerHTML = '';
      resolve();
    });
  });
}

/**
 * Blue achievement celebration. Returns a Promise that resolves when dismissed.
 */
export function showAchievementCelebration(achievement) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('celebration-overlay');
    overlay.classList.remove('hidden');

    const colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#1d4ed8', '#2563eb', '#bfdbfe'];
    let confettiHtml = '';
    for (let i = 0; i < 20; i++) {
      const color = colors[i % colors.length];
      const left = Math.random() * 100;
      const delay = Math.random() * 0.8;
      const duration = 1.5 + Math.random() * 2;
      confettiHtml += `<div class="confetti" style="left:${left}%;background:${color};animation-delay:${delay}s;animation-duration:${duration}s;"></div>`;
    }

    overlay.innerHTML = `
      ${confettiHtml}
      <div class="celebration-content">
        <span class="celebration-emoji">${achievement.emoji}</span>
        <h2 class="celebration-title" style="color:#60a5fa">${achievement.title}</h2>
        <p class="celebration-subtitle">${achievement.description}</p>
        <button class="celebration-dismiss" style="background:#3b82f6" id="dismiss-celebration">Awesome!</button>
      </div>
    `;

    overlay.querySelector('#dismiss-celebration').addEventListener('click', () => {
      overlay.classList.add('hidden');
      overlay.innerHTML = '';
      resolve();
    });
  });
}
