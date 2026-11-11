# Meal-log prototypes: logging a meal by photo (PB Health, formerly Fitterfly)

Three clickable, phone-sized prototypes of the same job: logging lunch from a photo. Each flow has its own folder. All three use the same theme, the same scenario data and the same five test tasks, so they can be compared fairly.

| Flow | The idea | Live link |
|---|---|---|
| [Flow 1: Ask before saving](flow-1-ask-before-saving/) | The photo is a draft. The app asks how much of each food you ate, then saves, with a 10-second Undo. | [flow-1-ask-before-saving](https://codewtirtha.github.io/meal-log-prototypes/flow-1-ask-before-saving/) |
| [Flow 2: Show the estimate](flow-2-show-the-estimate/) | The app shows what it found, what it assumed and how sure it is: outlines on the photo, grams, "Sure" or "Check this", ranges. | [flow-2-show-the-estimate](https://codewtirtha.github.io/meal-log-prototypes/flow-2-show-the-estimate/) |
| [Flow 3: One meal card](flow-3-one-meal-card/) | Fewest steps. From the photo on, every screen is a state of one meal card, and each change updates the nutrition at once. | [flow-3-one-meal-card](https://codewtirtha.github.io/meal-log-prototypes/flow-3-one-meal-card/) |

The site root, <https://codewtirtha.github.io/meal-log-prototypes/>, is a plain list of the three links without the flow names, so it can be shown to participants.

Each flow's README has its nine screens and a screen-by-screen table of what the brief asked for and where it is.

## Test tasks (the same in every flow)

1. You have just had lunch from a tub of biscuits: all the glucose biscuits, but only 10 of the cream crackers. Log this lunch with a photo of the tub.
2. How did your lunch compare with your lunch target? Find one thing to do differently next time.
3. Find out what Fitgems are.
4. You now remember that you ate 12 cream crackers, not 10. Change your saved lunch.
5. Start logging another meal with a photo, then stop before anything is saved.

On a laptop the tasks sit beside the phone, with the line "Nothing leaves this page and nothing is stored." On a phone the prototype fills the screen and a slim bar at the top has **Tasks**.

## Scenario data (from the brief)

- User: Asha. Meal: Lunch, 10 Oct, 12:45 PM. Photo: a clear tub of mixed biscuits, seen from above.
- Detected: cream crackers, 14 pieces (about 84 g), 350 kcal; glucose biscuits, 6 pieces (about 36 g), 146 kcal.
- Totals: 496 of 443 kcal (112 %); carbohydrate 86 of 55 g (156 %, over); fat 14 of 15 g (93 %); protein 7 of 22 g (32 %, under); fibre 2 of 8 g (25 %, under).
- Food score 4 out of 10. Fitgems earned: 10.

The per-piece values reproduce these totals exactly. When a participant changes an amount, everything is recalculated: task 1 asks for 10 crackers, which makes the saved lunch 396 kcal.

## One theme, sampled from the app screens

Every colour was sampled from the nine app screenshots and is defined once, as CSS variables in [`shared/theme.css`](shared/theme.css). The flows use only these variables.

| Variable | Value | Used for | Sampled from |
|---|---|---|---|
| `--navy` | `#0D1925` | header band, primary buttons | screen 1 header, screen 6 "Track meal" |
| `--blue` | `#0477F6` | icons, active tab, progress, selection, under-target bars | screen 1 Home tab, screen 5 progress |
| `--blue-ink` | `#0762D0` | blue text | `--blue` darkened to pass WCAG AA |
| `--pink` | `#DA0A78` | text links | screen 6 "Search here", screen 7 "Go back" (darkened for AA) |
| `--page` | `#F7F8FA` | Home background | screens 1 and 2 |
| `--card-grey` | `#F4F6FA` | light grey cards | screen 6 |
| `--line` | `#DCE2F1` | card outlines | screens 1 and 3 tiles |
| `--amber` / `--amber-ink` | `#FFB200` / `#8A4B00` | over target, always with an up arrow | screen 9 calorie ring |
| `--within` | `#5E6E86` | within target (neutral) | |
| `--green` | `#0CA122` | the "saved" seal | screen 7 |
| `--gem` | `#F80A8C` | Fitgems | screen 8 |
| `--peach` | `#FFF2E6` | the suggestion card | screens 5 and 9 |
| `--score-bg` | pink to cyan gradient | the food score | screens 7 and 9 |

The brief's reference colours (navy `#0F1B2D`, blue `#2F6FED`) are within a few shades of these; the sampled values are used so the prototypes look like the app.

Type: Inter for text and Poppins for headings, as in the app screens. Both are embedded in [`shared/fonts.css`](shared/fonts.css) (SIL Open Font License), so the pages work offline. Frames are iPhone 15: 393 x 852 pt.

## Rules from the brief, as built

- Text is at least 16 px, food counts at least 20 px, tap targets at least 44 px. This was checked automatically on every screen.
- Amounts are in pieces or grams, never "Number".
- One filled (navy) primary button per screen.
- Every sheet and every process has a visible way out: a close (✕), Cancel, Stop or Retake.
- Over target is amber with an up arrow; under target is blue with a down arrow; nothing is red.
- Bars can run past a marked, labelled target line.
- Praise and warnings never share a screen. There are no fun facts, no app-download banner and no floating chat button.
- Home's tab bar is Home, Programs, [the flow's centre tab], Academy, Store. Chat is an icon in the header.

## Repository layout

```
index.html                     site root: neutral links to the three flows
shared/
  theme.css                    the palette (CSS variables) and every shared component
  core.js                      scenario data, nutrition maths, food score, icons,
                               the small renderer, phone frame, task panel, shared screens
  fonts.css                    Inter and Poppins, embedded
  img/                         the biscuit-tub photo, two close-ups, example plate, breakfast
flow-1-ask-before-saving/      index.html (page + Flow 1 styles), flow.js (screens), README.md, preview.jpg
flow-2-show-the-estimate/      the same for Flow 2
flow-3-one-meal-card/          the same for Flow 3
tools/take_screenshots.py      screenshots of every screen, start to end
```

There is no build step: edit a file, refresh the page.

## Open it on your computer

Download or clone the repository and double-click `flow-1-ask-before-saving/index.html` (or the other flows). Keep the `shared` folder next to the flow folders: every flow loads its theme, fonts and photos from there.

You can also serve the folder locally:

```bash
python3 -m http.server 8000
```

then open <http://localhost:8000/flow-1-ask-before-saving/>.

## Put it online with GitHub Pages

This repository is published with GitHub Pages from the `main` branch. To set it up, or to check the settings:

1. On GitHub, open the repository, then **Settings → Pages**.
2. Under **Build and deployment**, choose **Source: Deploy from a branch**, **Branch: `main`**, folder **`/ (root)`**, then **Save**.
3. Wait a minute or two. The **Actions** tab shows a run called "pages build and deployment"; when it has a green tick, the site is live at <https://codewtirtha.github.io/meal-log-prototypes/>.
4. Share the flow links from the table above.

Every push to `main` republishes the site by itself. Browsers can keep an old copy for up to 10 minutes, so check changes in a private window.

Good to know:

- Links are case-sensitive, and each flow must stay in its folder with its `index.html`; the `shared` folder must stay at the top level.
- On a free GitHub account, Pages sites come from public repositories, so anyone can see every file here.
- To publish under another account: create a public repository, upload everything in this folder (keeping the folders), then do steps 1 to 3. The links become `https://<your-username>.github.io/<repository-name>/flow-1-ask-before-saving/` and so on.

## Screenshots

[`tools/take_screenshots.py`](tools/take_screenshots.py) opens each flow in headless Google Chrome, steps from the first screen to the last, and saves every screen at 1179 x 2556 px (393 x 852 pt at 3x), plus a board with screens 1 to 9 left to right, labelled "Flow n - Screen m".

```bash
pip install websocket-client pillow
python3 tools/take_screenshots.py --previews
```

The pictures go to `~/Downloads/meal-log-prototype-screenshots/<flow folder>/`. `--previews` also refreshes each flow's `preview.jpg`. The script opens the pages with `#shots` in the address, which pauses the prototype's timers and animations so every screen is captured at a known moment.

## What is real and what is simulated

**Real:** every tap path; counts, grams, calories and nutrients recalculated as amounts change; the food score; Undo and Edit; changing the meal (each meal has its own targets); adding one of five common foods; the Fitgems explanation.

**Simulated:** the camera always sees the biscuit tub, and "Your photos" offers that photo; recognition always finds the brief's two foods; the analysis waits a fixed time (Flow 1: 12 s, Flow 2: 8 s, Flow 3: 5 s); the clock shows 12:44 to 12:46 on 10 Oct; Search and Talk are not part of these prototypes. Nothing is stored: reloading the page starts again.

## How the food score is worked out

The score starts at 10 and loses points, so the brief's lunch scores 4:

- 3 points off when three quarters or more of the calories come from refined flour (biscuits, crackers). The reason shown is "Mostly refined flour".
- 1 point off when calories are more than 10 % over the meal target.
- 1 point off when protein is under half its goal.
- 1 point off when fibre is under half its goal.

The first rule that applies is the reason shown with the score. A nutrient is "over" when it is above 105 % of its limit (calories, carbs, fat) and "under" when it is below 90 % of its goal (protein, fibre). Flow 2's ranges allow plus or minus 5 % for a food marked "Sure" (or checked by the person) and plus or minus 20 % for "Check this".

## Earlier designs

The two earlier prototypes, Design 1 ("simplified") and Design 2 ("detailed"), were replaced by these three flows. They are kept in the git history under the tag `designs-v1`.
