# My Naija Life 🇳🇬

A 3D Nigerian life simulation that runs in the browser on PC and mobile.

**Play:** https://thetechguydev.github.io/my-naija-life/

Pick your name, gender, faith and area (Ikeja, Yaba, Surulere, Lekki, Wuse 2, Bodija, Rumuola, Nassarawa GRA or New Haven). You start at 18 with ₦2,000,000 and a family back home. There is no single correct life: study, hustle, work, make friends, fall in love, look after your family, and live with the consequences of your choices.

## Features

- **Walk-in interiors (V5):** your home has real rooms that change with your housing level (face-me-I-face-you, self-contain, mini flat, 2-bedroom). Sleep in your bed, cook in the kitchen, watch TV, study at your desk, bathe. Furniture and paint from HomeStyle Furniture appear in your home. NIMC is a full walk-through: ticket, queue, form, photo, fingerprints and signature.

- **Life:** age and birthdays, health, energy, hunger, happiness and reputation, a Life Profile and a Life History timeline.
- **People:** 16 NPCs with personalities (ambitious, religious, materialistic, jealous, loyal and more), interests and memory. You can go from stranger to friend, close friend, talking stage, dating and a serious relationship. Gist, hangouts, dates, gifts, jealousy, cheating and breakups.
- **Phone simulator (V5.1):** a full NaijaOS phone with lock screen and apps: Phone (contacts, recents, keypad, real ringing incoming calls and conversations, airtime), Messages (SMS, bank alerts, scams), NaijaChat (WhatsApp-style chats, typing, family group), NaijaGram (feed, likes, posts, followers, going viral, brand deals), Camera and Gallery (real photos of the 3D world), NaijaBank (PIN, transfers, history, failed transfers), MyTel (airtime and data bundles), Maps, News, My Life and Settings. Battery drains and charges when you sleep.
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
| `js/interior.js` | Walk-in interiors, furniture models, home layouts, scenes and speech bubbles |
| `js/ui.js` | Toasts, sound, building panels |
| `js/panels.js` | Setup, people, family, events, Life Profile, home and shop panels |
| `js/phone.js` | The phone simulator (NaijaOS) and all its apps |
| `js/main.js` | Input, traffic, game loop, HUD, boot |

Saves are kept in the browser and upgrade automatically between versions. Older single-file versions are kept in `versions/`.
