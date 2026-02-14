# Greg's 90-Day Challenge

A Progressive Web App (PWA) for tracking a 90-day strength workout challenge. Features a dreadlock lion theme, daily workout logging, inspiring messages to your future self, and milestone celebrations.

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
├── css/
│   ├── styles.css             # Main styles (gold lion theme, auto dark/light)
│   └── milestones.css         # Milestone badge & celebration animations
├── js/
│   ├── app.js                 # Entry point: router, SW registration
│   ├── db.js                  # IndexedDB wrapper (all data operations)
│   ├── views/
│   │   ├── dashboard.js       # Home screen (lion, progress, messages)
│   │   ├── log-workout.js     # Workout logging (quick + structured)
│   │   ├── history.js         # Timeline of past workouts
│   │   ├── day-detail.js      # Full detail for a single day
│   │   ├── milestones.js      # Milestone gallery
│   │   └── settings.js        # Export, import, reset
│   ├── components/
│   │   ├── nav.js             # Bottom navigation bar
│   │   ├── progress-bar.js    # Visual progress bar
│   │   ├── exercise-form.js   # Structured exercise entry UI
│   │   ├── milestone-badge.js # Badge + celebration overlay
│   │   ├── lion-svg.js        # Dreadlock lion SVG art
│   │   └── toast.js           # Toast notifications
│   └── utils/
│       ├── dates.js           # Date formatting/calculation helpers
│       └── exercises.js       # Default exercise library (40 exercises)
├── icons/
│   ├── lion.svg               # Lion source SVG
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
- **Structured**: pick exercises from a library (40 built-in + custom), enter sets/reps/weight

### Inspiring Messages

Write a motivational note each day. After 7+ entries, the dashboard randomly shows a past message — motivation from your past self.

### Milestones

Celebrations at days 7, 14, 30, 45, 60, 75, and 90. A full-screen animated overlay with confetti appears when you hit each milestone for the first time.

### Data Management

- **Export**: Download all data as a JSON file (backup)
- **Import**: Restore from a JSON backup file
- **Reset**: Clear everything and start fresh

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
