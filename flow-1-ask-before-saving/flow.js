'use strict';
/* =====================================================================
   Flow 1: Ask before saving
   The photo is a draft. After reading it, the app asks one question per
   food ("We counted 14 cream crackers. How many did you eat?") and saves
   only when every question is answered, with a 10-second Undo.

   Screen map (brief):
   1 Home top ........ "Log a meal with a photo" under the greeting, rebrand
                        notice moved to an inbox dot, no centre tab
   2 Home scrolled ... Meal card lists today's meals, no second log button
   3 Method sheet .... Photo / Search / Talk tiles with "Best for" hints, close
   4 Camera .......... "Everything in the frame is counted..." + good/bad row
   5 Analysing ....... "Step 2 of 3: estimating amounts, about 10 seconds left"
   6 Question cards .. "1 of 2" ... "All of them", "Not this food", meal chip
   7 Saved ........... "Saved 2 foods to lunch", Undo (10 s), Edit
   8 Insights ........ "Based on the amounts you confirmed", score, calories
   9 Insights ........ nutrient bars with "Eat less carbs", "Eat more protein"
   (Fitgems were removed from all three flows.)
   ===================================================================== */

/* the analysis takes 12 s: 2 s finding foods, 6 s estimating amounts, 4 s calculating nutrients */
const STAGES = [{ until: 2, label: 'finding foods' }, { until: 8, label: 'estimating amounts' }, { until: 12, label: 'calculating nutrients' }];
const TOTAL = STAGES[STAGES.length - 1].until;

const qItems = () => S.draft.items.filter(i => !i.added);

/* ---------- 1-2 Home ---------- */
const screens = {};
screens.home = () => `<section class="screen" data-status="light">
  <div class="sbfill"></div>
  <div class="body">
    ${homeHeader(`<button class="headbtn" data-act="inbox" aria-label="Inbox${S.inboxSeen ? '' : ', 1 new message'}">${icon('inbox')}${S.inboxSeen ? '' : '<span class="dot"></span>'}</button>${chatBtn()}`)}
    <div class="f1-log"><button class="btn" data-act="openLog">${icon('camera')}Log a meal with a photo</button></div>
    <div class="home-sec">${essentialsHtml()}</div>
    <div class="home-grey">
      ${segTabsHtml()}
      <section class="hcard" id="mealCard" aria-labelledby="mealH">
        <div class="hcard-h"><h3 id="mealH">Meal</h3><span class="kc"><b class="num">${dayKcal()}</b> kcal today</span></div>
        <div style="margin-top:6px">${mealRowsHtml()}</div>
      </section>
      ${trackersHtml()}
    </div>
  </div>
  ${tabBarHtml(null)}
</section>`;

function inboxSheet() {
  return () => `<div class="grab"></div>${sheetHead('Inbox')}<div class="sheet-body"><div class="row" style="align-items:flex-start;background:var(--violet-50);border-color:transparent"><span class="grow"><span class="t">Fitterfly is now PB Health</span><span class="s" style="color:var(--text)">Your progress is saved. You can keep using this app as before.</span><span class="s">Today</span></span></div></div><div class="sheet-foot"><button class="btn secondary" data-act="closeSheet">Close</button></div>`;
}

/* ---------- 3 Method sheet ---------- */
function methodSheet() {
  const tiles = [['photo', 'camera', 'Photo', 'a single plate'], ['search', 'search', 'Search', 'packaged food'], ['talk', 'mic', 'Talk', 'describing a meal']];
  return () => `<div class="grab"></div>${sheetHead('How do you want to log?')}<div class="sheet-body"><div class="f1-tiles">${tiles.map(([k, ic, l, h]) => `<button class="f1-tile" data-act="method" data-m="${k}"><span class="mi">${icon(ic)}</span><b>${l}</b><span class="bf">Best for<em>${h}</em></span></button>`).join('')}</div></div><div class="sheet-foot" style="padding-top:2px"></div>`;
}

/* ---------- 4 Camera ---------- */
screens.camera = () => `<section class="screen dark cam" data-status="light">
  ${viewfinderHtml()}
  <header class="camtop"><button class="iconbtn" data-act="closeCamera" aria-label="Close the camera">${icon('x')}</button><span class="camtitle">Photo</span><span class="iconbtn ghost"></span></header>
  <p class="caption">Everything in the frame is counted. We’ll find each food and ask how much you ate.</p>
  <div class="camfoot">
    <div class="f1-examples" role="group" aria-label="Photo examples">
      <div class="f1-ex"><span class="ex-img"><img src="${ART.plate}" alt=""><span class="ex-mark good">${icon('check')}</span></span><span><span class="sr-only">Good example: </span>One plate, from above</span></div>
      <div class="f1-ex"><span class="ex-img blur"><img src="${ART.plate}" alt=""><span class="ex-mark bad">${icon('x')}</span></span><span><span class="sr-only">Avoid: </span>Blurry or dark</span></div>
    </div>
    <div class="camctl">${galleryBtn('Your photos')}${shutterBtn()}<span class="galbtn ghost"></span></div>
  </div>
</section>`;

/* ---------- 5 Analysing ---------- */
const anEl = () => (S.an ? S.an.el : 0);
const stageIdx = el => STAGES.findIndex(s => el < s.until) === -1 ? STAGES.length - 1 : STAGES.findIndex(s => el < s.until);
function anText() {
  const el = anEl(); const i = stageIdx(el); const left = Math.max(1, Math.ceil(TOTAL - el - 1e-9));
  return `<b>Step ${i + 1} of ${STAGES.length}:</b> ${STAGES[i].label}, about ${left} second${left === 1 ? '' : 's'} left`;
}
function pbarHtml() {
  const el = anEl(); const i = stageIdx(el); const from = i ? STAGES[i - 1].until : 0; const p = clamp((el - from) / (STAGES[i].until - from), 0, 1) * 100;
  return STAGES.map((s, k) => `<i class="${k < i ? 'f' : k === i ? 'now' : ''}"${k === i ? ` style="--p:${p.toFixed(0)}%"` : ''}></i>`).join('');
}
screens.analysing = () => `<section class="screen">
  <header class="topbar"><span class="iconbtn ghost"></span><span class="title center">Reading your photo</span><span class="iconbtn ghost"></span></header>
  <div class="body pad" style="padding-top:20px">
    <div class="scanph">${photoHtml(curPhoto().key, 'photo', '<span class="scanline"></span>', photoAlt(curPhoto().key))}</div>
    <div class="pbar" id="anBar" style="margin:24px 0 14px" aria-hidden="true">${pbarHtml()}</div>
    <p class="f1-step" id="anText" role="status">${anText()}</p>
    <p class="p muted" style="margin-top:14px">Next, we’ll ask how much of each food you ate. Nothing is saved until you answer.</p>
  </div>
  <div class="footer"><button class="btn secondary" data-act="cancelAnalysis">Cancel (photo not saved)</button></div>
</section>`;

/* ---------- 6 Question cards ---------- */
screens.question = () => {
  const items = qItems(); const n = items.length; const it = items[S.q]; const fd = FOODS[it.food]; const wt = byWeight(it); const nm = fd.name.toLowerCase();
  /* pieces are counted ("We counted 14 cream crackers"); rice, dal and sabzi are weighed ("We found about 200 g of rice") */
  const title = wt
    ? (it.food !== it.detFood ? `You said this is ${nm}. How much did you eat?` : `We found about ${it.det} g of ${nm}. How much did you eat?`)
    : (it.food !== it.detFood ? `You said these are ${nm}. How many did you eat?` : `We counted ${it.det} ${nm}. How many did you eat?`);
  const primary = it.qty === 0 ? 'I ate none' : it.qty === it.det ? (wt ? 'All of it' : 'All of them') : `I ate ${it.qty}${wt ? ' g' : ''}`;
  const when = `${S.draft.day === DAY_LABEL ? 'today' : 'yesterday'}, ${S.draft.time}`;
  return `<section class="screen">
    <header class="topbar">${S.q > 0 ? `<button class="iconbtn" data-act="qBack" aria-label="Back to the previous question">${icon('chevL')}</button>` : '<span class="iconbtn ghost"></span>'}
      <div class="title center"><div class="f1-prog" aria-label="Question ${S.q + 1} of ${n}"><span>${S.q + 1} of ${n}</span><span class="pd" aria-hidden="true">${items.map((_, k) => `<i class="${k <= S.q ? 'f' : ''}"></i>`).join('')}</span></div></div>
      <button class="iconbtn" data-act="discard" aria-label="Stop logging">${icon('x')}</button></header>
    <div class="body pad" style="padding-top:16px;padding-bottom:18px">
      <button class="chip meal" data-act="changeMeal">Meal: <b>${esc(mealName(S.draft.meal))}</b><span class="chg">(change)</span></button>
      <section class="gcard f1-q" aria-labelledby="qT">
        <div class="f1-ctx">${photoHtml(fd.crop || S.draft.photo, 'thumb', '', 'Close-up from your photo')}<span>From your photo,<br>${esc(when)}</span></div>
        <h1 class="f1-qtitle" id="qT">${esc(title)}</h1>
        ${stepperHtml(it, 'xl')}
        <p class="f1-qsub" id="qSub">${it.qty ? (wt ? `${kcalOf(it)} kcal` : `${esc(gramsText(it))} · ${kcalOf(it)} kcal`) : 'Left out of this meal'}</p>
      </section>
      <div class="f1-links"><button class="linkbtn" data-act="notThis" data-id="${it.id}">${icon('ban')}Not this food</button><button class="linkbtn" data-act="addFoodOpen">${icon('plus')}Add a food</button></div>
    </div>
    <div class="footer"><button class="btn" data-act="answer">${esc(primary)}</button></div>
  </section>`;
};
function notThisSheet(it) {
  const kinds = [it.detFood, ...it.alts]; const wt = byWeight(it); const was = FOODS[it.detFood].name.toLowerCase();
  const kcalNote = k => (FOODS[k].byWeight ? `${r0(FOODS[k].kcal * 100)} kcal per 100 g` : `${r0(FOODS[k].kcal)} kcal a piece`);
  return () => `<div class="grab"></div>${sheetHead(wt ? 'What is it?' : 'What are they?')}<div class="sheet-body">
    <p class="small muted" style="margin:0 0 12px;line-height:1.4">${wt ? `We thought this was ${esc(was)}. Choose what it is.` : `We thought these were ${esc(was)}. Choose what they are.`}</p>
    <div class="rows">${kinds.map(k => `<button class="row ${k === it.food ? 'on' : ''}" data-act="swapFood" data-id="${it.id}" data-k="${k}" aria-pressed="${k === it.food}"><span class="radio"></span><span class="grow"><span class="t">${esc(FOODS[k].name)}</span><span class="s">${kcalNote(k)}</span></span></button>`).join('')}
      <button class="row" data-act="nip" data-what="Searching for another food"><span class="grow"><span class="t">Something else</span><span class="s">Search for it</span></span>${icon('search')}</button>
      <button class="row" data-act="noneEaten" data-id="${it.id}"><span class="grow"><span class="t">${wt ? 'I didn’t eat any of this' : 'I didn’t eat any of these'}</span><span class="s">${wt ? 'Leave it out of this meal' : 'Leave them out of this meal'}</span></span></button>
    </div></div><div class="sheet-foot"><button class="btn secondary" data-act="closeSheet">Cancel</button></div>`;
}

/* ---------- 7 Saved: a sheet over the meal ---------- */
function mealPageHtml(m) {
  return `<header class="topbar"><span class="iconbtn">${icon('chevL')}</span><span class="title">${esc(mealName(m.meal))}<small>${esc(whenText(m))}</small></span></header>
  <div class="pad" style="padding-top:16px">${photoHtml(m.photo, 'photo')}<p class="h3" style="margin:16px 0 6px">Foods (${m.items.length})</p>${logListHtml(m.items)}</div>`;
}
screens.saved = () => {
  const m = savedMeal(); const n = m.items.length; const mn = mealLower(m.meal);
  const title = S.savedEdit ? `Saved changes to ${mn}` : `Saved ${n} food${n === 1 ? '' : 's'} to ${mn}`;
  return `<section class="screen">
    <div class="f1-backdrop" aria-hidden="true">${mealPageHtml(m)}</div>
    <div class="scrim"></div>
    <div class="f1-sheet" role="dialog" aria-modal="true" aria-labelledby="svT">
      <div class="grab" style="width:48px;height:5px;margin:10px auto 2px;border-radius:3px;background:var(--grab)"></div>
      <div class="sheet-head"><span style="flex:1"></span><button class="iconbtn" data-act="savedClose" aria-label="Close">${icon('x')}</button></div>
      <div class="f1-saved">${SEAL}<h1 id="svT">${esc(title)}</h1>${logListHtml(m.items)}</div>
      <div class="sheet-foot" style="padding-top:16px">
        <div class="btnrow" style="margin-bottom:10px">${S.undoLeft > 0 ? `<button class="btn secondary small f1-undo" data-act="undo">${icon('undo')}<span>${undoLabel()}</span></button>` : ''}<button class="btn secondary small" data-act="edit">${icon('pencil')}Edit</button></div>
        <button class="btn" data-act="seeInsights">See your meal insights</button>
      </div>
    </div>
  </section>`;
};

/* ---------- 8-9 Insights ---------- */
screens.insights = () => {
  const m = savedMeal(); const items = m.items; const sc = foodScore(items, m.meal); const R = rowsByKey(nutrientRows(items, m.meal)); const k = R.kcal; const mn = mealLower(m.meal);
  return `<section class="screen">
    <div class="inshead">${VEG}<div class="bar"><button class="iconbtn" data-act="insBack" aria-label="Back to Home">${icon('chevL')}</button><span class="title">Meal insights</span></div></div>
    <div class="body" style="padding-bottom:calc(var(--hb) + 12px)">
      <div class="meal-id">${photoHtml(m.photo, 'thumb', '', 'Your meal photo')}<div><b>${esc(mealName(m.meal))}</b><span>${esc(whenText(m))}</span></div></div>
      <div class="pad">
        <h2 class="f1-basis">Based on the amounts you confirmed</h2>
        ${scoreHtml(sc)}
        <section class="gcard f1-kcal" aria-label="Calories">
          <div class="big"><b class="num">${r0(k.val)}</b> of ${k.target} kcal <span class="muted">(${mn} target)</span></div>
          ${barHtml(k)}
          ${k.status === 'over' ? `<span class="nstat over">${icon('up')}${r0(k.val - k.target)} kcal over your ${mn} target</span>` : `<span class="nstat within">Within your ${mn} target</span>`}
        </section>
        <section class="gcard f1-nutr" aria-labelledby="nutH"><h3 class="h3" id="nutH">Nutrients</h3><div class="nlist">${['carbs', 'protein', 'fat', 'fibre'].map(key => { const r = R[key]; return `<div><div class="nrow-top"><span class="nl">${r.label}</span><span class="nv"><b class="num">${r0(r.val)}</b> of ${r.target} g</span></div>${barHtml(r)}${statusHtml(r, 'act')}</div>`; }).join('')}</div></section>
        <h3 class="h3 f1-loghead">You logged</h3>
        ${logListHtml(items)}
        <div class="f1-change"><button class="linkbtn" data-act="changeAmounts">${icon('pencil')}Change amounts</button></div>
      </div>
    </div>
  </section>`;
};

/* ---------- actions ---------- */
function startAnalysis() {
  clearTimers(); closeSheetSilently(); S.an = { t0: Date.now(), el: 0 }; go('analysing');
  every(() => {
    S.an.el = (Date.now() - S.an.t0) / 1000;
    if (S.an.el >= TOTAL) { App.actions.finishAnalysis(); return; }
    const t = $('#anText'); if (t) t.innerHTML = anText();
    const b = $('#anBar'); if (b) b.innerHTML = pbarHtml();
  }, 200);
}
function closeSheetSilently() { App.sheet = null; }
function bumpValue(id) { const b = document.querySelector(`[data-fk="v-${id}"] b`); if (b) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); } }
function finishQuestions() {
  if (!counted(S.draft.items).length) { toast('Every amount is 0, so there is nothing to save. Change an amount or stop logging.'); return; }
  S.savedEdit = S.draft.editing; saveDraft(); startUndoCountdown(() => { if (S.screen === 'saved') render(); }); App.last = null; go('saved');
}
function leaveSaved() { clearTimers(); stopUndoCountdown(); S.undo = null; }

const actions = A => {
  A.inbox = () => { S.inboxSeen = true; openSheet(inboxSheet()); };
  A.openLog = () => openSheet(methodSheet());
  A.method = d => { if (d.m === 'photo') { App.sheet = null; go('camera'); } else notInPrototype(d.m === 'search' ? 'Search' : 'Talk'); };
  A.openMeal = d => {
    const m = S.meals.find(x => x.id === d.id);
    if (!m || !m.draft) { toast('In this prototype, only the meal you log by photo can be opened.'); return; }
    S.savedId = m.id; go('insights');
  };
  A.closeCamera = () => go('home', 'back');
  A.shoot = () => { useCamera(); startAnalysis(); };
  A.pickPhoto = d => { usePhoto(d.k || 'tub'); startAnalysis(); };
  A.cancelAnalysis = () => { clearTimers(); S.an = null; go('camera', 'back'); toast('Cancelled. Your photo was not saved.'); };
  A.finishAnalysis = () => { clearTimers(); S.an = null; S.draft = newDraft(); S.q = 0; go('question'); };
  A.qty = d => { const it = draftItem(d.id); stepQty(it, d.d); it.touched = true; render(); bumpValue(d.id); };
  A.answer = () => {
    const items = qItems(); items[S.q].touched = true;
    if (S.q < items.length - 1) { S.q += 1; App.last = null; App.dir = 'fwd'; render(); } else finishQuestions();
  };
  A.qBack = () => { if (S.q > 0) { S.q -= 1; App.last = null; App.dir = 'back'; render(); } };
  A.notThis = d => openSheet(notThisSheet(draftItem(d.id)));
  A.swapFood = d => { const it = draftItem(d.id); it.food = d.k; it.touched = true; closeSheet(); toast(`Changed to ${FOODS[d.k].name.toLowerCase()}.`); };
  A.noneEaten = d => { const it = draftItem(d.id); it.qty = 0; it.touched = true; App.sheet = null; toast(`Left out: ${FOODS[it.food].name.toLowerCase()}.`); A.answer(); };
  A.discard = () => openSheet(discardSheet(S.draft && S.draft.editing));
  A.discardYes = () => {
    const editing = S.draft && S.draft.editing; S.draft = null; App.sheet = null;
    if (editing) { go('insights', 'back'); toast('No changes made.'); } else { go('home', 'back'); toast('Stopped. Nothing was saved.'); }
  };
  A.undo = () => {
    const wasEdit = S.savedEdit; clearTimers(); stopUndoCountdown(); undoSave(); S.q = qItems().length - 1; App.last = null; go('question', 'back');
    toast(wasEdit ? 'Undone. Your saved meal is back as it was.' : `Undone. Your ${mealLower(S.draft.meal)} is not saved yet.`);
  };
  A.edit = () => { leaveSaved(); S.draft = draftFromMeal(savedMeal()); S.q = 0; go('question'); };
  A.savedClose = () => { leaveSaved(); go('home', 'back'); };
  A.seeInsights = () => { leaveSaved(); go('insights'); };
  A.changeAmounts = () => { hideToast(); S.draft = draftFromMeal(savedMeal()); S.q = 0; go('question'); };
  A.insBack = () => { hideToast(); go('home', 'back'); };
};

boot({
  title: 'Meal log — Flow 1',
  galleryTitle: 'Your photos',
  state: () => ({ inboxSeen: false, q: 0, an: null, savedEdit: false }),
  screens,
  actions,
});
