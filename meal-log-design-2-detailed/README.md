# Meal Log — Design 2: “See it, fix it, reuse it” (detailed)

A clickable, phone-sized prototype for logging one meal, built for the CS 6750 individual project (Fitterfly / PB Health meal logging).

- **`index.html`** — the whole prototype in one file. No server, no database, no network requests: the fonts and food photos are inside the file.
- **`Design2_Thinking_Process.docx`** — the thinking process and the screen-by-screen change plan (cites screen_1 to screen_9).

## Open it on your computer

Double-click `index.html`. On a laptop you see a phone frame with the test tasks beside it. On a phone the prototype fills the screen; the slim bar at the top has **Tasks** and **Restart**.

## Put it online with GitHub Pages (free, public link)

1. Sign in at github.com → **New repository** → name it, for example, `meal-log-prototypes` → choose **Public** → **Create repository**.
2. On the new repository page, click **uploading an existing file**. Drag this whole folder (`meal-log-design-2-detailed`) into the page — and the Design 1 folder too, if you want both in one repository.
   Only `index.html` needs to be online. If you don’t want the Word document to be public, delete it from the folder you drag in (keep your copy in Downloads).
3. Click **Commit changes**.
4. Open **Settings → Pages**. Under **Build and deployment**, choose **Source: Deploy from a branch**, **Branch: main**, folder **/ (root)**, then **Save**.
5. Wait one or two minutes and refresh. The page shows *Your site is live at* `https://<your-username>.github.io/meal-log-prototypes/`.
6. Your links are the folder names added to that address:
   - Design 1: `https://<your-username>.github.io/meal-log-prototypes/meal-log-design-1-simplified/`
   - Design 2: `https://<your-username>.github.io/meal-log-prototypes/meal-log-design-2-detailed/`
7. Open each link in a private (incognito) window to check it works for someone who isn’t signed in, then share it.

**Good to know**

- Links are case-sensitive, and the file must stay named `index.html`.
- On a free GitHub account, Pages sites come from public repositories, so anyone can see every file in the repository.
- To update, upload a new `index.html` into the same folder and commit; the link stays the same (allow a minute to refresh).
- Prefer one repository per design? Upload `index.html` to the top level of a repository named `meal-log-design-2`; the link becomes `https://<your-username>.github.io/meal-log-design-2/`.

## What is real and what is simulated

Real: every tap path, live totals, the meal score, Edit, Undo and the edit history, photo markers, shares, grams, Search (including “My recipes”), and typed meals.
Simulated: the camera (pick a demo scene: plate, tin or tray), food recognition, voice (sample phrases in English, हिन्दी and বাংলা), the photo library behind the catch-up card, and the clock, which starts at 2:05 PM.
