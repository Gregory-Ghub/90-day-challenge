import { DEFAULT_EXERCISES } from './utils/exercises.js';
import { saveAutoBackup } from './utils/backup.js';

const DB_NAME = 'strength-challenge-db';
const DB_VERSION = 2;

let db = null;

export function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const database = e.target.result;
      const { oldVersion } = e;

      // Version 1 stores
      if (oldVersion < 1) {
        const workouts = database.createObjectStore('workouts', { keyPath: 'id', autoIncrement: true });
        workouts.createIndex('dayNumber', 'dayNumber', { unique: false });
        workouts.createIndex('date', 'date', { unique: true });

        database.createObjectStore('challenge', { keyPath: 'id' });

        const lib = database.createObjectStore('exercises_library', { keyPath: 'id', autoIncrement: true });
        lib.createIndex('name', 'name', { unique: true });
        lib.createIndex('category', 'category', { unique: false });
      }

      // Version 2: workout templates
      if (oldVersion < 2) {
        database.createObjectStore('workout_templates', { keyPath: 'id', autoIncrement: true });
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
  const challenge = await getChallenge();
  if (!challenge) {
    await put('challenge', {
      id: 1,
      startDate: null,
      isActive: false,
      completedAt: null,
      milestonesShown: [],
      achievements: []
    });
  }

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
  await updateChallenge({ startDate, isActive: true, completedAt: null, milestonesShown: [] });
  await saveAutoBackup(exportAllData);
}

// ---- Workouts ----

export async function saveWorkout(workout) {
  const existing = await getWorkoutByDate(workout.date);
  const now = new Date().toISOString();

  let result;
  if (existing) {
    result = await put('workouts', {
      ...existing,
      ...workout,
      id: existing.id,
      updatedAt: now
    });
  } else {
    result = await add('workouts', {
      ...workout,
      createdAt: now,
      updatedAt: now
    });
  }

  await renumberWorkouts();
  return result;
}

export async function getWorkoutByDate(date) {
  return getByIndex('workouts', 'date', date);
}

export async function getWorkoutByDay(dayNumber) {
  return getByIndex('workouts', 'dayNumber', dayNumber);
}

export async function getAllWorkouts() {
  const all = await getAll('workouts');
  return all.sort((a, b) => b.date.localeCompare(a.date));
}

export async function renumberWorkouts() {
  const all = await getAll('workouts');
  all.sort((a, b) => a.date.localeCompare(b.date));
  for (let i = 0; i < all.length; i++) {
    const newDay = i + 1;
    if (all[i].dayNumber !== newDay) {
      all[i].dayNumber = newDay;
      all[i].updatedAt = new Date().toISOString();
      await put('workouts', all[i]);
    }
  }
  await saveAutoBackup(exportAllData);
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

export async function addCustomExercise(name, category, notes = '', defaultReps = null, defaultSets = null, isDuration = false) {
  return add('exercises_library', { name, category, isCustom: true, notes: notes || '', defaultReps, defaultSets, isDuration });
}

// ---- Workout Templates ----

export async function getTemplates() {
  return getAll('workout_templates');
}

export async function addTemplate(template) {
  return add('workout_templates', {
    ...template,
    createdAt: new Date().toISOString()
  });
}

export async function updateTemplate(template) {
  return put('workout_templates', template);
}

export async function deleteTemplate(id) {
  return deleteRecord('workout_templates', id);
}

// ---- Import / Export ----

export async function exportAllData() {
  const workouts = await getAll('workouts');
  const challenge = await getChallenge();
  const exercises = await getAll('exercises_library');
  const templates = await getAll('workout_templates');
  return { workouts, challenge, exercises, templates, exportedAt: new Date().toISOString() };
}

export async function importAllData(data) {
  await clearStore('workouts');
  await clearStore('challenge');
  await clearStore('exercises_library');
  await clearStore('workout_templates');

  if (data.challenge) await put('challenge', data.challenge);
  if (data.workouts) {
    for (const w of data.workouts) await add('workouts', w);
  }
  if (data.exercises) {
    for (const ex of data.exercises) await add('exercises_library', ex);
  }
  if (data.templates) {
    for (const t of data.templates) await add('workout_templates', t);
  }

  await saveAutoBackup(exportAllData);
}

export async function resetAllData() {
  await clearStore('workouts');
  await clearStore('challenge');
  await clearStore('exercises_library');
  await clearStore('workout_templates');
  await seedDefaults();
  await saveAutoBackup(exportAllData);
}
