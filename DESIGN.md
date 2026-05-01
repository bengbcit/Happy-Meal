---
version: alpha
name: Kinetic — Sports Motion Design System
description: >
  A high-energy, immersive design system for a sports and fitness landing page.
  Dark-mode first. Physics-based animation at its core. Every decision conveys
  the feeling that motion is life — powerful, fluid, breathable, cinematic.

colors:
  # ── Backgrounds ──────────────────────────────────────────
  background: "#09090B"
  surface: "#111114"
  surface-elevated: "#18181D"
  surface-high: "#222228"
  surface-overlay: "#2A2A32"

  # ── Core energy palette ──────────────────────────────────
  primary: "#FF4D00"
  primary-dim: "#CC3D00"
  primary-glow: "#FF6B35"
  on-primary: "#FFFFFF"

  secondary: "#00C6FF"
  secondary-dim: "#009ACC"
  secondary-glow: "#33D4FF"
  on-secondary: "#FFFFFF"

  accent: "#00E87A"
  accent-dim: "#00B85F"
  on-accent: "#000000"

  # ── Text scale ───────────────────────────────────────────
  on-background: "#FFFFFF"
  on-surface: "#F4F4F6"
  on-surface-variant: "#A0A0B0"
  on-surface-muted: "#606070"

  # ── Semantic roles ───────────────────────────────────────
  energy: "#FF4D00"
  motion: "#00C6FF"
  calm: "#00E87A"
  error: "#FF3B6B"
  warning: "#FFB800"

  # ── Borders & outlines ───────────────────────────────────
  outline: "#2E2E3A"
  outline-variant: "#1E1E28"

  # ── Gradient stops (use as CSS var references in code) ───
  gradient-energy-start: "#FF4D00"
  gradient-energy-end: "#FF1A6B"
  gradient-motion-start: "#00C6FF"
  gradient-motion-end: "#7B2FFF"
  gradient-hero-start: "#09090B"
  gradient-hero-mid: "#12121A"
  gradient-hero-end: "#0D0D12"

typography:
  display-xl:
    fontFamily: Inter Tight
    fontSize: 120px
    fontWeight: "900"
    lineHeight: 1.0
    letterSpacing: -0.04em
    fontVariation: "'wdth' 100"

  display-lg:
    fontFamily: Inter Tight
    fontSize: 80px
    fontWeight: "800"
    lineHeight: 1.05
    letterSpacing: -0.03em

  headline-lg:
    fontFamily: Inter Tight
    fontSize: 48px
    fontWeight: "700"
    lineHeight: 1.1
    letterSpacing: -0.02em

  headline-md:
    fontFamily: Inter Tight
    fontSize: 32px
    fontWeight: "700"
    lineHeight: 1.2
    letterSpacing: -0.02em

  headline-sm:
    fontFamily: Inter Tight
    fontSize: 24px
    fontWeight: "600"
    lineHeight: 1.3
    letterSpacing: -0.01em

  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: "400"
    lineHeight: 1.7

  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 1.6

  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: "400"
    lineHeight: 1.5

  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: "600"
    lineHeight: 1
    letterSpacing: 0.08em
    fontFeature: "ss01 on"

  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: "600"
    lineHeight: 1
    letterSpacing: 0.1em

  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: "700"
    lineHeight: 1
    letterSpacing: 0.15em

rounded:
  none: 0px
  xs: 2px
  sm: 4px
  md: 8px
  lg: 16px
  xl: 24px
  full: 9999px

spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  xxl: 96px
  section: 128px
  gutter: 24px
  container-max: 1440px
  container-padding: 40px

components:
  # ── Navigation ───────────────────────────────────────────
  nav:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-lg}"
    height: 72px
    padding: 0 40px

  nav-scrolled:
    backgroundColor: "rgba(9,9,11,0.85)"
    textColor: "{colors.on-background}"

  # ── Hero section ─────────────────────────────────────────
  hero-section:
    backgroundColor: "{colors.background}"
    textColor: "{colors.on-background}"
    height: 100vh

  # ── Buttons ──────────────────────────────────────────────
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.xs}"
    height: 56px
    padding: 0 32px

  button-primary-hover:
    backgroundColor: "{colors.primary-glow}"

  button-primary-active:
    backgroundColor: "{colors.primary-dim}"

  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.xs}"
    height: 56px
    padding: 0 32px

  button-ghost-hover:
    backgroundColor: "rgba(255,255,255,0.06)"

  button-energy:
    backgroundColor: "linear-gradient(135deg, {colors.gradient-energy-start}, {colors.gradient-energy-end})"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.xs}"
    height: 64px
    padding: 0 40px

  # ── Cards ────────────────────────────────────────────────
  motion-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 32px

  motion-card-hover:
    backgroundColor: "{colors.surface-elevated}"

  activity-tile:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.sm}"
    height: 400px
    padding: 24px

  activity-tile-hover:
    backgroundColor: "{colors.surface-high}"

  # ── Indicators ───────────────────────────────────────────
  scroll-progress:
    backgroundColor: "{colors.primary}"
    height: 3px

  kinetic-cursor:
    backgroundColor: "rgba(255,77,0,0.15)"
    size: 48px
    rounded: "{rounded.full}"

  # ── Footer ───────────────────────────────────────────────
  footer:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.body-sm}"
    padding: 64px 40px
---

# Kinetic

> _Motion is not decoration. It is the product._

## Brand & Style

Kinetic is a sports and fitness landing experience built on a single conviction: movement communicates what words cannot. The design system is engineered to feel physically alive — every scroll, hover, and transition should pulse with the same energy as a first sprint, a deep breath before a lift, or the final kilometer of a race.

**Brand personality:** Powerful yet controlled. Cinematic yet functional. The aesthetic sits at the intersection of a Nike campaign film and an Awwwards SOTD — zero excess, maximum impact. Think Whoop's data density, Peloton's immersive coaching energy, and Resn's surreal interactivity synthesized into one system.

**Target audience:** Athletes, active lifestyle seekers, fitness enthusiasts aged 18–40 who respond to both peak performance and mindful recovery. They expect premium quality and reward brands that move the way they do.

**Dark mode is canonical.** The deep space palette (#09090B) is not a theme variant — it is the foundation. It allows the Energy Orange (#FF4D00), Electric Blue (#00C6FF), and Vivid Green (#00E87A) to achieve maximum luminosity, similar to how an LED display reads brighter against darkness. A light-mode variant may exist but should be treated as secondary.

**Emotional arc:** The page should take the user from _quiet intensity_ (hero, near-black, single massive headline) → _kinetic energy_ (activity tiles, motion cards, fast scroll triggers) → _confident calm_ (athlete story, spacious photography) → _decisive action_ (CTA section, high-contrast button, gradient burst). This mirrors the physiological rhythm of a workout: warm-up → peak effort → cool-down → results.

## Colors

The palette is rooted in controlled darkness punctuated by three high-voltage accent colors, each mapped to a semantic performance state.

- **Background (#09090B):** Deep space black. Not pure black — the slight blue-black tint gives depth and prevents harshness. This is the canvas everything else lives on.
- **Surface (#111114) / Surface-elevated (#18181D) / Surface-high (#222228):** A three-tier card/container elevation system. Each step is subtle; the layering creates visual hierarchy without competing with accent colors.
- **Energy Orange — Primary (#FF4D00):** The brand's heartbeat. Used exclusively for primary CTAs, the most important interactive element on any screen, kinetic highlights, and scroll progress indicators. Semantically maps to `energy`: raw effort, fire, drive. At full opacity it demands attention. At 10–15% opacity it creates warm glow halos behind hero elements.
- **Electric Blue — Secondary (#00C6FF):** Speed, flow, digital precision. Used for motion trails, data visualization, secondary interactive states, and the motion arrow on kinetic scroll indicators. Semantically maps to `motion`.
- **Vivid Green — Accent (#00E87A):** Recovery, balance, achievement. Used for completion states, progress milestones, and the "calm" end of the page. Semantically maps to `calm`.
- **On-surface scale (#F4F4F6 → #A0A0B0 → #606070):** Three text tones for hierarchy. The brightest is for headlines and primary content; the mid-tone for body text and metadata; the muted tone for timestamps and secondary labels.
- **Outline (#2E2E3A):** Very subtle. Used only for card borders and dividers. Never use a border as the primary differentiation between elements — use background tones instead.

**Gradient system:** Two named gradients power the motion effect language:
- `gradient-energy`: `linear-gradient(135deg, #FF4D00 → #FF1A6B)` — hero burst, CTA section background, button glow.
- `gradient-motion`: `linear-gradient(135deg, #00C6FF → #7B2FFF)` — speed trails, scroll progress variant, secondary section accents.

Both gradients should animate: use `background-position` keyframe animation at 6–8s cycle time with `background-size: 200% 200%` for a breathing, living gradient effect.

## Typography

Typography in Kinetic is structural architecture, not decoration. The hierarchy must be readable at a glance and convey force.

- **Display (Inter Tight, 900 weight):** `display-xl` at 120px is reserved for the single hero headline. It should fill the viewport horizontally on desktop — the line-length is intentional. `display-lg` at 80px is for section headlines that must stop the user mid-scroll. Use `letter-spacing: -0.04em` to collapse characters together; at large sizes this creates mass and momentum. Inter Tight's compressed width is critical — do not substitute a non-condensed face.
- **Headlines (Inter Tight, 700–800 weight):** `headline-lg` through `headline-sm` govern section titles, card headers, and athlete names. Maintain tight letter spacing. At `headline-md` and below, consider occasional `font-style: italic` for emphasis on key action words ("run", "push", "breathe") — this adds a physical lean to the type that echoes forward motion.
- **Body (Inter, 400 weight):** Body text is the breath between the punches. Use generous `line-height: 1.6–1.7` to give the eye room to move. Never go below 14px. Body text should never compete with display type — if an element needs to be bold and large, make it a headline, not heavy body text.
- **Labels (Inter, 600–700 weight, uppercase):** `label-caps` at `letter-spacing: 0.15em` is used for section identifiers ("/ 01 TRAINING"), stat labels ("BPM", "KM", "REP"), and navigation links. The generous tracking creates a technical precision feel — like a sports watch display.

**Dynamic type behavior:**
- On scroll, `display-xl` characters should enter with a staggered word-by-word or line-by-line reveal using a `y: 80px → 0, opacity: 0 → 1` spring animation.
- On hero entry, apply a brief `font-variation-settings: 'wdth' 85 → 100` transition over 600ms if the font supports variable axes — this creates an "expanding" effect on load.
- Avoid animating font-weight directly (causes layout shift); animate `opacity`, `transform`, and `filter: blur` instead.

## Layout

The layout system uses a **Fluid Max-Width Grid** anchored to a 1440px container maximum, with aggressive full-bleed sections for cinematic impact.

- **Spacing base unit:** 8px. All spacing values are multiples of 8. The exception is micro-adjustments (4px for internal component padding corrections).
- **Sections:** Full-screen sections (`height: 100vh`) alternate with content sections of explicit block height. The contrast between full-bleed and contained creates visual breathing — the user experiences compression and release, mirroring physical exertion and recovery.
- **Grid:** 12-column grid with 24px gutters on desktop, collapsing to 4-column with 16px gutters on mobile. Hero content typically spans 10/12 columns with 1-column offset. Activity tiles use a 4-column auto grid with `grid-auto-rows: 400px`.
- **Sticky elements:** The navigation bar is `position: sticky; top: 0` with a backdrop-blur transition. A vertical kinetic scroll indicator (fixed, right edge) tracks section progress.
- **Overflow containers:** All parallax layers and motion cards should be wrapped in `overflow: hidden` containers. This is not optional — without it, GPU-accelerated transforms on inner elements will bleed outside bounds and cause paint artifacts.
- **Z-layer stack:** Background canvas (0) → parallax media layers (10, 20) → content cards (30) → sticky navigation (100) → cursor follower (200).
- **Whitespace contrast:** Sections that show athlete stories or photography should have `padding: 128px 40px` to let imagery breathe. Energy sections (activity tiles, feature grid) compress to `padding: 48px 40px` — the tight packing conveys intensity.

## Elevation & Depth

Depth in Kinetic is achieved through light, not shadow — an energy glow system rather than traditional box-shadows.

- **Level 0 — Canvas:** The `background` (#09090B) layer. No treatment.
- **Level 1 — Surface cards:** `background: #111114`, no shadow. Separated from background purely by color delta. Keep this delta intentionally small so the page feels like one unified dark field.
- **Level 2 — Elevated cards / hover states:** `background: #18181D` + `box-shadow: 0 0 0 1px rgba(255,255,255,0.06)`. The 1px outline at very low opacity creates a glass-edge effect without a traditional border.
- **Level 3 — Focus / active states:** Add a `box-shadow: 0 0 24px 0 rgba(255,77,0,0.15)` energy glow behind the active element. The primary color glow is the elevation mechanism — it signals importance through luminosity.
- **Glow halos:** Behind hero text, use a large `radial-gradient` centered pseudo-element (`position: absolute, opacity: 0.12, blur: 120px, color: primary`) to create an ambient energy atmosphere. This is the primary depth mechanism in the hero section.
- **No default box-shadows:** Do not use standard `box-shadow` drop shadows (e.g., `0 4px 12px rgba(0,0,0,0.3)`). They read as UI library defaults and contradict the elevated cinematic aesthetic.

## Shapes

Shape language is deliberately sharp — corners communicate precision and athletic discipline.

- **Default:** `rounded-sm` (4px) for all interactive components: buttons, cards, inputs, activity tiles. This is the system default. It provides the barest softness without reading as rounded or friendly.
- **Navigation and pills:** `rounded-full` (9999px) for tag chips, badge indicators, and any pill-shaped UI element — maximum curvature contrasts sharply against the dominant right-angle vocabulary.
- **Never use:** `rounded-lg` (16px) or `rounded-xl` (24px) on cards or buttons. These read as consumer-app softness and contradict the precision aesthetic. Reserve for decorative graphic elements only.
- **Clip masks:** For hero media and athletic photography, use `clip-path: polygon()` shapes with sharp diagonal cuts (e.g., `polygon(0 0, 100% 0, 100% 90%, 85% 100%, 0 100%)`) rather than border-radius. This creates the angular, forward-leaning visual energy of a speed graphic.
- **Rule lines:** Use 1px horizontal rules sparingly (`border-top: 1px solid {colors.outline}`) to separate sections within a card. Never use full-width page dividers — let whitespace serve as the section separator.

## Motion & Animation

Motion is not enhancement — it _is_ the brand. Every animated property must feel physically motivated. If an element moves, a viewer should intuitively understand the force behind it.

### Philosophy

Follow **physics-based motion** exclusively. This means:
- **Ease-out** for elements entering the viewport (decelerating into rest, like a runner finishing a sprint).
- **Spring with overshoot** for buttons, cards, and interactive elements that respond to user input (the compressed spring releases with slight overshoot — `stiffness: 300, damping: 20` in Framer Motion terms).
- **Ease-in** only for exits (elements accelerating out of frame).
- **Never use linear easing** for any user-facing animation. Linear motion reads as mechanical and lifeless.

### Recommended Stack

| Layer | Technology | Role |
|---|---|---|
| Core interactions | Framer Motion (React) | Spring animations, variants, whileHover, scroll-based |
| Scroll orchestration | GSAP + ScrollTrigger | Pinned sections, timeline scrub, parallax |
| Smooth scroll | Lenis | Momentum-based scroll, eliminates jerky native scroll |
| 3D / particles | React Three Fiber (optional) | Hero particle field, lightweight 3D athlete model |
| Page transitions | Framer Motion `AnimatePresence` | Shared element transitions between routes |

### Hero Section

The hero is the brand statement. It must stop scrolling and demand presence.

1. **Background:** Full-viewport dark canvas with a subtle radial gradient glow (primary color, ~10% opacity, 800px radius, positioned center-left). Behind content, place either a high-quality athlete video (`autoplay muted loop playsInline`, `object-fit: cover`) faded to 15–25% opacity, or a WebGL particle field using React Three Fiber (`@react-three/fiber`) with ~2,000 particles emitting from a center origin, drifting upward with subtle random velocity.
2. **Headline entrance:** The `display-xl` headline should enter in two phases: (a) each word translates from `y: 80px` to `y: 0` with `opacity: 0 → 1`, staggered by 80ms per word, using a `spring(stiffness: 80, damping: 18)` — this creates a heavy, powerful punch-in; (b) after all words are placed, apply a subtle `letter-spacing` transition from `-0.06em` to `-0.04em` over 400ms, expanding the characters to final position.
3. **Parallax layers:** Stack at minimum 3 layers at different `z` depths with Framer Motion `useScroll` and `useTransform`. The background video/particle field moves at 0.3× scroll speed, a mid-layer graphic element at 0.6×, and foreground text at 1× (pinned). This creates the illusion of depth as the user scrolls into the page.
4. **Scroll indicator:** A kinetic scroll indicator below the CTA — two animated chevrons pulsing sequentially with a 400ms stagger, using `scale: 1 → 1.2 → 1, opacity: 1 → 0.4 → 1` on a 2s loop.

### Scroll-Triggered Animations

All scroll animations use GSAP ScrollTrigger with `start: "top 80%"` and `end: "top 20%"` defaults (element enters animation window when 80% down the viewport).

- **Fade-in + rise:** Default for cards and text blocks. `opacity: 0 → 1, y: 40px → 0`, duration 0.6s, `ease: "power2.out"`.
- **Staggered grid reveal:** For activity tile grids, stagger children by 0.1s per item. Apply a `scaleY: 0 → 1, transformOrigin: "bottom"` clip reveal on the tile's media layer, not the tile itself (preserves layout).
- **Blur-to-sharp:** For photographer or athlete images, enter with `filter: blur(12px) → blur(0)` combined with `scale: 1.04 → 1.0`. The brief blur suggests the image is coming into focus — like eyes adjusting after a sprint.
- **Stat counters:** Numeric statistics (e.g., "10K users", "98% improvement") should use a number odometer that counts up when scrolled into view. Implement via `motion.div` with a custom `useMotionValue` and `animate`.
- **Section title reveal:** Section identifier labels (`label-caps`) should use a masked reveal: `clip-path: inset(0 100% 0 0) → inset(0 0% 0 0)`, duration 0.5s, `ease: "expo.out"`. The text slides into view from a clipping mask — clean and technical.

### Micro-interactions

Micro-interactions are the texture of the experience. They must be instantaneous and physically satisfying.

- **Button — primary:** On `hover`, the button scales to `scale: 1.03` with a `spring(stiffness: 400, damping: 25)` — barely perceptible but creates the feeling of a physical surface lifting. Simultaneously, add `box-shadow: 0 0 32px 0 rgba(255,77,0,0.4)` energy glow. On `press` (`whileTap`), `scale: 0.97` instantly — the "press" squish. On release, spring back to `1.03` then settle to `1.0`.
- **Button — energy ripple:** On click, emit a radial ripple from the click origin: a pseudo-element expanding from `scale: 0` to `scale: 2.5` with `opacity: 0.3 → 0`, duration 600ms. Color is `colors.primary` at 30% opacity.
- **Motion card hover:** The card container: `y: -4px, box-shadow: energy glow`. Inside the card, child elements (title, image, stat) each have independent motion — the image `scale: 1.05`, the title `x: 4px`, the stat counter increments by 1 step. This "inner choreography" makes the card feel alive, not just lifted.
- **Cursor follower:** On desktop, track cursor position with a `48px × 48px` circle (`border-radius: 50%`) using `requestAnimationFrame` with a lerp factor of `0.12` (smooth lag). The follower changes size and color based on the element underneath: larger and orange over primary CTAs, smaller and blue over secondary actions, invisible over text.
- **Navigation link hover:** Use a bottom-border animated underline: `scaleX: 0 → 1` from `transformOrigin: left`, using the primary color. Duration 200ms, `ease: "power2.out"`.

### Page and Section Transitions

- **Section-to-section:** Use Lenis smooth scrolling (`lerp: 0.08`, `duration: 1.2`) globally. Combined with GSAP ScrollTrigger, this creates a cinematic scroll feel where the user feels the page resistance and momentum.
- **Route transitions (if multi-page):** Use Framer Motion `AnimatePresence` with a shared element transition. The key visual element from the source page (e.g., an athlete card) should `layoutId` match a target element on the destination page, creating a fluid morph transition rather than a cut or fade.
- **Hero out-transition:** As the user scrolls past the hero, the headline should `scale: 1 → 0.9, opacity: 1 → 0` via ScrollTrigger scrub. The hero background blurs to `blur: 0 → 8px`. This "falling behind" effect tells the user they are moving forward into the experience.

### Performance

- All transforms use `will-change: transform` declared only when the animation is active (add and remove the class dynamically to avoid GPU memory leaks).
- All scroll animations use `ScrollTrigger.batch()` for grouped elements to reduce observer overhead.
- Particles (if used) are capped at 2,000 instances with frustum culling enabled in React Three Fiber.
- Respect `@media (prefers-reduced-motion: reduce)`: wrap all `motion.*` components in a `useReducedMotion()` check. When reduced motion is active, substitute `opacity` transitions only (no translation, scale, or blur animations).
- Target 60fps on mid-range mobile. Profile with Chrome Performance tab; animations using `transform` and `opacity` exclusively are GPU-composited and will not cause layout recalculations.

## Components

### Hero Section

Full-viewport entry experience. Structure:
```
<section> [100vh, position: relative, overflow: hidden]
  <div> [background canvas: gradient + particle/video layer, z:10]
  <div> [parallax group, z:20, motion.div with scroll-linked y transform]
    <span> [section label: "/ 01 HERO", label-caps, opacity 0.5]
    <h1> [display-xl, word-by-word animated entry]
    <p> [body-lg, fade-in after headline, max-width 480px]
    <div> [CTA group: button-energy + button-ghost, fade-in with 200ms delay]
  <div> [kinetic scroll indicator, position: absolute, bottom: 32px, centered]
```

The hero headline should be a single semantic `<h1>`. Do not break it into multiple elements for animation — use Framer Motion's `variants` with `staggerChildren` on word-wrapped `<span>` elements generated in JS.

### Navigation

The navigation transitions from fully transparent to a frosted-glass solid on scroll.

- **Default (top of page):** `background: transparent`, `backdrop-filter: none`. Logo and links are full white. No border.
- **Scrolled state (> 80px from top):** Transition over 300ms to `background: rgba(9,9,11,0.85)`, `backdrop-filter: blur(20px) saturate(180%)`, `border-bottom: 1px solid rgba(255,255,255,0.06)`. This uses the CSS `transition` property on `background-color` and `backdrop-filter`.
- **Motion progress indicator:** A `3px` line underneath the nav (`position: absolute, bottom: 0, width: 100%`) using `scaleX` driven by `useScroll()`. Color: `colors.primary`. This replaces the scroll percentage readout — it is silent, direct, kinetic.
- **Mobile:** Hamburger icon that transforms into an X using SVG path morphing. Menu overlay slides in from the right with `x: 100% → 0`, `ease: "expo.out"`, duration 500ms. Links stagger in with 60ms delay each.

### Motion Cards / Activity Tiles

Cards are the primary content unit for showcasing activity types (running, strength, yoga, etc.).

- **Container:** `overflow: hidden`, `position: relative`, `border: 1px solid {colors.outline}`, `rounded-sm`. On hover: remove border color (replace with glow shadow), add `box-shadow: 0 0 0 1px rgba(255,77,0,0.3), 0 8px 40px rgba(255,77,0,0.1)`.
- **Media layer (inner):** Full-bleed image or video, `object-fit: cover`, `scale: 1.0 → 1.05` on card hover via CSS `transition: transform 0.6s cubic-bezier(0.16,1,0.3,1)`. The slow, smooth scale creates a breathing, alive media feel.
- **Text content (inner):** The activity name (`headline-sm`) and stat overlay should be positioned at the bottom with a `linear-gradient(transparent, rgba(9,9,11,0.9))` scrim. On hover, the text `y: 0 → -8px` to create a floating label effect.
- **Hover choreography (Framer Motion):** Use a parent `motion.div` with `whileHover="hover"` and define child `variants` with independent transform targets. The image scales, the text rises, a small directional arrow appears — all coordinated from one hover state.

### Scroll Progress / Kinetic Scroll Indicator

Two complementary indicators:
1. **Top nav bar line:** `position: fixed`, `top: 72px` (below nav), `left: 0`, `height: 3px`, `background: gradient-energy`, `scaleX` driven by `useScroll({ offset: ["start start", "end end"] })`.
2. **Vertical section tracker:** `position: fixed`, `right: 24px`, `top: 50%`, `transform: translateY(-50%)`. A vertical column of 4–6 dots, one per section. The active section dot scales to `scale: 1.5` and changes color to `colors.primary`. Dots connect via a thin line that fills from top to active position.

### CTA Buttons

Three variants:

1. **Primary (`button-primary`):** Solid Energy Orange fill, white label, `rounded-xs` (2px). The sharp corner is intentional — it reads as a decisive action, not a soft invitation.
2. **Energy (`button-energy`):** Animated `gradient-energy` fill, white label, 64px tall. Used only once per page as the primary conversion action. The gradient animates continuously (`background-position` oscillates) even at rest — it is always in motion.
3. **Ghost (`button-ghost`):** Transparent fill, `border: 1px solid rgba(255,255,255,0.15)`, white label. Secondary actions. On hover, border becomes `colors.primary` with a 200ms transition.

All buttons use `whileTap={{ scale: 0.97 }}` in Framer Motion.

### Footer

Minimal and structured. Two rows:
1. **Top row:** Logo (left) + navigation links (center) + social icons (right). `label-md` typography, `on-surface-variant` color.
2. **Bottom row:** Copyright + legal links (left) + "Back to top" arrow button (right). The back-to-top button uses the kinetic scroll-to indicator arrow with an upward animation on hover.
Footer background: `colors.surface` (#111114) — slightly elevated from the page background, creating a clean landing at the scroll end.

## Do's and Don'ts

- Do use Energy Orange (`colors.primary`) for exactly one primary action per viewport — never two.
- Do animate `transform` and `opacity` only; never animate `width`, `height`, `top`, `left`, or any property that triggers layout recalculation.
- Do use `will-change: transform` dynamically (add before animation, remove after) — never as a permanent CSS declaration.
- Do pair all scroll-triggered animations with `@media (prefers-reduced-motion: reduce)` fallbacks that use only `opacity` transitions.
- Don't use `box-shadow` with dark rgba values (e.g., `rgba(0,0,0,0.4)`) — use glow shadows with the brand color palette instead.
- Don't mix `rounded-lg`/`rounded-xl` with `rounded-xs`/`rounded-sm` in the same component — choose one radius vocabulary per component family.
- Don't use more than two font weights on a single viewport (e.g., 900 + 400 is correct; adding 600 creates hierarchy noise).
- Don't animate at frame rates below 60fps — profile on mid-range hardware and reduce particle count or animation complexity before shipping.
- Don't use `justify-content: center` for hero text — left-align the headline for maximum reading speed and kinetic forward momentum.
- Do maintain WCAG AA contrast (4.5:1 for body text, 3:1 for large display text). On-background (#FFFFFF on #09090B) achieves 21:1 — headroom for opacity adjustments while staying compliant.
- Don't use animation as a loading mask — content should be present in DOM immediately, animations are pure enhancement. Use `Suspense` with a skeleton state, not blank frames.

## Brand Voice & Rationale

The design decisions in this system are not aesthetic choices — they are physiological ones.

**Why deep space black as the canvas?** Darkness creates focus. In high-performance environments — surgery theaters, control rooms, cockpit displays — dark backgrounds reduce eye strain and amplify signal. A fitness brand that uses darkness is communicating: _this is performance territory, not a casual app_.

**Why Energy Orange as the primary signal?** Orange occupies the longest wavelength visible to human eyes without triggering the alarm response of red. It reads as urgency without aggression — the color of sunrise, of embers, of the burn in your legs during interval training. It says "go" without saying "danger."

**Why physics-based springs over CSS easings?** A cubic-bezier easing is a mathematical approximation. A spring is a physical model. When an interface element moves with overshoot and damping — the way a door handle, a pull-cord, or a resistance band actually moves — the user's motor cortex recognizes it as real. This recognition creates a subconscious sense of physical presence. The interface feels _tangible_.

**Why scroll-driven storytelling?** The act of scrolling is already a physical gesture. Kinetic scroll design exploits this: each downward push of the finger becomes a step forward in the narrative. The user does not read the page — they _run_ through it. The parallax layers, the blur-to-sharp reveals, the counter animations — each is calibrated to reward the physical input with a visual response, creating a feedback loop identical to the effort-reward cycle of exercise itself.

**The adrenaline–calm balance:** The most common failure in high-energy design is unrelenting intensity — a page that screams from start to finish produces fatigue, not excitement. Kinetic's emotional arc is deliberate: the hero is loud, the activity tiles are kinetic, but the athlete story section is spacious, photography-driven, and nearly still. The CTA recovers the energy in a single focused burst. This mirrors the physiological arc of a training session — and leaves the user with the same feeling: spent, but motivated.
