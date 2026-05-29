# The Most Important Hour — Vite Project

## First time setup

Open Terminal, navigate to this folder, then run:

```bash
npm install
```

This downloads everything needed (takes about 30 seconds, only needed once).

---

## Preview on your computer

```bash
npm run dev
```

Then open http://localhost:5173 in your browser.
The app hot-reloads — changes appear instantly without refreshing.

---

## Deploy to Firebase (your live app)

```bash
npm run build
firebase deploy
```

That's it. `npm run build` compiles everything into the `dist/` folder,
and `firebase deploy` sends it live to https://most-important-app.web.app

---

## Project structure

```
src/
  App.jsx                    — root, all state lives here
  main.jsx                   — entry point
  constants/index.js         — themes, quotes, colours, font sizes
  hooks/
    useStorage.js            — localStorage helpers + key names
    useAudio.js              — Web Audio API (iOS-safe)
    utils.js                 — dates, streaks, formatting
  styles/
    global.css               — reset, nav, shared components
    variables.css            — CSS custom properties (theme tokens)
  components/
    Home/                    — hero, timeline, footer buttons
    Meditate/                — timer, fire/waves animation, audio
    Notes/                   — list, folders, read, editor
    Dreams/                  — masonry grid, editor sheet
    History/                 — timeline + month calendar view
    Settings/                — theme picker, font size, export/import
    shared/StarSvg.jsx       — the sparkle star motif

public/
  icon-512.png               — app icon (add yours here)
  chime.mp3                  — meditation chime
  fire-sound.mp3             — fire background sound
  waves-sound.mp3            — waves background sound
  Star_svg_2.svg             — sparkle SVG
```

---

## Adding a new feature / tab

1. Create `src/components/NewFeature/NewFeature.jsx` and `NewFeature.css`
2. Add your state to `App.jsx`
3. Add a tab entry to `NAV_TABS` in `App.jsx`
4. Render it inside the tab switch in `App.jsx`

That's all. The theme system and fonts apply automatically.

---

## Audio files

Place your audio files in the `public/` folder:
- `public/chime.mp3`
- `public/fire-sound.mp3`
- `public/waves-sound.mp3`

These are served directly by Vite (no import needed).
