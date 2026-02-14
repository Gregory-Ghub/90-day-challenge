export function renderProgressBar(logged, total = 90) {
  const pct = Math.min(Math.round((logged / total) * 100), 100);
  return `
    <div class="progress-container">
      <div class="progress-label">
        <span>${logged} of ${total} days logged</span>
        <span>${pct}%</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width: ${pct}%"></div>
      </div>
    </div>
  `;
}
