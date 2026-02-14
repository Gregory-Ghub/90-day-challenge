import { DEFAULT_EXERCISES } from './utils/exercises.js';

const DB_NAME = 'strength-challenge-db';
const DB_VERSION = 1;

let db = null;

export function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const database = e.target.result;

      // Workouts store
      if (!database.objectStoreNames.contains('workouts')) {
        const workouts = database.createObjectStore('workouts', { keyPath: 'id', autoIncrement: true });
        workouts.createIndex('dayNumber', 'dayNumber', { unique: false });
        workouts.createIndex('date', 'date', { unique: true });
      }

      // Challenge state store
      if (!database.objectStoreNames.contains('challenge')) {
        database.createObjectStore('challenge', { keyPath: 'id' });
      }

      // Exercises library store
      if (!database.objectStoreNames.contains('exercises_library')) {
        const lib = database.createObjectStore('exercises_library', { keyPath: 'id', autoIncrement: true });
        lib.createIndex('name', 'name', { unique: true });
        lib.createIndex('category', 'category', { unique: false });
      }
    };

    request.onsuccess = async (e) => {
      db = e.target.result;
      await seedDefaults();
      resolve(db);
    };

    request.onerror = (e) => reject(e.target.error);
  });
}

async function seedDefaults() {
  // Seed challenge state if not exists
  const challenge = await getChallenge();
  if (!challenge) {
    await put('challenge', {
      id: 1,
      startDate: null,
      isActive: false,
      completedAt: null,
      milestonesShown: []
    });
  }

  // Seed exercises if empty
  const exercises = await getAll('exercises_library');
  if (exercises.length === 0) {
    for (const ex of DEFAULT_EXERCISES) {
      await add('exercises_library', ex);
    }
  }
}

// ---- Generic CRUD helpers ----

function tx(storeName, mode = 'readonly') {
  const transaction = db.transaction(storeName, mode);
  return transaction.objectStore(storeName);
}

function add(storeName, data) {
  return new Promise((resolve, reject) => {
    const request = tx(storeName, 'readwrite').add(data);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function put(storeName, data) {
  return new Promise((resolve, reject) => {
    const request = tx(storeName, 'readwrite').put(data);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function get(storeName, key) {
  return new Promise((resolve, reject) => {
    const request = tx(storeName).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAll(storeName) {
  return new Promise((resolve, reject) => {
    const request = tx(storeName).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getByIndex(storeName, indexName, value) {
  return new Promise((resolve, reject) => {
    const store = tx(storeName);
    const index = store.index(indexName);
    const request = index.get(value);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function deleteRecord(storeName, key) {
  return new Promise((resolve, reject) => {
    const request = tx(storeName, 'readwrite').delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function clearStore(storeName) {
  return new Promise((resolve, reject) => {
    const request = tx(storeName, 'readwrite').clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ---- Challenge ----

export async function getChallenge() {
  return get('challenge', 1);
}

export async function updateChallenge(data) {
  const current = await getChallenge();
  return put('challenge', { ...current, ...data });
}

export async function startChallenge(startDate) {
  return updateChallenge({ startDate, isActive: true, completedAt: null, milestonesShown: [] });
}

// ---- Workouts ----

export async function saveWorkout(workout) {
  const existing = await getWorkoutByDate(workout.date);
  const now = new Date().toISOString();

  if (existing) {
    return put('workouts', {
      ...existing,
      ...workout,
      id: existing.id,
      updatedAt: now
    });
  } else {
    return add('workouts', {
      ...workout,
      createdAt: now,
      updatedAt: now
    });
  }
}

export async function getWorkoutByDate(date) {
  return getByIndex('workouts', 'date', date);
}

export async function getWorkoutByDay(dayNumber) {
  return getByIndex('workouts', 'dayNumber', dayNumber);
}

export async function getAllWorkouts() {
  const all = await getAll('workouts');
  return all.sort((a, b) => b.dayNumber - a.dayNumber);
}

export async function getWorkoutCount() {
  const all = await getAll('workouts');
  return all.length;
}

export async function getRandomMessage() {
  const all = await getAll('workouts');
  const withMessages = all.filter(w => w.inspiringMessage);
  if (withMessages.length === 0) return null;
  return withMessages[Math.floor(Math.random() * withMessages.length)];
}

// ---- Exercises Library ----

export async function getExercises() {
  return getAll('exercises_library');
}

export async function addCustomExercise(name, category) {
  return add('exercises_library', { name, category, isCustom: true });
}

// ---- Import / Export ----

export async function exportAllData() {
  const workouts = await getAll('workouts');
  const challenge = await getChallenge();
  const exercises = await getAll('exercises_library');
  return { workouts, challenge, exercises, exportedAt: new Date().toISOString() };
}

export async function importAllData(data) {
  // Clear existing
  await clearStore('workouts');
  await clearStore('challenge');
  await clearStore('exercises_library');

  // Import challenge
  if (data.challenge) {
    await put('challenge', data.challenge);
  }

  // Import workouts
  if (data.workouts) {
    for (const w of data.workouts) {
      await add('workouts', w);
    }
  }

  // Import exercises
  if (data.exercises) {
    for (const ex of data.exercises) {
      await add('exercises_library', ex);
    }
  }
}

export async function resetAllData() {
  await clearStore('workouts');
  await clearStore('challenge');
  await clearStore('exercises_library');
  await seedDefaults();
}
