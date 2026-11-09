# Lift Log — Dan & Jena

A tiny mobile-first workout tracker for Kathryn Mueller's 2025 push/pull routine. No build step, no backend, no accounts — just a static site that saves to the device.

## What it does

1. Ask who's lifting: **Dan** or **Jena**.
2. Show the four workouts (**Push 1**, **Pull 1**, **Push 2**, **Pull 2**) with the date each was last done and a **Next up** suggestion based on whichever workout has gone longest without being logged.
3. Let you record weight and reps for every set, with the previous session's numbers shown as placeholders and a one-tap "use those numbers" fill.
4. Save the session and show it in a recent-activity list (with delete).

Each person's history is kept separately. Everything is stored in `localStorage` on the device/browser, so no data is sent anywhere and Dan and Jena can each use their own phone.

## Routine

The exercise list, set/rep targets, and notes come from *Kathryn Mueller's Workout Routine 2025*:

| Workout | Focus |
| --- | --- |
| Push Day 1 | Chest, shoulders, triceps, quads, glutes |
| Push Day 2 | Chest, shoulders, triceps, quads, glutes |
| Pull Day 1 | Back, biceps, rear delts, glutes, hamstrings |
| Pull Day 2 | Back, biceps, rear delts, glutes, hamstrings |

AMRAP pull-ups, warm-up sets, and exercise alternatives from the PDF are included as notes on each exercise.

## Run locally

Any static file server works:

```sh
cd workout-app
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Opening `index.html` directly also works for the core app, but the service worker and install prompt need `http://localhost` or HTTPS.

## Deploy to GitHub Pages

From this folder:

```sh
git init -b main
git add .
git commit -m "Add lift log app"
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

Then on GitHub:

1. Open the repo's **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select **main** and **/ (root)**, then **Save**.
4. The app appears at `https://<your-username>.github.io/<repo-name>/` after a minute or two.

For a private repo, GitHub Pages requires a paid plan; a public repo is the simplest option. The app has no secrets, so public is fine.

### Install on a phone

Open the Pages URL in Safari (iOS) or Chrome (Android), then:

- **iOS:** Share → **Add to Home Screen**
- **Android:** menu → **Install app** / **Add to Home screen**

After the first load it works offline, which is handy in a gym with bad signal.

## Project layout

```
index.html     single page shell
app.js         workout data, rendering, storage, routing
styles.css     mobile-first dark UI
sw.js          offline cache
manifest.json  PWA metadata
icon*.png/svg  app icons
```

There is no framework, package manager, or build step. Edit the files and reload.

## Updating the app

The service worker serves cached assets and refreshes them in the background, while page navigations go to the network first. To force every installed copy to drop old assets, bump the cache name in `sw.js` (`liftlog-v1` → `liftlog-v2`).

## Notes

- Data lives only in the browser that created it. Clearing site data (or tapping **Reset all data** on the user screen) deletes it.
- There is no sync between devices. If Dan and Jena want a shared log later, a small backend or a synced storage service would be needed.
- The routine is Kathryn Mueller's; this app is just a personal logger for it.
