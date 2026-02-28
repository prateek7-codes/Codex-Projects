# Kanso Habit Tracker

A Japanese minimalism-inspired habit tracker built with plain HTML, CSS, and JavaScript.

## Features

- Habit list management (add/delete)
- Daily completion check-in per habit
- Current streak per habit
- Last 7-day completion count per habit
- Dashboard stats: habits, done today, completion %, best streak
- 30-day calendar heatmap-style view
- Japanese-inspired dual themes (Yoru dark / Hikari light)
- Persistent local storage (`localStorage`)

## Run locally

```bash
python3 -m http.server 4173
```

Open <http://127.0.0.1:4173>.

## Deploy on Vercel

1. Push this repository to GitHub/GitLab/Bitbucket.
2. Import the repo in Vercel.
3. Keep framework preset as **Other** (static site).
4. Deploy (no build command required).

`vercel.json` is included so all routes rewrite to `index.html`.
