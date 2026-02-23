/**
 * Pure Canvas API charts — zero dependencies.
 * All colors are read from CSS custom properties so they adapt to dark/light mode.
 */

function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function formatDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Render a 13-week consistency heatmap.
 * Worked days = accent color; rest days = muted background.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {Array} workouts - array of workout objects with a `date` string (YYYY-MM-DD)
 * @param {string} startDate - YYYY-MM-DD challenge start date
 */
export function renderHeatmap(canvas, workouts, startDate) {
  if (!canvas) return;

  const dpr = window.devicePixelRatio || 1;
  const COLS = 13; // weeks
  const ROWS = 7;  // days per week
  const GAP = 3;

  const containerWidth = canvas.clientWidth || 300;
  const CELL = Math.max(14, Math.floor((containerWidth - GAP * (COLS - 1)) / COLS));
  const W = COLS * (CELL + GAP) - GAP;
  const H = ROWS * (CELL + GAP) - GAP;

  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const accentColor = getCssVar('--accent') || '#c8860a';
  const bgColor = getCssVar('--bg-secondary') || '#f0ebe3';

  const workedDates = new Set(workouts.map(w => w.date));
  const start = new Date(startDate + 'T00:00:00');

  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      const date = new Date(start);
      date.setDate(date.getDate() + col * 7 + row);
      const dateStr = formatDateStr(date);

      const x = col * (CELL + GAP);
      const y = row * (CELL + GAP);

      ctx.fillStyle = workedDates.has(dateStr) ? accentColor : bgColor;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, y, CELL, CELL, 3);
      } else {
        ctx.rect(x, y, CELL, CELL);
      }
      ctx.fill();
    }
  }
}

/**
 * Render a 13-bar weekly volume chart.
 * Bar height = workouts logged that week.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {Array} workouts
 * @param {string} startDate - YYYY-MM-DD
 */
export function renderWeeklyBar(canvas, workouts, startDate) {
  if (!canvas) return;

  const dpr = window.devicePixelRatio || 1;
  const WEEKS = 13;
  const GAP = 4;
  const W = canvas.clientWidth || 300;
  const BAR_W = Math.max(8, Math.floor((W - GAP * (WEEKS - 1)) / WEEKS));
  const LABEL_H = 20; // space for week labels below
  const COUNT_H = 16; // space for count labels above bars
  const H = 120;
  const CHART_H = H - LABEL_H;

  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const accentColor = getCssVar('--accent') || '#c8860a';
  const bgColor = getCssVar('--bg-secondary') || '#f0ebe3';
  const mutedColor = getCssVar('--text-muted') || '#8a7a5a';

  const start = new Date(startDate + 'T00:00:00');
  const weekCounts = new Array(WEEKS).fill(0);

  for (const w of workouts) {
    const d = new Date(w.date + 'T00:00:00');
    const diffDays = Math.floor((d - start) / (1000 * 60 * 60 * 24));
    const weekIdx = Math.floor(diffDays / 7);
    if (weekIdx >= 0 && weekIdx < WEEKS) {
      weekCounts[weekIdx]++;
    }
  }

  const maxVal = Math.max(...weekCounts, 1);
  const fontSize = Math.max(8, Math.min(11, BAR_W - 2));

  for (let i = 0; i < WEEKS; i++) {
    const x = i * (BAR_W + GAP);
    const count = weekCounts[i];
    const availH = CHART_H - COUNT_H;
    const barH = count > 0 ? Math.max(4, Math.round((count / maxVal) * availH)) : 0;

    // Background track
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, COUNT_H, BAR_W, availH, 3);
    } else {
      ctx.rect(x, COUNT_H, BAR_W, availH);
    }
    ctx.fill();

    // Filled bar
    if (barH > 0) {
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, COUNT_H + availH - barH, BAR_W, barH, 3);
      } else {
        ctx.rect(x, COUNT_H + availH - barH, BAR_W, barH);
      }
      ctx.fill();

      // Count above bar
      ctx.fillStyle = mutedColor;
      ctx.font = `${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(String(count), x + BAR_W / 2, COUNT_H + availH - barH - 3);
    }

    // Week label below
    ctx.fillStyle = mutedColor;
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`W${i + 1}`, x + BAR_W / 2, H - 4);
  }
}
