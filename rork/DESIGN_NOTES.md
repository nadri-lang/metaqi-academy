# MetaQi Academy — Design Reference

Living style brief distilled from the `rork/` mockups. I read this before any
visual/redesign work on the app, so keep it updated instead of re-explaining
your taste each time — add a dated note under "Open asks" when you want
something changed, and I'll fold it into the relevant section once done.

## Source screenshots
- `app inicio.png` / `pag 1.jpeg` — final home screen direction (the one you
  confirmed you like). `inicio.jpeg` is an earlier iteration, kept for
  reference only — the second grid on it (Metafísica China / Cursos /
  Servicios / Agenda) was superseded by the IChing + Energía del Mes/Año row.
- `energia zilei.jpeg` — Energía del Día detail screen.
- `servicios.jpeg` — Servicios list.
- `admin.jpeg` — Panel de Administración.
- `iching.jpg` — I Ching oracle screen. Built 2026-09-08 (`app/iching.tsx` +
  `app/iching-detail.tsx`), home hero row now has 3 cards (IChing added).
- `promo app.png` — marketing/promo asset, not a screen.

## Palette
- Background: deep navy `#0A1424`
- Card: `#152A4A`, border `#2C4468`
- Accent / gold: `#C8A24A` family (buttons, headings, active states)
- Text: primary `#F4F0E4` (warm off-white), secondary `#AEBBD6`, muted `#7E8CAC`
- Status: free = green pill, premium = gold pill, offer = red pill

These already live in `frontend/src/constants/Colors.ts` — don't hardcode
hex values in screens, pull from `Colors`/`Gradients`.

## Typography
- Headings: serif bold (elegant, editorial) — used for titles like
  "Día del Caballo de Fuego"
- Body/UI: sans, with a semibold weight for labels and buttons
- Small caps / eyebrow labels: uppercase, letter-spaced, accent color

## Recurring visual motifs
- Circular gold "seal"/emblem frames with a meander (key-pattern) border —
  used for the zodiac-animal badge and category icons (IChing, Servicios,
  Feng Shui, etc.)
- Small circular "badge" overlapping the bottom-right of a bigger icon to
  show a secondary attribute (e.g. the flame icon on the horse emblem =
  the day's element)
- Free = green solid badge, Premium/Oferta = gold or red badge, always a
  small rounded pill in the corner of a card, never plain text
- Cards: 1px border in `cardBorder`, generous corner radius, no heavy drop
  shadows — the border does the separation, not elevation

## Screen-by-screen notes

### Home (`app/(tabs)/home.tsx`) — matches mockup, done 2026-09-08
Brand header, language pills, hero card for Energía del Día (with date line,
"Animal del día" line, and the zodiac emblem via `ZodiacEmblem`/`ZodiacGlyph`),
3-card row (IChing / Energía del Mes / Año), subscription banner.

### Energía del Día detail — not yet redesigned to match `energia zilei.jpeg`
Mockup: same date/animal header repeated, then a 2x4 grid of icon buttons
(Horas Favorables, Viajes, Activaciones, Actividades, A Evitar, Relaciones
BaZi, Sectores Feng Shui, Direcciones Qi Men), then a highlighted
"Activaciones del Día" card with image + "Ver Video" button + save/premium
row at the bottom. Queued next.

### Servicios — mockup uses ornate per-service circular icons (calligraphy
seal style, e.g. red 囍 for weddings) plus a green "Solicitar por WhatsApp"
button and a blue "Pagar con PayPal" button side by side on every card.
Not yet compared against current implementation in detail — check before
redesigning, current screen may already be close.

### Panel de Administración — mockup: greeting row with role pill, a 3x2
stats grid (Hoy / Este mes / Únicos / Registrados / Nuevos / Conversión),
search-by-email bar with a gold "Entregar contenido exclusivo" button, then
a 2-column icon grid of admin sections, then a "Solicitudes pendientes"
list with a red count badge. Queued next, after Energía del Día detail.

## Open asks (dated, most recent first)
(none currently — the zodiac-emblem and IChing asks below were both closed
2026-09-08)

## Resolved
- **2026-09-08** — Animal-of-the-day auto icon: done. Admin picks Animal
  (×12) + Elemento (×5) from chip rows in `admin/daily-energy.tsx`
  (auto-composes the display text); `ZodiacGlyph` has a hand-drawn silhouette
  per animal (chosen over MaterialCommunityIcons for full fidelity), wrapped
  in `ZodiacEmblem` (gold ring + element corner badge). Renders on the home
  hero. First-pass art — ask if any of the 12 need retouching once seen live.
- **2026-09-08** — I Ching oracle (`iching.jpg`): done. `app/iching.tsx` +
  `app/iching-detail.tsx`, real King Wen hexagram computation
  (`backend/iching_data.py`), home card added. "Ver interpretación completa"
  shows structure (trigrams, moving lines, transformation) - not full
  classical Judgment/Image text per hexagram (64 × ~8 pieces of text, a
  separate undertaking if wanted later).
