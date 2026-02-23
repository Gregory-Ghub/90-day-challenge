# Greg's 90-Day Challenge

A Progressive Web App (PWA) for tracking a 90-day strength workout challenge. Features a dreadlock lion theme, daily workout logging, inspiring messages to your future self, and milestone celebrations.

## Install the App

**No app store required.** This is a Progressive Web App — it installs directly from the browser.

### On Android (Chrome)

1. Open **https://YOUR_USERNAME.github.io/90-day-challenge/** in Chrome
2. Tap the **three-dot menu (⋮)** in the top-right corner
3. Tap **"Install app"** or **"Add to Home Screen"**
4. The app icon appears on your home screen and works offline from now on

> Chrome may automatically show a banner at the bottom of the screen prompting you to install — tap it if it appears.

### On iPhone / iPad (Safari)

1. Open **https://YOUR_USERNAME.github.io/90-day-challenge/** in Safari
2. Tap the **Share button** (the box with an arrow pointing up)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **Add** in the top-right corner

### On Desktop (Chrome or Edge)

1. Open **https://YOUR_USERNAME.github.io/90-day-challenge/** in Chrome or Edge
2. Click the **install icon** (looks like a monitor with a down arrow) in the address bar
3. Click **Install**

---

## What It Is

A mobile-first fitness tracker that installs on your phone like a native app. No backend, no accounts, no subscriptions — all data stays on your device using IndexedDB.

## Prerequisites

- A modern web browser (Chrome, Edge, Firefox, Safari)
- Python 3 (for local development server only)
- Git + a GitHub account (for deployment)

## Setup

No dependencies to install. Just clone/download and serve.

## How to Run

### Local Development

```bash
cd D:\dev\90-day-challenge
py -m http.server 8000
```

Open `http://localhost:8000` in Chrome. Press `Ctrl+C` in the terminal to stop the server.

### Install on Phone

1. Deploy to GitHub Pages (see step-by-step below)
2. Open the URL in Chrome on your Android phone
3. Tap the "Install app" or "Add to Home Screen" prompt

## How to Test

1. **Manual testing**: Open in Chrome, use DevTools (F12) for mobile view
2. **Offline test**: DevTools → Network → check "Offline" → reload
3. **PWA audit**: DevTools → Lighthouse → check "Progressive Web App" → Generate report
4. **Data inspection**: DevTools → Application → IndexedDB → `strength-challenge-db`

## Project Structure

```
90-day-challenge/
├── index.html                 # Single-page app shell
├── manifest.json              # PWA install metadata
├── sw.js                      # Service worker (offline support)
├── .gitignore                 # Prevents OS/editor/secret files from being committed
├── css/
│   ├── styles.css             # Main styles (gold lion theme, auto dark/light)
│   └── milestones.css         # Milestone badge & celebration animations
├── js/
│   ├── app.js                 # Entry point: router, SW registration, restore dialog
│   ├── db.js                  # IndexedDB wrapper (all data operations, v2)
│   ├── views/
│   │   ├── dashboard.js       # Home screen (lion, progress, messages, achievements)
│   │   ├── log-workout.js     # Workout logging (quick + structured + load template)
│   │   ├── history.js         # Timeline + heatmap + weekly bar chart
│   │   ├── day-detail.js      # Full detail for a single day
│   │   ├── milestones.js      # Milestone + achievement gallery
│   │   ├── settings.js        # Export, import, reset, backup info
│   │   └── templates.js       # Workout template CRUD
│   ├── components/
│   │   ├── nav.js             # Bottom navigation bar (4 tabs)
│   │   ├── progress-bar.js    # Visual progress bar
│   │   ├── exercise-form.js   # Structured exercise entry UI (modal, notes hints)
│   │   ├── milestone-badge.js # Gold milestone + blue achievement celebrations
│   │   ├── charts.js          # Pure Canvas heatmap + weekly bar chart
│   │   ├── lion-svg.js        # Dreadlock lion SVG art
│   │   └── toast.js           # Toast notifications
│   └── utils/
│       ├── dates.js           # Date formatting/calculation helpers
│       ├── exercises.js       # Default exercise library (40 exercises)
│       ├── backup.js          # localStorage auto-backup helpers
│       ├── html.js            # Shared escapeHtml() and formatDuration() utilities
│       └── achievements.js    # Achievement definitions + check logic
├── icons/
│   ├── icon-192.png           # App icon 192x192
│   ├── icon-512.png           # App icon 512x512
│   ├── icon-maskable-192.png  # Maskable variant 192x192
│   └── icon-maskable-512.png  # Maskable variant 512x512
└── README.md
```

## Key Concepts

### How It Works

- **Hash-based routing** (`#/home`, `#/log`, `#/history`) — no server needed
- **IndexedDB** stores all data locally on device — survives page reloads, app restarts
- **Service Worker** caches all files for offline access (cache-first strategy)
- **CSS `prefers-color-scheme`** automatically matches your phone's dark/light mode

### Workout Logging

Two modes available simultaneously:

- **Quick Log**: freeform text describing your workout
- **Structured**: pick exercises from a library (40 built-in + custom), enter sets/reps/weight or duration (minutes + seconds) depending on exercise type

**Duration exercises** (Running, Cycling, Rowing Machine, Jump Rope, Battle Ropes, Planks) automatically show `[ ] m  [ ] s` inputs instead of Reps + Weight. Custom exercises can be set to either type when you create them.

### Inspiring Messages

Write a motivational note each day. After 7+ entries, the dashboard randomly shows a past message — motivation from your past self.

### Milestones

Celebrations at days 7, 14, 30, 45, 60, 75, and 90. A full-screen animated overlay with confetti appears when you hit each milestone for the first time.

### Data Management

- **Auto-backup**: After every workout save, the full dataset is serialized to `localStorage`. If IndexedDB is wiped (e.g. browser "Clear site data"), the app offers to restore on next launch.
- **Export**: Download all data as a JSON file (best long-term backup)
- **Import**: Restore from a JSON backup file
- **Reset**: Clear everything and start fresh

### Workout Templates

Save named exercise structures (e.g. "Push Day A") and load them into the log form in one tap. Templates live in their own IndexedDB object store and are included in exports.

### Achievements

12 unlockable achievements tracked in the challenge record:
- **Streak**: 3, 7, 14, 30 consecutive workout days
- **Count**: 10, 25, 50, 75 total workouts logged
- **Variety**: 5+ unique exercises in one session
- **Time**: Early Bird (before 8am), Night Owl (after 10pm)
- **PR**: Any exercise hits a new weight personal record

### Charts (History page)

- **Consistency Heatmap**: 13 × 7 grid showing worked vs rest days
- **Weekly Volume Bar**: 13-bar chart counting workouts per week
- Both use the Canvas API with zero external dependencies and read CSS custom properties to auto-adapt to dark/light mode.

## Privacy

All data is stored **locally on your device** using IndexedDB and localStorage. Nothing is ever sent to a server.

The GitHub repository contains **only source code** — no personal data, no workout history, no inspiring messages. Your data never leaves your device unless you manually export and share the JSON file.

**About the auto-backup:** The app automatically backs up your data to `localStorage` after every workout save. This backup survives clearing browser history and cache, but will be erased if you use **"Clear site data"** in your browser settings. For maximum protection, use **Settings → Export Data** to save a JSON backup file regularly.

---

## Deploying to GitHub Pages (Step-by-Step)

### 1. Install Git (if you don't already have it)

Download from https://git-scm.com/download/win and install with default settings.

### 2. Create a GitHub repository

1. Go to https://github.com and log in (or create an account)
2. Click the **+** button in the top-right → **New repository**
3. Name it `90-day-challenge`
4. Set it to **Public** (required for free GitHub Pages)
5. Do NOT check "Add a README" (we already have one)
6. Click **Create repository**
7. Keep this page open — you'll need the URL it shows

### 3. Push your code to GitHub

Open a terminal in the project folder and run these commands one at a time:

```bash
cd D:\dev\90-day-challenge

git init

git add .

git commit -m "Initial commit: Greg's 90-Day Challenge PWA"

git branch -M main

git remote add origin https://github.com/YOUR_USERNAME/90-day-challenge.git

git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

**If prompted to log in**: A browser window will open for GitHub authentication. Log in and authorize.

### 4. Enable GitHub Pages

1. Go to your repo on GitHub: `https://github.com/YOUR_USERNAME/90-day-challenge`
2. Click **Settings** (gear icon tab at the top)
3. In the left sidebar, click **Pages**
4. Under "Source", select **Deploy from a branch**
5. Under "Branch", select **main** and leave the folder as **/ (root)**
6. Click **Save**

### 5. Wait for deployment

- GitHub will build and deploy your site. This takes 1-3 minutes the first time.
- You can check the status: go to **Actions** tab in your repo to see the deployment progress
- A green checkmark means it's live

### 6. Access your app

Your app is now live at:

```
https://YOUR_USERNAME.github.io/90-day-challenge/
```

### 7. Install on your phone

1. Open the URL above in **Chrome** on your Android phone
2. Wait a few seconds — Chrome should show a banner: **"Add Greg's 90-Day Challenge to Home screen"**
3. If no banner appears: tap the **three-dot menu (⋮)** → **"Install app"** or **"Add to Home Screen"**
4. The app now appears on your home screen like a regular app

### Updating the app after changes

After making changes locally, push them to GitHub:

```bash
cd D:\dev\90-day-challenge
git add .
git commit -m "Description of what you changed"
git push
```

GitHub Pages will automatically redeploy within 1-3 minutes.

**Note on caching**: Since the app uses a service worker, your phone may show the old version for a bit. Close and reopen the app to get the latest version.
