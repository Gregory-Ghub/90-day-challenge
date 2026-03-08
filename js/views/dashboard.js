import { getChallenge, getWorkoutCount, getRandomMessage, getWorkoutByDate } from '../db.js';
import { renderProgressBar } from '../components/progress-bar.js';
import { todayStr, currentDay } from '../utils/dates.js';
import { checkAndShowMilestone } from '../components/milestone-badge.js';
import { checkAndShowShame } from '../components/shame-modal.js';
import { LION_SVG, LION_SVG_SMALL } from '../components/lion-svg.js';
import { escapeHtml } from '../utils/html.js';
import { ACHIEVEMENTS } from '../utils/achievements.js';

const THEMES = [
  { id: 'gold', label: 'Gold', color: '#c8860a' },
  { id: 'ocean', label: 'Ocean', color: '#0077b6' },
  { id: 'forest', label: 'Forest', color: '#15803d' },
  { id: 'sunset', label: 'Sunset', color: '#dc4a20' },
  { id: 'midnight', label: 'Midnight', color: '#7c3aed' },
];

function getSelectedTheme() {
  return localStorage.getItem('selected-theme') || 'gold';
}

function applyTheme(themeId) {
  if (themeId === 'gold') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', themeId);
  }
  localStorage.setItem('selected-theme', themeId);
}

function renderThemePicker() {
  const current = getSelectedTheme();
  return `
    <div class="theme-picker">
      <span class="theme-picker-label">Theme</span>
      ${THEMES.map(t => `
        <button class="theme-swatch${t.id === current ? ' active' : ''}"
                data-theme-id="${t.id}"
                title="${t.label}"
                aria-label="${t.label} theme"
                style="background:${t.color};">
        </button>
      `).join('')}
    </div>
  `;
}

const MILESTONES = [
  { day: 7,  emoji: '⭐', label: 'First Week' },
  { day: 14, emoji: '🔥', label: 'Two Weeks' },
  { day: 30, emoji: '🏆', label: 'One Month' },
  { day: 45, emoji: '⛰️', label: 'Halfway' },
  { day: 60, emoji: '⚡', label: 'Two Months' },
  { day: 75, emoji: '🚀', label: 'Final Stretch' },
  { day: 90, emoji: '👑', label: 'Challenge Complete' },
];

export async function renderDashboard(container) {
  const challenge = await getChallenge();
  const count = await getWorkoutCount();

  // Welcome state — no challenge started
  if (!challenge.isActive || !challenge.startDate) {
    container.innerHTML = `
      <div class="welcome">
        <div class="welcome-lion">${LION_SVG}</div>
        <h2 class="welcome-title">Greg's 90-Day Challenge</h2>
        <p class="welcome-subtitle">Unleash the beast within.</p>
        <p class="welcome-text">Build strength, build discipline. Log your first workout to start the clock.</p>
        <button class="btn btn-primary" id="start-btn">Begin the Hunt</button>
      </div>
      ${renderThemePicker()}
    `;
    container.querySelector('#start-btn').addEventListener('click', () => {
      window.location.hash = '#/log';
    });
    container.querySelectorAll('.theme-swatch').forEach(btn => {
      btn.addEventListener('click', () => {
        const themeId = btn.dataset.themeId;
        applyTheme(themeId);
        container.querySelectorAll('.theme-swatch').forEach(s => s.classList.remove('active'));
        btn.classList.add('active');
      });
    });
    return;
  }

  const today = todayStr();
  const day = currentDay(challenge.startDate);
  const todayWorkout = await getWorkoutByDate(today);
  const loggedToday = !!todayWorkout;
  const displayDay = Math.min(Math.max(day, 1), 90);
  const isComplete = count >= 90 || day > 90;

  // Random past message (after 7+ entries)
  let messageHtml = '';
  if (count >= 7) {
    const msg = await getRandomMessage();
    if (msg) {
      messageHtml = `
        <div class="card">
          <div class="card-title">Past You Said</div>
          <div class="message-quote">"${escapeHtml(msg.inspiringMessage)}"</div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:6px;">— Day ${msg.dayNumber}</div>
        </div>
      `;
    }
  }

  // Earned milestone badges (last 3)
  const earnedMilestones = MILESTONES.filter(m => count >= m.day);
  let milestoneBadgesHtml = '';
  if (earnedMilestones.length > 0) {
    const recent = earnedMilestones.slice(-3);
    milestoneBadgesHtml = `
      <div class="card" style="cursor:pointer" id="milestones-link">
        <div class="card-title">Milestones</div>
        <div style="display:flex;gap:12px;justify-content:center;">
          ${recent.map(m => `
            <div style="text-align:center">
              <div style="font-size:1.5rem">${m.emoji}</div>
              <div style="font-size:0.6875rem;color:var(--text-muted)">Day ${m.day}</div>
            </div>
          `).join('')}
        </div>
        <div style="text-align:center;margin-top:8px;font-size:0.75rem;color:var(--accent);">View all</div>
      </div>
    `;
  }

  // Recently earned achievements (last 7 days)
  const earned = challenge.achievements || [];
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentAchievements = earned.filter(a => new Date(a.earnedAt).getTime() >= cutoff);
  let achievementsHtml = '';
  if (recentAchievements.length > 0) {
    achievementsHtml = `
      <div class="card" style="cursor:pointer" id="achievements-link">
        <div class="card-title">Recent Achievements</div>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
          ${recentAchievements.map(a => {
            const def = ACHIEVEMENTS.find(d => d.id === a.id);
            return def ? `
              <div style="text-align:center">
                <div style="font-size:1.5rem">${def.emoji}</div>
                <div style="font-size:0.6875rem;color:var(--text-muted)">${def.label}</div>
              </div>
            ` : '';
          }).join('')}
        </div>
        <div style="text-align:center;margin-top:8px;font-size:0.75rem;color:#3b82f6;">View all</div>
      </div>
    `;
  }

  // Today's status banner
  let bannerHtml = '';
  if (!isComplete) {
    if (loggedToday) {
      bannerHtml = `<div class="banner banner-success">You've logged today's workout! The lion rests.</div>`;
    } else {
      bannerHtml = `<div class="banner banner-warning" style="cursor:pointer" id="log-today-banner">The pride awaits — tap to log today's workout!</div>`;
    }
  }

  container.innerHTML = `
    ${isComplete ? `
      <div class="welcome">
        <div class="welcome-lion">${LION_SVG}</div>
        <h2 class="welcome-title">Challenge Conquered!</h2>
        <p class="welcome-text">90 days. You proved you're the king. Incredible discipline, Greg.</p>
      </div>
    ` : `
      <div class="day-counter">
        <div style="color:var(--accent);margin-bottom:8px;">${LION_SVG_SMALL}</div>
        <div class="day-counter-number">${displayDay}</div>
        <div class="day-counter-label">Day of 90</div>
      </div>
    `}

    ${renderProgressBar(count)}
    ${bannerHtml}
    ${messageHtml}
    ${achievementsHtml}
    ${milestoneBadgesHtml}
    ${renderThemePicker()}
  `;

  container.querySelector('#log-today-banner')?.addEventListener('click', () => {
    window.location.hash = '#/log';
  });

  container.querySelector('#milestones-link')?.addEventListener('click', () => {
    window.location.hash = '#/milestones';
  });

  container.querySelector('#achievements-link')?.addEventListener('click', () => {
    window.location.hash = '#/milestones';
  });

  // Theme picker
  container.querySelectorAll('.theme-swatch').forEach(btn => {
    btn.addEventListener('click', () => {
      const themeId = btn.dataset.themeId;
      applyTheme(themeId);
      container.querySelectorAll('.theme-swatch').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  await checkAndShowShame();
  await checkAndShowMilestone(count);
}
