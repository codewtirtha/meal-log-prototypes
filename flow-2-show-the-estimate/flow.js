'use strict';
/* =====================================================================
   Flow 2: Show the estimate
   The app shows what it detected, what it assumed and how sure it is.
   Nothing is hidden: outlines on the photo, grams for every count, a
   "Sure" or "Check this" tag on each food, ranges instead of single
   numbers on the insights.

   Screen map (brief):
   1 Home top ........ "Last meal" strip + filled "Log a meal", "Now PB Health"
                        header badge, centre tab "Log a meal" (one name for one action)
   2 Home scrolled ... no blue banner; Meal card uses the same "Log a meal"
   3 Method sheet .... Photo / Search / Talk with accuracy notes, "Cancel"
   4 Camera .......... live outlines "will be counted", "Photo tips" chip
   5 Analysing ....... labelled stages, foods appear as found, "Stop"
   6 Review .......... numbered outlines, "Sure" / "Check this", alternatives
   7 Saved ........... "Meal saved", score 4 on a 0-10 scale, "Mostly refined flour",
                        Undo for 10 s
   8 Insights ........ verdict labelled "Estimate", "About 450-540 kcal", "Check foods"
   9 Insights ........ nutrient ranges with "Eat less carbs", "Eat more protein"
                        (the same action labels as Flow 1), "What we assumed"
   (Fitgems were removed from all three flows.)
   ===================================================================== */

/* 10 s analysis, as in Flows 1 and 3: 0-3.75 s finding foods, 3.75-7.5 s estimating portions,
   7.5-10 s calculating nutrients */
const STAGES = [{ until: 3.75, label: 'Finding foods' }, { until: 7.5, label: 'Estimating portions' }, { until: 10, label: 'Calculating nutrients' }];
const TOTAL = 10;
const FOUND_AT = [1.25, 2.75, 3.5];   /* when foods 1, 2 (and 3, on yesterday's plate) appear */
const COUNT_AT = [5.0, 6.25, 7.0];    /* when their amounts appear */
const KCAL_AT = 8.75;

/* outlines in each photo's own pixels: the tub is 596 x 474, the plate 600 x 480; x, y = centre */
const TUB = { pw: 596, ph: 474 }; const PLATE = { pw: 600, ph: 480 };
const OUTLINES = {
  cracker: Object.assign({ x: 350, y: 300, w: 150, h: 165, rot: -25, round: false }, TUB),
  round: Object.assign({ x: 349, y: 139, w: 146, h: 146, rot: 0, round: true }, TUB),
  cracker2: Object.assign({ x: 196, y: 204, w: 128, h: 170, rot: -27, round: false }, TUB),
  rice: Object.assign({ x: 200, y: 272, w: 204, h: 204, rot: 0, round: true }, PLATE),
  dal: Object.assign({ x: 392, y: 165, w: 152, h: 152, rot: 0, round: true }, PLATE),
  sabzi: Object.assign({ x: 382, y: 342, w: 150, h: 150, rot: 0, round: true }, PLATE),
};
function olHtml(o, n, label, cls = '', below = false) {
  const s = `left:${((o.x - o.w / 2) / o.pw * 100).toFixed(2)}%;top:${((o.y - o.h / 2) / o.ph * 100).toFixed(2)}%;width:${(o.w / o.pw * 100).toFixed(2)}%;height:${(o.h / o.ph * 100).toFixed(2)}%;transform:rotate(${o.rot}deg)`;
  return `<span class="ol ${o.round ? 'round' : ''} ${cls}" style="${s}">${n ? `<span class="n" style="transform:rotate(${-o.rot}deg)">${n}</span>` : ''}${label ? `<span class="lab${below ? ' below' : ''}" style="transform:translateX(-50%) rotate(${-o.rot}deg)">${esc(label)}</span>` : ''}</span>`;
}
/* a "will be counted" label, unrotated, centred on a point of the photo */
const labHtml = (x, y, text) => `<span class="ol-lab" style="left:${(x / 596 * 100).toFixed(2)}%;top:${(y / 474 * 100).toFixed(2)}%">${esc(text)}</span>`;
/* the food's outline on the review photo (each detected food keeps its own) */
const olFor = it => OUTLINES[it.ol] || (FOODS[it.food].crop === 'round' ? OUTLINES.round : OUTLINES.cracker);
/* "14 pieces (~84 g)" for pieces, "about 200 g" for food weighed in grams */
const amountShort = it => (byWeight(it) ? `about ${it.qty} g` : `${qtyText(it)} (~${gramsOf(it)} ${FOODS[it.food].gu || 'g'})`);

/* ---------- 1-2 Home ---------- */
const screens = {};
function lastMealHtml() {
  const m = S.meals[S.meals.length - 1];   /* the most recently saved meal */
  return `<button class="f2-last" data-act="openMeal" data-id="${m.id}">${photoHtml(m.photo, 'thumb', '', '')}<span class="grow"><span class="k">Last meal</span><span class="t">${esc(mealName(m.meal))}, ${esc((m.day || DAY_LABEL) === DAY_LABEL ? m.time : whenText(m))}</span><span class="s">${esc(mealSummary(m))} · ${r0(totals(m.items).kcal)} kcal</span></span>${icon('chevR', 'chev')}</button>`;
}
const logBtn = () => `<button class="btn f2-logbtn" data-act="openLog">${icon('plusSq')}Log a meal</button>`;
screens.home = () => `<section class="screen" data-status="light">
  <div class="sbfill"></div>
  <div class="body">
    <header class="navyhead">${PATTERN}<div class="hello"><div class="avatar" aria-hidden="true">${USER.initial}</div><div class="who"><b>Hi, ${USER.name}</b><span>Good to see you</span></div><div class="head-actions">${chatBtn()}</div></div>
      <button class="f2-badge" data-act="rebrand"><span class="pb">${icon('sparkle')}</span>Now PB Health</button></header>
    <div class="f2-top">${lastMealHtml()}${logBtn()}</div>
    <div class="home-sec">${essentialsHtml()}</div>
    <div class="home-grey">
      ${segTabsHtml()}
      <section class="hcard" id="mealCard" aria-labelledby="mealH">
        <div class="hcard-h"><h3 id="mealH">Meal</h3><span class="kc"><b class="num">${dayKcal()}</b> kcal today</span></div>
        <div style="margin-top:6px">${mealRowsHtml()}</div>
        ${logBtn()}
      </section>
      ${trackersHtml()}
    </div>
  </div>
  ${tabBarHtml({ label: 'Log a meal', icon: 'plusSq', act: 'openLog' })}
</section>`;

/* ---------- 3 Method sheet ---------- */
function methodSheet() {
  const rows = [
    ['photo', 'camera', 'Photo', 'Good for single dishes; less sure for mixed platters'],
    ['search', 'search', 'Search', 'Most exact for packaged food: you pick the brand and amount'],
    ['talk', 'mic', 'Talk', 'Good when you can say what you ate and how much'],
  ];
  return () => `<div class="grab"></div><div class="sheet-head"><h2>How do you want to log?</h2></div><div class="sheet-body"><div class="f2-methods">${rows.map(([k, ic, l, h]) => `<button class="f2-method" data-act="method" data-m="${k}"><span class="mi">${icon(ic)}</span><span class="ml"><b>${l}</b><span>${h}</span></span>${icon('chevR', 'chev')}</button>`).join('')}</div></div><div class="sheet-foot"><button class="btn secondary" data-act="closeSheet">Cancel</button></div>`;
}

/* ---------- 4 Camera ---------- */
screens.camera = () => `<section class="screen dark cam" data-status="light">
  <div class="viewfinder"><img class="vf-bg" src="${ART.tub}" alt="" aria-hidden="true" draggable="false"><img class="vf-img" src="${ART.tub}" alt="Camera view: a clear tub of biscuits, from above" draggable="false">
    <div class="vf-mask"></div>
    <div class="vf-ol" aria-hidden="true">${olHtml(OUTLINES.round, 0, '')}${olHtml(OUTLINES.cracker, 0, '')}${olHtml(OUTLINES.cracker2, 0, '')}${labHtml(349, 139, 'will be counted')}${labHtml(352, 302, 'will be counted')}</div>
    <div class="vf-circle"></div><div class="vf-corners"><i></i><i></i><i></i><i></i></div></div>
  <header class="camtop"><button class="iconbtn" data-act="closeCamera" aria-label="Close the camera">${icon('x')}</button><span class="camtitle">Photo</span><span class="iconbtn ghost"></span></header>
  <p class="caption">We identify each food and estimate its amount</p>
  <p class="sr-only">Outlined foods will be counted.</p>
  <div class="camfoot">
    <div class="f2-camtools"><button class="camchip" data-act="tips">${icon('bulb')}Photo tips</button></div>
    <div class="camctl">${galleryBtn('Your photos')}${shutterBtn()}<span class="galbtn ghost"></span></div>
  </div>
</section>`;

/* ---------- 5 Analysing ---------- */
const anEl = () => (S.an ? S.an.el : 0);
const stageIdx = el => { const i = STAGES.findIndex(s => el < s.until); return i === -1 ? STAGES.length - 1 : i; };
function stagesHtml() {
  const i = stageIdx(anEl());
  return STAGES.map((s, k) => `<li class="${k < i ? 'done' : k === i ? 'now' : ''}">${k < i ? `<span class="okdot">${icon('check')}</span>` : k === i ? '<span class="spinner"></span>' : '<span class="pend"></span>'}${s.label}${k === i ? '…' : ''}</li>`).join('');
}
const detected = () => PHOTOS[curPhoto().key].detect;
function foundHtml() {
  const el = anEl();
  return detected().map((d, k) => {
    if (el < FOUND_AT[k]) return '';
    const it = { food: d.food, qty: d.qty }; const wt = byWeight(it);
    const am = el >= KCAL_AT ? `${wt ? `about ${it.qty} g` : qtyText(it)} · ${kcalOf(it)} kcal` : el >= COUNT_AT[k] ? amountShort(it) : (wt ? 'estimating…' : 'counting…');
    return `<div class="f2-frow"><span class="nb">${k + 1}</span><span class="grow">${esc(FOODS[d.food].name)}</span><span class="am">${esc(am)}</span></div>`;
  }).join('');
}
function scanOutlines() {
  const el = anEl();
  return detected().map((d, k) => (el >= FOUND_AT[k] ? olHtml(OUTLINES[d.ol], k + 1, '', 'pop') : '')).join('');
}
screens.analysing = () => `<section class="screen">
  <header class="topbar"><span class="iconbtn ghost"></span><span class="title center">Reading your photo</span><span class="iconbtn ghost"></span></header>
  <div class="body pad" style="padding-top:16px;padding-bottom:16px">
    <div class="scanph">${photoHtml(curPhoto().key, 'photo', `<span class="ol-layer" id="anOl">${scanOutlines()}</span><span class="scanline"></span>`, photoAlt(curPhoto().key))}</div>
    <ul class="f2-stages" id="anStages" aria-live="polite">${stagesHtml()}</ul>
    <div class="f2-found" id="anFound">${foundHtml()}</div>
  </div>
  <div class="footer"><button class="btn secondary" data-act="stop">${icon('stop')}Stop</button></div>
</section>`;

/* ---------- 6 Review ---------- */
function tagHtml(it) {
  if (it.added) return `<span class="tag mine">${icon('plus')}Added</span>`;
  if (it.conf === 'sure') return `<span class="tag sure">${icon('check')}Sure</span>`;
  if (it.conf === 'check') return `<span class="tag check">${icon('help')}Check this</span>`;
  return `<span class="tag est">${icon('check')}Checked</span>`;
}
function rowHtml(it) {
  const alts = it.alts && it.alts.length && !it.added ? [it.detFood, ...it.alts].filter(k => k !== it.food) : [];
  const showAlts = alts.length && (it.conf === 'check' || it.food !== it.detFood);
  return `<section class="gcard f2-row" aria-label="${esc(foodName(it))}">
    <div class="f2-rtop">${it.added ? `<span class="nb" style="background:var(--muted)">+</span>` : `<span class="nb">${it.n}</span>`}<span class="grow"><span class="nm">${esc(foodName(it))}</span><span class="am">${it.qty ? esc(amountShort(it)) : 'Not counted'}</span></span>${tagHtml(it)}</div>
    <div class="f2-rctl">${stepperHtml(it, 'sm')}<span class="kc num">${kcalOf(it)} kcal</span></div>
    ${showAlts ? `<div class="f2-alts"><span class="lbl">Or is it:</span><div class="chips">${alts.map(k => `<button class="chip" data-act="swap" data-id="${it.id}" data-k="${k}">${esc(FOODS[k].name)}</button>`).join('')}</div></div>` : ''}
  </section>`;
}
screens.review = () => {
  const d = S.draft; const t = totals(d.items);
  const marks = d.items.filter(i => !i.added && i.qty > 0).map(i => olHtml(olFor(i), i.n, '')).join('');
  return `<section class="screen">
    <header class="topbar"><button class="iconbtn" data-act="discard" aria-label="${d.editing ? 'Stop changing this meal' : 'Stop logging'}">${icon('x')}</button><span class="title">${d.editing ? 'Change your meal' : 'Your meal'}<small>${esc(whenText(d))}</small></span></header>
    <div class="body pad" style="padding-top:16px;padding-bottom:16px">
      ${photoHtml(d.photo, 'photo', `<span class="ol-layer">${marks}</span>`, 'Your photo with numbered outlines on each food')}
      <div class="f2-mealbar"><button class="chip meal" data-act="changeMeal">${icon('clock')}<b>${esc(mealName(d.meal))}</b>${icon('chevD')}</button><span class="small muted">Estimated from your photo</span></div>
      <div id="rows">${d.items.map(rowHtml).join('')}</div>
      <button class="f2-add" data-act="addFoodOpen">${icon('plus')}Add food</button>
      <div class="f2-total"><span>Total</span><span>about <b class="num" id="tot">${r0(t.kcal)}</b> kcal</span></div>
    </div>
    <div class="footer"><button class="btn" data-act="save">${d.editing ? 'Save changes' : 'Save meal'}</button></div>
  </section>`;
};

/* ---------- 7 Saved: a sheet over the review ---------- */
function savedSheet() {
  return () => {
    const m = savedMeal(); const sc = foodScore(m.items, m.meal);
    return `<div class="grab"></div><div class="sheet-head"><h2 class="sr-only">Saved</h2><span style="flex:1"></span><button class="iconbtn" data-act="savedClose" aria-label="Close">${icon('x')}</button></div>
    <div class="sheet-body f2-saved">${SEAL}<h1>${S.savedEdit ? 'Changes saved' : 'Meal saved'}</h1>${scoreHtml(sc)}</div>
    <div class="sheet-foot"><div class="btnrow" style="margin-bottom:10px">${S.undo && S.undoLeft > 0 ? `<button class="btn secondary small" data-act="undo">${icon('undo')}<span>${undoLabel()}</span></button>` : ''}<button class="btn secondary small" data-act="edit">${icon('pencil')}Edit</button></div><button class="btn" data-act="seeInsights">See insights</button></div>`;
  };
}

/* ---------- 8-9 Insights ---------- */
function rangeText(lo, hi, unit) { const a = r0(lo), b = r0(hi); return a === b ? `about ${a} ${unit}` : `about ${a}–${b} ${unit}`; }
screens.insights = () => {
  const m = savedMeal(); const items = m.items; const sc = foodScore(items, m.meal); const rows = nutrientRows(items, m.meal); const R = rowsByKey(rows); const v = kcalVerdict(items, m.meal);
  const [klo, khi] = rangeOf(items, 'kcal');
  return `<section class="screen">
    <div class="inshead">${VEG}<div class="bar"><button class="iconbtn" data-act="insBack" aria-label="Back to Home">${icon('chevL')}</button><span class="title">Meal insights</span></div></div>
    <div class="body" style="padding-bottom:calc(var(--hb) + 12px)">
      <div class="meal-id">${photoHtml(m.photo, 'thumb', '', 'Your meal photo')}<div><b>${esc(mealName(m.meal))}</b><span>${esc(whenText(m))}</span><span class="f2-scorepill">Food score&nbsp;<b>${sc.score}</b>/10</span></div></div>
      <div class="pad">
        <section class="gcard f2-verdict" id="verdict" aria-labelledby="vH">
          <div class="f2-vtop"><span class="tag est">${icon('approx')}Estimate</span><button class="btn secondary small auto" data-act="checkFoods">Check foods</button></div>
          <h2 class="f2-vhead" id="vH">${esc(v.head)}</h2>
          <p class="f2-vline">${esc(v.line)}</p>
          ${barHtml(R.kcal, { lo: klo, hi: khi })}
          ${statusHtml(Object.assign({}, R.kcal, { status: v.status }), 'status')}
        </section>
        <section class="gcard f2-nutr" id="nutr" aria-labelledby="nH"><h3 class="h3" id="nH">Nutrients (estimates)</h3><div class="nlist">${['carbs', 'protein', 'fat', 'fibre'].map(key => { const r = R[key]; const [lo, hi] = rangeOf(items, key); return `<div><div class="nrow-top"><span class="nl">${r.label}</span><span class="nv">${esc(rangeText(lo, hi, 'g'))} <span class="muted">of ${r.target} g</span></span></div>${barHtml(r, { lo, hi })}${statusHtml(r, 'act')}</div>`; }).join('')}</div></section>
        <section class="gcard f2-assume" aria-labelledby="aH"><h3 class="h3" id="aH">What we assumed</h3><ul class="loglist">${items.map(i => `<li><span class="nm"><b>${esc(foodName(i))}</b><span>${esc(byWeight(i) ? `about ${i.qty} g` : `${qtyText(i)}, about ${FOODS[i.food].g} ${FOODS[i.food].gu || 'g'} each`)}</span></span>${tagHtml(i)}</li>`).join('')}</ul></section>
      </div>
    </div>
  </section>`;
};

/* ---------- actions ---------- */
function startAnalysis() {
  clearTimers(); App.sheet = null; S.an = { t0: Date.now(), el: 0 }; go('analysing');
  every(() => {
    S.an.el = (Date.now() - S.an.t0) / 1000;
    if (S.an.el >= TOTAL) { App.actions.finishAnalysis(); return; }
    const st = $('#anStages'); if (st) st.innerHTML = stagesHtml();
    const f = $('#anFound'); if (f && f.dataset.k !== foundKey()) { f.innerHTML = foundHtml(); f.dataset.k = foundKey(); }
    const o = $('#anOl'); if (o && o.dataset.k !== olKey()) { o.innerHTML = scanOutlines(); o.dataset.k = olKey(); }
  }, 150);
}
const foundKey = () => { const el = anEl(); return [FOUND_AT, COUNT_AT].map(a => a.filter(t => el >= t).length).join('-') + (el >= KCAL_AT ? 'k' : ''); };
const olKey = () => String(FOUND_AT.filter(t => anEl() >= t).length);
function bumpValue(id) { const b = document.querySelector(`[data-fk="v-${id}"] b`); if (b) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); } }

const actions = A => {
  A.openLog = () => openSheet(methodSheet());
  A.method = d => { if (d.m === 'photo') { App.sheet = null; go('camera'); } else notInPrototype(d.m === 'search' ? 'Search' : 'Talk'); };
  A.openMeal = d => {
    const m = S.meals.find(x => x.id === d.id);
    if (!m || !m.draft) { toast('In this prototype, only the meal you log by photo can be opened.'); return; }
    S.savedId = m.id; go('insights');
  };
  A.tips = () => openSheet(tipsSheet(TIP_KEYS));
  A.closeCamera = () => go('home', 'back');
  A.shoot = () => { useCamera(); startAnalysis(); };
  A.pickPhoto = d => { usePhoto(d.k || 'tub'); startAnalysis(); };
  A.stop = () => { clearTimers(); S.an = null; go('camera', 'back'); toast('Stopped. Your photo was not saved.'); };
  A.finishAnalysis = () => { clearTimers(); S.an = null; S.draft = newDraft(); go('review'); };
  A.qty = d => {
    const it = draftItem(d.id); stepQty(it, d.d); it.touched = true;
    if (!it.added && it.conf === 'check') it.conf = 'checked';
    render(); bumpValue(d.id);
  };
  A.swap = d => { const it = draftItem(d.id); it.food = d.k; it.touched = true; if (!it.added) it.conf = 'checked'; render(); toast(`Changed to ${FOODS[d.k].name.toLowerCase()}.`); };
  A.discard = () => openSheet(discardSheet(S.draft && S.draft.editing));
  A.discardYes = () => {
    const editing = S.draft && S.draft.editing; S.draft = null; App.sheet = null;
    if (editing) { go('insights', 'back'); toast('No changes made.'); } else { go('home', 'back'); toast('Stopped. Nothing was saved.'); }
  };
  A.save = () => {
    if (!counted(S.draft.items).length) { toast('Every amount is 0, so there is nothing to save.'); return; }
    S.savedEdit = S.draft.editing; saveDraft(); startUndoCountdown(() => { if (App.sheet) render(); }); openSheet(savedSheet());
  };
  A.undo = () => { const wasEdit = S.savedEdit; stopUndoCountdown(); undoSave(); closeSheet(); toast(wasEdit ? 'Undone. Your saved meal is back as it was.' : `Undone. Your ${mealLower(S.draft.meal)} is not saved yet.`); };
  A.edit = () => { stopUndoCountdown(); S.undo = null; S.draft = draftFromMeal(savedMeal()); App.sheet = null; render(); };
  A.savedClose = () => { stopUndoCountdown(); S.undo = null; S.draft = null; go('home', 'back'); };
  A.seeInsights = () => { stopUndoCountdown(); S.undo = null; go('insights'); };
  A.checkFoods = () => { S.draft = draftFromMeal(savedMeal()); go('review'); };
  A.insBack = () => go('home', 'back');
};

boot({
  title: 'Meal log — Flow 2',
  galleryTitle: 'Your photos',
  state: () => ({ an: null, savedEdit: false }),
  screens,
  actions,
});
