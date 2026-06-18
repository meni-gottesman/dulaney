# The Dulaney Wedding — Jaden &amp; McKenna

A cinematic, editorial wedding website for an intimate destination wedding at the
**Four Seasons, Nevis** (West Indies), **May 6–10, 2027** — ceremony Saturday, May 8.
Built to reflect the printed invitation: *Bon Voyage · For a select few*.

### 🌐 Live
**https://meni-gottesman.github.io/dulaney/**
Source repo: `github.com/meni-gottesman/dulaney` (GitHub Pages, `main` branch).
The printed invitation lists **www.dulaneys.com** — see *Connecting dulaneys.com* below
to point that domain here.

> Details on this site are taken from the invitation. A couple of inferred items
> (name order, the exact ceremony day, the day‑by‑day itinerary) are flagged at the
> bottom — please confirm them.

It reuses the theme and content from your Lovable "Nevis Affair" project (warm
ivory/ink palette with a quiet **Caribbean‑blue** accent, Cormorant Garamond + Jost,
quiet‑luxury editorial layout) with one restrained signature gesture from the
reference site — the envelope opening:

- ✉️ **Opening film** — a **full‑screen, fully opaque** takeover (nothing else visible):
  the couple's own cream handmade‑paper envelope, sealed with a red **"J&M" wax heart**,
  opens on a short muted **video** over an ivory field, then dissolves to the hero. It
  auto‑plays for a hands‑free "movement on open," falls back to tap, and to a static
  poster under reduced‑motion; a returning visitor skips straight in (per‑session)
- 🎞️ **Cinematic hero** — a full‑bleed engagement photo, names anchored in the lower
  third, a slow ken‑burns and subtle scroll parallax for depth
- 💛 **Scratch to reveal** — the Save‑the‑Date hides under a refined charcoal panel you
  scratch (or press Enter) to reveal the dates
- 🖼️ **Engagement gallery** — an editorial masonry with a tap‑to‑enlarge **lightbox**
  (swipe / arrows / keyboard)
- ⏳ **Countdown** to the day (days · hours · minutes)
- 🔊 **Ambient sound** — **off by default**, opt‑in via the control bottom‑right (a
  quiet ring hints at it on entry); choice remembered across visits
- 📜 Scroll reveals, editorial **itinerary**, full **RSVP**

The palette is locked to a single light identity (no surprise dark mode), so the site
looks the same in every guest's hand and matches the printed invitation.

### Structure — three pages, shared styling
A minimal home, with the details on their own pages (no build step; only Google Fonts
over the network):

| File | What's on it |
|---|---|
| `index.html` | **Home** — envelope gate → hero → Save‑the‑Date (scratch) → RSVP → closing |
| `details.html` | Itinerary · Travel · Stay · Dress code · Registry |
| `gallery.html` | Engagement photos + lightbox |
| `assets/style.css` | All styling (shared by every page) |
| `assets/app.js` | All behaviour (gate, scratch, lightbox, RSVP… each guarded so it no‑ops where absent) |

Edit text directly in the page's HTML; edit look‑and‑feel once in `assets/style.css`.

---

## Run it

- **Quickest:** double‑click `index.html`.
- **Local server (recommended for testing audio/fonts):**
  ```
  cd nevis-affair
  python3 -m http.server 8000
  # open http://localhost:8000
  ```

> Note: on macOS, a server *launched from inside Claude* can't read `~/Desktop`
> due to privacy protections — that's why the live preview was served from a copy
> in `/tmp`. Running the command yourself in Terminal works fine.

---

## Update the live site

The site is hosted on **GitHub Pages** from this folder's git repo. To publish a change:

```
cd nevis-affair
# edit index.html / swap an asset…
git add -A && git commit -m "update" && git push
```

GitHub rebuilds in ~1 minute → https://meni-gottesman.github.io/dulaney/

### Connecting dulaneys.com (the URL on the invitation)
1. In the repo → **Settings → Pages → Custom domain**, enter `www.dulaneys.com` (or `dulaneys.com`) and save. (This writes a `CNAME` file.)
2. At your domain registrar, add DNS:
   - `www` → **CNAME** → `meni-gottesman.github.io`
   - apex `dulaneys.com` → four **A** records: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
3. Back in Pages, tick **Enforce HTTPS** once the cert issues (a few minutes).

---

## Make it yours — swap points

All edits are plain HTML/CSS in `index.html`. Search for these markers:

### 1. Names, dates, copy, itinerary
Text lives directly in each page. **`index.html`** holds the home copy — Hero,
Save‑the‑Date (the scratch reveal), RSVP and the Closing. **`details.html`** holds
Itinerary, Travel, Stay, Dress code and Registry. Edit in place. The ceremony
countdown target lives in `assets/app.js`:
```js
const target = new Date("2027-05-08T16:00:00-04:00").getTime(); // 4pm AST, Sat May 8
```

### 2. Engagement photos (already integrated)
Every photo is **only of the two of them** — chosen deliberately, none of empty
scenery. The set lives in `assets/`:

| File | Source | Where it's used / why |
|---|---|---|
| `hero.jpg` / `hero-m.jpg` | 1645 | Full‑screen hero — the couple on the bow as a **dolphin surfaces** below them. The "wow": intimacy, a wild moment, and open water. Type sits in the lower third over that water; on phones (the QR target) the dolphin is in frame. |
| `closing.jpg` | 2366 | The "We'll see you on the island" farewell — the two of them at golden hour, her hand on his cheek, the boat's wake behind. A deliberately *different* register from the hero (sunset vs midday, a tender close‑up) so the first and last images never echo. Cropped at 36% from top. |
| `opening.mp4` / `opening.webm` / `opening-poster.jpg` | Firefly clip | The entry‑gate film (above). 1080×1920, warm‑graded to ivory, trimmed to the sealed→open beat, muted. To restyle, re‑encode from the source in `~/Downloads` (see the note below the table). |
| `g1 … g6` | 0420 · 0086 · 0942 · 0320 · 1932 · 0778 | Gallery, sequenced as an arc — *the place → tenderness → joy → golden romance → a still portrait → present, to camera* — with colour and black‑and‑white alternating. None repeat the hero/closing bow‑embrace. |

All were resized/compressed for fast mobile loading (long edge 1500–2400px,
~2.3 MB for the whole set; the gallery lazy‑loads as you scroll). The originals
remain untouched in your `Dulaney Engagement.zip`.

- **Swap the hero:** replace `assets/hero.jpg` **and** `assets/hero-m.jpg` (a **portrait**
  image works best — the type sits in the lower third, so leave room there). Keep the
  `srcset`/`width`/`height` on the hero `<img>` in `index.html` matching the new sizes.
- **Swap a gallery photo:** replace the corresponding `assets/gN.jpg`. To add/remove
  tiles, edit the `<img>` list in the **Gallery** section (the masonry reflows
  automatically). Keep the `width`/`height` attributes roughly matching the new
  image so the layout doesn't jump.
- **Swap the footer:** replace `assets/closing.jpg`.
- **Re-optimize new images** with the macOS built-in (no installs):
  `sips -Z 1800 big-photo.jpg --out assets/gX.jpg` (then they're web-ready).

### 4. Ambient music (instead of the generated pad)
Drop an MP3 in `assets/` and uncomment the source in the `<audio id="audioEl">` tag:
```html
<audio id="audioEl" loop preload="none">
  <source src="assets/ambient.mp3" type="audio/mpeg" />
</audio>
```
The site automatically prefers a real track over the synthesized pad. **Sound is off
by default** (consent‑first, since the site is reached by surprise QR scan) — a quiet
ring around the control bottom‑right hints at it on entry, and a guest's choice is
remembered across visits. To greet guests with music instead, change the default in
`startAudio()` from `"off"` back to `"on"`.

### 5. Registry links — still placeholders ⚠️
The invitation didn't include registry info, so the two **Registry** links point at
`#registry` (a harmless no‑op). Replace them with real URLs when ready, or remove the
section. (Marked `SWAP:` in the code.)

### 6. RSVP backend (currently client‑side)
RSVPs are stored in the browser's `localStorage` and a confirmation is shown. To
collect them for real, edit `submitRSVP(data)` (marked `--- INTEGRATION HOOK ---`)
to `POST` `data` to your endpoint — e.g. a Google Form/Sheet, Formspree, or your
existing Lovable/Supabase function. The `data` object contains:
`guestName, guestEmail, attending, guests, meal, note`.

### 7. Contacts (from the invitation — already wired)
Pulled straight from the printed suite: **Resort — Lynn Vosloo · 239.628.6269**
(Stay section, tappable `tel:` link) and **Flight — Brett Lafleur · 402.677.6578**
(Travel section). Update these two if they change. Room block is held under **Dulaney**,
reserve by **July 23, 2026**.

---

## Theme reference (from your Lovable project)

| Token | OKLCH | Role |
|---|---|---|
| `--ivory` | `0.962 0.012 90` | page background |
| `--soft` | `0.985 0.006 90` | cards / near‑white |
| `--ink` | `0.205 0.006 75` | text (warm near‑black) |
| `--ocean` | `0.40 0.072 232` | primary Caribbean accent |
| `--turquoise` | `0.66 0.066 192` | accent |
| `--palm` | `0.45 0.05 152` | accent |

Fonts: **Cormorant Garamond** (display) + **Jost** (labels/UI). Corners are square
(`--radius: 0`) for a crisp, editorial feel. The palette is **locked to one light
identity** — no dark mode — so the site looks the same in every guest's hand and
matches the printed invitation. Mobile‑first and `prefers-reduced-motion` are honoured.
