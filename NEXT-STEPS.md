# Next Steps — Testing & GitHub Release Guide

This guide walks you through two things:

1. **Testing every new feature** locally so you know the app works before publishing
2. **Uploading to GitHub** and creating a proper release — including the full branch workflow you'll use for every future feature

---

## Before You Start — Open the App Locally

Every test in this guide assumes the app is running locally. Start your dev server now and leave it running.

Open a terminal in your project folder and run:

```bash
cd D:\dev\90-day-challenge
py -m http.server 8080
```

Then open **http://localhost:8080** in Chrome.

> **What this does:** Python's built-in HTTP server serves your files over a local network connection. Chrome needs this because ES modules (the `import`/`export` statements in your JavaScript) don't work when you open an HTML file directly from your file system — they require a real web server, even a local one.

---

## Part 1 — Testing Every New Feature

Work through these sections in order. Each one tests a specific version's new features.

---

### Test 1 — Auto-Backup (v1.1.0)

**What this feature does:** Every time you save a workout, the entire app's data is quietly written to `localStorage` — a separate storage area that survives "Clear history" but NOT "Clear site data." If IndexedDB is ever wiped, the app will notice on startup and offer to restore.

#### Step 1.1 — Log a workout and verify the backup was created

1. In the app, navigate to **Log** and save any workout (quick log is fine)
2. After saving, open Chrome DevTools: press **F12** (or right-click → Inspect)
3. Click the **Application** tab at the top of DevTools
4. In the left sidebar, expand **Storage** → click **Local Storage** → click `http://localhost:8080`
5. You should see two keys:
   - `90day-backup` — the full JSON backup of your data
   - `90day-backup-ts` — the timestamp of the last backup

> **What to look for:** The `90day-backup` value should be a long JSON string starting with `{"workouts":[...`. If you click on the key, the value appears in the panel below. This confirms the auto-backup is working after every save.

#### Step 1.2 — Simulate data loss and test the restore dialog

This simulates what happens when a user accidentally clears their data.

1. Still in the **Application** tab of DevTools
2. In the left sidebar, expand **IndexedDB** → expand **strength-challenge-db** → click **workouts**
3. Click the **Clear object store** button (the circle with a line through it, or press the delete key)
4. Do the same for the **challenge** store
5. Close DevTools and **reload the page** (press F5)

> **What you should see:** A dialog box asking "Restore Your Data?" with the number of workouts found in the backup and the export date. Click **Restore** — your workouts should reappear on the dashboard.

> **Why this matters:** This simulates what happened to your data before. Now the app protects against it automatically.

#### Step 1.3 — Check the Settings page for backup info

Navigate to **Settings** (gear icon top-right). You should see an **Auto-Backup** card showing the date and time of the last backup.

---

### Test 2 — Charts (v1.2.0)

**What this feature does:** The History page now shows a consistency heatmap (91 day grid) and a weekly volume bar chart, both drawn with the Canvas API — no third-party libraries.

#### Step 2.1 — Log a few workouts on different days

The charts are most useful with data. If you only have one workout, the heatmap will show one gold cell and the bar chart one bar. That's fine for testing — the point is they render without errors.

#### Step 2.2 — Navigate to History

Go to **History** in the bottom nav. You should see:

- A **Consistency — 13 Weeks** card with a grid of small squares. Gold squares = days you worked out. Grey squares = rest days.
- A **Weekly Volume** card with bars. Each bar represents one week (W1–W13). The bar height shows how many workouts you logged that week.

> **What to look for:** The charts should fill the full width of the card and have no white/black squares where colors should be. If the canvas is blank, something went wrong.

#### Step 2.3 — Test dark mode

Open Chrome DevTools → press **Ctrl+Shift+P** → type `Emulate CSS prefers-color-scheme dark` and select it. The chart colors should change to match the dark theme — gold accent on a dark background. Run the same command with `light` to switch back.

> **How this works:** The chart code reads color values directly from CSS custom properties (`--accent`, `--bg-secondary`) at render time, so it automatically inherits whatever the current theme is.

---

### Test 3 — Workout Templates (v1.3.0)

**What this feature does:** You can save named workout structures (e.g. "Push Day A") and load them into the log form in one tap. Saves you from re-entering the same exercises every session.

#### Step 3.1 — Create a template

1. Tap **Templates** in the bottom nav (the grid icon, 4th tab)
2. Tap **+ New**
3. Enter a name: `Push Day A`
4. Enter a description: `Chest, shoulders, triceps`
5. Tap **+ Add Exercise** and add 2–3 exercises (Bench Press, Overhead Press, Dips)
6. For each exercise, add a set with reps and weight
7. Tap **Save Template**

You should see your template listed with the exercise count.

#### Step 3.2 — Load the template into a workout

1. Navigate to **Log** in the bottom nav
2. Tap the **Structured** tab
3. Tap the **Load Template** button that appears above the exercise list
4. A picker dialog appears listing your templates — tap **Push Day A**
5. The exercises from your template should now be pre-filled in the form

> **What to look for:** The exercise form should show Bench Press, Overhead Press, and Dips already populated. You can adjust the reps/weight before saving.

#### Step 3.3 — Verify the database migration worked

Open DevTools → **Application** → **IndexedDB** → **strength-challenge-db**. You should see four object stores listed:

- `challenge`
- `exercises_library`
- `workout_templates` ← this is new in v1.3.0
- `workouts`

Click on `workout_templates` and you should see the template you just created.

> **What this proves:** The database upgraded from version 1 to version 2 without wiping your existing data. The upgrade code only adds the new store — it never touches the existing ones.

#### Step 3.4 — Test the custom exercise modal

1. In the Log page, switch to **Structured** tab
2. Tap **+ Add Exercise**
3. In the exercise dropdown, scroll to the bottom and select **+ Add Custom...**
4. A styled dialog should appear (not a browser `prompt()` box) asking for Name, Category, and Notes
5. Enter: Name = `Bulgarian Split Squats`, Category = `Legs`, Notes = `Keep front shin vertical`
6. Tap **Add Exercise**

The custom exercise should now appear in the dropdown and be selected. If you hover over it in future sessions, the notes appear as a hint below the exercise name.

---

### Test 4 — Achievements (v1.4.0)

**What this feature does:** 12 new achievements beyond the day-milestone badges. They track streaks, total workout count, variety, time of day, and personal records.

#### Step 4.1 — Trigger the workout count achievement

You need 10 total workouts logged for the "Getting Consistent!" achievement. Check how many you have in Settings → Challenge Info. If you're close, log a few more workouts (even quick logs) until you hit 10.

When you save the 10th workout, you should see a **blue** celebration overlay (not gold — gold is for day milestones, blue is for achievements). Dismiss it with "Awesome!"

#### Step 4.2 — Trigger a Personal Record

1. Go to **Log** → **Structured** tab
2. Add Bench Press with a weight higher than any previous entry (e.g. 205 lbs if you've previously logged 200)
3. Save the workout
4. You should see a blue "New PR!" achievement celebration

> **How PR detection works:** After saving, the app compares every set weight in your new workout against the historical maximum for that exercise across all previous workouts. If any weight exceeds the old max (or if it's the first time you've logged that exercise), the PR achievement fires.

#### Step 4.3 — Check the Milestones page

Navigate to **Milestones** (accessible from the gear icon or a card on the dashboard). You should see:

- **Milestones** section — the 7 gold day-milestone badges (earned ones are gold, locked ones are greyed out)
- **Achievements** section — the 12 blue achievement badges (earned ones show the date earned, locked ones show what's required)

#### Step 4.4 — Check the Dashboard for the recent achievements card

Navigate to **Home**. If you've earned any achievements in the last 7 days, a **"Recent Achievements"** card should appear showing the emojis and labels. Tapping it goes to the Milestones page.

---

### Test 5 — Duration Tracking (v1.5.0)

**What this feature does:** Exercises like Running, Cycling, Rowing Machine, Jump Rope, Battle Ropes, and Planks now show `[ ] m  [ ] s` inputs instead of Reps + Weight. Duration is stored as a whole number of seconds. Day Detail shows it formatted as `2m 30s`.

#### Step 5.1 — Verify duration inputs appear for the right exercises

1. Navigate to **Log** → tap the **Structured** tab
2. Tap **+ Add Exercise**
3. In the exercise dropdown, select **Running**
4. The set row should show two small inputs labelled **m** and **s** — not Reps and Weight
5. Now change the exercise to **Bench Press** — the inputs should switch back to Reps + Weight
6. Change it to **Planks** (under Core) — duration inputs should appear again

> **What to look for:** Only the six duration exercises trigger this layout. All others (push, pull, legs, most core) are unchanged.

#### Step 5.2 — Log a duration workout and verify it saves correctly

1. Select **Running**
2. Enter `2` in the **m** field and `30` in the **s** field for Set 1
3. Tap **+ Add Set** — a second `[ ] m  [ ] s` row should appear
4. Enter `3` minutes `0` seconds for Set 2
5. Fill in any other required fields and tap **Save**
6. Navigate to **History** and tap the workout you just saved
7. In the Day Detail view, the sets should display as:
   - `Set 1: 2m 30s`
   - `Set 2: 3m`

> **What `3m` (no seconds) means:** `formatDuration` omits the seconds component when it's zero, so `180` seconds shows as `3m` not `3m 0s`. This is intentional.

#### Step 5.3 — Add a custom duration exercise

1. Go to **Log** → **Structured** → **+ Add Exercise**
2. In the dropdown, select **+ Add Custom...**
3. The modal should now show an **Exercise Type** section with two radio buttons: **Reps / Weight** (selected by default) and **Duration**
4. Enter Name: `Farmer's Walk`, Category: `Other`, Type: `Duration`
5. Tap **Add Exercise**
6. The set row for Farmer's Walk should show `[ ] m  [ ] s` inputs

#### Step 5.4 — Verify the service worker updated

1. Open DevTools (F12) → **Application** → **Service Workers**
2. The active service worker should show **`90day-v7`** in its script URL or source
3. If it still shows v6, click **Update** and reload

---

### Test 7 — Shame Reminders (feature/shame-reminders)

**What this feature does:** If you haven't logged a workout in 14 or more hours, a full-screen shame modal greets you on the dashboard. The roast text and dismiss button get progressively more brutal the longer you've been absent. If the 14-hour mark will be crossed while you have the tab open, a toast notification fires at that exact moment. Both mechanisms are suppressed once per browser session so you don't get nagged on every page visit.

---

#### Step 7.1 — Set up a test workout to trigger shame

You need at least one workout in IndexedDB with a `createdAt` timestamp that's 15+ hours old.

1. Open the app at `http://localhost:8080`
2. Log any workout (quick log is fine — type "Test" and save)
3. Open Chrome DevTools: press **F12**
4. Click the **Console** tab
5. Paste the following snippet and press **Enter**:

```javascript
(() => {
  const req = indexedDB.open('strength-challenge-db', 2);
  req.onsuccess = (e) => {
    const db = e.target.result;
    const tx = db.transaction('workouts', 'readwrite');
    const store = tx.objectStore('workouts');
    store.getAll().onsuccess = (ev) => {
      const all = ev.target.result;
      if (!all.length) { console.log('No workouts found.'); return; }
      const latest = all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      const hoursAgo = new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString();
      latest.createdAt = hoursAgo;
      store.put(latest).onsuccess = () => {
        console.log(`✅ Done. createdAt set to: ${hoursAgo}`);
      };
    };
  };
})();
```

6. You should see `✅ Done. createdAt set to: ...` in the console

> **Why the console instead of the Application tab:** Chrome DevTools shows IndexedDB values as editable but the edits silently revert — it's a known browser limitation. The console snippet writes directly to the database using the same IndexedDB API the app uses, so the change sticks.

> **To test different tiers**, change the `16` in `- 16 * 60 * 60 * 1000` to any number of hours before running the snippet.

---

#### Step 7.2 — Trigger the shame modal

1. Reload the page (`F5`)
2. The shame modal should appear immediately over the dashboard

**What you should see:**
- A dark overlay with a skull emoji (💀) that shakes after a short delay
- A large red number showing the hours elapsed (e.g. "16")
- The word "hours" next to it
- The caption "since your last workout"
- A headline matching the hours tier (see tier table below)
- A roast paragraph
- A streak warning line in red italics
- A pulsing red **"Log It Now"** button
- A grey, understated dismiss button with a snarky label

---

#### Step 7.3 — Test the "Log It Now" button

1. Click the red **Log It Now** button
2. The overlay should close immediately
3. The app should navigate to the **Log** screen (`#/log`)

---

#### Step 7.4 — Test the dismiss button

1. Reload the page again (the modal should reappear since you're in a fresh session)
2. Click the grey dismiss button
3. The overlay should close, and you stay on the dashboard
4. Navigate away and back to Home — the modal should **not** reappear

> **Why it doesn't reappear:** Once dismissed or actioned, `sessionStorage` records that shame was shown this session. Navigating between pages does not open a new session — only closing the tab and reopening does.

---

#### Step 7.5 — Verify session suppression

1. With the modal having been shown and dismissed, navigate through the app (History, Log, back to Home)
2. The modal should **never** reappear during this session
3. Open a **new tab** and go to `http://localhost:8080` — the modal should appear again (new session, no sessionStorage entry)

---

#### Step 7.6 — Test every shame tier

Run the console snippet from Step 7.1 with different hour values to verify all six tiers. After each run, clear sessionStorage so the suppression doesn't block the modal — paste this into the console first:

```javascript
sessionStorage.clear(); console.log('Session cleared — reload to see shame modal again.');
```

Then re-run the timestamp snippet with the hour value for the tier you want to test, and reload.

| Hours to use in snippet | Headline you should see |
|---|---|
| `15` | **The Streak Is Getting Nervous** |
| `20` | **Almost a Full Day. Really.** |
| `28` | **A Whole Day Gone** |
| `40` | **Day and a Half. Outstanding.** |
| `52` | **Two Days. The Gains Are Gone.** |
| `80` | **You Have Forgotten What Lifting Is** |

For each tier, check that:
- The hours number in red matches what you expect
- The headline and roast text are unique (not repeating from another tier)
- The dismiss button label changes per tier (escalating from mild to defeated)

---

#### Step 7.7 — Verify no shame when recently logged

1. Log a fresh workout right now (the `createdAt` will be the current time)
2. Reload the page
3. The shame modal should **not** appear — you logged within the last 14 hours

This confirms the threshold check works correctly and won't annoy you when you're being disciplined.

---

#### Step 7.8 — Test the in-page toast nudge

This test simulates being in the app when the 14-hour mark is about to pass.

1. Log a fresh workout (createdAt = now)
2. Open DevTools → **Console** tab and paste this to set the timestamp to 13 hours 58 minutes ago:

```javascript
(() => {
  const req = indexedDB.open('strength-challenge-db', 2);
  req.onsuccess = (e) => {
    const db = e.target.result;
    const tx = db.transaction('workouts', 'readwrite');
    const store = tx.objectStore('workouts');
    store.getAll().onsuccess = (ev) => {
      const all = ev.target.result;
      const latest = all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      latest.createdAt = new Date(Date.now() - ((13 * 60 + 58) * 60 * 1000)).toISOString();
      store.put(latest).onsuccess = () => console.log('✅ Set to 13h 58m ago');
    };
  };
})();
```

3. Reload the page — the shame modal should **not** appear (only 13h 58m elapsed, under threshold)
4. Leave the tab open and wait ~2 minutes
5. A red toast notification should appear at the bottom of the screen reading: *"14 hours. No workout. The streak is waiting on you."*

> **What this proves:** If you leave the app open and hit the 14-hour mark mid-session, the in-page nudge fires without requiring a reload. It uses `setTimeout` calculated at page load time.

---

#### Step 7.9 — Confirm milestone celebrations still work

The shame modal and milestone celebrations both use the `#celebration-overlay` element. They must not conflict.

1. Set your workout count close to a milestone (e.g. you need 7 total for the first milestone)
2. Run the console snippet from Step 7.1 (with `16` hours) so shame will trigger
3. Reload the page — the shame modal should appear first
4. Dismiss it
5. If you were at a milestone, the gold celebration overlay should appear after
6. Dismiss that too

Both overlays should appear in sequence without visual glitches or broken dismiss buttons.

---

#### Step 7.10 — Verify no shame before the challenge starts

1. Open DevTools → **Application** → **IndexedDB** → **workouts** → clear the object store
2. Open the **challenge** store → set `isActive` to `false` and `startDate` to `null`
3. Reload the page
4. The welcome screen should appear with no shame modal

> **Why this matters:** The shame feature should never trigger for a brand-new user who hasn't started yet. `getShameStatus()` returns `null` when there are no workouts.

---

### Test 6 — PWA Offline (all versions)

Any time you update the service worker cache (which changed with each branch), you need to verify offline still works.

1. In Chrome, press **F12** → go to **Application** → **Service Workers**
2. Click **Update** to force the new service worker to activate
3. Go to **Network** tab → check the **Offline** checkbox
4. Reload the page

The app should still load and function normally. All data operations (reading/writing workouts) use IndexedDB, which works fully offline.

Uncheck **Offline** when done.

---

## Part 2 — Uploading to GitHub

### The Situation

All the code for v1.1.0 through v1.4.0 was written directly to your working directory in one session. The files are all interlinked — `db.js` has changes from multiple branches, `log-workout.js` has changes from two branches, etc. Trying to separate them into individual commits now would be complex and error-prone.

**The practical approach:** Commit everything together as one clean update, tag it as v1.4.0, and push it to GitHub. From this point forward, every new feature gets its own branch.

This is how experienced developers handle "I prototyped a bunch of things and now want to clean it up" — you don't fight the history, you start the clean workflow from now.

---

### Step 1 — Check what's changed

Open a terminal in your project folder:

```bash
cd D:\dev\90-day-challenge
git status
```

> **What this does:** Shows you every file that's been added or changed since the last commit. You should see a long list of modified files and new files (marked with `??` for untracked new files).

```bash
git diff --stat
```

> **What this does:** Shows a summary of how many lines were added/removed in each changed file. Good for a quick sanity check before committing.

---

### Step 2 — Stage all the changes

```bash
git add .gitignore
git add js/utils/backup.js js/utils/html.js js/utils/achievements.js js/utils/exercises.js
git add js/components/charts.js js/views/templates.js
git add js/db.js js/app.js sw.js
git add js/views/settings.js js/views/history.js js/views/log-workout.js
git add js/views/milestones.js js/views/dashboard.js js/views/day-detail.js
git add js/components/nav.js js/components/exercise-form.js js/components/milestone-badge.js
git add css/styles.css css/milestones.css
git add README.md NEXT-STEPS.md
```

> **What staging means:** Git has a two-step process for saving changes. First you "stage" files (add them to a holding area called the index), then you "commit" them (permanently record the snapshot). Staging lets you review exactly what will be committed before it's locked in. This is different from just saving a file — saving happens on your hard drive; staging + committing happens in Git's history.
>
> Using specific file names instead of `git add .` (add everything) is a deliberate habit — it prevents accidentally committing files you didn't intend to (like a `.env` file with secrets).

Verify the staged files look right:

```bash
git status
```

All the files you staged should now be listed under "Changes to be committed" (shown in green). Nothing you didn't expect should be there.

---

### Step 3 — Commit the changes

```bash
git commit -m "feat: add auto-backup, charts, templates, achievements, and duration tracking (v1.1-v1.5)"
```

> **What a commit is:** A commit is a permanent, labeled snapshot of your code at a specific moment. Every commit has a unique ID (a long hex string like `a3f9b12`), an author, a timestamp, and a message. Git history is a chain of these snapshots.
>
> **Conventional commit format:** The message follows the pattern `type: description`. Common types:
> - `feat` — a new feature
> - `fix` — a bug fix
> - `chore` — housekeeping (gitignore, configs, no user-facing change)
> - `docs` — documentation only
> - `refactor` — code reorganization, no behavior change
>
> The colon and space after the type are mandatory. Keep the description short (under 72 characters), lowercase, no period at the end. This format makes automated tooling (like changelog generators) work correctly.

---

### Step 4 — Push to GitHub

```bash
git push origin main
```

> **What this does:** Sends your local commits to the `main` branch on GitHub (called the "remote" — specifically the remote named `origin`, which is the shortname Git assigned to your GitHub repo URL when you first set it up). After this, your code is visible on GitHub at your repo URL.
>
> **Why `origin`?** When you ran `git remote add origin https://github.com/...` during the initial setup, you named that GitHub URL "origin." It's just a nickname for the full URL. You could name it anything, but "origin" is the universal convention.

---

### Step 5 — Create a Git Tag

A tag is a named label pointing to a specific commit. Tags are how you mark a release — "this exact code is version 1.4.0."

```bash
git tag v1.5.0 -m "Add auto-backup, canvas charts, workout templates, achievements, and duration tracking"
```

Then push the tag to GitHub:

```bash
git push origin v1.5.0
```

> **Why tags need a separate push:** By default, `git push` only pushes commits, not tags. You have to explicitly push tags. Think of them as a separate kind of object in Git.
>
> **Semantic versioning (SemVer):** Version numbers follow the format `MAJOR.MINOR.PATCH`:
> - `PATCH` (e.g. v1.0.1): Bug fixes or docs. No new features. Users can update safely.
> - `MINOR` (e.g. v1.1.0): New features that don't break anything existing. Users can update safely.
> - `MAJOR` (e.g. v2.0.0): Breaking changes — something that used to work now doesn't. Users should check before updating.
>
> v1.4.0 means: first major version, 4 new features added, 0 patches.

---

### Step 6 — Create a GitHub Release

A GitHub Release is a human-friendly presentation of a tag. It shows up on your repo's "Releases" page and lets you write release notes explaining what changed.

1. Go to your repository on GitHub: `https://github.com/YOUR_USERNAME/90-day-challenge`
2. Click **Releases** in the right sidebar (or go to the **Code** tab and click "Releases" on the right)
3. Click **Draft a new release**
4. In the **Choose a tag** dropdown, select **v1.5.0** (the tag you just pushed)
5. Set **Release title** to: `v1.5.0 — Charts, Templates, Achievements & Duration Tracking`
6. In the description box, write something like:

```
## What's New

### v1.1.0 — Auto-Backup
- Your workout data is now automatically backed up to localStorage after every save
- If IndexedDB is wiped, the app detects the backup on startup and offers to restore
- Settings page shows the timestamp of the last backup

### v1.2.0 — Charts
- History page now shows a 13-week consistency heatmap
- Weekly volume bar chart shows workout frequency by week
- Both charts adapt automatically to dark/light mode

### v1.3.0 — Workout Templates
- Save named workout structures (e.g. "Push Day A") and load them in one tap
- "Load Template" button in the Log screen fills in your exercises automatically
- Custom exercise modal replaces the old browser prompt() dialog

### v1.4.0 — Achievements
- 12 new achievement badges: streaks (3/7/14/30 days), workout counts (10/25/50/75),
  variety (5+ exercises in one session), early bird, night owl, and personal records
- Blue celebration overlay for achievements (distinct from gold milestone celebrations)
- Recent achievements preview card on the dashboard
- Full achievement gallery on the Milestones page

### v1.5.0 — Duration Tracking
- Running, Cycling, Rowing Machine, Jump Rope, Battle Ropes, and Planks now show
  minutes + seconds inputs instead of Reps / Weight
- Day Detail displays duration sets as "2m 30s", "45s", "3m", etc.
- Custom exercise modal has an Exercise Type toggle: Reps/Weight vs Duration
- Backwards-compatible: old workouts stored as {reps, weight} display correctly alongside new {duration} sets
```

7. Click **Publish release**

> **What GitHub Pages does with this:** GitHub Pages is already auto-deployed from your `main` branch. As soon as you pushed in Step 4, GitHub automatically started rebuilding and deploying your live site. The release you just created is just documentation — it doesn't trigger a separate deployment. Your live app is already updated.

---

### Step 7 — Verify the Live App

1. Wait 1–3 minutes for GitHub Pages to redeploy (check the **Actions** tab in your repo — a green checkmark means it's done)
2. Open your live URL: `https://YOUR_USERNAME.github.io/90-day-challenge/`
3. On your phone, close and reopen the installed PWA to get the new service worker
4. Test one or two features to confirm they work in production

---

## Part 3 — The Branch Workflow (Use This for Every Future Feature)

Now that your codebase is clean and tagged, this is the workflow to use every time you want to add something new. This is how professional developers work — it keeps `main` always stable and lets you safely experiment.

We'll use a hypothetical next feature as the example: adding a **rest day tracking** feature.

---

### Step 3.1 — Create a feature branch

```bash
git checkout -b feature/rest-days
```

> **What a branch is:** A branch is an independent line of development. When you create `feature/rest-days`, Git makes a new pointer that starts at the same commit as `main`. Any commits you make go onto this branch only — `main` is untouched. If you break something, you can just delete the branch and start over without any risk to your working code.
>
> `git checkout -b` is a shortcut for two commands: `git branch feature/rest-days` (create the branch) then `git checkout feature/rest-days` (switch to it). With modern Git you can also use `git switch -c feature/rest-days`.
>
> **Naming convention:** `feature/` prefix for new features, `fix/` for bug fixes, `chore/` for housekeeping. Lowercase, hyphens between words. Be specific — `feature/rest-days` is better than `feature/update`.

Verify you're on the new branch:

```bash
git branch
```

The current branch is marked with `*`. You should see `* feature/rest-days`.

---

### Step 3.2 — Make your changes

Write your code. Edit files, create new files. Save as you normally would. Nothing you do here affects `main`.

---

### Step 3.3 — Stage and commit

```bash
git add js/views/log-workout.js js/db.js
git commit -m "feat(log): add rest day toggle to workout logging"
```

> **Commit early and often:** Don't wait until a feature is completely done to make your first commit. Make small, focused commits as you go. Each commit should represent one logical change. If something breaks later, you can roll back to any previous commit.

---

### Step 3.4 — Push the branch to GitHub

The first time you push a new branch:

```bash
git push -u origin feature/rest-days
```

> **What `-u` does:** The `-u` flag (short for `--set-upstream`) tells Git to remember that your local `feature/rest-days` branch is connected to `origin/feature/rest-days` on GitHub. After this first push, you can just type `git push` on subsequent pushes — Git knows where to send them.

---

### Step 3.5 — Open a Pull Request on GitHub

1. Go to your GitHub repo — GitHub will show a yellow banner: "feature/rest-days had recent pushes" with a **Compare & pull request** button. Click it.
2. Set:
   - **Base branch:** `main` (this is where your changes will be merged INTO)
   - **Compare branch:** `feature/rest-days` (this is your branch with the new code)
3. Write a title: `feat(log): add rest day toggle`
4. In the description, explain what you changed and why
5. Click **Create pull request**

> **What a Pull Request is:** A PR is a formal request to merge your branch into another branch (usually `main`). It's not just a merge — it's a structured review process. GitHub shows exactly what lines changed, lets collaborators leave comments, and tracks approval. Even if you're working solo, PRs are valuable because the PR description becomes part of the project's history.

---

### Step 3.6 — Merge the Pull Request

On the PR page, you'll see a **Merge pull request** button with a dropdown arrow that offers three options:

| Option | What it does | When to use |
|--------|-------------|-------------|
| **Create a merge commit** | Keeps all commits from your branch in the history, adds a "merge commit" | When you want full history of individual commits |
| **Squash and merge** | Combines all your branch commits into one single commit on main | When your branch has messy "WIP" commits you want to clean up |
| **Rebase and merge** | Replays your commits on top of main without a merge commit | Advanced — keeps linear history |

**Recommendation for this project:** Use **Squash and merge**. It keeps `main`'s history clean and readable — one commit per feature. Write a clean commit message in the box (use the conventional commit format).

Click **Confirm squash and merge**.

After merging, GitHub offers to delete the branch — click **Delete branch**. The branch has served its purpose and no longer needs to exist.

---

### Step 3.7 — Update your local main

Your local `main` branch still doesn't know about the merge. Sync it:

```bash
git checkout main
git pull
```

> **What `git pull` does:** Downloads the latest commits from GitHub (`git fetch`) and merges them into your current local branch (`git merge`). After this, your local `main` matches GitHub's `main`.

Now delete the local feature branch (it's been merged, you don't need it):

```bash
git branch -d feature/rest-days
```

> **`-d` vs `-D`:** Lowercase `-d` is a safe delete — Git refuses to delete the branch if it hasn't been merged yet (protecting you from accidental data loss). Uppercase `-D` forces the delete regardless. Always use lowercase `-d` unless you're intentionally discarding an unmerged branch.

---

### Step 3.8 — Tag the release

```bash
git tag v1.6.0 -m "Add rest day tracking"
git push origin v1.6.0
```

---

### Step 3.9 — Create a GitHub Release

Same process as Step 6 above — go to Releases on GitHub, draft a new release from the tag, write release notes, publish.

---

## Quick Reference — Git Commands You'll Use Every Time

```bash
# Start a new feature
git checkout -b feature/my-feature-name

# See what's changed
git status
git diff

# Stage specific files
git add path/to/file.js

# Commit
git commit -m "feat(scope): description of change"

# Push branch to GitHub (first time)
git push -u origin feature/my-feature-name

# Push branch to GitHub (subsequent times)
git push

# After merging on GitHub: get back to main and sync
git checkout main
git pull

# Clean up merged local branch
git branch -d feature/my-feature-name

# Tag a release
git tag v1.X.0 -m "Short description"
git push origin v1.X.0

# See all tags
git tag

# See commit history
git log --oneline
```

---

## Troubleshooting

### "The app still shows the old version after pushing"

The service worker is caching the old files. On your phone: close the app completely → reopen it. In Chrome desktop: DevTools → Application → Service Workers → click **Update**.

### "My charts are blank in History"

You need at least one workout logged AND the challenge must have a start date. If you reset all data, log a workout first (which starts the challenge), then go to History.

### "The restore dialog didn't appear"

The restore dialog only appears if: (1) IndexedDB has zero workouts AND (2) the `90day-backup` key exists in localStorage with at least one workout. If you cleared localStorage too, there's nothing to restore from.

### "git push is asking for my username and password"

GitHub no longer accepts passwords for Git operations. You need to authenticate with a Personal Access Token or use the GitHub CLI (`gh auth login`). The easiest fix: install [GitHub Desktop](https://desktop.github.com/) and push from there — it handles authentication automatically.

### "I made a commit but want to undo it"

```bash
# Undo the last commit but keep your file changes (safe)
git reset --soft HEAD~1

# Undo the last commit AND discard the file changes (destructive!)
git reset --hard HEAD~1
```

Always prefer `--soft` unless you're absolutely sure you want to throw away the changes.
