const BACKUP_KEY = '90day-backup';
const BACKUP_TIMESTAMP_KEY = '90day-backup-ts';
const REMINDER_KEY = '90day-backup-reminder-ts';
const REMINDER_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Serialize all app data to localStorage.
 * @param {Function} exportFn - async function that returns the full data object
 */
export async function saveAutoBackup(exportFn) {
  try {
    const data = await exportFn();
    localStorage.setItem(BACKUP_KEY, JSON.stringify(data));
    localStorage.setItem(BACKUP_TIMESTAMP_KEY, new Date().toISOString());
  } catch {
    // localStorage may be unavailable or full — silently skip
  }
}

/**
 * Retrieve the auto-backup from localStorage.
 * @returns {object|null} Parsed backup data, or null if none exists
 */
export function getAutoBackup() {
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Get the ISO timestamp of the last auto-backup, or null.
 */
export function getAutoBackupTimestamp() {
  return localStorage.getItem(BACKUP_TIMESTAMP_KEY);
}

/**
 * Returns true if the 7-day manual-export reminder should be shown.
 */
export function shouldShowBackupReminder() {
  const last = localStorage.getItem(REMINDER_KEY);
  if (!last) return true;
  return Date.now() - new Date(last).getTime() >= REMINDER_INTERVAL_MS;
}

/**
 * Record that the reminder was shown today.
 */
export function markReminderShown() {
  localStorage.setItem(REMINDER_KEY, new Date().toISOString());
}
