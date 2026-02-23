import { getAllWorkouts } from '../db.js';

const SHAME_THRESHOLD_HOURS = 14;
const SHAME_SESSION_KEY = 'shamePresentedAt';

/**
 * Returns the number of hours since the most recent workout was logged,
 * plus the workout record itself. Returns null if no workouts exist or
 * the threshold hasn't been crossed.
 */
export async function getShameStatus() {
  const workouts = await getAllWorkouts(); // sorted dayNumber desc
  if (workouts.length === 0) return null;

  const latest = workouts[0];
  const lastTime = new Date(latest.createdAt).getTime();
  const hoursElapsed = (Date.now() - lastTime) / (1000 * 60 * 60);

  if (hoursElapsed < SHAME_THRESHOLD_HOURS) return null;

  const streak = calcStreak(workouts);

  return {
    hours: Math.floor(hoursElapsed),
    streak,
    lastWorkout: latest,
  };
}

/**
 * True if shame was already surfaced this browser session.
 */
export function wasShameShownThisSession() {
  return !!sessionStorage.getItem(SHAME_SESSION_KEY);
}

export function markShameShown() {
  sessionStorage.setItem(SHAME_SESSION_KEY, Date.now().toString());
}

/**
 * Returns ms until the 14-hour threshold is crossed from the last workout.
 * Negative if already past. Returns null if no workouts.
 */
export async function msUntilShameThreshold() {
  const workouts = await getAllWorkouts();
  if (workouts.length === 0) return null;
  const lastTime = new Date(workouts[0].createdAt).getTime();
  const thresholdTime = lastTime + SHAME_THRESHOLD_HOURS * 60 * 60 * 1000;
  return thresholdTime - Date.now();
}

/**
 * Returns the roast content for a given number of elapsed hours and streak.
 */
export function getShameContent(hours, streak) {
  const streakLine = streak > 1
    ? `Your ${streak}-day streak is on life support.`
    : streak === 1
      ? `You've only got a 1-day streak to lose — but still.`
      : `Your streak is already dead. Don't let the body get cold too.`;

  if (hours < 18) {
    return {
      headline: 'The Streak Is Getting Nervous',
      roast: `${hours} hours and counting. The lion is awake, watching, and deeply unimpressed.`,
      streakLine,
      logLabel: 'Log It Now',
      dismissLabel: "I'll do it soon, probably",
    };
  }

  if (hours < 24) {
    return {
      headline: 'Almost a Full Day. Really.',
      roast: `${hours} hours with no workout. You've had time for everything except the one thing that matters.`,
      streakLine,
      logLabel: 'Stop Being a Coward — Log It',
      dismissLabel: 'I acknowledge my failure',
    };
  }

  if (hours < 36) {
    return {
      headline: 'A Whole Day Gone',
      roast: `${hours} hours. You slept, ate, scrolled, and did everything except the thing you said you'd do.`,
      streakLine,
      logLabel: 'Redeem Yourself Now',
      dismissLabel: "I have no excuses (I have excuses)",
    };
  }

  if (hours < 48) {
    return {
      headline: 'Day and a Half. Outstanding.',
      roast: `${hours} hours. The weights are gathering dust. Your future self is filing a formal complaint.`,
      streakLine,
      logLabel: 'Fix This Right Now',
      dismissLabel: 'I will sit with my shame',
    };
  }

  if (hours < 72) {
    return {
      headline: 'Two Days. The Gains Are Gone.',
      roast: `${hours} hours of absolutely nothing. The 90-day challenge is becoming the never-day challenge.`,
      streakLine,
      logLabel: 'Salvage What\'s Left',
      dismissLabel: 'I am beyond help apparently',
    };
  }

  return {
    headline: 'You Have Forgotten What Lifting Is',
    roast: `${hours} hours. Scientists are studying you. The inactivity is unprecedented. The lion has left the building.`,
    streakLine,
    logLabel: 'Come Back From the Dead',
    dismissLabel: 'I respect how bad this is',
  };
}

function calcStreak(workouts) {
  if (!workouts.length) return 0;
  const sorted = [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const mostRecent = new Date(sorted[0].date + 'T00:00:00');
  if (mostRecent < yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const curr = new Date(sorted[i].date + 'T00:00:00');
    const prev = new Date(sorted[i - 1].date + 'T00:00:00');
    const diff = Math.round((prev - curr) / (1000 * 60 * 60 * 24));
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}
