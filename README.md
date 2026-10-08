# My Naija Life 🇳🇬

A 3D Nigerian life simulation that runs in the browser on PC and mobile.

**Play:** https://thetechguydev.github.io/my-naija-life/

Pick your name, gender, faith and area (Ikeja, Yaba, Surulere, Lekki, Wuse 2, Bodija, Rumuola, Nassarawa GRA or New Haven). You start at 18 with ₦2,000,000 and a family back home. There is no single correct life: study, hustle, work, make friends, fall in love, look after your family, and live with the consequences of your choices.

## Features

- **Walk-in interiors (V5):** your home has real rooms that change with your housing level (face-me-I-face-you, self-contain, mini flat, 2-bedroom). Sleep in your bed, cook in the kitchen, watch TV, study at your desk, bathe. Furniture and paint from HomeStyle Furniture appear in your home. NIMC is a full walk-through: ticket, queue, form, photo, fingerprints and signature.
- **Every building has an inside (V5.2):** bank (tellers, ATMs, customer service), university (lecture theatre, admissions, bursary), Business Hub (open office, reception, interview room, HR), hospital (consulting room, pharmacy, ward), buka, market stalls, barber, cyber cafe, police station (with a real cell), church, mosque (ablution and prayer rows), Chill Spot (bar, big screen, pool table), estate agent, Oga Motors showroom, Local Govt town hall, NYSC secretariat and the Hustle Hub. Staff greet you, and actions play out in place: you sit for lectures and exams, sit across the interview panel, lie in the ward bed, eat at the buka table and watch football on the sofa. Arrests put you in the police cell and accidents wake you up in the hospital ward.

- **Life:** age and birthdays, health, energy, hunger, happiness and reputation, a Life Profile and a Life History timeline.
- **People:** 16 NPCs with personalities (ambitious, religious, materialistic, jealous, loyal and more), interests and memory. You can go from stranger to friend, close friend, talking stage, dating and a serious relationship. Gist, hangouts, dates, gifts, jealousy, cheating and breakups.
- **Phone simulator (V5.1):** a full NaijaOS phone with lock screen and apps: Phone (contacts, recents, keypad, real ringing incoming calls and conversations, airtime), Messages (SMS, bank alerts, scams), NaijaChat (WhatsApp-style chats, typing, family group), NaijaGram (feed, likes, posts, followers, going viral, brand deals), Camera and Gallery (real photos of the 3D world), NaijaBank (PIN, transfers, history, failed transfers), MyTel (airtime and data bundles), Maps, News, My Life and Settings. Battery drains and charges when you sleep.
- **Family:** parents and siblings in your hometown who call, need help and celebrate your wins.
- **Marriage and children (V5.3):** buy a ring and propose, then go through the introduction with your partner's family, the bride price and list, a traditional wedding, and a church wedding, nikkah or court wedding (each played out in the church, mosque or LG hall). Your spouse moves in and is at home in the evenings. Married life includes housekeeping money, in-law requests, date nights, trying for a baby, antenatal care, labour (hospital or birth attendant), the naming ceremony, children growing up at home, choosing a public or private school and paying school fees every term.
- **Life events:** malaria, NEPA outages, floods, rent increases, scams, loans to friends, weddings, bonuses, fuel price hikes and more, each with choices.
- **Path:** NIN (NIMC) → JAMB → university (lectures, exams, carryovers, SIWES) → NYSC → CV → interviews → jobs. Side hustles, Yahoo and police, housing and an okada.
- **World:** 3D city with real street names, traffic lights, zebra crossings, accidents and GPS directions.

## Accounts, online saves and admin (V5.4)

- Players sign up with a username, email and password, and their life is saved online so they can continue on any device. Guests can play without an account and upload their progress later from **Menu → Save online**.
- The **admin dashboard** is at `/admin.html`. It shows players online now, active today, sign-ups per day, players by area, the richest characters and a live feed of life events. You can open any player to see their character, credit money, send a message, restore their stats, ban or unban, give admin rights, reset their save or download it.
- **Announcements** sent from the dashboard reach every player as an SMS and a pop-up.
- The backend is Supabase. `supabase/schema.sql` creates the tables and the security rules. `js/config.js` holds the project URL and the public anon key. With an empty config the game runs offline as before.

## Social: real players (V6)

- **Real players in your city:** other signed-in players in the same area walk around your streets with a purple 🌐 name tag and appear as pink dots on the minimap. Walk up to them to see their life, follow them or wave.
- **NaijaGram 🌍 Naija tab:** real photo posts from every player, with likes and comments. Posting from the Me tab also shares to everyone. Tap a player to see their profile, follow or wave.
- **Rankings app 🏆:** top players by money, respect, followers, family size and longest life.
- **Share my life story 📤:** makes a life card image to post on X or WhatsApp, with a link to your public page (`player.html?u=username`).
- **Admin:** a Posts tab to hide or delete posts.
- Database: run `supabase/v6_social.sql` once (it is also included in `schema.sql`).

## Open 24/7, careers and businesses (V6.1)

- **Every place is open round the clock.** The clock is game time: a full game day passes in about 16 real minutes, with day and night.
- **Career ladders:** every job has levels (for example Junior Developer → Software Developer → Senior Developer → Tech Lead → Engineering Manager → CTO). Performance rises with shifts, overtime and good choices in workplace events, and falls when you miss weekday shifts. Ask HR for a promotion review when you qualify. Miss three weekdays in a row and you are sacked.
- **Businesses:** register a business name with CAC at the Local Govt Secretariat, then open a POS kiosk, provisions store, buka restaurant or dispatch logistics company (Menu → My businesses, or the Business phone app). Hire staff with different skills and traits, buy stock, set prices, advertise, supervise, upgrade or sell. Every morning you get the previous day's profit or loss, with theft, stock-outs, task force visits and big orders.

## Cars, economy and transport (V6.2)

- **Cars you can drive:** buy a Toyota Corolla 2010 (₦9.5m), Honda Accord 2015 (₦16m) or Lexus RX 350 (₦32m) at Oga Motors. Walk to it and press E to get in. Drive with W/S (gas, brake, reverse) and A/D (steer), Space handbrake, H horn, C to switch between the chase view and the inside view (each model has its own interior: fabric or leather, wood or metal trim, screen, ambient light). On mobile, the left stick drives. Fuel, damage, crashes with traffic and walls, hitting pedestrians, towing for parking on the road, repairs, trade-ins and selling.
- **NNPC Filling Station** next to your home: fuel for your car and jerrycans for your generator. Petrol prices move with inflation and fuel scarcity.
- **Inflation:** prices creep up every day (salaries follow slowly), with occasional jumps in the news. See today's numbers in the News app.
- **Prepaid electricity:** your home uses power units every day (AC, fridge, TV, fan). Buy units in the Power ⚡ app. When they run out: generator, inverter, solar panels (HomeStyle) or no light.
- **Public transport:** from the Directory, pick a place and walk, drive, or take a keke, danfo or ride-hailing car.
- **Next guide:** the "Next" box now checks what is actually possible right now (daily limits, energy, money, deadlines) and tells you exactly what to do.

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
| `js/interior.js` | Interior engine, furniture models, home layouts, NIMC, scenes and speech bubbles |
| `js/interiors2.js` | All other building interiors, action scenes, exam and interview seats, police cell, hospital ward, ATM |
| `js/ui.js` | Toasts, sound, building panels |
| `js/panels.js` | Setup, people, family, events, Life Profile, home and shop panels |
| `js/phone.js` | The phone simulator (NaijaOS) and all its apps |
| `js/config.js` | Supabase URL and public key |
| `js/career.js` | Job ladders, performance, promotions, overtime, workplace events |
| `js/business.js` | Business ownership: CAC, staff, stock, prices, daily profit and loss |
| `js/vehicles.js` | Cars: models, interiors, driving controller, fuel, crashes, Oga Motors and the filling station |
| `js/economy.js` | Inflation, prepaid electricity and solar, public transport, Power app |
| `js/cloud.js` | Sign up / sign in, online saves, admin actions, announcements |
| `admin.html`, `js/admin.js`, `css/admin.css` | Admin dashboard |
| `js/social.js` | Real players in the city, NaijaGram posts, likes, comments, follows, waves, rankings, life-story card |
| `player.html` | Public player page used by shared links |
| `supabase/schema.sql` | Database tables and security rules |
| `js/marriage.js` | Proposal, wedding steps, spouse, pregnancy, birth, naming, children and school fees |
| `js/main.js` | Input, traffic, game loop, HUD, boot |

Saves are kept in the browser and upgrade automatically between versions. Older single-file versions are kept in `versions/`.
