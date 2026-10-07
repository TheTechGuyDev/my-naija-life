# My Naija Life 🇳🇬

A 3D Nigerian life simulation that runs in the browser on PC and mobile.

**Play:** https://thetechguydev.github.io/my-naija-life/

Pick your name, gender, faith and area (Ikeja, Yaba, Surulere, Lekki, Wuse 2, Bodija, Rumuola, Nassarawa GRA or New Haven). You start at 18 with ₦2,000,000 and a family back home. There is no single correct life: study, hustle, work, make friends, fall in love, look after your family, and live with the consequences of your choices.

## Features (V4)

- **Life:** age and birthdays, health, energy, hunger, happiness and reputation, a Life Profile and a Life History timeline.
- **People:** 16 NPCs with personalities (ambitious, religious, materialistic, jealous, loyal and more), interests and memory. You can go from stranger to friend, close friend, talking stage, dating and a serious relationship. Gist, hangouts, dates, gifts, jealousy, cheating and breakups.
- **Phone:** NaijaChat, calls, transfers, notifications, family, people, profile and history.
- **Family:** parents and siblings in your hometown who call, need help and celebrate your wins.
- **Life events:** malaria, NEPA outages, floods, rent increases, scams, loans to friends, weddings, bonuses, fuel price hikes and more, each with choices.
- **Path:** NIN (NIMC) → JAMB → university (lectures, exams, carryovers, SIWES) → NYSC → CV → interviews → jobs. Side hustles, Yahoo and police, housing and an okada.
- **World:** 3D city with real street names, traffic lights, zebra crossings, accidents and GPS directions.

## Controls

| Action | PC | Mobile |
|---|---|---|
| Move | WASD / Arrow keys (Shift to run) | Drag the left side of the screen |
| Look around | Drag with the mouse, Q/R to turn, Z/X to tilt | Drag the right side of the screen |
| Zoom | Mouse wheel or ＋/－ | Pinch or ＋/－ |
| Enter / talk | E | Green button |
| Phone | P | 📱 |
| Bag | I | 🎒 |
| Directory | N | 🗺️ |
| Menu | M / Esc | ☰ |

## Code structure

| File | Contents |
|---|---|
| `index.html` | Page layout and script loader |
| `css/style.css` | All styling |
| `js/core.js` | Constants and helpers (version number lives here) |
| `js/data.js` | Areas, items, questions, jobs, NPCs, personalities, outings, government fees and life events |
| `js/map.js` | City layout, addresses, walking and GPS pathfinding |
| `js/life.js` | Save/migration, time, education, jobs, crime, relationships, family, events, daily life |
| `js/world3d.js` | 3D rendering: buildings, roads, people, cars, lighting |
| `js/ui.js` | Toasts, sound, building panels |
| `js/panels.js` | Setup, phone, people, family, events, Life Profile |
| `js/main.js` | Input, traffic, game loop, HUD, boot |

Saves are kept in the browser and upgrade automatically between versions. Older single-file versions are kept in `versions/`.
