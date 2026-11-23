# Buoy 3D Core — Gemini Spec Application Record (Nov 22, 2026)

**Source:** real exported app code from Ray's AI Studio account (Buoy 3D Core,
0b34addc-6480-4492-b374-46c5a247027b), copied from the pristine export
`../buoy-3d-core-app-export-20261122/` (23 files, untouched — md5s verified
after the work). **This folder is the working copy only; nothing here has
been pushed to GitHub yet.**

**Specs applied:** Gemini Answer 1 (Nov 22, 8:24 PM — 7-file update spec) as
**corrected by her real-code verification** (Nov 22, ~8:38 PM, browser task
9d0a9d6d — verbatim at `../GEMINI-BUOY-REAL-CODE-VERIFICATION-20261122.md`).
The corrected spec REPLACES the overwrite approach: the real 74 KB
BuoyCore3D.tsx and 66 KB rayDesignData.ts were patched surgically, never
replaced. Marlow's build (`../marlow-buoy-build-20261122/`) was used as
reference only (physics.ts verbatim; envelope data ported verbatim).

## File-by-file

### File 1 — `src/lib/physics.ts` (NEW, 7,407 B, md5 fdf790a8…)
Marlow's pure SI library, verbatim. No changes.

### File 2 — `src/data/rayDesignData.ts` (66,064 → 114,369 B, md5 cad6c620…)
Surgical additions to the real file; the real types, PART_DETAILS,
TRIAL_PROTOCOL, FLOW_CHANNELS, TIDE_PRESETS and stepSimulation are intact.
- Ported verbatim from Marlow's build: `Assumed`/`Known`/`MaybeKnown`,
  `SizingEnvelope`, `ENVELOPE_A` (180 mm / 50 L @ 4.0 bar),
  `ENVELOPE_B` (450 mm / 250 L @ **2.25 bar midpoint** — corrected spec;
  her A5 sizing shorthand said 2.5 bar, difference flagged),
  `ENVELOPES`, `PROPOSED_ADDITIONS` (8 items), `CONFLICTS` (15),
  `MISSING_FOR_RAY` (15), `liftSummary()`, `headlinePowerChain()`.
- New consts: `FOUR_LAYER_PISTON` (A6), `FLOW_DERIVED_TANK_SIZING` (A5),
  `EM_ENERGY_BALANCE` (−800 J / build −801 J), `BUILD_FINDINGS` (4 confirmed),
  `PHASE_ORDER_NOTE`, `SIMULATION_LABEL`, `ENVELOPE_SELECTOR_PAUSED_MESSAGE`.
- `PART_DETAILS[2]` (Central air-plunger) rewritten as the 4-layer piston
  spec; subParts are now the four layers (`piston-layer-1-outer-shell` …
  `piston-layer-4-compressor-rod`).
- `SimControls` gains `envelope?: EnvelopeId | 'unresolved'` (optional,
  default unresolved). `SimTelemetry` gains Gemini's five fields
  (`flapperOpen`, `footValveOpen`, `needleValve`, `accumulatorBar`,
  `warnings`) plus seven Phoenix guard fields (`simTimeS`, `cycleCount`,
  `cycleStartTimeS`, `emergentCycleHz`, `plenumBarGauge`,
  `plenumOverPressure`, `sizingParadox`).
- `stepSimulation()` keeps the REAL 5-param signature
  `(prev, tide, dt, paused, controls)`. Patched: unresolved pauses physics
  + raises the warning; live valve-state machine; plenum Boyle guard
  (full-stroke isothermal, from the selected envelope's own numbers);
  emergent cycle-rate detection (cycle = DISCHARGE → FILLING return).
  The real phase machine (FILLING → TRIGGERED → DISCHARGE → FILLING) is
  NOT rewritten; RESET is the DISCHARGE → FILLING return (see
  PHASE_ORDER_NOTE). Live power/RPM math is NOT replaced (already
  discharge-driven, confirmed); dual-envelope power math lives in
  `headlinePowerChain()`. `accumulatorBar` = plunger air pressure (the real
  sim has no separate accumulator state — documented in-code).
- Diagram image paths made `import.meta.env.BASE_URL`-aware for Pages.
- Corrected-spec Files 4–6 reconciliation note in-code: the file's
  tidal/wave/stroke/power/RPM/drag/buoyancy constants ARE the real app's
  values and were not rewritten; envelope strokes (1.00 m / 0.65 m) and
  tanks (50 L / 250 L) live in the ENVELOPE constants.

### File 3 — `src/components/BuoyCore3D.tsx` (74,710 → 82,848 B, md5 62ea3bc8…)
Surgical patch only; scene, pier pilings, textures, 260-droplet particles,
camera logic untouched.
- **Moving carriage group** (the verified-missing fix): `movingCarriageGroup`
  parents `pistonInnerGroup` + `centerNeedleGroup` + `underTankGroup` on
  `buoyRoot`; the tank now strokes with the piston instead of moving only
  on exploded view. The tank keeps its local explode lerp.
- **Drive-signal conflict (flagged):** Gemini's corrected spec wires the
  tick as `movingCarriageGroup.position.y = -sim.strokeDepth`. strokeDepth
  in the real sim is a POSITIVE magnitude, so −strokeDepth would sink the
  carriage whenever the piston moves in EITHER direction — backwards
  against the real sim, where air forces the plunger UP on trigger. The
  carriage is driven by the real file's own `pistonOffset`
  (`sim.pistonPosition * 0.65`), preserving exact visible motion. Needs
  Gemini to confirm or correct.
- **Four-layer piston cutaway:** the solid disk became a 90° section
  cutaway — Layer 1 gunmetal shell (270° arc) + gold U-cup seals, Layer 2
  cyan annular air core with 4 animated air-velocity arrows (opacity
  follows `dischargePulse`), Layer 3 chrome sealing tube, Layer 4 rod
  with alternating red/silver NdFeB magnet rings + gold cap.
- Gold air-injection ring collar + 4 micro-taps at the quad-venturi ring
  (stage 05); center vent exhaust nozzle at the keel bottom (y −4.62,
  parented to the carriage); 90-point white bubble system rising around
  the venturi ring + center vent (bright on discharge).
- Verified already-present, no change: turbine coupling (RPM-driven, no
  idle clock) and hull mooring lock (`buoyRoot.position.y = 0`,
  `rotation.z = 0`).

### File 4 — `src/components/OperatingPrincipleAndSizing.tsx` (8,379 → 14,720 B)
- Side-by-side A/B comparison matrix (from CONFLICTS + tank/lift rows),
  the four verified findings callout, and the 15 missing numbers list.
- Sizing table annotated: its rows are Envelope B's numbers, kept as-is.
- Takes an optional `selectedEnvelope` prop (from App) to name the
  selected envelope in the matrix intro.

### File 5 — `src/components/PartDetailModal.tsx` (57,293 → 60,446 B)
- Case 2 rebuilt as the interactive 4-layer piston teardown: four layer
  groups registered with the new `PART_DETAILS[2].subParts` ids, so the
  existing click-to-highlight UI becomes the layer-by-layer teardown.

### File 6 — `src/components/Schematics.tsx` (25,544 → 27,990 B)
- Regenerative cycle strip (Scuppers → Flappers → Chamber → Foot Valve →
  Venturis + Air Injection → Turbine → Center Vents → return leg) and
  live valve-state tags read from the sim's valve-state machine
  (Flappers / Foot Valve / Needle Valve + Plenum Pressure guard tag;
  "— pick an envelope" while unresolved).

### File 7 — `src/App.tsx` (10,386 → 14,341 B, md5 9333e3f1…)
- Envelope state, default `'unresolved'`; A / B / Unresolved selector
  buttons in the sub-header strip with an inline readout of the selected
  envelope (stroke · air volume · pressure, from ENVELOPES).
- Refusal guard: unresolved blocks the sim loop + shows the banner
  "SIMULATOR PAUSED — Select Envelope A or Envelope B to simulate. Ray
  must true the baseline bore."; Boost button disabled while unresolved.
- Envelope passed into `SimControls` and `stepSimulation()` (real
  5-param signature kept).
- Permanent TARGET banner added to the persistent top header bar
  ("TARGET: 2,000 W — NOT MEASURED · SIMULATION READOUTS ONLY");
  the sub-header TARGET label was already there (confirmed, kept).

### Pages prep — `vite.config.ts`
- `base: '/helix-force-buoy/'` set. Note: the scaffold
  `helix-force-buoy-app/vite.config.ts` has NO base setting, so there was
  nothing to mirror; the project-site base was set explicitly.
- Diagram image paths are `BASE_URL`-aware (see File 2).

## Verification (all run in this folder, Nov 22 ~20:50)
- `bun install` — 187 packages installed.
- `bun run lint` (`tsc --noEmit`) — **clean, 0 errors**. (Two errors
  found and fixed during the work: an unescaped apostrophe in the Part 2
  text, and the initial telemetry missing the five new fields.)
- `bun run build` (`vite build`) — **clean in 1.39 s**; dist/index.html
  1.36 kB, JS 1,041.87 kB (Three.js chunk warning only), CSS 37.21 kB.
  dist asset URLs all under `/helix-force-buoy/`; public assets copied
  to dist/assets (diagram images present). Bundle contains the refusal
  text and carriage/layer code.
- Sim-check (`bun /tmp/sim-check.ts`, 28 assertions) — **ALL PASS**:
  unresolved pauses physics + raises the warning; plenum guard A = 9.20
  bar (OVER the 6.0 ceiling), B = 4.55 bar (under 7.0); emergent cycle
  rate 0.364 Hz in the live sim (the real machine's phases overlap via
  spring dynamics — faster than the sequential-batching bound of 0.167 /
  0.177 Hz in Gemini's analysis; the guard reports the live number);
  2 cycles complete per envelope; no NaN; sizing paradox false; valve
  fields consistent with phase; power chains land ~2,000 W both envelopes.
- `bun run preview` (port 4173) — index 200, JS 200, CSS 200, diagram
  image 200, all under `/helix-force-buoy/`. No browser render was done
  (no live-browser tool in this session); the preview serving + bundle
  contents are the render evidence. A live look in a real browser is
  still owed before calling the launch fully proven.

## Open items / needs Ray or Gemini
- **Drive signal:** carriage driven by `pistonOffset`, not Gemini's
  `-sim.strokeDepth` (see File 3 conflict note). Needs Gemini to confirm
  or correct.
- **Envelope B nominal:** 2.25 bar used per the corrected spec; her A5
  sizing said 2.5 bar. Ray has not trued it.
- **Phase order:** real machine kept (TRIGGERED phase); RESET mapped to
  the DISCHARGE → FILLING return. Needs Gemini to confirm the mapping
  and Ray to true the phase order if he wants the Nov 22 order instead.
- **Live power/RPM math not replaced** (already discharge-driven);
  dual-envelope power math is reference arithmetic in
  `headlinePowerChain()`. Retuning the app's constants to the envelopes
  needs Ray's word.
- **Push note:** `dist/` and `node_modules/` are gitignored per the
  export's `.gitignore`, so the push carries source only — Pages needs
  the build workflow (as used for rays-ironworks-studio /
  phoenix-voice-studio) or a dist commit; that choice is the push step's,
  not this record's.
- Gemini's verification/correction follow-up (if any) folds in as the
  next update, not a blocker.

## What was NOT done
No GitHub push, no Pages enablement, no publish, no edit to the AI Studio
app, no edit to the pristine export folder, no money spent. Marlo (Copilot
CLI) was not used for drafting — his monthly quota is exceeded (0.47 AI
credits, 31 s, no draft, Nov 22 ~20:33); all edits were implemented
directly in this session.
