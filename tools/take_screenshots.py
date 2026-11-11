#!/usr/bin/env python3
"""Screenshot every screen of the three meal-log flows, start to end.

Drives the system Google Chrome in headless mode over the DevTools protocol,
so nothing has to be installed except the `websocket-client` package
(pip install websocket-client). Each flow page is opened with `#shots` in the
address, which stops the prototype's timers and animations; the script then
steps through the flow with the page's own actions (window.PROTO) and saves
the phone, 393 x 852 pt at 3x (1179 x 2556 px, the iPhone 15 size).

Usage:
    python3 tools/take_screenshots.py [OUT_DIR] [--flows 1,2,3] [--scale 3]

OUT_DIR defaults to ~/Downloads/meal-log-prototype-screenshots. One folder per
flow is written inside it, plus a board image with screens 1-9 left to right.
Files named "Task 5 ..." show the mixed-plate task (yesterday's rice, dal and
aloo gobi), which is the same in every flow.
With --previews, each flow folder's preview.jpg (the 3 x 3 grid shown in its
README) is refreshed too.
"""
import argparse
import base64
import json
import os
import pathlib
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import urllib.request

import websocket  # websocket-client

ROOT = pathlib.Path(__file__).resolve().parent.parent
CHROME_PATHS = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
]

# ---------------------------------------------------------------------------
# What to capture. Each step: (file label, JavaScript to run first, board slot)
# board slot = the brief's screen number (1-9) that this image stands for on the
# board, or None for in-between states that are saved but not put on the board.
# ---------------------------------------------------------------------------
SCROLL_TO = "(() => {{ const b = document.querySelector('#screen .body'); const el = document.querySelector('{sel}'); b.scrollTop = Math.max(0, el.getBoundingClientRect().top - b.getBoundingClientRect().top + b.scrollTop - {off}); }})()"
SCROLL_END = "(() => { const b = document.querySelector('#screen .body'); b.scrollTop = b.scrollHeight; })()"

CHANGE_FIRST = "for (let i = 0; i < {n}; i++) PROTO.act('qty', {{id: PROTO.S.draft.items[0].id, d: {d}}})"
# Task 5 (yesterday's plate of rice, dal and aloo gobi) starts from Home in every flow
PLATE = "PROTO.act('pickPhoto', {k: 'thali'})"

FLOWS = {
    1: {
        "folder": "flow-1-ask-before-saving",
        "name": "Flow 1 - Ask before saving",
        "steps": [
            ("Screen 1 - Home", "", 1),
            ("Screen 2 - Home scrolled to the Meal card", SCROLL_TO.format(sel="#mealCard", off=150), 2),
            ("Screen 3 - How do you want to log", "PROTO.act('openLog')", 3),
            ("Screen 4 - Camera", "PROTO.act('method', {m: 'photo'})", 4),
            ("Screen 4b - Your photos", "PROTO.act('gallery')", None),
            ("Screen 5 - Analysing, step 2 of 3", "PROTO.act('pickPhoto', {k: 'tub'}); PROTO.S.an.el = 2; PROTO.render()", 5),
            ("Screen 6a - Question 1 of 2, cream crackers", "PROTO.act('finishAnalysis')", 6),
            ("Screen 6b - Not this food", "PROTO.act('notThis', {id: PROTO.S.draft.items[0].id})", None),
            ("Screen 6c - Question 1 of 2, changed to 10", "PROTO.closeSheet(); " + CHANGE_FIRST.format(n=4, d=-1), None),
            ("Screen 6d - Question 2 of 2, glucose biscuits", "PROTO.act('answer')", None),
            ("Screen 7 - Saved, with a 10-second Undo", "PROTO.act('answer')", 7),
            ("Screen 8 - Insights, score and calories", "PROTO.act('seeInsights')", 8),
            ("Screen 9 - Insights, nutrients", SCROLL_TO.format(sel=".f1-nutr", off=16), 9),
            ("Screen 9b - Insights, end", SCROLL_END, None),
            ("Extra - Home after logging", "PROTO.act('insBack'); " + SCROLL_TO.format(sel="#mealCard", off=150), None),
            ("Task 5a - Analysing yesterday's plate", "PROTO.act('openLog'); PROTO.act('method', {m: 'photo'}); " + PLATE + "; PROTO.S.an.el = 2; PROTO.render()", None),
            ("Task 5b - Question 1 of 3, rice", "PROTO.act('finishAnalysis')", None),
            ("Task 5c - Question 1 of 3, changed to 100 g", CHANGE_FIRST.format(n=4, d=-1), None),
            ("Task 5d - Question 3 of 3, aloo gobi", "PROTO.act('answer'); PROTO.act('answer')", None),
            ("Task 5e - Saved", "PROTO.act('answer')", None),
            ("Task 5f - Insights", "PROTO.act('seeInsights')", None),
            ("Task 5g - Insights, nutrients", SCROLL_TO.format(sel=".f1-nutr", off=16), None),
        ],
    },
    2: {
        "folder": "flow-2-show-the-estimate",
        "name": "Flow 2 - Show the estimate",
        "steps": [
            ("Screen 1 - Home", "", 1),
            ("Screen 2 - Home scrolled to the Meal card", SCROLL_TO.format(sel="#mealCard", off=150), 2),
            ("Screen 3 - Log a meal sheet", "PROTO.act('openLog')", 3),
            ("Screen 4 - Camera with outlines", "PROTO.act('method', {m: 'photo'})", 4),
            ("Screen 4b - Photo tips", "PROTO.act('tips')", None),
            ("Screen 4c - Your photos", "PROTO.act('gallery')", None),
            ("Screen 5 - Analysing, foods appearing", "PROTO.act('pickPhoto', {k: 'tub'}); PROTO.S.an.el = 4.2; PROTO.render()", 5),
            ("Screen 6a - Review", "PROTO.act('finishAnalysis')", 6),
            ("Screen 6b - Review, foods", SCROLL_TO.format(sel="#rows", off=12), None),
            ("Screen 6c - Review, crackers changed to 10", CHANGE_FIRST.format(n=4, d=-1), None),
            ("Screen 7 - Meal saved, with a 10-second Undo", "PROTO.act('save')", 7),
            ("Screen 8 - Insights, estimate", "PROTO.act('seeInsights')", 8),
            ("Screen 9 - Insights, nutrients", SCROLL_TO.format(sel="#nutr", off=12), 9),
            ("Screen 9b - Insights, what we assumed", SCROLL_END, None),
            ("Extra - Home after logging", "PROTO.act('insBack'); " + SCROLL_TO.format(sel="#mealCard", off=150), None),
            ("Task 5a - Analysing yesterday's plate", "PROTO.act('openLog'); PROTO.act('method', {m: 'photo'}); " + PLATE + "; PROTO.S.an.el = 6; PROTO.render()", None),
            ("Task 5b - Review", "PROTO.act('finishAnalysis')", None),
            ("Task 5c - Review, rice changed to 100 g", CHANGE_FIRST.format(n=4, d=-1) + "; " + SCROLL_TO.format(sel="#rows", off=12), None),
            ("Task 5d - Saved", "PROTO.act('save')", None),
            ("Task 5e - Insights", "PROTO.act('seeInsights')", None),
            ("Task 5f - Insights, nutrients", SCROLL_TO.format(sel="#nutr", off=12), None),
        ],
    },
    3: {
        "folder": "flow-3-one-meal-card",
        "name": "Flow 3 - One meal card",
        "steps": [
            ("Screen 1 - Home", "", 1),
            ("Screen 2 - Home scrolled to the Meal card", SCROLL_TO.format(sel="#mealCard", off=150), 2),
            ("Screen 2b - Home, foot with the rebrand line", SCROLL_END, None),
            ("Screen 3 - Log meal sheet with coach mark", SCROLL_TO.format(sel="#mealCard", off=150) + "; PROTO.act('openLog')", 3),
            ("Screen 4 - Camera", "PROTO.act('takePhoto')", 4),
            ("Screen 4b - Photo tips", "PROTO.act('tips')", None),
            ("Screen 4c - Your recent photos", "PROTO.act('gallery')", None),
            ("Screen 5 - Meal card, analysing", "PROTO.act('pickPhoto', {k: 'tub'})", 5),
            ("Screen 6a - Meal card, review", "PROTO.act('finishAnalysis')", 6),
            ("Screen 6b - Meal card, crackers changed to 10, live summary", CHANGE_FIRST.format(n=4, d=-1) + "; " + SCROLL_TO.format(sel="#live", off=200), None),
            ("Screen 7 - Meal card, saved, with a 10-second Undo", "PROTO.act('save')", 7),
            ("Screen 8 - Meal card, insights and suggestion", "PROTO.hideToast(); " + SCROLL_TO.format(sel="#insights", off=0), 8),
            ("Screen 9 - Meal card, nutrients", SCROLL_END, 9),
            ("Extra - Home after logging", "PROTO.act('done'); " + SCROLL_TO.format(sel="#mealCard", off=150), None),
            ("Task 5a - Meal card, analysing yesterday's plate", "PROTO.act('openLog'); PROTO.act('takePhoto'); " + PLATE, None),
            ("Task 5b - Meal card, review", "PROTO.act('finishAnalysis')", None),
            ("Task 5c - Meal card, rice changed to 100 g", CHANGE_FIRST.format(n=4, d=-1) + "; " + SCROLL_TO.format(sel="#live", off=420), None),
            ("Task 5d - Meal card, saved", "PROTO.act('save')", None),
            ("Task 5e - Meal card, insights", "PROTO.hideToast(); " + SCROLL_TO.format(sel="#insights", off=0), None),
        ],
    },
}


def rosetta():
    try:
        return subprocess.run(["sysctl", "-n", "sysctl.proc_translated"], capture_output=True, text=True).stdout.strip() == "1"
    except OSError:
        return False


def free_port():
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]
    s.close()
    return port


class Chrome:
    def __init__(self):
        exe = next((p for p in CHROME_PATHS if os.path.exists(p)), None) or shutil.which("google-chrome") or shutil.which("chromium")
        if not exe:
            sys.exit("Google Chrome or Chromium is needed.")
        self.port = free_port()
        self.profile = tempfile.mkdtemp(prefix="meal-log-shots-")
        prefix = []
        if sys.platform == "darwin" and rosetta():
            prefix = ["arch", "-arm64"]  # a Python under Rosetta would otherwise start Chrome as x64 (slow)
        extra = ["--no-sandbox"] if hasattr(os, "geteuid") and os.geteuid() == 0 else []  # Chrome refuses to run as root otherwise (Linux containers)
        self.proc = subprocess.Popen(
            prefix + [exe, "--headless=new", f"--remote-debugging-port={self.port}", "--remote-allow-origins=*",
             f"--user-data-dir={self.profile}", "--no-first-run", "--no-default-browser-check",
             "--hide-scrollbars", "--force-color-profile=srgb"] + extra + ["about:blank"],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        tabs = None
        for _ in range(600):
            try:
                tabs = json.load(urllib.request.urlopen(f"http://127.0.0.1:{self.port}/json"))
                if any(t["type"] == "page" for t in tabs):
                    break
            except OSError:
                pass
            time.sleep(0.1)
        if not tabs:
            sys.exit("Chrome did not start (no DevTools port after 60 s).")
        page = next(t for t in tabs if t["type"] == "page")
        self.ws = websocket.create_connection(page["webSocketDebuggerUrl"], timeout=60)
        self.msg_id = 0
        self.console = []

    def send(self, method, **params):
        self.msg_id += 1
        mid = self.msg_id
        self.ws.send(json.dumps({"id": mid, "method": method, "params": params}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get("id") == mid:
                if "error" in msg:
                    raise RuntimeError(f"{method}: {msg['error']}")
                return msg.get("result", {})
            if msg.get("method") == "Runtime.exceptionThrown":
                self.console.append("exception: " + json.dumps(msg["params"]["exceptionDetails"])[:600])
            elif msg.get("method") == "Runtime.consoleAPICalled" and msg["params"]["type"] in ("error", "warning"):
                self.console.append(msg["params"]["type"] + ": " + " ".join(str(a.get("value", a.get("description", ""))) for a in msg["params"]["args"])[:600])
            elif msg.get("method") == "Log.entryAdded" and msg["params"]["entry"]["level"] in ("error", "warning"):
                e = msg["params"]["entry"]
                self.console.append(f"log {e['level']}: {e.get('text', '')} {e.get('url', '')}"[:600])

    def js(self, expr):
        r = self.send("Runtime.evaluate", expression=expr, awaitPromise=True, returnByValue=True)
        if "exceptionDetails" in r:
            raise RuntimeError(f"JS error in: {expr[:120]}\n{json.dumps(r['exceptionDetails'])[:800]}")
        return r.get("result", {}).get("value")

    def settle(self):
        """Wait for fonts and images, then two animation frames."""
        self.js("""(async () => {
            await document.fonts.ready;
            await Promise.all(Array.from(document.images).map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            return true; })()""")
        time.sleep(0.15)

    def close(self):
        try:
            self.ws.close()
        finally:
            self.proc.terminate()
            try:
                self.proc.wait(5)
            except subprocess.TimeoutExpired:
                self.proc.kill()
            shutil.rmtree(self.profile, ignore_errors=True)


def shoot_flow(ch, n, out_root, scale):
    spec = FLOWS[n]
    out = out_root / spec["folder"]
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    url = (ROOT / spec["folder"] / "index.html").as_uri() + "#shots"
    ch.send("Emulation.setDeviceMetricsOverride", width=1280, height=960, deviceScaleFactor=scale, mobile=False)
    ch.send("Page.navigate", url=url)
    for _ in range(100):
        time.sleep(0.1)
        try:
            if ch.js("document.readyState === 'complete' && !!window.PROTO"):
                break
        except RuntimeError:
            pass
    # rectangular phone (screenshots of a real phone have no rounded corners)
    ch.js("document.querySelector('.phone').style.borderRadius = '0'")
    saved = []
    for label, script, slot in spec["steps"]:
        if script:
            ch.js(script)
        ch.settle()
        rect = ch.js("(() => { const r = document.querySelector('#phone').getBoundingClientRect(); return {x: r.x, y: r.y, w: r.width, h: r.height}; })()")
        shot = ch.send("Page.captureScreenshot", format="png", captureBeyondViewport=False,
                       clip={"x": rect["x"], "y": rect["y"], "width": rect["w"], "height": rect["h"], "scale": 1})
        name = f"Flow {n} - {label}.png"
        (out / name).write_bytes(base64.b64decode(shot["data"]))
        saved.append((name, slot))
        print(f"  {name}")
    return out, saved


def board_picks(out, saved):
    picks = {}
    for name, slot in saved:
        if slot and slot not in picks:
            picks[slot] = name
    return [(k, out / picks[k]) for k in sorted(picks)]


def label_font(size):
    from PIL import ImageFont
    for f in ["/System/Library/Fonts/SFNS.ttf", "/System/Library/Fonts/Helvetica.ttc", "/Library/Fonts/Arial.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]:
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            continue
    return ImageFont.load_default()


def make_preview(n, out, saved, dest):
    """3 x 3 grid of screens 1-9 at 1x, for the flow's README."""
    from PIL import Image, ImageDraw
    items = board_picks(out, saved)
    w, h, gap, pad, lab = 393, 852, 28, 28, 46
    grid = Image.new("RGB", (pad * 2 + 3 * w + 2 * gap, pad * 2 + 3 * (h + lab) + 2 * gap), "#EEF1F6")
    draw = ImageDraw.Draw(grid)
    font = label_font(26)
    for i, (k, path) in enumerate(items):
        x = pad + (i % 3) * (w + gap)
        y = pad + (i // 3) * (h + lab + gap)
        im = Image.open(path).convert("RGB").resize((w, h), getattr(Image, 'Resampling', Image).LANCZOS)
        mask = Image.new("L", (w, h), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, w - 1, h - 1], radius=40, fill=255)
        draw.text((x + 4, y), f"Flow {n} - Screen {k}", fill="#0D1925", font=font)
        grid.paste(im, (x, y + lab), mask)
    grid.save(dest, quality=82, optimize=True)
    print(f"  {dest}")


def make_board(n, out, saved):
    """Screens 1-9 left to right, each labelled "Flow n - Screen m", as in the brief."""
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        print("  (Pillow not installed: skipping the board image)")
        return
    imgs = [(k, Image.open(p).convert("RGB")) for k, p in board_picks(out, saved)]
    w = 590
    h = round(imgs[0][1].height * w / imgs[0][1].width)
    gap, top, side, bottom = 56, 150, 70, 70
    board = Image.new("RGB", (side * 2 + len(imgs) * w + (len(imgs) - 1) * gap, top + h + bottom), "#EEF1F6")
    draw = ImageDraw.Draw(board)
    font = label_font(40)
    for i, (k, im) in enumerate(imgs):
        x = side + i * (w + gap)
        im = im.resize((w, h), getattr(Image, 'Resampling', Image).LANCZOS)
        mask = Image.new("L", (w, h), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, w - 1, h - 1], radius=64, fill=255)
        draw.rounded_rectangle([x - 12, top - 12, x + w + 11, top + h + 11], radius=76, fill="#11141A")
        board.paste(im, (x, top), mask)
        draw.text((x + 6, top - 92), f"Flow {n} - Screen {k}", fill="#0D1925", font=font)
    path = out / f"Flow {n} - Screens 1-9.png"
    board.save(path, optimize=True)
    print(f"  {path.name}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("out", nargs="?", default=str(pathlib.Path.home() / "Downloads" / "meal-log-prototype-screenshots"))
    ap.add_argument("--flows", default="1,2,3")
    ap.add_argument("--scale", type=float, default=3)
    ap.add_argument("--previews", action="store_true", help="also refresh preview.jpg in each flow folder")
    a = ap.parse_args()
    out_root = pathlib.Path(a.out).expanduser()
    ch = Chrome()
    try:
        ch.send("Page.enable")
        ch.send("Runtime.enable")
        ch.send("Log.enable")
        for n in [int(x) for x in a.flows.split(",")]:
            print(FLOWS[n]["name"])
            ch.console.clear()
            out, saved = shoot_flow(ch, n, out_root, a.scale)
            make_board(n, out, saved)
            if a.previews:
                make_preview(n, out, saved, ROOT / FLOWS[n]["folder"] / "preview.jpg")
            if ch.console:
                print("  console:\n   " + "\n   ".join(ch.console))
    finally:
        ch.close()
    print(f"Saved to {out_root}")


if __name__ == "__main__":
    main()
