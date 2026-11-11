'use strict';
/* =====================================================================
   Flow 3: One meal card
   Fewest steps. From the photo on, every screen is a state of one
   scrolling meal card: analysing -> review -> saved -> insights. Every
   correction shows its effect at once in a live nutrition summary.

   Screen map (brief):
   1 Home top ........ raised centre tab "Log meal" with a camera icon
                        (replaces Trackers); rebrand as a dismissible line at
                        the foot of Home
   2 Home scrolled ... Meal card lists today's meals, "Tap a meal to edit";
                        no banner, no "Add Meal" link
   3 Method sheet .... Photo pre-selected, labelled with the app's name for it,
                        "Klik"; "Take photo", hint, first-time coach mark
                        "Klik means logging by photo", Search and Talk as
                        small links, close
   4 Camera .......... "We estimate each food's amount. Everything in the frame
                        is counted; keep only what you'll eat." + "Photo tips"
                        (one good and one bad example, as in Flows 1 and 2)
   5 Card, analysing . photo, two "Finding foods..." placeholder rows, "Retake"
   6 Card, review .... large counts with steppers, "Estimate" tags, meal chip,
                        "Not this food" with look-alikes, live nutrition
                        summary, "Add food", "Save meal"
   7 Card, saved ..... snackbar "Lunch saved. Undo (10)", score 4/10 with its scale;
                        each food keeps its "Estimate" or "Your count" tag
   8 Card, insights .. "Estimate" tag, labelled lunch target, the verdict as a
                        suggestion
   9 Card, insights .. nutrient bars with labelled targets, directional colours
                        and the action labels of Flows 1 and 2 ("Eat less carbs",
                        "Eat more protein")
   (Fitgems were removed from all three flows.)
   ===================================================================== */

const ANALYSIS_MS = 10000;   /* 10 s, as in Flows 1 and 2 */

/* ---------- 1-2 Home ---------- */
const screens = {};
screens.home = () => `<section class="screen" data-status="light">
  <div class="sbfill"></div>
  <div class="body">
    ${homeHeader(chatBtn())}
    <div class="home-sec">${essentialsHtml()}</div>
    <div class="home-grey f3-foot">
      ${segTabsHtml()}
      <section class="hcard" id="mealCard" aria-labelledby="mealH">
        <div class="hcard-h"><h3 id="mealH">Meal</h3><span class="kc"><b class="num">${dayKcal()}</b> kcal today</span></div>
        <p class="f3-tapnote">${icon('pencil')}Tap a meal to edit</p>
        <div style="margin-top:4px">${mealRowsHtml()}</div>
      </section>
      ${trackersHtml()}
      ${S.rebrandHidden ? '' : `<div class="f3-rebrand" role="note"><span class="grow"><b>Fitterfly is now PB Health.</b> Your progress is saved.</span><button class="iconbtn" data-act="hideRebrand" aria-label="Dismiss this note">${icon('x')}</button></div>`}
    </div>
  </div>
  ${tabBarHtml({ label: 'Log meal', icon: 'camera', act: 'openLog', raised: true })}
</section>`;

/* ---------- 3 Method sheet ---------- */
function methodSheet() {
  return () => `<div class="grab"></div>${sheetHead('Log a meal')}<div class="sheet-body">
    <div class="f3-pick" role="radio" aria-checked="true"><span class="mi">${icon('camera')}</span><span class="grow"><b>Photo <span class="f3-klik">Klik</span></b><span class="h">Photo works best for a single plate</span></span><span class="ok">${icon('check')}</span></div>
    ${S.coachSeen ? '' : `<div class="f3-coach" role="note"><span class="grow">Klik means logging by photo</span><button data-act="coachOk">Got it</button></div>`}
  </div><div class="sheet-foot"><button class="btn" data-act="takePhoto">${icon('camera')}Take photo</button>
    <div class="f3-or">Or use<button class="linkbtn" data-act="nip" data-what="Search">${icon('search')}Search</button>·<button class="linkbtn" data-act="nip" data-what="Talk">${icon('mic')}Talk</button></div></div>`;
}

/* ---------- 4 Camera ---------- */
screens.camera = () => `<section class="screen dark cam" data-status="light">
  ${viewfinderHtml()}
  <header class="camtop"><button class="iconbtn" data-act="closeCamera" aria-label="Close the camera">${icon('x')}</button><span class="camtitle">Photo</span><span class="iconbtn ghost"></span></header>
  <p class="caption">We estimate each food’s amount. Everything in the frame is counted; keep only what you’ll eat.</p>
  <div class="camfoot">
    <div class="f3-camtools"><button class="camchip" data-act="tips">${icon('bulb')}Photo tips</button></div>
    <div class="camctl">${galleryBtn('Your recent photos')}${shutterBtn()}<span class="galbtn ghost"></span></div>
  </div>
</section>`;

/* ---------- 5-9 the meal card ---------- */
function liveHtml(items, mealKey) {
  const R = rowsByKey(nutrientRows(items, mealKey)); const k = R.kcal;
  return `<section class="f3-live" id="live" aria-live="polite" aria-label="Nutrition so far">
    <div class="lh"><b>${esc(mealName(mealKey))} so far</b><span>Changes as soon as you change an amount</span></div>
    <p class="f3-big"><b class="num" data-n="kcal">${r0(k.val)}</b> of ${k.target} kcal</p>
    ${barHtml(k, { tlabel: `${mealName(mealKey)} target ${k.target} kcal` })}
    <div class="f3-mini">${['carbs', 'protein', 'fat', 'fibre'].map(key => { const r = R[key]; return `<div data-n="${key}"><span class="ml">${r.label}</span><span class="mv"><b>${r0(r.val)}</b> of ${r.target} g</span>${r.status === 'within' ? '<span class="nstat within">Within target</span>' : statusHtml(r, 'status')}</div>`; }).join('')}</div>
  </section>`;
}
/* The amount's tag stays with the food from review to saved card to insights:
   "Estimate" until the person changes the amount, then "Your count". */
function tagHtml(it) {
  if (it.added) return `<span class="tag mine">${icon('plus')}Added</span>`;
  if (it.touched) return `<span class="tag mine">${icon('check')}Your count</span>`;
  return `<span class="tag est">${icon('approx')}Estimate</span>`;
}
const hasEstimate = items => counted(items).some(i => !i.added && !i.touched);
function reviewRowHtml(it) {
  const fd = FOODS[it.food];
  const swap = !it.added && it.alts && it.alts.length ? `<div class="f3-swap"><button class="linkbtn" data-act="notThis" data-id="${it.id}">${icon('ban')}Not this food</button></div>` : '';
  return `<div class="f3-row"><div class="f3-rtop stack"><span class="nm">${esc(fd.name)}, ${esc(qtyText(it))}</span></div>
    <div class="f3-rctl">${stepperHtml(it, 'lg')}<span class="side">${tagHtml(it)}<b class="num">${kcalOf(it)} kcal</b><span>${it.qty ? (byWeight(it) ? '' : esc(gramsText(it))) : 'Not counted'}</span></span></div>${swap}</div>`;
}
function savedRowHtml(it) {
  return `<div class="f3-row"><div class="f3-rtop"><span class="nm">${esc(foodName(it))}<small>${esc(amountLine(it))}</small></span><span class="side">${tagHtml(it)}<b class="num">${kcalOf(it)} kcal</b></span></div></div>`;
}
/* "Not this food": the foods it could be, as in Flow 1's sheet and Flow 2's chips */
function notThisSheet(it) {
  const wt = byWeight(it); const kinds = [it.detFood, ...it.alts];
  const kcalNote = k => (FOODS[k].byWeight ? `${r0(FOODS[k].kcal * 100)} kcal per 100 g` : `${r0(FOODS[k].kcal)} kcal a piece`);
  return () => `<div class="grab"></div>${sheetHead(wt ? 'What is it?' : 'What are they?')}<div class="sheet-body">
    <p class="small muted" style="margin:0 0 12px;line-height:1.4">${wt ? `We thought this was ${esc(FOODS[it.detFood].name.toLowerCase())}. Choose what it is.` : `We thought these were ${esc(FOODS[it.detFood].name.toLowerCase())}. Choose what they are.`}</p>
    <div class="rows">${kinds.map(k => `<button class="row ${k === it.food ? 'on' : ''}" data-act="swapFood" data-id="${it.id}" data-k="${k}" aria-pressed="${k === it.food}"><span class="radio"></span><span class="grow"><span class="t">${esc(FOODS[k].name)}</span><span class="s">${kcalNote(k)}</span></span></button>`).join('')}
      <button class="row" data-act="nip" data-what="Searching for another food"><span class="grow"><span class="t">Something else</span><span class="s">Search for it</span></span>${icon('search')}</button>
    </div></div><div class="sheet-foot"><button class="btn secondary" data-act="closeSheet">Cancel</button></div>`;
}
function insightsHtml(m) {
  const items = m.items; const R = rowsByKey(nutrientRows(items, m.meal)); const mn = mealName(m.meal);
  const basis = hasEstimate(items) ? `<span class="tag est">${icon('approx')}Estimate</span>` : `<span class="tag mine">${icon('check')}Your counts</span>`;
  return `<section class="f3-sec" id="insights" aria-labelledby="insH"><div class="f3-insh"><h3 class="h3" id="insH">How this ${mealLower(m.meal)} compares</h3>${basis}</div>
    <div class="f3-target"><span>${esc(mn)} target</span><b>${R.kcal.target} kcal</b></div>
    <div class="advice f3-advice"><span class="ai">${icon('bulb')}</span><div><b>A suggestion</b><p>${esc(suggestion(items, m.meal))}</p></div></div>
    <div class="nlist">${['kcal', 'carbs', 'protein', 'fat', 'fibre'].map(key => { const r = R[key]; const unit = key === 'kcal' ? 'kcal' : 'g'; return `<div><div class="nrow-top"><span class="nl">${r.label}</span><span class="nv"><b class="num">${r0(r.val)}</b> of ${r.target} ${unit}</span></div>${barHtml(r, key === 'kcal' ? { tlabel: `${mn} target` } : {})}${statusHtml(r, 'act')}</div>`; }).join('')}</div>
  </section>`;
}
screens.card = () => {
  const st = S.cardState; const d = S.draft; const m = st === 'saved' ? savedMeal() : null;
  const left = st === 'saved' ? `<button class="iconbtn" data-act="done" aria-label="Back to Home">${icon('chevL')}</button>` : st === 'analysing' ? `<button class="iconbtn" data-act="stopCard" aria-label="Stop and go back">${icon('x')}</button>` : `<button class="iconbtn" data-act="discard" aria-label="${d && d.editing ? 'Stop changing this meal' : 'Stop logging'}">${icon('x')}</button>`;
  const title = st === 'analysing' ? 'New meal' : mealName((m || d).meal);
  const pic = st === 'analysing' ? curPhoto() : { key: (m || d).photo, day: (m || d).day, time: (m || d).time };
  let inner = '';
  if (st === 'analysing') {
    inner = `<div class="f3-finding"><span class="spinner"></span>Finding foods…</div>
      <div class="skel-row" aria-hidden="true"><span class="skel sq"></span><span style="flex:1;display:grid;gap:8px"><span class="skel" style="width:70%"></span><span class="skel" style="width:40%"></span></span></div>
      <div class="skel-row" aria-hidden="true"><span class="skel sq"></span><span style="flex:1;display:grid;gap:8px"><span class="skel" style="width:60%"></span><span class="skel" style="width:35%"></span></span></div>
      <div class="f3-retake"><button class="linkbtn" data-act="retake">${icon('retake')}Retake</button></div>`;
  } else if (st === 'review') {
    inner = `<div class="f3-meta"><button class="chip meal" data-act="changeMeal">${icon('clock')}<b>${esc(mealName(d.meal))}</b>${icon('chevD')}</button><span class="when">${esc(whenText(d))}</span></div>
      ${d.items.map(reviewRowHtml).join('')}
      <button class="f3-add" data-act="addFoodOpen">${icon('plus')}Add food</button>
      ${liveHtml(d.items, d.meal)}`;
  } else {
    const sc = foodScore(m.items, m.meal);
    inner = `<div class="f3-meta"><span class="chip meal" style="cursor:default">${icon('clock')}<b>${esc(mealName(m.meal))}</b></span><span class="when">${esc(whenText(m))}</span></div>
      ${m.items.map(savedRowHtml).join('')}
      <div class="f3-edit"><button class="linkbtn" data-act="editCard">${icon('pencil')}Edit foods</button></div>
      <section class="f3-sec" id="score">${scoreHtml(sc)}</section>
      ${insightsHtml(m)}`;
  }
  const foot = st === 'review' ? `<div class="footer"><button class="btn" data-act="save">${d.editing ? 'Save changes' : 'Save meal'}</button></div>` : st === 'saved' ? `<div class="footer"><button class="btn" data-act="done">Done</button></div>` : '';
  return `<section class="screen grey">
    <header class="topbar">${left}<span class="title">${esc(title)}<small>${esc(whenText(pic))}</small></span></header>
    <div class="body f3-page"><article class="f3-card" aria-label="Meal card">${photoHtml(pic.key, 'photo', st === 'analysing' ? '<span class="scanline"></span>' : '', photoAlt(pic.key))}${inner}</article></div>
    ${foot}
  </section>`;
};

/* ---------- actions ---------- */
function startCard() {
  clearTimers(); App.sheet = null; S.draft = null; S.cardState = 'analysing'; go('card');
  later(() => App.actions.finishAnalysis(), ANALYSIS_MS);
}
function flashChanged(before) {
  const after = totals(S.draft.items);
  ['kcal', 'carbs', 'protein', 'fat', 'fibre'].forEach(k => {
    if (r0(before[k]) !== r0(after[k])) { const el = document.querySelector(`[data-n="${k}"]`); if (el) { const tgt = k === 'kcal' ? el : el; tgt.classList.remove('flash'); void tgt.offsetWidth; tgt.classList.add('flash'); } }
  });
}
function bumpValue(id) { const b = document.querySelector(`[data-fk="v-${id}"] b`); if (b) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); } }
/* after saving, the card scrolls so the new score sits above the snackbar */
function scrollToScore() {
  const b = $('#screen .body'); const el = $('#score'); if (!b || !el) return;
  b.scrollTop = Math.max(0, el.getBoundingClientRect().top - b.getBoundingClientRect().top + b.scrollTop - 230);
  App.mem.card = b.scrollTop;
}
/* the snackbar's Undo lasts 10 seconds, with the seconds left on the button, as in Flows 1 and 2 */
function snack(msg) {
  startUndoCountdown(() => hideToast());
  toast(msg, { label: undoLabel(), labelHtml: true, fn: () => App.actions.undo(), ms: UNDO_SECONDS * 1000 });
}

const actions = A => {
  A.hideRebrand = () => { S.rebrandHidden = true; render(); };
  A.openLog = () => openSheet(methodSheet());
  A.coachOk = () => { S.coachSeen = true; render(); };
  A.takePhoto = () => { S.coachSeen = true; App.sheet = null; go('camera'); };
  A.tips = () => openSheet(tipsSheet(TIP_KEYS));
  A.openMeal = d => {
    const m = S.meals.find(x => x.id === d.id);
    if (!m || !m.draft) { toast('In this prototype, only the meal you log by photo can be edited.'); return; }
    S.savedId = m.id; S.draft = draftFromMeal(m); S.cardState = 'review'; go('card');
  };
  A.closeCamera = () => go('home', 'back');
  A.shoot = () => { useCamera(); startCard(); };
  A.pickPhoto = d => { usePhoto(d.k || 'tub'); startCard(); };
  A.retake = () => { clearTimers(); go('camera', 'back'); toast('Photo not saved. Take another one.'); };
  A.stopCard = () => { clearTimers(); S.draft = null; go('home', 'back'); toast('Stopped. Nothing was saved.'); };
  A.finishAnalysis = () => { clearTimers(); S.draft = newDraft(); S.draft.items.forEach(i => { i.conf = 'est'; }); S.cardState = 'review'; render(); };
  A.qty = d => {
    const before = totals(S.draft.items); const it = draftItem(d.id);
    stepQty(it, d.d); it.touched = true;
    render(); bumpValue(d.id); flashChanged(before);
  };
  A.notThis = d => openSheet(notThisSheet(draftItem(d.id)));
  A.swapFood = d => {
    const before = totals(S.draft.items); const it = draftItem(d.id); it.food = d.k;
    closeSheet(); flashChanged(before); toast(`Changed to ${FOODS[d.k].name.toLowerCase()}.`);
  };
  A.discard = () => openSheet(discardSheet(S.draft && S.draft.editing));
  A.discardYes = () => {
    const editing = S.draft && S.draft.editing; S.draft = null; App.sheet = null;
    if (editing) { S.cardState = 'saved'; render(); toast('No changes made.'); } else { go('home', 'back'); toast('Stopped. Nothing was saved.'); }
  };
  A.save = () => {
    if (!counted(S.draft.items).length) { toast('Every amount is 0, so there is nothing to save.'); return; }
    const wasEdit = S.draft.editing; saveDraft(); S.cardState = 'saved'; render();
    scrollToScore();
    snack(wasEdit ? `Changes to ${mealLower(S.draft.meal)} saved.` : `${mealName(S.draft.meal)} saved.`);
  };
  A.undo = () => {
    if (!S.undo) return; stopUndoCountdown(); const wasEdit = S.draft && S.draft.editing; undoSave(); S.cardState = 'review'; render();
    toast(wasEdit ? 'Undone. Your saved meal is back as it was.' : `Undone. Your ${mealLower(S.draft.meal)} is not saved yet.`);
  };
  A.editCard = () => { hideToast(); stopUndoCountdown(); S.undo = null; S.draft = draftFromMeal(savedMeal()); S.cardState = 'review'; render(); };
  A.done = () => { hideToast(); stopUndoCountdown(); S.undo = null; go('home', 'back'); };
};

boot({
  title: 'Meal log — Flow 3',
  galleryTitle: 'Your recent photos',
  state: () => ({ cardState: 'analysing', coachSeen: false, rebrandHidden: false }),
  screens,
  actions,
});
