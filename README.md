# 🧠⚽ Footy Brain — Football Academy App

> **Train your football brain!** Quizzes, mini-games and tactics for young footballers aged 8–12.

---

## What is Footy Brain?

Footy Brain is an educational football app for kids aged 8–12. It teaches ball control, tactics, rules, formations and pro-level football knowledge through interactive quizzes and canvas-based mini-games — all wrapped in a fun, gamified experience with XP, streaks, badges and levels.

**Built as a Progressive Web App (PWA)** — works on any device, installs to the home screen, works offline.

---

## Features

### 📚 Learning (16 Chapters · 112 Questions)
| Category | Chapters |
|---|---|
| Fundamentals | Ball Control, Passing, Dribbling, Shooting, Defending |
| Tactics | Formations, Pressing & Transitions, Set Pieces |
| Position-Specific | Striker, Midfielder, Defender, Goalkeeper |
| Rules | Laws of Football, Referee Signals |
| Pro Knowledge | Football IQ, History & Icons |

- Adaptive question ordering (wrong answers surface first)
- Spaced repetition tracking per question
- Chapter locking — score 60%+ to unlock the next
- Difficulty tiers: Beginner → Developing → Pro → Elite

### 🎮 Mini-Games (6 Games)
- **Penalty Shootout** — drag to aim, hold to charge power, beat the keeper
- **Offside Judge** — canvas-drawn scenarios, judge onside/offside
- **Free-Kick Master** — drag to aim + curve, bezier ball flight
- **Keep-Away Rondo** — possession IQ decision scenarios
- **Scanning Drill** — pitch flashes briefly, answer from memory
- **Header Challenge** — time your jump perfectly as the cross comes in

### 🏆 Progression System
- XP with streak multipliers (1.25× at 3 days, 1.5× at 7 days)
- 10 levels: Grassroots → Sunday League → Academy → ... → Legend
- 19 unlockable badges
- Perfect score bonus XP
- Daily challenge (5 questions, date-seeded, once per day)

### 💰 Freemium Model
- **Free:** 5 chapters + 2 mini-games (Penalty Shootout, Offside Judge)
- **Full Academy (£2.99):** All 16 chapters + all 6 games + daily challenge

---

## File Structure

```
footy-brain/
├── index.html      — App shell, all screens, CSS design system
├── data.js         — All chapters, questions, levels, badges, daily pool
├── app.js          — State, routing, quiz engine, XP, freemium logic
├── games.js        — All 6 canvas mini-games
├── manifest.json   — PWA manifest
├── sw.js           — Service worker (offline caching, push notifications)
├── offline.html    — Offline fallback page
└── icons/          — App icons (192px, 512px) — add your own
    ├── icon-192.png
    └── icon-512.png
```

---

## Running Locally

No build system needed. Just open `index.html` in a browser.

For full PWA features (service worker, install prompt), serve over HTTPS or localhost:

```bash
# Option 1 — Python
python -m http.server 8080

# Option 2 — Node
npx serve .

# Option 3 — VS Code
# Install "Live Server" extension → right-click index.html → Open with Live Server
```

Then visit `http://localhost:8080`

---

## Deploying to GitHub Pages

1. Push all files to a GitHub repository
2. Go to **Settings → Pages**
3. Source: **Deploy from branch → main → / (root)**
4. Your app will be live at `https://yourusername.github.io/footy-brain`

---

## Turning into a Native App (PWABuilder)

1. Deploy to GitHub Pages first (needs a live HTTPS URL)
2. Go to **pwabuilder.com**
3. Paste your GitHub Pages URL
4. Download the Android (Google Play) or Windows package
5. For iOS App Store — use the PWABuilder iOS package or wrap with Capacitor

---

## Monetisation Setup

The freemium gate is controlled in `app.js`:

```javascript
const FREE_CHAPTERS = ['f1', 'f2', 'f3', 't1', 'r1'];  // 5 free chapters
const FREE_GAMES    = ['penalty', 'offside'];             // 2 free games
const PREMIUM_PRICE = '£2.99';
```

**To enable real payments:**

### Option A — Unlock codes (simplest)
Add codes to the `VALID_CODES` array in `app.js`. Sell codes via Gumroad, Payhip or your own website. Buyer enters code in app to unlock.

### Option B — Stripe (recommended for web)
1. Create a Stripe account at stripe.com
2. Create a Payment Link for £2.99
3. Point `unlockPremium()` in `app.js` to your Stripe Payment Link
4. Use a Stripe webhook to deliver unlock codes by email after purchase

### Option C — Google Play Billing / Apple IAP
Use Capacitor to wrap the app natively, then implement in-app purchases through the respective platform SDKs.

---

## Adding Your App Icons

You'll need two PNG icons for the PWA manifest:

- `icons/icon-192.png` — 192×192px
- `icons/icon-512.png` — 512×512px

**Quick way to generate them:**
1. Create a square image with the 🧠⚽ logo on a dark (`#080f1e`) background
2. Use **realfavicongenerator.net** or **pwabuilder.com/imageGenerator** to generate all sizes

---

## Customising Content

All questions and chapters live in `data.js`. To add a chapter:

```javascript
{
  id: 'f6',                          // unique id
  title: 'Headers & Aerial Duels',   // display title
  emoji: '🏹',                        // emoji icon
  cat: 'Fundamentals',               // category
  xp: 20,                            // XP reward
  order: 17,                         // sort order
  // positions: ['Striker']          // omit = all positions see it
  desc: 'Master the art of heading.',
  questions: [
    {
      q: 'Where should you head the ball for maximum power?',
      difficulty: 2,                 // 1=Beginner 2=Developing 3=Pro 4=Elite
      opts: ['Top of the head', 'Forehead (flat part)', 'Side of head', 'Chin'],
      a: 1,
      exp: 'The flat forehead gives the largest, firmest contact surface for powerful headers.'
    },
    // ... more questions
  ]
}
```

To make a chapter free (no purchase needed), add its id to `FREE_CHAPTERS` in `app.js`.

---

## Tech Stack

| Technology | Usage |
|---|---|
| Vanilla HTML/CSS/JS | Everything — no framework needed |
| Bebas Neue + Outfit | Typography (Google Fonts) |
| Tailwind CDN | Utility classes for layout |
| Canvas API | All 6 mini-games |
| Web Audio API | Sound effects |
| localStorage | Game state persistence |
| Service Worker | Offline support + PWA |
| canvas-confetti | Celebration effects |

---

## Roadmap

- [ ] Real payment integration (Stripe)
- [ ] Club/coach licence (bulk unlock codes)
- [ ] Leaderboard with friend sharing
- [ ] More position-specific chapters (GK distribution, Striker link play)
- [ ] Push notifications for daily challenge reminder
- [ ] Parent dashboard (track child's progress)
- [ ] Additional languages (Spanish, French, German)

---

## Licence

© 2024 Footy Brain. All rights reserved.

The app content, questions, game logic and design are proprietary. The codebase is private — do not redistribute.

---

*Built with ❤️ for young footballers everywhere.*
