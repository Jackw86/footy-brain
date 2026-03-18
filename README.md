# 🧠⚽ Footy Brain — Football Academy

> Train your football brain. Quizzes · Games · Prizes · Streaks.

A progressive web app (PWA) for young footballers aged 8-12. Covers
technique, tactics, rules, mental game, fitness, analytics and more — 
53 chapters, 1,000+ questions, 6 mini-games and a full prize collection system.

## 🚀 Live App
**[footybrain.app](https://footybrain.app)** *(or your GitHub Pages URL)*

Install on your phone homescreen for the full app experience.

---

## 📱 Features

### Learning
- **53 chapters** across 12 categories — Fundamentals, Tactics, Position-Specific,
  Rules, Mental Game, Fitness, Analytics and more
- **1,000+ questions** with shuffled answers on every attempt
- **Adaptive quiz ordering** — wrong answers come back more often
- **Daily Challenge** — 5 questions every day to protect your streak

### Games
- 🥅 Penalty Shootout
- 🚩 Offside Judge  
- ⚡ Free-Kick Master
- 🔄 Keep-Away Rondo
- 👁️ Scanning Drill
- 🏹 Header Challenge

Each game gives **1 free attempt per 24 hours** — score 3+ to win a prize pack.

### Prize System
- **50+ collectible items** — Player Characters, Titles, Power-Ups, Knowledge Cards
- **5 rarity tiers** — Common through Legendary
- **Pack opening animation** with rarity-weighted random prizes
- **Pity timer** — guaranteed rare prize after 20 attempts without one
- **Odds displayed** for full transparency (legal compliance)

### Progression
- **10 levels** from Grassroots to Legend
- **XP system** with streak multipliers (1.25× at 3 days, 1.5× at 7 days)
- **Hearts system** — 5 hearts, lose one per wrong answer, regen every 30 mins
- **19 badges** to earn
- **Streak freezes** to protect your daily streak

### Monetisation (connect to payment provider)
- **Footy Brain Pro** — £24.99/year or £3.99/month
  - 2× XP always on, unlimited game attempts, weekly streak freeze,
    exclusive avatars, Pro leaderboard, parent dashboard
- **Streak Freeze** — £0.99 (1) or £1.99 (3)
- **Extra Attempts** — £0.99 for 3 more game attempts today
- **24-hour Pro** — earnable free by scoring well in games

---

## 🗂 File Structure

```
footy-brain/
├── index.html          App shell — all screens, design system, navigation
├── data.js             Core data — 16 chapters, level system, badges, daily pool
├── data-batch2.js      Batch 2 — 10 chapters (Mental Game, Fitness, Winger etc)
├── data-batch3.js      Batch 3 — 38 new chapters (full expansion)
├── app.js              App engine — hearts, XP, routing, quiz engine, Pro system
├── games.js            6 mini-games with canvas rendering
├── packs.js            Prize system — pack opening, collectibles, rarity system
├── drills.js           Drill of the Day — 30 football training drills
├── sw.js               Service worker — offline caching, push notifications
├── manifest.json       PWA manifest
├── offline.html        Offline fallback page
└── icons/
    ├── icon-192.png    PWA icon
    └── icon-512.png    PWA icon (large)
```

---

## 🛠 Deployment

### GitHub Pages (free)
1. Push all files to a public GitHub repository
2. Go to **Settings → Pages**
3. Set Source to **Deploy from branch → main → / (root)**
4. Your app is live at `https://yourusername.github.io/footy-brain`

### Netlify (free, recommended)
1. Go to [netlify.com](https://netlify.com) and sign up
2. Drag and drop the project folder onto the Netlify dashboard
3. Done — live instantly with a free `.netlify.app` URL
4. Add a custom domain in Netlify settings

### Custom Domain
Point your domain's DNS to GitHub Pages or Netlify.
For GitHub Pages: add a `CNAME` file containing your domain name.

---

## 💳 Payment Integration

Payment buttons are wired up with placeholder `showToast()` calls.
To activate real payments, integrate with:

- **RevenueCat** — handles Apple + Google billing in one SDK
- **Stripe** — for web purchases (not in-app store)
- **Apple StoreKit** / **Google Play Billing** — native if building with Capacitor/Cordova

Replace `showToast('...')` calls in `app.js` and `pro.js` with your payment SDK calls.

---

## ⚖️ Legal Notes

- All player characters are original fictional creations — no real player names or likenesses used
- Prize odds are displayed as required by app store policies
- Parental PIN setting available in settings
- ICO registration required if collecting user data in the UK
- Review the UK Children's Code (Age Appropriate Design Code) before launch

---

## 📋 Chapters (53 total)

| # | Category | Chapters |
|---|----------|---------|
| 1-5 | Fundamentals | Ball Control, Passing, Dribbling, Shooting, Defending |
| 6-8 | Tactics | Formations, Pressing, Set Pieces |
| 9-12 | Position-Specific | Striker, Midfielder, Defender, Goalkeeper |
| 13-14 | Rules | Laws of Football, Referee Signals |
| 15-16 | Pro Knowledge | Football IQ, History & Icons |
| 17-23 | Fundamentals+ | Heading, Crossing, Body Shape, Weak Foot, Speed, Shielding, Restarts |
| 24-30 | Tactics+ | Attacking Patterns, Defensive Org, Width, Playing Out, Counter-Attack, High Line, Marking |
| 31-42 | Position+ | Striker ×2, Winger ×2, Full-Back ×2, Midfielder ×2, GK ×3, CB Leadership |
| 43-44 | Rules+ | Offside in Depth, Fouls & Cards |
| 45-47 | Mental Game | Confidence, Pressure, Focus |
| 48-49 | Fitness | Conditioning, Nutrition & Recovery |
| 50-51 | Analytics | Stats & Data, Scouting |
| 52-53 | Managers | Legendary Managers, Famous Systems |

---

Built with vanilla JavaScript, CSS and HTML — no frameworks, no build step.
Works offline. Installable as a PWA on iOS and Android.
