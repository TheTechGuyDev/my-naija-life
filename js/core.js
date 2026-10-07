'use strict';
/* =========================================================
   MY NAIJA LIFE · core constants and helpers
   ========================================================= */
const VERSION = '5.1.0';
const T = 40, COLS = 60, ROWS = 40, WW = COLS * T, WH = ROWS * T;
const S = 0.08;                     // pixels -> metres (1 tile = 3.2 m)
const TIME_SCALE = 1.5;             // game minutes per real second (normal speed)
const YEAR_DAYS = 20;               // game days per year of age
const SAVE_KEY = 'mynaijalife_save';
const OLD_SAVE_KEYS = ['mynaijalife_v3'];
const GFX_KEY = 'mynaijalife_gfx';
const $ = id => document.getElementById(id);
const canvas = $('game');
let vw = window.innerWidth, vh = window.innerHeight;

const isTouch = window.matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const fmt = n => '₦' + Math.round(n).toLocaleString('en-NG');
function mulberry(seed){ let a = seed >>> 0; return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function seeded(str){ let h = 2166136261; for (let i = 0; i < str.length; i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return mulberry(h >>> 0); }
const srand = mulberry(20261005);
const hash = (c, r) => { const s = Math.sin(c * 12.9898 + r * 78.233) * 43758.5453; return s - Math.floor(s); };
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const spick = arr => arr[Math.floor(srand() * arr.length)];
const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const rint = (a, b) => Math.round(a + Math.random() * (b - a));
const WEEKDAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const BAG = isTouch ? 'tap 🎒 (Bag)' : 'press I or 🎒 (Bag)';
const fmtH = h => h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

let GFX = 'high';
try { GFX = localStorage.getItem(GFX_KEY) || (isTouch ? 'low' : 'high'); } catch (e) {}
