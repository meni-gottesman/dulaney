# Nevis Affair — McKenna &amp; Jaden

A cinematic, editorial wedding website for an intimate destination wedding at the
**Four Seasons Resort Nevis**, Saturday **14 November 2026**.

It reuses the theme and content from your Lovable "Nevis Affair" project (warm
ivory/ink palette with a quiet **Caribbean‑blue** accent, Cormorant Garamond + Jost,
quiet‑luxury editorial layout) with one restrained signature gesture from the
reference site — the envelope opening:

- ✉️ **Envelope opening** — a wax‑sealed gate that breaks open and hands off to a
  masked reveal of the names over the hero
- 🎞️ **Cinematic hero** — a full‑bleed engagement photo, names anchored in the lower
  third, a slow ken‑burns and subtle scroll parallax for depth
- 🖼️ **Engagement gallery** — an editorial masonry with a tap‑to‑enlarge **lightbox**
  (swipe / arrows / keyboard)
- ⏳ **Countdown** to the day (days · hours · minutes), a still editorial **Save the Date**
- 🔊 **Ambient sound** — **off by default**, opt‑in via the control bottom‑right (a
  quiet ring hints at it on entry); choice remembered across visits
- 📜 Scroll reveals, editorial **itinerary**, full **RSVP**

The palette is locked to a single light identity (no surprise dark mode), so the site
looks the same in every guest's hand and matches the printed invitation.

Everything is in a **single, self‑contained `index.html`** — no build step, no
dependencies (only Google Fonts over the network). Double‑click to open, or host it
anywhere static (Netlify, Vercel, GitHub Pages, S3, …).

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

## Make it yours — swap points

All edits are plain HTML/CSS in `index.html`. Search for these markers:

### 1. Names, dates, copy, itinerary
All text is written directly in the page sections (Hero, Invitation, Welcome,
Destination, Travel, Stay, Dress Code, Itinerary, Registry, RSVP, Closing). Edit in
place. The ceremony countdown target lives in the script:
```js
const target = new Date("2026-11-14T17:00:00-04:00").getTime(); // 5pm AST
```

### 2. Engagement photos (already integrated)
The real engagement photos are wired in and live in `assets/`:

| File | Where it's used |
|---|---|
| `hero.jpg` | Full-screen hero (the yacht at golden hour) |
| `g1.jpg … g8.jpg` | The "A Glimpse of Us" masonry gallery |
| `closing.jpg` | The "We'll see you on the island" footer |

All were resized/compressed for fast mobile loading (long-edge ~1600–2200px,
~2.6 MB for the whole set; the gallery lazy-loads as you scroll). The originals
remain untouched in your Downloads zip.

- **Swap the hero:** replace `assets/hero.jpg` (a landscape ~2000px image works best),
  or point `--hero-photo` in `:root` at a different file.
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

### 5. Registry links
In the **Registry** section, replace the `href="#"` values with your real registry URLs.

### 6. RSVP backend (currently client‑side)
RSVPs are stored in the browser's `localStorage` and a confirmation is shown. To
collect them for real, edit `submitRSVP(data)` (marked `--- INTEGRATION HOOK ---`)
to `POST` `data` to your endpoint — e.g. your Lovable/Supabase function, a Google
Form/Sheet, Formspree, or a simple serverless function. The `data` object contains:
`guestName, guestEmail, attending, guests, meal, cries, note`.

### 7. Accommodations email
The Stay section shows a placeholder booking address
(`reservations@fourseasons-nevis.example`). Replace it with the resort's real
reservations contact before sharing.

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

Fonts: **Cormorant Garamond** (display) + **Jost** (labels/UI). Radius `0.25rem`.
Dark mode, mobile‑first, and reduced‑motion are all supported.

See `SPEC.md` for the full content + design source of truth.
