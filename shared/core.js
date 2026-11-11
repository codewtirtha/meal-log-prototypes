'use strict';
/* =====================================================================
   PB Health meal-log prototypes: shared core for all three flows.
   Static only: no network calls, no storage, no database.

   - scenario data: Asha's lunch, a tub of mixed biscuits, 10 Oct, 12:45 PM
   - nutrition maths, the food score, estimate ranges, suggestions
   - icons and small illustrations
   - a tiny state-to-HTML renderer with event delegation
   - phone chrome: status bar, task panel, scaling
   - shared screen parts: Home, tab bar, camera, sheets, bars, score
   Each flow folder adds its own screens in flow.js and calls boot().
   ===================================================================== */

/* ---------- small utilities ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const r0 = v => Math.round(v);
const clone = o => JSON.parse(JSON.stringify(o));
let _uid = 0;
const uid = (p = 'i') => `${p}${++_uid}`;
/* Screenshot mode (#shots in the address): timers do not run and animations are off,
   so tools/take_screenshots.py can stop every screen at a known moment. */
const SHOTS = /[#&?]shots\b/.test(location.href);

/* ---------- pictures (shared/img) ---------- */
const IMG = '../shared/img/';
const ART = {
  tub: IMG + 'biscuit-tub.jpg',             /* the clear tub of mixed biscuits, seen from above */
  cracker: IMG + 'crop-cream-cracker.jpg',  /* close-up from that photo */
  round: IMG + 'crop-glucose-biscuit.jpg',  /* close-up from that photo */
  plate: IMG + 'example-plate.svg',         /* a single plate: the "good photo" example */
  chai: IMG + 'breakfast-chai.svg',         /* this morning's breakfast photo */
};

/* =====================================================================
   Scenario data (identical in all three flows)
   ===================================================================== */
const USER = { name: 'Asha', initial: 'A' };
const DAY_LABEL = '10 Oct';
const PHOTO_TIME = '12:45 PM';
const MEALS = [
  { key: 'breakfast', name: 'Breakfast', range: 'Until 10 AM' },
  { key: 'msnack', name: 'Morning snack', range: '10 AM to 12 PM' },
  { key: 'lunch', name: 'Lunch', range: '12 PM to 3:30 PM' },
  { key: 'esnack', name: 'Evening snack', range: '3:30 PM to 7 PM' },
  { key: 'dinner', name: 'Dinner', range: 'After 7 PM' },
];
const mealName = k => (MEALS.find(m => m.key === k) || { name: k }).name;
const mealLower = k => mealName(k).toLowerCase();
/* per-meal targets; lunch is the brief's 443 kcal, 55 g carbs, 22 g protein, 15 g fat, 8 g fibre */
const TARGETS = {
  breakfast: { kcal: 360, carbs: 45, protein: 18, fat: 12, fibre: 6 },
  msnack: { kcal: 150, carbs: 19, protein: 7, fat: 5, fibre: 3 },
  lunch: { kcal: 443, carbs: 55, protein: 22, fat: 15, fibre: 8 },
  esnack: { kcal: 150, carbs: 19, protein: 7, fat: 5, fibre: 3 },
  dinner: { kcal: 447, carbs: 56, protein: 22, fat: 15, fibre: 8 },
};

/* Values per piece or per portion. The two detected foods are set so that 14 cream crackers
   (84 g, 350 kcal) and 6 glucose biscuits (36 g, 146 kcal) give exactly the brief's totals:
   496 kcal, carbs 86 g, protein 7 g, fat 14 g, fibre 2 g. */
const FOODS = {
  cream_cracker: { name: 'Cream crackers', unit: 'piece', units: 'pieces', g: 6, kcal: 25, carbs: 60 / 14, protein: 5 / 14, fat: 10 / 14, fibre: 1.5 / 14, refined: true, short: 'crackers', crop: 'cracker' },
  glucose_biscuit: { name: 'Glucose biscuits', unit: 'piece', units: 'pieces', g: 6, kcal: 146 / 6, carbs: 26 / 6, protein: 2 / 6, fat: 4 / 6, fibre: 0.5 / 6, refined: true, short: 'biscuits', crop: 'round' },
  marie: { name: 'Marie biscuits', unit: 'piece', units: 'pieces', g: 6, kcal: 26, carbs: 4.3, protein: 0.45, fat: 0.7, fibre: 0.1, refined: true, short: 'biscuits', crop: 'round' },
  digestive: { name: 'Digestive biscuits', unit: 'piece', units: 'pieces', g: 15, kcal: 71, carbs: 9.6, protein: 1, fat: 3.2, fibre: 0.55, refined: true, short: 'biscuits', crop: 'round' },
  salted_cracker: { name: 'Salted crackers', unit: 'piece', units: 'pieces', g: 6, kcal: 27, carbs: 4, protein: 0.5, fat: 1.1, fibre: 0.15, refined: true, short: 'crackers', crop: 'cracker' },
  jeera_cracker: { name: 'Jeera crackers', unit: 'piece', units: 'pieces', g: 7, kcal: 31, carbs: 4.6, protein: 0.7, fat: 1.1, fibre: 0.2, refined: true, short: 'crackers', crop: 'cracker' },
  tea: { name: 'Tea with milk and sugar', unit: 'cup', units: 'cups', g: 150, gu: 'ml', kcal: 80, carbs: 11, protein: 2.2, fat: 2.8, fibre: 0 },
  curd: { name: 'Curd', unit: 'katori', units: 'katoris', g: 150, kcal: 90, carbs: 7, protein: 5, fat: 5, fibre: 0 },
  egg: { name: 'Boiled egg', unit: 'egg', units: 'eggs', g: 50, kcal: 78, carbs: 0.6, protein: 6.3, fat: 5.3, fibre: 0 },
  dal: { name: 'Dal', unit: 'katori', units: 'katoris', g: 150, kcal: 160, carbs: 20, protein: 8, fat: 5, fibre: 5 },
  banana: { name: 'Banana', unit: 'banana', units: 'bananas', g: 120, kcal: 105, carbs: 27, protein: 1.3, fat: 0.4, fibre: 3.1 },
};
const ADDABLE = ['tea', 'curd', 'egg', 'dal', 'banana'];
/* What the photo analysis "finds" (Wizard of Oz): the brief's two foods. */
const DETECTED = [
  { food: 'cream_cracker', qty: 14, conf: 'sure', alts: ['salted_cracker', 'jeera_cracker'] },
  { food: 'glucose_biscuit', qty: 6, conf: 'check', alts: ['marie', 'digestive'] },
];
/* This morning's meal, already logged, so the Meal card has something to list. */
const BREAKFAST = { id: 'm-breakfast', meal: 'breakfast', time: '8:30 AM', photo: 'chai', items: [{ id: 'b1', food: 'tea', qty: 1, conf: 'mine' }, { id: 'b2', food: 'marie', qty: 2, conf: 'mine' }] };
const FITGEMS = 10;

function detectedItems() {
  return DETECTED.map((d, i) => ({ id: uid(), n: i + 1, food: d.food, qty: d.qty, det: d.qty, detFood: d.food, conf: d.conf, alts: d.alts.slice(), touched: false }));
}

/* ---------- amounts: always pieces or grams, never "Number" ---------- */
const unitWord = (fd, q) => (q === 1 ? fd.unit : fd.units);
const qtyText = it => `${it.qty} ${unitWord(FOODS[it.food], it.qty)}`;
const gramsOf = it => r0(FOODS[it.food].g * it.qty);
function gramsText(it, approx = 'about ') { const fd = FOODS[it.food]; return `${fd.unit === 'piece' ? approx : ''}${gramsOf(it)} ${fd.gu || 'g'}`; }
const kcalOf = it => r0(FOODS[it.food].kcal * it.qty);
const foodName = it => FOODS[it.food].name;
const lowerName = it => { const n = foodName(it); return n.startsWith('Marie') ? n : n.toLowerCase(); };
function amountLine(it, approx = 'about ') { return `${qtyText(it)} (${gramsText(it, approx)})`; }

/* =====================================================================
   Nutrition maths
   ===================================================================== */
const NKEYS = ['kcal', 'carbs', 'protein', 'fat', 'fibre'];
const counted = items => items.filter(i => i.qty > 0);
function totals(items) {
  const t = { kcal: 0, carbs: 0, protein: 0, fat: 0, fibre: 0, g: 0 };
  counted(items).forEach(it => { const fd = FOODS[it.food]; NKEYS.forEach(k => { t[k] += fd[k] * it.qty; }); t.g += fd.g * it.qty; });
  return t;
}
const NUTR = [
  { key: 'kcal', label: 'Calories', unit: 'kcal', kind: 'limit' },
  { key: 'carbs', label: 'Carbs', unit: 'g', kind: 'limit', act: 'Eat less carbs' },
  { key: 'protein', label: 'Protein', unit: 'g', kind: 'goal', act: 'Eat more protein' },
  { key: 'fat', label: 'Fat', unit: 'g', kind: 'limit', act: 'Eat less fat' },
  { key: 'fibre', label: 'Fibre', unit: 'g', kind: 'goal', act: 'Eat more fibre' },
];
/* status: a limit (calories, carbs, fat) is "over" above 105 %; a goal (protein, fibre) is "under" below 90 % */
function nutrientRows(items, mealKey) {
  const T = TARGETS[mealKey]; const t = totals(items);
  return NUTR.map(n => {
    const val = t[n.key]; const target = T[n.key]; const pct = target ? val / target : 0;
    let status = 'within';
    if (n.kind === 'limit' && pct > 1.05) status = 'over';
    if (n.kind === 'goal' && pct < 0.9) status = 'under';
    return Object.assign({}, n, { val, target, pct, status });
  });
}
const rowsByKey = rows => Object.fromEntries(rows.map(r => [r.key, r]));

/* Food score out of 10 (the brief's 4 for this lunch). Rules, in order of weight:
   3 points off when 75 % or more of the calories come from refined flour (biscuits, crackers),
   1 off for calories more than 10 % over the meal target, 1 off for protein under half its goal,
   1 off for fibre under half its goal. The first rule that applies is the reason shown. */
function foodScore(items, mealKey) {
  const t = totals(items); const T = TARGETS[mealKey];
  const refined = counted(items).filter(i => FOODS[i.food].refined).reduce((a, i) => a + FOODS[i.food].kcal * i.qty, 0);
  const pens = [];
  if (t.kcal > 0 && refined / t.kcal >= 0.75) pens.push({ pts: 3, why: 'Mostly refined flour' });
  if (t.kcal > T.kcal * 1.1) pens.push({ pts: 1, why: `More calories than your ${mealLower(mealKey)} target` });
  if (t.protein < T.protein * 0.5) pens.push({ pts: 1, why: 'Low in protein' });
  if (t.fibre < T.fibre * 0.5) pens.push({ pts: 1, why: 'Low in fibre' });
  const score = clamp(10 - pens.reduce((a, p) => a + p.pts, 0), 1, 10);
  return { score, reason: pens.length ? pens[0].why : 'Close to your targets', pens };
}

/* Estimate ranges (Flow 2): a food marked "Sure" is +/- 5 %, "Check this" +/- 20 %,
   a food the person checked or changed +/- 5 %. */
const UNC = { sure: 0.05, check: 0.2 };
function rangeOf(items, key) {
  let lo = 0, hi = 0;
  counted(items).forEach(it => { const v = FOODS[it.food][key] * it.qty; const u = UNC[it.conf] ?? 0.05; lo += v * (1 - u); hi += v * (1 + u); });
  return [lo, hi];
}
const round10 = v => Math.round(v / 10) * 10;
function kcalVerdict(items, mealKey) {
  const [lo, hi] = rangeOf(items, 'kcal'); const T = TARGETS[mealKey].kcal; const L = round10(lo); const H = round10(hi); const mn = mealLower(mealKey);
  const head = L > T ? `Over your ${mn} target` : H < T ? `Within your ${mn} target` : `Close to your ${mn} target`;
  const status = L > T ? 'over' : 'within';
  return { head, status, L, H, T, line: `About ${L}–${H} kcal; ${mn} target ${T} kcal` };
}

/* One suggestion for next time (Flow 3): "Next time, try fewer crackers or add some protein". */
function suggestion(items, mealKey) {
  const R = rowsByKey(nutrientRows(items, mealKey)); const parts = [];
  if (R.carbs.status === 'over' || R.kcal.status === 'over') {
    const top = counted(items).map(i => ({ i, v: FOODS[i.food].carbs * i.qty })).sort((a, b) => b.v - a.v)[0];
    if (top) parts.push(`try fewer ${FOODS[top.i.food].short || foodName(top.i).toLowerCase()}`);
  }
  if (R.protein.status === 'under') parts.push('add some protein');
  else if (R.fibre.status === 'under') parts.push('add a vegetable or a fruit');
  if (!parts.length) return 'This meal is close to your targets. A similar meal next time keeps the day on track.';
  return `Next time, ${parts.join(' or ')}.`;
}

/* =====================================================================
   Icons (24 x 24 line icons) and small illustrations
   ===================================================================== */
const ICONS = {
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3.2"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><path d="M12 18v4"/><path d="M8.5 22h7"/>',
  search: '<circle cx="11" cy="11" r="7.5"/><path d="m21 21-4.3-4.3"/>',
  chevR: '<path d="m9 18 6-6-6-6"/>', chevL: '<path d="m15 18-6-6 6-6"/>', chevD: '<path d="m6 9 6 6 6-6"/>', chevU: '<path d="m18 15-6-6-6 6"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', plus: '<path d="M12 5v14"/><path d="M5 12h14"/>', minus: '<path d="M5 12h14"/>', check: '<path d="M20 6 9 17l-5-5"/>',
  pencil: '<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
  home: '<path d="M3 10.5 12 3l9 7.5V20a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/>',
  clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6"/><path d="M9 16h6"/>',
  plusSq: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8"/><path d="M8 12h8"/>',
  book: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
  cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h2.5l2.4 11.2a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 1.9-1.4L21.5 7H5.4"/>',
  chat: '<path d="M21 12a8.5 8.5 0 0 1-12.7 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12Z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13l3.5 7v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-4-4L6 21"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
  info: '<circle cx="12" cy="12" r="9.5"/><path d="M12 16v-4.5"/><path d="M12 8h.01"/>',
  help: '<circle cx="12" cy="12" r="9.5"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.7-3 4.5"/><path d="M12 17.5h.01"/>',
  bulb: '<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.1V16h5v-.1c0-.8.4-1.6 1.1-2.1A6 6 0 0 0 12 3z"/>',
  calcheck: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 9h18"/><path d="m9 15 2 2 4-4"/>',
  chart: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M7.5 16.5v-3M12 16.5v-6M16.5 16.5v-4"/>',
  drop: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5S12.5 5.5 12 3c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7z"/>',
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  glass: '<path d="M5 3h14l-1.6 16.2A2 2 0 0 1 15.4 21H8.6a2 2 0 0 1-2-1.8z"/><path d="M5.6 9h12.8"/>',
  ban: '<circle cx="12" cy="12" r="9.5"/><path d="m5.5 5.5 13 13"/>',
  scale: '<path d="M12 3v18"/><path d="M7 21h10"/><path d="m3 7 4-3 4 3"/><path d="m13 7 4-3 4 3"/><path d="M3 7l4 8 4-8"/><path d="M13 7l4 8 4-8"/>',
  sparkle: '<path d="M12 3l1.8 4.9L19 9.7l-5.2 1.8L12 16.4l-1.8-4.9L5 9.7l5.2-1.8z"/>',
  up: '<path d="M12 4.5 21 19H3z" fill="currentColor" stroke="none"/>',
  down: '<path d="M12 19.5 3 5h18z" fill="currentColor" stroke="none"/>',
  dash: '<path d="M5 12h14" stroke-width="3"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  retake: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  plate: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/>',
  clock: '<circle cx="12" cy="12" r="9.5"/><path d="M12 7v5l3.5 2"/>',
  approx: '<path d="M4 9.5c2.5-2.2 5.5-2.2 8 0s5.5 2.2 8 0"/><path d="M4 15.5c2.5-2.2 5.5-2.2 8 0s5.5 2.2 8 0"/>',
};
function icon(n, cls = '') { return `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[n] || ''}</svg>`; }
/* the Fitgems gem (screen_8) */
const GEM = '<svg class="ic gem" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.5 2.5 9.8 6 3.5h12l3.5 6.3z" style="fill:var(--gem)"/><path d="M2.5 9.8h19M9 3.5l3 6.3 3-6.3M12 21.5 9 9.8m3 11.7 3-11.7" stroke="#fff" stroke-opacity=".6" stroke-width="1" fill="none"/></svg>';
/* duotone tile icons, as on screen_1 */
const DUO = {
  assessment: '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="6" y="5" width="20" height="24" rx="4" style="fill:var(--duo-1)"/><rect x="11" y="2.5" width="10" height="5.5" rx="2" style="fill:var(--duo-2)"/><path d="M10.5 14.5l2 2 3-3M10.5 21.5l2 2 3-3" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5 15.5h3.5M18.5 22.5h3.5" style="stroke:var(--duo-2)" stroke-width="2.2" stroke-linecap="round"/></svg>',
  sessions: '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="2.5" y="8" width="21" height="15" rx="3" style="fill:var(--duo-1)"/><path d="M9 27.5h8M13 23v4.5" style="stroke:var(--duo-2)" stroke-width="2.6" stroke-linecap="round"/><rect x="17" y="3.5" width="9" height="8" rx="2" style="fill:var(--duo-2)"/><path d="M26 6.5l3.5-2.2v8.4L26 10.5z" style="fill:var(--duo-2)"/></svg>',
  reports: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M3 9.5a3 3 0 0 1 3-3h6l3 3h11a3 3 0 0 1 3 3V24a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z" style="fill:var(--duo-1)"/><path d="M3 15.5h26V24a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z" style="fill:var(--duo-2)"/><path d="M8.5 15.5c3-3.6 9-3.6 15 0" stroke="#fff" stroke-width="2" fill="none"/></svg>',
  plans: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="15" cy="17.5" r="11.5" style="fill:var(--duo-1)"/><circle cx="15" cy="17.5" r="6.5" fill="#fff"/><circle cx="15" cy="17.5" r="3.2" style="fill:var(--duo-2)"/><path d="M15 17.5 26.5 6" style="stroke:var(--duo-2)" stroke-width="2.6" stroke-linecap="round"/><path d="M22.5 4.5h5v5" style="stroke:var(--duo-2)" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  lab: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M11.5 3.5l6 3-5 10-6-3z" style="fill:var(--duo-2)"/><circle cx="14" cy="21" r="5.5" fill="none" style="stroke:var(--duo-1)" stroke-width="3"/><path d="M6 28.5h18" style="stroke:var(--duo-2)" stroke-width="3" stroke-linecap="round"/><path d="M19.5 14a8 8 0 0 1 2.5 11.5" style="stroke:var(--duo-1)" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',
};
/* the doodle pattern on the navy header (screen_1) */
const PATTERN = '<svg class="pattern" width="100%" height="100%" aria-hidden="true"><defs><pattern id="hp" width="96" height="96" patternUnits="userSpaceOnUse" patternTransform="rotate(-16)"><g fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M27 22c2-2 4-4.3 4-7.3A6.7 6.7 0 0 0 24.3 8c-2.1 0-3.6.6-5.3 2.3C17.3 8.6 15.8 8 13.7 8A6.7 6.7 0 0 0 7 14.7c0 3 2 5.3 4 7.3l8 8Z"/><path d="M58 60h14M54 55v10M76 55v10M51 57v6M79 57v6"/><circle cx="74" cy="22" r="8"/><path d="M74 14c1-4 4-5 6-5"/><path d="M14 66h12a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5H18l-4-5z"/></g></pattern></defs><rect width="100%" height="100%" fill="url(#hp)"/></svg>';
/* the light vegetable doodles behind the insights header (screen_8, screen_9) */
const VEG = '<svg class="vpat" width="100%" height="100%" aria-hidden="true"><defs><pattern id="vp" width="132" height="120" patternUnits="userSpaceOnUse" patternTransform="rotate(-10)"><g fill="none" style="stroke:var(--doodle)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M16 50 36 20c3-4 9-1 7 4L24 56z"/><path d="M38 18l4-8M40 20l7-4M36 16l-1-7"/><path d="M74 30c10-12 26-10 30-6-2 12-16 22-30 6z"/><path d="M74 30l22-4"/><path d="M18 92c10 10 30 12 40 0-14 4-26 2-36-6z"/><path d="M58 92c2-4 6-6 8-6"/><path d="M102 72c-10 6-12 22 0 28 12-6 10-22 0-28z"/><path d="M102 72v-8M98 100l-4 4M106 100l4 4"/></g></pattern></defs><rect width="100%" height="100%" fill="url(#vp)"/></svg>';
/* the green scalloped "saved" seal (screen_7) */
const SEAL = (() => {
  const pts = []; for (let i = 0; i < 24; i++) { const a = (Math.PI * 2 * i) / 24; const r = i % 2 ? 29 : 33; pts.push(`${(36 + r * Math.cos(a)).toFixed(1)},${(36 + r * Math.sin(a)).toFixed(1)}`); }
  return `<div class="seal"><svg viewBox="0 0 72 72" aria-hidden="true"><polygon points="${pts.join(' ')}" style="fill:var(--green);stroke:var(--green)" stroke-width="5" stroke-linejoin="round"/><path d="m24 37 8 8 16-17" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`;
})();
function photoHtml(key, cls = 'photo', extra = '', alt = '') { return `<div class="${cls}">${ART[key] ? `<img src="${ART[key]}" alt="${esc(alt)}" draggable="false">` : ''}${extra}</div>`; }

/* =====================================================================
   Tiny rendering framework: state -> HTML, with event delegation
   ===================================================================== */
const App = { state: null, screens: {}, actions: {}, last: null, dir: 'fwd', mem: {}, sheet: null, lastSheet: null, cfg: null, afterRender: [] };
let S = null;
function go(screen, dir = 'fwd') { App.sheet = null; S.screen = screen; App.dir = dir; render(); }
function openSheet(fn) { App.sheet = fn; render(); }
function closeSheet() { App.sheet = null; render(); }
function render() {
  const host = $('#screen');
  const same = App.last === S.screen;
  const oldBody = host.querySelector('.body');
  if (oldBody && App.last) App.mem[App.last] = oldBody.scrollTop;
  const sb = $('#overlay .sheet-body'); const sheetScroll = sb ? sb.scrollTop : 0;
  const ae = document.activeElement; const fk = ae && ae.closest && ae.closest('[data-fk]') ? ae.closest('[data-fk]').dataset.fk : null;
  host.innerHTML = App.screens[S.screen]();
  const scr = host.firstElementChild;
  if (!same && scr && !SHOTS) scr.classList.add(App.dir === 'back' ? 'enter-back' : 'enter-fwd');
  const nb = host.querySelector('.body');
  if (nb) nb.scrollTop = (same || App.dir === 'back') ? (App.mem[S.screen] || 0) : 0;
  const light = !!(scr && (scr.classList.contains('dark') || scr.dataset.status === 'light'));
  const sbEl = $('.statusbar'); if (sbEl) sbEl.classList.toggle('light', light);
  const hb = $('.homebar'); if (hb) hb.classList.toggle('light', !!(scr && scr.classList.contains('dark')) && !App.sheet);
  const t = $('#sbTime'); if (t) t.textContent = App.cfg.clock ? App.cfg.clock(S) : '12:45';
  const isNewSheet = App.sheet && App.sheet !== App.lastSheet;
  $('#overlay').innerHTML = App.sheet ? `<div class="scrim${isNewSheet && !SHOTS ? ' anim' : ''}" data-act="closeSheet"></div><div class="sheet${isNewSheet && !SHOTS ? ' anim' : ''}" role="dialog" aria-modal="true">${App.sheet()}</div>` : '';
  if (App.sheet && !isNewSheet) { const nsb = $('#overlay .sheet-body'); if (nsb) nsb.scrollTop = sheetScroll; }
  App.lastSheet = App.sheet; App.last = S.screen;
  if (fk) { const el = document.querySelector(`[data-fk="${fk}"]`); if (el) el.focus({ preventScroll: true }); }
  else if (isNewSheet) { const f = $('#overlay .sheet [data-autofocus]') || $('#overlay .sheet button'); if (f) f.focus({ preventScroll: true }); }
  App.afterRender.forEach(fn => fn());
}
/* timers that pause in screenshot mode */
let timers = [];
function later(fn, ms) { if (SHOTS) return null; const t = setTimeout(fn, ms); timers.push(t); return t; }
function every(fn, ms) { if (SHOTS) return null; const t = setInterval(fn, ms); timers.push(t); return t; }
function clearTimers() { timers.forEach(t => { clearTimeout(t); clearInterval(t); }); timers = []; }
/* toasts: bottom by default; a flow can place one at the top */
let toastTimer = null;
function toast(msg, opts = {}) {
  const host = $('#toast');
  host.innerHTML = `<div class="toast ${opts.cls || ''}" role="status"><span class="msg">${opts.html ? msg : esc(msg)}</span>${opts.label ? `<button type="button" class="tbtn" id="toastAct">${esc(opts.label)}</button>` : ''}${opts.close ? `<button type="button" class="iconbtn tclose" id="toastClose" aria-label="Close">${icon('x')}</button>` : ''}</div>`;
  const b = $('#toastAct'); if (b) b.onclick = () => { hideToast(); if (opts.fn) opts.fn(); };
  const c = $('#toastClose'); if (c) c.onclick = () => hideToast();
  clearTimeout(toastTimer); if (!SHOTS) toastTimer = setTimeout(hideToast, opts.ms || 5000);
}
function hideToast() { const t = $('#toast'); if (t) t.innerHTML = ''; }
function notInPrototype(what) { toast(`${what ? what + ' is' : 'That is'} not part of this prototype. Try logging your lunch with a photo.`); }

function bindEvents() {
  const phone = $('#phone');
  phone.addEventListener('click', e => {
    const el = e.target.closest('[data-act]'); if (!el || !phone.contains(el)) return;
    if (el.matches('[disabled],[aria-disabled="true"]')) { if (el.dataset.why) toast(el.dataset.why); return; }
    const fn = App.actions[el.dataset.act]; if (fn) { e.preventDefault(); fn(el.dataset, el, e); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && App.sheet) closeSheet(); });
}

/* =====================================================================
   Phone chrome: status bar, task panel, scaling
   ===================================================================== */
/* The same five tasks in every flow. */
const TASKS = [
  'You have just had lunch from a tub of biscuits: all the glucose biscuits, but only 10 of the cream crackers. Log this lunch with a photo of the tub.',
  'How did your lunch compare with your lunch target? Find one thing to do differently next time.',
  'Find out what Fitgems are.',
  'You now remember that you ate 12 cream crackers, not 10. Change your saved lunch.',
  'Start logging another meal with a photo, then stop before anything is saved.',
];
const DISCLAIMER = 'Nothing leaves this page and nothing is stored.';
function statusBarHtml() {
  return `<div class="statusbar" aria-hidden="true"><span id="sbTime">12:44</span><span class="island"></span><span class="sb-right"><svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor"/><rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="currentColor"/><rect x="10" y="3" width="3" height="9" rx="1" fill="currentColor"/><rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor"/></svg>5G<svg width="27" height="13" viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" opacity=".5"/><rect x="2.5" y="2.5" width="15" height="8" rx="2" fill="currentColor"/><rect x="24.5" y="4.5" width="2" height="4" rx="1" fill="currentColor" opacity=".5"/></svg></span></div>`;
}
function setupChrome(cfg) {
  document.title = cfg.title;
  const tasks = TASKS.map(t => `<li>${esc(t)}</li>`).join('');
  $('.about').innerHTML = `<h2>Try these tasks</h2><ol>${tasks}</ol><p class="note">${DISCLAIMER}</p>`;
  $('.proto-bar').innerHTML = `<span class="grow"></span><button type="button" id="pbTasks">Tasks</button><button type="button" id="pbHide" aria-label="Hide this bar">✕</button>`;
  $('#pbHide').onclick = () => $('.proto-bar').classList.add('hidden');
  $('#pbTasks').onclick = () => openSheet(() => `<div class="grab"></div>${sheetHead('Try these tasks')}<div class="sheet-body"><ol style="padding-left:22px;line-height:1.5;margin:0 0 12px;font-size:16px">${tasks}</ol><p class="small muted" style="line-height:1.45">${DISCLAIMER}</p></div><div class="sheet-foot"><button class="btn secondary" data-act="closeSheet">Close</button></div>`);
  const fit = () => {
    const wrap = $('.device-wrap'); const dev = $('.device');
    if (matchMedia('(max-width: 600px)').matches) { wrap.style.width = ''; wrap.style.height = ''; dev.style.transform = ''; return; }
    const W = dev.offsetWidth; const H = dev.offsetHeight;
    const s = Math.min(1, (innerHeight - 32) / H, (innerWidth - 32) / W);
    dev.style.transform = `scale(${s})`; wrap.style.width = `${W * s}px`; wrap.style.height = `${H * s}px`;
  };
  addEventListener('resize', fit); fit();
}

/* =====================================================================
   Shared screen parts
   ===================================================================== */
const sheetHead = (title, act = 'closeSheet', label = 'Close') => `<div class="sheet-head"><h2>${esc(title)}</h2><button class="iconbtn" data-act="${act}" aria-label="${esc(label)}">${icon('x')}</button></div>`;

/* ---- Home ---- */
function homeHeader(right = '') {
  return `<header class="navyhead">${PATTERN}<div class="hello"><div class="avatar" aria-hidden="true">${USER.initial}</div><div class="who"><b>Hi, ${USER.name}</b><span>Good to see you</span></div><div class="head-actions">${right}</div></div></header>`;
}
const chatBtn = () => `<button class="headbtn" data-act="nip" data-what="Chat with your coach" aria-label="Chat with your coach">${icon('chat')}</button>`;
function essentialsHtml() {
  return `<h2 class="essentials-h">My Program Essentials</h2><div class="tiles">${[['assessment', 'Assessment'], ['sessions', 'Sessions'], ['reports', 'Reports'], ['plans', 'Plans']].map(([k, l]) => `<button class="tile" data-act="nip" data-what="${l}"><span class="ti">${DUO[k]}</span><span>${l}</span></button>`).join('')}</div>
  <button class="labcard" data-act="nip" data-what="Lab Tests">${DUO.lab}<span>Lab Tests</span></button>`;
}
const segTabsHtml = () => `<div class="segtabs" role="tablist"><button class="segtab" role="tab" aria-selected="false" data-act="nip" data-what="Today’s Tasks">${icon('calcheck')}Today’s Tasks</button><button class="segtab on" role="tab" aria-selected="true">${icon('chart')}Daily Insights</button></div>`;
function trackersHtml() {
  return `<div class="trackers">
    <section class="tracker"><h3>Activity</h3><button class="btn small secondary" data-act="nip" data-what="Pairing a device">Pair Device</button></section>
    <section class="tracker"><h3>Water</h3><div class="tv">${icon('glass')}<span><b>${S.water}</b>/12 glasses</span></div><div class="stepper sm"><button class="step-btn" data-act="water" data-d="-1" aria-label="One glass less" ${S.water <= 0 ? 'disabled' : ''}>${icon('minus')}</button><button class="step-btn" data-act="water" data-d="1" aria-label="One glass more">${icon('plus')}</button></div></section>
  </div>`;
}
const loggedMeals = () => S.meals.slice().sort((a, b) => MEALS.findIndex(m => m.key === a.meal) - MEALS.findIndex(m => m.key === b.meal));
function mealSummary(m) { return counted(m.items).map(i => foodName(i)).join(', '); }
/* today's meals, logged ones first in meal order, then the main meals still to log */
function mealRowsHtml(opts = {}) {
  const logged = loggedMeals();
  const rows = logged.map(m => `<button class="mealrow" data-act="${opts.act || 'openMeal'}" data-id="${m.id}">${photoHtml(m.photo, 'thumb')}<span class="grow"><span class="t">${esc(mealName(m.meal))}</span><span class="s">${esc(m.time)} · ${esc(mealSummary(m))}</span></span><span class="kc num">${r0(totals(m.items).kcal)} kcal</span>${icon('chevR', 'chev')}</button>`);
  ['lunch', 'esnack', 'dinner'].filter(k => !logged.some(m => m.meal === k)).forEach(k => rows.push(`<div class="mealrow todo"><span class="ph" aria-hidden="true">${icon('plate')}</span><span class="grow"><span class="t">${esc(mealName(k))}</span><span class="s">Not logged yet</span></span></div>`));
  return rows.join('');
}
function dayKcal() { return r0(S.meals.reduce((a, m) => a + totals(m.items).kcal, 0)); }
function tabBarHtml(centre) {
  const tabs = [['home', 'Home', 'home'], ['programs', 'Programs', 'clipboard']];
  if (centre) tabs.push(['centre', centre.label, centre.icon]);
  tabs.push(['academy', 'Academy', 'book'], ['store', 'Store', 'cart']);
  return `<nav class="tabbar" aria-label="Main">${tabs.map(([k, l, ic]) => {
    if (k === 'centre' && centre.raised) return `<button class="tab raised" data-act="${centre.act}"><span class="fab">${icon(ic)}</span><span>${esc(l)}</span></button>`;
    if (k === 'centre') return `<button class="tab" data-act="${centre.act}">${icon(ic)}<span>${esc(l)}</span></button>`;
    return `<button class="tab ${k === 'home' ? 'on' : ''}" ${k === 'home' ? 'aria-current="page"' : `data-act="nip" data-what="${l}"`}>${icon(ic)}<span>${l}</span></button>`;
  }).join('')}</nav>`;
}

/* ---- Camera ---- */
function viewfinderHtml(extra = '') {
  return `<div class="viewfinder"><img class="vf-bg" src="${ART.tub}" alt="" aria-hidden="true" draggable="false"><img class="vf-img" src="${ART.tub}" alt="Camera view: a clear tub of biscuits, from above" draggable="false"><div class="vf-mask"></div><div class="vf-circle"></div><div class="vf-corners"><i></i><i></i><i></i><i></i></div>${extra}</div>`;
}
const galleryBtn = (label = 'Your photos') => `<button class="galbtn" data-act="gallery"><span class="gthumb"><img src="${ART.tub}" alt=""></span><span>${esc(label)}</span></button>`;
const shutterBtn = () => `<button class="shutter" data-act="shoot" aria-label="Take photo"><i></i></button>`;
/* examples for photo tips */
const EXAMPLES = {
  good: { img: 'plate', cls: '', mark: 'good', title: 'One plate, from above', text: 'Only the food you will eat, in good light' },
  blurry: { img: 'plate', cls: 'blur', mark: 'bad', title: 'Blurry or dark', text: 'We may miss foods or count them wrong' },
  cut: { img: 'plate', cls: 'cut', mark: 'bad', title: 'Food cut off or at an angle', text: 'We cannot see how much there is' },
};
function exampleHtml(k) {
  const e = EXAMPLES[k];
  return `<div class="ex"><span class="ex-img ${e.cls}"><img src="${ART[e.img]}" alt=""><span class="ex-mark ${e.mark}">${icon(e.mark === 'good' ? 'check' : 'x')}</span></span><span class="ex-text"><b>${e.mark === 'good' ? 'Good: ' : 'Avoid: '}${esc(e.title)}</b><span>${esc(e.text)}</span></span></div>`;
}
function tipsSheet(keys) {
  return () => `<div class="grab"></div>${sheetHead('Photo tips')}<div class="sheet-body"><div style="display:grid;gap:16px">${keys.map(exampleHtml).join('')}</div></div><div class="sheet-foot"><button class="btn secondary" data-act="closeSheet">Close</button></div>`;
}
function gallerySheet(title = 'Your photos') {
  const items = [['tub', 'Today, 12:45 PM', true], ['chai', 'Today, 8:30 AM', false], ['plate', 'Yesterday, 1:10 PM', false]];
  return () => `<div class="grab"></div>${sheetHead(title)}<div class="sheet-body"><div class="gallery">${items.map(([k, t, ok]) => `<button class="gitem ${ok ? '' : 'off'}" data-act="${ok ? 'pickPhoto' : 'pickOther'}"><span class="gimg"><img src="${ART[k]}" alt=""></span><span>${esc(t)}</span></button>`).join('')}</div><p class="small muted" style="margin:14px 0 0;line-height:1.45">In this prototype only today’s 12:45 PM photo can be logged.</p></div><div class="sheet-foot"><button class="btn secondary" data-act="closeSheet">Cancel</button></div>`;
}

/* ---- steppers, score, bars ---- */
function stepperHtml(it, size = '', label = true) {
  const fd = FOODS[it.food];
  return `<div class="stepper ${size}" role="group" aria-label="${esc(foodName(it))}: how many"><button class="step-btn" data-act="qty" data-id="${it.id}" data-d="-1" aria-label="One ${fd.unit} less" ${it.qty <= 0 ? 'disabled' : ''}>${icon('minus')}</button><span class="step-val" data-fk="v-${it.id}"><b class="num">${it.qty}</b>${label ? `<span>${unitWord(fd, it.qty)}</span>` : ''}</span><button class="step-btn" data-act="qty" data-id="${it.id}" data-d="1" aria-label="One ${fd.unit} more">${icon('plus')}</button></div>`;
}
function scoreHtml(sc, opts = {}) {
  const segs = Array.from({ length: 10 }, (_, i) => `<i class="${i < sc.score ? 'f' : ''}"></i>`).join('');
  return `<section class="scorebox" aria-label="Food score ${sc.score} out of 10">
    <div class="score-top"><div><span class="lbl">${esc(opts.title || 'Food score')}</span>${opts.why === false ? '' : `<span class="why">${esc(opts.whyText || sc.reason)}</span>`}</div><div class="score-num"><b>${sc.score}</b><span>/10</span></div></div>
    <div class="segs" aria-hidden="true">${segs}</div><div class="scale" aria-hidden="true"><span>0</span><span>10</span></div>
  </section>`;
}
const fmtN = (v, unit) => unit === 'kcal' ? `${r0(v)}` : `${r0(v)}`;
function statusHtml(r, mode) {
  if (r.status === 'over') return `<span class="nstat over">${icon('up')}${esc(mode === 'act' && r.act ? r.act : r.key === 'kcal' ? 'Over target' : `Over target`)}</span>`;
  if (r.status === 'under') return `<span class="nstat under">${icon('down')}${esc(mode === 'act' && r.act ? r.act : 'Under target')}</span>`;
  return `<span class="nstat within">Within target</span>`;
}
/* One nutrient bar. The bar's full width is 1.6 x the target, so a fill can run past the
   marked target line; anything beyond that is drawn to the edge. */
function barHtml(r, opts = {}) {
  const max = Math.max(r.target * 1.6, (opts.hi ?? r.val) * 1.02);
  const pos = v => `${clamp(v / max * 100, 0, 100).toFixed(1)}%`;
  const tl = r.target / max * 100;
  const range = opts.lo != null ? `<span class="range ${r.status}" style="left:${pos(opts.lo)};width:calc(${pos(opts.hi)} - ${pos(opts.lo)})"></span>` : '';
  const tlabel = opts.tlabel || `Target ${r.target}${r.unit === 'kcal' ? ' kcal' : ' g'}`;
  return `<div class="nbar-wrap"><span class="tlabel ${tl > 70 ? 'end' : ''}" style="left:${tl > 70 ? `calc(${tl.toFixed(1)}% + 2px)` : `${tl.toFixed(1)}%`}">${esc(tlabel)}</span><div class="nbar" role="img" aria-label="${esc(r.label)}: ${r0(r.val)} of ${r.target} ${r.unit}">${range}<span class="fill ${r.status}" style="width:${pos(r.val)}"></span><span class="tline" style="left:${tl.toFixed(1)}%"></span></div></div>`;
}

/* ---- shared sheets ---- */
function mealPickerSheet(current) {
  return () => `<div class="grab"></div>${sheetHead('Which meal is this?')}<div class="sheet-body"><div class="rows">${MEALS.map(m => `<button class="row ${m.key === current ? 'on' : ''}" data-act="pickMeal" data-k="${m.key}" aria-pressed="${m.key === current}"><span class="radio"></span><span class="grow"><span class="t">${esc(m.name)}</span><span class="s">${esc(m.range)}</span></span></button>`).join('')}</div></div><div class="sheet-foot"><button class="btn secondary" data-act="closeSheet">Cancel</button></div>`;
}
function addFoodSheet() {
  return () => `<div class="grab"></div>${sheetHead('Add a food')}<div class="sheet-body"><p class="small muted" style="margin:0 0 12px">Foods you often add to lunch</p><div class="rows">${ADDABLE.map(k => { const fd = FOODS[k]; return `<button class="row" data-act="addFood" data-k="${k}"><span class="grow"><span class="t">${esc(fd.name)}</span><span class="s">1 ${esc(fd.unit)} (${fd.g} ${fd.gu || 'g'}) · ${fd.kcal} kcal</span></span><span class="addpill">${icon('plus')}Add</span></button>`; }).join('')}</div></div><div class="sheet-foot"><button class="btn secondary" data-act="closeSheet">Cancel</button></div>`;
}
function fitgemsSheet() {
  return () => `<div class="grab"></div>${sheetHead('What are Fitgems?')}<div class="sheet-body"><div style="display:flex;gap:14px;align-items:flex-start"><span style="flex:none;width:48px;height:48px;border-radius:14px;background:#FDEBF4;display:grid;place-items:center">${GEM.replace('class="ic gem"', 'class="ic gem" style="width:30px;height:30px"')}</span><p class="p" style="margin:0">Fitgems are reward points. You get them for healthy habits, such as logging a meal or finishing a session. You got ${FITGEMS} for logging this ${S.draft ? mealLower(S.draft.meal) : 'lunch'}.</p></div></div><div class="sheet-foot"><button class="btn secondary" data-act="closeSheet">Close</button></div>`;
}
function rebrandSheet() {
  return () => `<div class="grab"></div>${sheetHead('Fitterfly is now PB Health')}<div class="sheet-body"><p class="p" style="margin:0 0 8px">Your progress is saved. You can keep using this app as before.</p></div><div class="sheet-foot"><button class="btn secondary" data-act="closeSheet">Close</button></div>`;
}
function discardSheet(editing = false) {
  const title = editing ? 'Stop changing this meal?' : 'Stop logging?';
  const text = editing ? 'Your saved meal stays as it was.' : 'Nothing has been saved. Your photo stays in your phone’s photos.';
  return () => `<div class="grab"></div>${sheetHead(title)}<div class="sheet-body"><p class="p" style="margin:0 0 6px">${text}</p></div><div class="sheet-foot btnrow"><button class="btn secondary" data-act="closeSheet" data-autofocus>Keep going</button><button class="btn" data-act="discardYes">Stop</button></div>`;
}
/* "Cream crackers / 14 pieces (about 84 g) ... 350 kcal" */
function logListHtml(items, approx = 'about ') {
  return `<ul class="loglist">${counted(items).map(i => `<li><span class="nm"><b>${esc(foodName(i))}</b><span>${esc(amountLine(i, approx))}</span></span><span class="kc num">${kcalOf(i)} kcal</span></li>`).join('')}</ul>`;
}

/* ---- draft and saving (shared model) ---- */
function newDraft() { return { id: uid('m'), meal: 'lunch', time: PHOTO_TIME, photo: 'tub', items: detectedItems(), editing: false, saved: false }; }
function draftFromMeal(m) { const d = clone(m.draft); d.editing = true; d.saved = false; return d; }
function saveDraft() {
  const d = S.draft;
  S.undo = { meals: clone(S.meals), draft: clone(d) };
  const m = { id: d.id, meal: d.meal, time: d.time, photo: d.photo, items: clone(counted(d.items)), draft: clone(d) };
  S.meals = S.meals.filter(x => x.id !== d.id).concat(m);
  d.saved = true; S.savedId = m.id;
  return m;
}
function undoSave() { if (!S.undo) return; S.meals = S.undo.meals; S.draft = S.undo.draft; S.draft.saved = false; S.undo = null; }
const savedMeal = () => S.meals.find(m => m.id === S.savedId) || null;
const draftItem = id => S.draft.items.find(i => i.id === id);

/* ---- shared actions ---- */
function sharedActions(A) {
  A.closeSheet = () => closeSheet();
  A.nip = d => notInPrototype(d.what);
  A.water = d => { S.water = clamp(S.water + Number(d.d), 0, 12); render(); };
  A.rebrand = () => openSheet(rebrandSheet());
  A.fitgems = () => { hideToast(); openSheet(fitgemsSheet()); };
  A.gallery = () => openSheet(gallerySheet(App.cfg.galleryTitle));
  A.pickOther = () => toast('In this prototype, use today’s 12:45 PM photo of the biscuit tub.');
  A.changeMeal = () => openSheet(mealPickerSheet(S.draft.meal));
  A.pickMeal = d => { S.draft.meal = d.k; closeSheet(); toast(`Meal changed to ${mealLower(d.k)}.`); };
  A.addFoodOpen = () => openSheet(addFoodSheet());
  A.addFood = d => {
    const ex = S.draft.items.find(i => i.food === d.k);
    if (ex) ex.qty += 1; else S.draft.items.push({ id: uid(), n: S.draft.items.length + 1, food: d.k, qty: 1, det: 0, conf: 'added', alts: [], touched: true, added: true });
    closeSheet(); toast(`Added 1 ${FOODS[d.k].unit} of ${FOODS[d.k].name.toLowerCase()}.`);
  };
}

/* ---- boot ---- */
function boot(cfg) {
  App.cfg = cfg;
  S = Object.assign({ screen: 'home', meals: [clone(BREAKFAST)], draft: null, water: 4, savedId: null, undo: null }, cfg.state ? cfg.state() : {});
  App.state = S;
  $('#sb').outerHTML = statusBarHtml();
  sharedActions(App.actions);
  cfg.actions(App.actions);
  Object.assign(App.screens, cfg.screens);
  bindEvents();
  setupChrome(cfg);
  if (SHOTS) document.body.classList.add('no-anim');
  render();
  /* hooks for tools/take_screenshots.py */
  window.PROTO = { App, get S() { return S; }, go, render, act: (n, d = {}) => App.actions[n](d, null, null), closeSheet, hideToast };
}
