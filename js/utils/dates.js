/**
 * Get today's date as YYYY-MM-DD in local time.
 */
export function todayStr() {
  return formatDate(new Date());
}

/**
 * Format a Date object as YYYY-MM-DD in local time.
 */
export function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse a YYYY-MM-DD string into a Date (local midnight).
 */
export function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Format a YYYY-MM-DD string into a human-readable form: "Feb 14, 2026"
 */
export function displayDate(str) {
  const date = parseDate(str);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Format a YYYY-MM-DD string as a short date: "Feb 14"
 */
export function shortDate(str) {
  const date = parseDate(str);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Calculate day number (1-based) given a start date string and a target date string.
 */
export function dayNumber(startDateStr, targetDateStr) {
  const start = parseDate(startDateStr);
  const target = parseDate(targetDateStr);
  const diffMs = target - start;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Get the date string for a given day number from a start date.
 */
export function dateForDay(startDateStr, day) {
  const start = parseDate(startDateStr);
  start.setDate(start.getDate() + day - 1);
  return formatDate(start);
}

/**
 * Calculate how many days since start (today's day number).
 */
export function currentDay(startDateStr) {
  return dayNumber(startDateStr, todayStr());
}

/**
 * Check if a date string is today.
 */
export function isToday(dateStr) {
  return dateStr === todayStr();
}
