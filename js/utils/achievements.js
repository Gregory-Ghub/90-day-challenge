import { getAllWorkouts, getChallenge, updateChallenge } from '../db.js';

export const ACHIEVEMENTS = [
  { id: 'streak-3',   emoji: '🔥', label: '3-Day Streak',     title: 'On Fire!',              description: '3 workouts in a row' },
  { id: 'streak-7',   emoji: '⚡', label: '7-Day Streak',     title: 'Week Warrior!',         description: '7 workouts in a row' },
  { id: 'streak-14',  emoji: '💪', label: '14-Day Streak',    title: 'Two-Week Beast!',       description: '14 workouts in a row' },
  { id: 'streak-30',  emoji: '🌊', label: '30-Day Streak',    title: 'Unstoppable!',          description: '30 workouts in a row' },
  { id: 'count-10',   emoji: '✅', label: '10 Workouts',      title: 'Getting Consistent!',   description: '10 total workouts logged' },
  { id: 'count-25',   emoji: '🌟', label: '25 Workouts',      title: 'Quarter Century!',      description: '25 total workouts logged' },
  { id: 'count-50',   emoji: '🎯', label: '50 Workouts',      title: 'Halfway Hunter!',       description: '50 total workouts logged' },
  { id: 'count-75',   emoji: '👑', label: '75 Workouts',      title: 'Elite Level!',          description: '75 total workouts logged' },
  { id: 'variety',    emoji: '🎨', label: 'Variety Pack',     title: 'Mix Master!',           description: '5+ unique exercises in one session' },
  { id: 'early-bird', emoji: '🌅', label: 'Early Bird',       title: 'Rise and Grind!',       description: 'Workout logged before 8am' },
  { id: 'night-owl',  emoji: '🦉', label: 'Night Owl',        title: 'Night Shift!',          description: 'Workout logged after 10pm' },
  { id: 'pr',         emoji: '🏋️', label: 'Personal Record',  title: 'New PR!',               description: 'Hit a new weight personal record' },
];

function getCurrentStreak(workouts) {
  if (!workouts.length) return 0;

  const sorted = [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const mostRecent = new Date(sorted[0].date + 'T00:00:00');
  // Streak must include today or yesterday
  if (mostRecent < yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const curr = new Date(sorted[i].date + 'T00:00:00');
    const prev = new Date(sorted[i - 1].date + 'T00:00:00');
    const diffDays = Math.round((prev - curr) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

async function getMaxWeightForExercise(exerciseName, excludeWorkoutId) {
  const workouts = await getAllWorkouts();
  let max = null;
  for (const w of workouts) {
    if (w.id === excludeWorkoutId) continue;
    for (const ex of (w.exercises || [])) {
      if (ex.name !== exerciseName) continue;
      for (const s of (ex.sets || [])) {
        if (s.weight != null && (max === null || s.weight > max)) {
          max = s.weight;
        }
      }
    }
  }
  return max;
}

/**
 * Check all achievements against the latest saved workout.
 * Returns an array of newly earned ACHIEVEMENTS definitions.
 */
export async function checkAchievements(latestWorkout) {
  const challenge = await getChallenge();
  const earned = challenge.achievements || [];
  const earnedIds = new Set(earned.map(a => a.id));

  const allWorkouts = await getAllWorkouts();
  const newlyEarned = [];
  const now = new Date();
  const hour = now.getHours();
  const count = allWorkouts.length;
  const streak = getCurrentStreak(allWorkouts);

  // Streak achievements
  for (const n of [3, 7, 14, 30]) {
    if (streak >= n && !earnedIds.has(`streak-${n}`)) {
      newlyEarned.push(ACHIEVEMENTS.find(a => a.id === `streak-${n}`));
    }
  }

  // Count achievements
  for (const n of [10, 25, 50, 75]) {
    if (count >= n && !earnedIds.has(`count-${n}`)) {
      newlyEarned.push(ACHIEVEMENTS.find(a => a.id === `count-${n}`));
    }
  }

  // Variety: 5+ unique exercises in this session
  if (!earnedIds.has('variety') && latestWorkout?.exercises) {
    const uniqueNames = new Set(latestWorkout.exercises.map(e => e.name));
    if (uniqueNames.size >= 5) {
      newlyEarned.push(ACHIEVEMENTS.find(a => a.id === 'variety'));
    }
  }

  // Time-based
  if (!earnedIds.has('early-bird') && hour < 8) {
    newlyEarned.push(ACHIEVEMENTS.find(a => a.id === 'early-bird'));
  }
  if (!earnedIds.has('night-owl') && hour >= 22) {
    newlyEarned.push(ACHIEVEMENTS.find(a => a.id === 'night-owl'));
  }

  // PR detection: compare each set weight against historical max for that exercise
  if (!earnedIds.has('pr') && latestWorkout?.exercises) {
    outer: for (const ex of latestWorkout.exercises) {
      const prevMax = await getMaxWeightForExercise(ex.name, latestWorkout.id);
      for (const s of (ex.sets || [])) {
        if (s.weight != null && (prevMax === null || s.weight > prevMax)) {
          newlyEarned.push(ACHIEVEMENTS.find(a => a.id === 'pr'));
          break outer;
        }
      }
    }
  }

  const valid = newlyEarned.filter(Boolean);

  if (valid.length > 0) {
    const updatedEarned = [
      ...earned,
      ...valid.map(a => ({ id: a.id, earnedAt: new Date().toISOString() }))
    ];
    await updateChallenge({ achievements: updatedEarned });
  }

  return valid;
}
