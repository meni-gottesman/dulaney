# The Dulaney Wedding — Jaden &amp; McKenna

A cinematic, editorial wedding website for an intimate destination wedding at the
**Four Seasons, Nevis** (West Indies), **May 6–10, 2027** — ceremony Friday, May 7 (5 PM, Oceanfront 18th Lawn).
Built to reflect the printed invitation: *Bon Voyage · For a select few*.

### 🌐 Live
**https://destinationdulaney.com/** — Namecheap domain → GitHub Pages, free Let's Encrypt
SSL, `www` and `http` both redirect to the canonical https apex.
Source repo: `github.com/meni-gottesman/dulaney` (GitHub Pages, `main` branch).

> ⚠️ **The URL printed on the invitation must be `destinationdulaney.com`.**
> An early draft of this README assumed *dulaneys.com*. That domain belongs to an
> unrelated third party (registered 2004, GoDaddy) and serves someone else's live
> site — anything printed with it would send guests to a stranger.

> ⚠️ **Keep the registrant email verified.** ICANN requires the registrant contact on a
> new domain to be confirmed within 15 days. It lapsed once (2026‑07‑26) and Namecheap
> suspended DNS: every URL went dark, including the github.io fallback. Clicking the
> verification link in Namecheap's email restored it within minutes. Watch for those
> emails, especially around renewal.

> Details on this site are taken from the invitation. A couple of inferred items
> (name order, the exact ceremony day, the day‑by‑day itinerary) are flagged at the
> bottom — please confirm them.

It reuses the content from your Lovable "Nevis Affair" project in a **single dark
theme** (deep warm near‑black, warm‑ivory type, a brightened ocean/turquoise accent,
Cormorant Garamond + Jost, quiet‑luxury editorial layout) with one restrained gesture from the
reference site — the envelope opening:

- ✉️ **Opening film** — a **full‑screen** takeover of the couple's **navy** handmade‑paper
  envelope, sealed with a **bronze "J&M" wax heart**. It **plays only when tapped** (poster +
  "Tap to open" until then), **silently** (ambient audio is currently disabled); the envelope opens,
  warm light blooms, the frame **whites out**, and the **site fades in from white** while
  the sound **crossfades into the looping music**. `object-fit: cover` fills the screen
  top‑to‑bottom on every size (desktop sees the whole envelope; phones fill with the seal).
  A returning visitor skips straight in (per‑session); reduced‑motion holds on the poster.
- 🎞️ **Cinematic hero** — a full‑bleed engagement photo, names anchored in the lower
  third, a slow ken‑burns and subtle scroll parallax for depth
- 💛 **Three hearts, scratch to reveal** — the Save‑the‑Date hides Day · Month · Year
  under three wax‑heart scratch‑offs (or press Enter); all three open a live **countdown**
- 🖼️ **Engagement gallery** — an editorial masonry with a tap‑to‑enlarge **lightbox**
  (swipe / arrows / keyboard)
- 🔊 **Ambient music** — `assets/ambient.mp3` is **on by default**: the film's real
  envelope‑opening sound crossfades into the song on the open‑tap, plays once, and ends
  on the song's own fade‑out. Mute any time via the control bottom‑right; a guest's
  choice is remembered across visits
- 📜 Scroll reveals, editorial **itinerary**, full **RSVP**

The palette is locked to a single dark identity (no light/dark toggle), so the site
looks the same in every guest's hand.

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

GitHub rebuilds in ~1 minute → https://destinationdulaney.com/

### The custom domain (done — 2026-07-11)
1. Repo → **Settings → Pages → Custom domain** = `destinationdulaney.com` (writes `CNAME`). ✅ done
2. At your domain registrar, add DNS:
   - `www` → **CNAME** → `meni-gottesman.github.io`
   - apex `destinationdulaney.com` → four **A** records: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
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
const target = new Date("2027-05-07T17:00:00-04:00").getTime(); // 5pm AST, Fri May 7
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

### 4. Ambient music + the film's own sound
Two audio layers, crossfaded:
- The gate `<video>` is **muted**. iOS grants audio to only one element per gesture, so
  everything you hear comes from the single `<audio id="audioEl">`.
- **`assets/ambient.mp3`** (3:18) is one baked file: the film's own recorded
  envelope‑opening sound (0–5 s) **crossfades** (5–7 s) into *"Just the Two of Us"*,
  saxophone cover by **Brendan Mills**, used with his permission. The song runs to its
  own composed fade‑out; there is **no loop**.

The crossfade is timed so the sax is swelling exactly as the 7 s film blooms to white and
the site reveals (`SONG_FADE_START = 5.4` in `app.js` snaps the audio there if it drifts).
It's **on by default**; the control bottom‑right mutes/unmutes and the choice is
remembered; playback pauses when the guest leaves the tab.

**To swap the song**, rebuild the file — foley from the opening film, crossfaded into the
new track, both loudness‑matched:

```
ffmpeg -t 7.0 -i opening-source.mp4 -vn -c:a pcm_s16le foley.wav
ffmpeg -i foley.wav -ss <song-start> -i new-song.mp3 \
  -filter_complex "[0:a]loudnorm=I=-20:TP=-2:LRA=11,aresample=44100[v];\
                   [1:a]loudnorm=I=-20:TP=-2:LRA=11,aresample=44100[s];\
                   [v][s]acrossfade=d=2.0:c1=tri:c2=tri[a]" \
  -map "[a]" -c:a libmp3lame -q:a 5 assets/ambient.mp3
```

Then bump `ambient.mp3?v=N` in `index.html`. To make audio **off by default**, change
`let want = "on"` / `let pref = "on"` to `"off"` in `assets/app.js`.

### 5. Registry — LIVE ✅
The invitation didn't include registry info, so the two **Registry** links point at
`#registry` (a harmless no‑op). Replace them with real URLs when ready, or remove the
section. (Marked `SWAP:` in the code.)

### 6. RSVP — guest list + Hosts admin (Google Sheet backend)
The RSVP lets guests reply, **say who's coming with them**, and see a public
*"who's coming"* list. The couple get a **password‑protected Hosts panel** (the
**Hosts** link in the footer, or `…/#admin`) to edit/remove anyone and **download a
CSV** — and the data lives in a plain **Google Sheet they own** (the simplest thing
to manage). The admin password is checked **on Google's servers**, so it's never
exposed in the page.

**Out of the box it runs in DEMO mode** (saves to that one browser, demo password
`dulaney2027`) so you can show the couple the whole flow. To make it **live & shared**:

1. Create a Google Sheet (visit `sheets.new`) — this is the guest list. Rename tab 1 to **`RSVPs`**.
2. **Extensions → Apps Script**, delete the sample, and paste **`rsvp-backend.gs`** (in this repo).
3. In that script set `ADMIN_PASSWORD` to the password you'll give the couple.
4. **Deploy → New deployment → Web app**, *Execute as: Me*, *Who has access: Anyone*. Authorize, copy the **`…/exec` URL**.
5. In **`assets/app.js`**, set `RSVP_ENDPOINT = "that /exec URL"`. Commit & push. Done — replies now flow into the Sheet, and the Hosts password is the one from step 3.

> Notes: the public list shows only **name · party size · companions** — never emails
> or notes. The couple can also just open the Sheet directly and use **File → Download
> → CSV**. To change the password later, edit `ADMIN_PASSWORD` and re‑deploy a new
> version (instructions are in `rsvp-backend.gs`). Apps Script is the friendliest
> no‑server option for a non‑technical owner; once deployed, confirm a test reply
> lands in the Sheet.

### 7. Contacts & deadlines (already wired)
Stay section: room block held under **“Dempsey–Dulaney Celebration”**; full rates
(Ocean View Suite $525/night, transfers $180/pp, all-inclusive F&B $390/pp/day);
reservations **(869) 469-1111** and **reservations.nev@fourseasons.com** (both tappable);
resort brochure PDF + resort site linked. Travel section: flight assistance
**Brett Lafleur** (blafleur3386@gmail.com); travel insurance via **Lynn Vosloo**
(lvosloo@expediacruises.com · (877) 781-7447). RSVP deadlines:
reply by **September 1**, room-block deposit by **November 1**, balance by **February 1, 2027**.
These dates also live in `assets/dulaney-nevis-2027.ics` (the guest "add to calendar" file) —
after changing any of them, re-run `python3 tools/make_ics.py` to regenerate it.
Update these if they change. The resort email is `reservations.nev@fourseasons.com`, confirmed against page 26 of the
Four Seasons brochure hosted at `assets/fs-nevis-brochure-2026.pdf`.

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
(`--radius: 0`) for a crisp, editorial feel. The palette is **locked to one dark
identity** — no light/dark toggle — so the site looks the same in every guest's hand.
Mobile‑first and `prefers-reduced-motion` are honoured.
