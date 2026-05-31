# HEWN
### A quiet daily instrument for two habits

**Positioning:** Not a tracker. A small object you uncover, one day at a time, by eating enough protein and moving enough. Two numbers, one stone.

---

## 1. Product concept

Most habit apps are *additive*: they pile up points, streaks, badges, charts. For an ADHD brain this is a trap — the reward system is noisy, the failure states are punishing, and a single broken streak can collapse the whole structure. The dopamine economy of streaks is exactly the thing that burns out.

Hewn inverts the model. Progress is **subtractive**. You begin each day with a rough, unworked block of stone. Protein and movement don't *add* to a score — they *remove* roughness, revealing a refined form that was always inside the material. You are not collecting. You are uncovering.

The app does two things and refuses to do anything else:

- **Protein** — target 100 g/day
- **Movement** — target 30 min/day

That's the entire surface area. No calories, no macros, no weight on the home screen, no feed, no challenges, no streaks, no guilt. The home screen is two readouts and one stone.

**Who it's for:** Adults with ADHD who shut down in front of dashboards. They need (a) the next action to be obvious, (b) logging to take under 3 seconds, (c) feedback that is calm rather than celebratory, and (d) a layout that never moves, so it lives in spatial memory and survives executive-function bad days.

---

## 2. The central design decision (read this first)

The brief contains one unresolved tension, and it's the most important thing to get right:

> A sculpture that becomes *more refined over time* implies permanent accumulation. But protein and movement are *daily* habits that reset at midnight.

If the stone keeps refining forever, a single day stops mattering — good for anti-shame, bad for daily feedback. If it resets to rough every morning, the day-to-day loop is clear, but it can feel Sisyphean: *"I carved it and now it's gone."*

**Resolution — a two-layer system:**

1. **Today's stone (the home screen).** Each morning a fresh rough block appears. Today's protein and movement carve *this* block. This gives a clean, immediate, same-every-day loop. The stone is the day.
2. **The Shelf (hidden, deeper).** When a day is completed, that finished piece is *kept* — it moves to a quiet collection of objects, like a museum vitrine or a mantel of small carvings. Nothing you finish is ever lost.

This resolves both needs. The daily loop is legible (one stone = one day). Long-term progress is real and emotional, but expressed as *a growing collection of finished objects* rather than one endlessly inflating thing. And critically: **a missed day is simply a stone that didn't get finished — it just isn't on the shelf.** There is no red mark, no broken chain, nothing to "lose." Recovery is structurally free.

> Optional refinement to test: a faint **patina** — consistent recent days let the morning block start from a slightly warmer, less-raw base, so steadiness is rewarded without ever introducing a streak counter. I'd ship without it first; it adds state and can reintroduce a soft "I broke it" feeling. Keep it in your back pocket.

The rest of this concept assumes the two-layer model.

---

## 3. UX principles

1. **Two indicators, everything else orbits them.** If a screen element doesn't serve protein, movement, or the stone, it doesn't exist.
2. **Under 3 seconds to log.** Open → tap one chip → done, with calm confirmation. No modals on the happy path.
3. **The layout never moves.** Protein is always top, movement always bottom, stone always center. Spatial memory does the navigation so working memory doesn't have to.
4. **Roughness is a beginning, not a failure.** The unworked stone is beautiful on its own. Low progress is never rendered as damage.
5. **No streaks, so there is nothing to break.** The single most important anti-shame decision. Consistency shows up as a fuller shelf, never as a number at risk.
6. **Calm confirmation, never celebration.** A soft material change and a light haptic. No confetti, no sound, no "You crushed it!"
7. **Enough is a feature.** When a target is met, the app says *enough for now* and stops pulling. It does not encourage overshooting. This matters for ADHD compulsivity.
8. **Big targets for impulsive hands.** Quick-add chips are large, in the thumb zone, forgiving of mis-taps (easy undo).
9. **Forgetting is normal.** "Add later" requires no date picker, no friction. The default action always logs to today.
10. **Decisions are pre-made.** Targets default to 100 g / 30 min. Reminders default to one gentle invitation or none. The user can change everything but is never *required* to choose.

---

## 4. The artifact system

**Primary form (default):** a vertical, hand-sized abstract object in pale stone — somewhere between a seed, an egg, and a standing bird. Brancusi lineage (think *Beginning of the World*, *Bird in Space*), resting on a thin plinth, lit like a museum object. Vertical reads well on a phone and gives a natural top/bottom structure that mirrors the two indicators.

**How the two metrics carve it** (one object, two dimensions of refinement):

| Metric | What it refines | Visual reading |
|---|---|---|
| **Protein** | the *material* — substance, warmth, polish, sheen | surface goes from chalky/raw to dense and softly lustrous; light starts to wrap the form |
| **Movement** | the *form* — edges, planes, silhouette, definition | the carved shape sharpens; rough facets resolve into clean planes; the silhouette gets precise |

A useful spatial metaphor: protein descends from above (nourishment), movement rises from below (effort), and the form emerges in the middle where they meet.

**State model (drives all rendering):**
- `roughness` 0→1 (inverse of protein progress)
- `definition` 0→1 (movement progress)
- `polish` 0→1 (protein progress)
- `lighting` baseline → resolved (only on full completion)

**Series (optional, low-priority):** three forms total — the Seed (default), the Standing Form (Noguchi-leaning, organic stone), and the Vessel (a small carved bowl/totem). Choosing is buried in settings; one default ships so nobody is forced to decide.

---

## 5. Screens

### 5.1 Home screen

**Purpose:** Show today's two numbers, the stone, and the fastest possible way to add to either. This is 95% of all app usage.

**Layout (stacked, fixed forever):**
```
┌───────────────────────────┐
│                    ⚙       │  tiny settings glyph, top-right
│  PROTEIN                   │
│  64 / 100 g                │  large editorial number
│  ───────────●─────         │  thin progress line
│  [ +10 ] [ +20 ] [ +30 ]   │  quick-add chips
│                            │
│            ◗◖              │
│          ( stone )         │  hero artifact, ~50% of height
│            ▁▁▁             │  thin plinth
│                            │
│  MOVEMENT                  │
│  18 / 30 min               │
│  ──────●──────────         │
│  [ +5 ] [ +10 ] [ +15 ]    │  thumb-zone, easiest reach
└───────────────────────────┘
```

**Main UI elements:** two metric blocks (label · current/target · thin progress line · three chips), the stone in the center, a 1-pt settings glyph. Nothing else.

**Microcopy:** `Protein 64 / 100 g` · `Movement 18 / 30 min` · chips read `+10` `+20` `+30` and `+5` `+10` `+15`.

**Visual details:** numbers in display type, target in a muted weight (`64` ink, `/ 100 g` at ~40% opacity). Progress line is hairline (1–1.5 pt), single accent color, ~30% fill at 64/100. The stone is the only saturated, dimensional thing on screen; everything else is flat, monochrome, generous whitespace. Protein chips sit upper-mid (protein logging is bursty/infrequent); movement chips sit at the very bottom in the thumb arc.

**Interaction notes:** chips act *in place* — no modal. Tap and the number tweens, the line advances, the relevant part of the stone refines, a light haptic fires, `Logged` fades in and out (~1 s). Tapping the stone (or long-press anywhere) opens the centered Quick Add overlay for one-handed reach and custom amounts.

---

### 5.2 Quick add interaction state

**Purpose:** Sub-3-second logging, including from the thumb without reaching, plus the rare custom amount and "earlier today."

**Layout:** a low, centered sheet that rises ~⅓ of the screen, with the stone still visible above it. Two rows: protein chips, movement chips. A single small `•••` reveals a quiet stepper for custom values.

**Main UI elements:** the two chip rows (mirrors home), an optional stepper (− value +), an `Earlier today` toggle (no date picker — just "now / earlier"), a generous dismiss area.

**Microcopy:** `Add protein` · `Add movement` · `Logged` · on the stepper, `36 g` · toggle reads `Earlier today`.

**Visual details:** soft-glass sheet over the dimmed home; the stone keeps breathing behind it. Chips ≥ 56–64 pt tall, wide tap targets, rounded.

**Interaction notes:** every tap is instantly undoable — a brief `Undo` appears beside `Logged`. The default always logs to *today*; "earlier today" is the only time concession and never blocks the fast path. Sheet auto-dismisses after a log, or stays if the user keeps tapping (impulsive multi-log is fine).

---

### 5.3 Completed day state

**Purpose:** Mark that the day is whole — quietly — and stop pulling for more.

**Layout:** identical to home (the layout never moves). Both readouts at target, both lines full, the stone in its resolved state.

**Main UI elements:** finished stone, both metrics complete, one line of microcopy. No new buttons appear except a quiet `Saved to your collection`.

**Microcopy:** `Enough for now` (primary) · `Today is complete` · `Saved to your collection`. If the user keeps adding past target: `Logged` still, but the headline stays `Enough for now` — never `More!`

**Visual details:** the only real "moment" in the app. The stone performs one slow turntable rotation (~4 s) to present itself, the lighting warms and resolves, surfaces reach full polish and definition. A single soft success haptic. No sound, no particles, no color burst — the change *is* the lighting.

**Interaction notes:** completion is calm and terminal for the day. The finished piece animates to the Shelf. Over-target logging is allowed but never encouraged or counted as "extra."

---

### 5.4 Missed / low-progress day (no guilt)

**Purpose:** Make a near-empty day, or a return after days away, feel neutral and easy to start.

**Layout:** home, unchanged. The stone is simply rough. No badges, no red, no "0/100 ❗", no streak.

**Main UI elements:** the rough stone (rendered as a beautiful raw object, not a broken one), the two readouts at their real values, the same chips.

**Microcopy:** `Today is still open` (mid-day) · `Start anywhere` (returning user) · `Continue tomorrow` (evening, if untouched — gentle, optional). Never `You missed 3 days` or `Don't break your streak`.

**Visual details:** the raw block gets its own quiet dignity — interesting grain, soft shadow, museum lighting. Roughness is styled as *potential*, not damage. If returning after a gap, the app says nothing about the gap.

**Interaction notes:** there is no recovery flow because there is nothing to recover. Today is a fresh stone like every other day. The Shelf simply has gaps; gaps are never annotated.

---

### 5.5 Weekly view — "The Shelf" (hidden, optional)

**Purpose:** A calm sense of rhythm and a place finished pieces live. Deliberately deeper so it never competes with the home loop.

**Layout:** reached by swipe-down (or a tiny gesture), not a tab. A horizontal shelf/vitrine of small objects — one per recent day — each rendered at the finish it reached. Finished days are polished pieces; partial days are partly-worked; missed days are gentle gaps (or faint raw blocks), never marked wrong.

**Main UI elements:** the row of objects, a date under each, and — on tap — that day's two numbers. That's all. No averages, no percentages, no charts, no "consistency score."

**Microcopy:** `This week` · on tap: `Protein 92 / 100 g · Movement 30 / 30 min`. No judgments.

**Visual details:** like looking at a mantel of carvings in raking light. Quiet, tactile, collectible. Scroll back through weeks of small objects.

**Interaction notes:** read-only and ambient. You can't edit history here (keeps it pressure-free). Pull back up to return home.

---

### 5.6 Settings

**Purpose:** The two things the brief allows — targets and reminders — and nothing that creates decision fatigue.

**Layout:** one short screen.

**Main UI elements:**
- **Targets:** Protein (default `100 g`, adjustable; g/oz toggle), Movement (default `30 min`, adjustable).
- **Reminders:** off by default, or a single gentle invitation. Phrased as an invitation, not an alarm. Max two.
- **Appearance:** Light / Dark / System.
- **Artifact:** choose form (Seed / Standing / Vessel) — buried, optional.

**Microcopy:** `Protein target` · `Movement target` · `A gentle reminder` · reminder body: `Today is still open` (not `You haven't logged!`). `Form`.

**Visual details:** same calm type, lots of air, large touch rows, no nested menus.

**Interaction notes:** every setting has a sane default already chosen. Changing a target is a stepper, not a keypad, so it's a single screen with no dead ends.

---

## 6. Visual direction

**Color — one accent, by design.** You asked for a single quiet accent, and I'd hold that line (it's the more disciplined choice and keeps the two metrics from competing). Both metrics share one warm accent; they're distinguished by *position and the part of the stone they refine*, not by color.

- Light base (bone/paper): `#F4F1EA`  · ink: `#1A1815`
- Dark base (basalt): `#15140F`  · paper-ink: `#ECE7DC`
- Accent (warm clay/ochre): `#BE7A4E` — used only on progress fills and active states, never as fields
- Everything else: monochrome, low-contrast, warm-neutral

> Variant to test, not ship first: protein = warm `#BE7A4E`, movement = muted sage-stone `#6E7B74`. It color-codes the two metrics but breaks your "one accent" rule and adds noise. The stone already differentiates them spatially — I'd resist it.

**Typography.** Editorial, museum-catalog feel.
- **Display (numbers, headlines):** a high-quality serif with quiet contrast — Reckless, GT Sectra, Canela, or similar. Numbers tabular. ~40–56 px on the home readouts.
- **UI (labels, chips):** a clean grotesque — ABC Diatype, Söhne, Neue Haas Grotesk, or Inter. Labels ~13–15 px, tracked +2–4%, often uppercase for the metric names.
- Alternative all-in-one direction for a more Teenage-Engineering / Nothing-OS feel: a single grotesque or mono throughout, numbers oversized. Pick one lane and commit.

**Material & light.** The stone is the only rendered, dimensional element: PBR-ish pale marble or warm limestone on a thin plinth, soft single-source studio light like a gallery object. Background is flat. Soft glass only on the Quick Add sheet. Subtle, warm, generous shadow under the plinth grounds the object.

**Motion.** Slow and breathing, never bouncy.
- Idle breathe: scale 1.0 ↔ 1.012, ~6 s, ease-in-out
- Add confirmation: ~700 ms material refinement on the affected zone + light haptic
- Number tween: ~500 ms
- Completion: ~4 s present-rotation + lighting resolve + one soft success haptic
- Easing: long, gentle (`cubic-bezier(.25,.1,.25,1)`); no overshoot anywhere

---

## 7. Component list

- **MetricBlock** — label · current/target · ProgressLine · ChipRow
- **ProgressLine** — hairline track + accent fill, animated
- **QuickAddChip** — large tappable, value label, pressed/haptic states
- **ChipRow** — three chips (protein 10/20/30, movement 5/10/15)
- **Artifact** — the stone; props: `roughness`, `polish`, `definition`, `lighting`; states: raw / working / resolved
- **Plinth** — thin base + grounding shadow
- **QuickAddSheet** — soft-glass overlay, two ChipRows, optional Stepper, Earlier-today toggle
- **Stepper** — custom value entry, ± buttons
- **ConfirmationToast** — `Logged` + `Undo`, auto-dismiss
- **HeadlineCopy** — single calm line (`Enough for now`, `Today is still open`)
- **Shelf** — horizontal vitrine of ArtifactThumbnails
- **ArtifactThumbnail** — day object + date, tap to reveal numbers
- **SettingRow** — label + control (stepper / toggle / segmented)
- **SettingsScreen**, **OnboardingScreen**

---

## 8. Design system direction (FMS-compatible, 375 px base)

- **Spacing:** 8 pt base, but used airily — common gaps 24 / 32 / 48; screen margins ≥ 24.
- **Type scale:** display 56 / 40, title 22, body 16, label 13 (tracked). Tabular numerals.
- **Radius:** soft and generous — chips ~16, sheet ~28, no hard corners.
- **Color tokens:** `base`, `ink`, `ink-muted` (40%), `accent`, `surface-glass`, `line`.
- **Elevation:** essentially flat; one soft-glass layer (the sheet); one grounding shadow (the plinth).
- **Motion tokens:** `breathe 6000ms`, `confirm 700ms`, `tween 500ms`, `complete 4000ms`, easing `gentle`.
- **Artifact pipeline:** a single shader/material driven by the three 0→1 params + a lighting state, so every screen state is just a parameter set — not separate art. (Maps cleanly to React + CSS Modules + a WebGL/Three or pre-rendered sprite-sequence fallback.)
- **Light / Dark** as first-class, warm-neutral on both.

---

## 9. Onboarding

Three quiet screens, under ~20 seconds, no slogans.

1. **The idea.** A rough block on a plinth. One line: `Two habits. One stone.` Sub-line: `Protein and movement, every day.`
2. **Your two targets.** Pre-filled `100 g` and `30 min`, each a single stepper. Headline: `These are set. Change them anytime.` One tap to accept.
3. **Begin.** `Begin.` → lands on the home screen showing today's raw block, with a one-time faint hint on the chips: `Tap to add.`

No account wall on first run, no permissions ask until a reminder is actually turned on.

---

## 10. Microcopy library

Tone: calm, short, neutral, adult. Never motivational, never cute, never shaming.

- Readouts: `Protein 64 / 100 g` · `Movement 18 / 30 min`
- Actions: `Add protein` · `Add movement` · `Tap to add`
- Confirmation: `Logged` · `Undo`
- In-progress headline: `Today is still open`
- Completion: `Enough for now` · `Today is complete` · `Saved to your collection`
- Evening, untouched: `Continue tomorrow`
- Returning after a gap: `Start anywhere`
- Reminder body: `Today is still open` (never `You forgot` / `Don't break your streak`)
- Settings: `Protein target` · `Movement target` · `A gentle reminder` · `Form`

Banned register: streaks, percentages of self, "crushed it," "don't break," "you failed," emoji, exclamation marks.

---

## 11. App names

Shortlist, premium and quiet, no *fit/track/pro*:

- **Hewn** — *(my pick)* shaped by hand; short, adult, tactile, premium.
- **Cairn** — a stack of stones that marks a path; calm, Scandinavian-craft, ties to your "navigation object" direction.
- **Plinth** — the museum pedestal the object rests on; elegant, understated.
- **Quarry** — where stone is drawn from; raw-to-refined built in.
- **Patina** — the finish that comes with time; soft, premium.
- **Strata** — layers, geology; quiet and adult.
- **Relief** — bas-relief + the feeling of relief; smart but a touch ambiguous.
- **Whetstone** — sharpening, refinement; tactile but a little active.

Top two to test: **Hewn** (most distinctive, owns the metaphor) and **Cairn** (warmest, most navigational).

---

## 12. Final image-generation prompt (home screen hero)

> A premium iOS mobile app home screen, vertical 9:19.5 aspect ratio, 1080×2340. Extreme minimalism, museum-catalog aesthetic, Dieter Rams clarity, Teenage Engineering restraint. Warm off-white bone background (#F4F1EA), enormous whitespace. At the top, small uppercase tracked label "PROTEIN" in a clean grotesque, below it a large editorial serif number "64 / 100 g" with the target in muted grey; beneath, a hairline progress line ~30% filled in a quiet warm clay accent (#BE7A4E); below that, a single row of three large softly-rounded quick-add chips reading "+10  +20  +30". In the exact center and dominant, a hand-sized abstract Brancusi-inspired stone sculpture — a vertical form between a seed, an egg, and a standing bird — in pale warm marble, its lower half still raw and chalky, its upper half polished and luminous, resting on a thin plinth with a soft grounding shadow, lit by a single soft gallery light. At the bottom, a label "MOVEMENT", the editorial number "18 / 30 min", a hairline progress line ~60% filled in the same clay accent, and a row of three chips "+5  +10  +15" in the thumb zone. Calm monochrome palette, one warm accent only, soft depth, tactile materials, subtle film grain, photographed like a luxury product, no UI clutter, no charts, no icons except one tiny settings glyph top-right. Quiet, adult, premium, award-winning product design. --ar 9:19.5

---

## 13. Open questions / next steps

- Pre-rendered sprite sequence vs. live WebGL for the stone (battery and craft trade-off).
- Whether to ship the **patina** layer in v1 (I'd hold it).
- Localization of microcopy (kept in EN here per the brief).
- Next deliverable: a live, interactive home-screen prototype (React + CSS Modules) with a working stone and real quick-add, which is the strongest single asset for a Behance / ADA submission.
