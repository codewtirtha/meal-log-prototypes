# Flow 2: Show the estimate

The app shows what it detected, what it assumed and how sure it is: numbered outlines on the photo, pieces and grams for every food, a "Sure" or "Check this" tag, look-alike foods to switch to, and ranges instead of single numbers on the insights.

**Live:** <https://codewtirtha.github.io/meal-log-prototypes/flow-2-show-the-estimate/>

![Flow 2, screens 1 to 9](preview.jpg)

## Screen by screen

| Screen | The brief | In the prototype |
|---|---|---|
| 1. Home (top) | A "Last meal" strip with its photo and a filled "Log a meal" button; a "Now PB Health" header badge; centre tab "Log food" | As asked. The badge opens the rebrand note; the last meal is breakfast until lunch is saved. Tab bar: Home, Programs, Log food, Academy, Store |
| 2. Home scrolled | No blue banner; the Meal card uses the same filled "Log a meal" button | As asked |
| 3. Method sheet | Photo, Search and Talk, each with an accuracy note (Photo: "Good for single dishes; less sure for mixed platters"); no "New" badge; "Cancel" | As asked. Search: "Most exact for packaged food: you pick the brand and amount". Talk: "Good when you can say what you ate and how much" |
| 4. Camera | Live outlines around each food, labelled "will be counted"; caption "We identify each food and estimate its amount"; "Photo tips" chip (one good, one bad example); "Your photos" | As asked, with a close (✕) |
| 5. Analysing | Labelled stages (finding foods, estimating portions, calculating nutrients); foods appear as found; "Stop" | Over 8 s, the foods appear with numbered outlines, then their counts, then their calories |
| 6. Review | Photo with numbered outlines. Row 1: "Cream crackers, 14 pieces (~84 g), 350 kcal", tag "Sure". Row 2: "Glucose biscuits, 6 pieces (~36 g), 146 kcal", amber tag "Check this", chips "Marie biscuits" and "Digestive biscuits". Minus and plus beside each count; no trash icons; meal chip "Lunch"; "Add food"; primary "Save meal" | As asked. A count of 0 leaves a food out, so no delete button is needed. Changing a "Check this" food, or picking a look-alike, turns its tag into "Checked" |
| 7. Saved | "Meal saved"; score 4 on a 0-10 scale with the reason "Mostly refined flour"; "Undo", "Edit", primary "See insights" | A sheet over the review, with a close (✕) |
| 8. Insights header | "+10" Fitgems counter with the tooltip "+10 Fitgems for logging lunch. What are Fitgems?" | The tooltip shows the first time and closes after 8 s or with ✕; tapping the counter shows it again |
| 9. Insights | Verdict labelled "Estimate"; "About 450-540 kcal; lunch target 443 kcal"; "Check foods" beside the verdict | As asked. The nutrients show ranges with a labelled target line, and "What we assumed" lists each food's count, grams per piece and tag |

## Behaviour worth knowing

- The calorie range adds plus or minus 5 % for a food marked "Sure" (or checked) and plus or minus 20 % for "Check this". The verdict reads "Over", "Close to" or "Within" your target from that range.
- "Check foods" and "Edit" reopen the review; saving then reads "Changes saved".
- "Stop" during the analysis goes back to the camera, and nothing is saved.

## Files

- `index.html`: the page and Flow 2's own styles.
- `flow.js`: Flow 2's screens, actions and the outline positions (in the photo's own pixels).
- Shared theme, data and screens: [`../shared`](../shared).

Tasks, theme, deployment and screenshots: see the [main README](../README.md).
