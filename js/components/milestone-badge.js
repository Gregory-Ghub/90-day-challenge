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
      // Mark as shown
      shown.push(ms.day);
      await updateChallenge({ milestonesShown: shown });
      showCelebration(ms);
      return; // Show one at a time
    }
  }
}

function showCelebration(milestone) {
  const overlay = document.getElementById('celebration-overlay');
  overlay.classList.remove('hidden');

  // Confetti particles
  let confettiHtml = '';
  const colors = ['#c8860a', '#e6a817', '#f0c040', '#d4a020', '#b87a08', '#ffd700'];
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
  });
}
