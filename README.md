# Helix-Force Buoy — Marlow's Build from Gemini's Design

**Built:** Nov 22, 2026, at Ray's word (~19:31 PST) — "get Gemini's buoy codes to Marlow for the buoy system."
**Built by:** Marlow (GitHub Copilot Free, local CLI), from Gemini's design documents.
**Where:** local files only, in this folder. Nothing published, no AI Studio or Base44 app edited, no money spent, no key entered.

**TARGET: 2,000 W — NOT MEASURED.** Every output of this build is labelled SIMULATION — NOT MEASURED DATA. Nothing here claims the machine can achieve the target. No prices anywhere. Logs ship empty; true numbers only.

> His design. Her memory. One change at a time. Slow and smooth, smooth is fast.

---

## 1. Input files — what was actually used

| # | File | Status |
|---|------|--------|
| 1 | `../GEMINI-BUOY-ANSWERS-20261122.md` | Present — Gemini's Nov 22 redesign + lift evaluation (both envelopes), sizing paradox, flappers, foot valve, stepped piston, needle shuttle valve, pneumatic intensifier cycle, marine seals, EM repulsion coils, 10 missing specs, code-evaluation file list. |
| 2 | `~/workspace/sandbox/playground-tests/buoy-base44/gemini-buoy-air-plunger-sizing-20261120.md` | **Found in the sandbox, NOT in the design folder.** Gemini's Nov 20 air-plunger sizing (450 mm envelope). The brief said it was in `generator-system-design/` — it was not. Searched the workspace and found it here. |
| 3 | `~/workspace/sandbox/playground-tests/buoy-part-models/BUOY-2KW-SIZING-SPEC-20261120.md` | **Found in the sandbox, NOT in the design folder.** Marlow's Nov 20 2 kW sizing spec (180 mm envelope). Same note as above. |
| 4 | `../GENERATOR-SYSTEM-DESIGN-20261120.md` | Present — the master design record (Ray's design as drawn; 12 stages, 15 parts, moored, does not bob). |
| 5 | `../App.tsx.snapshot-20261120`, `../DATA-PLAN.md.snapshot-20261120`, `../space.json.snapshot-20261120` | Present — closest local copy of the buoy app code (the local ts-space app, not the AI Studio Buoy 3D Core app). Used for the canonical 12 stages, 15 parts, 11-step protocol, and the Harvest/Boost simulator behaviour. |

Related local work NOT used as a source (noted, not copied): `~/workspace/sandbox/playground-tests/buoy-part-models/` (JS part models — unitless visual models per the 2 kW spec §6) and `~/workspace/ts-spaces/helix-force-smart-hybrid-buoy/` (the local functional buoy app — its AGENTS.md forbids building from it; this build does not).

---

## 2. Files built

| File | What it is | Which design decision it implements | What it leaves open |
|------|-----------|--------------------------------------|---------------------|
| `src/lib/physics.ts` | Pure physics helpers (SI units). No React/three imports. | The force balance, lift pressure, hydrostatic head, thrust, swept volume, power chain (P = ΔP·Q), coil EMF (E ≈ 4.44 f N B A), Boyle plenum approximation, piston clamp. Each function cites its source doc. | Nothing — it is arithmetic only. It verifies no feasibility. |
| `src/data/rayDesignData.ts` | Design data + `stepSimulation()`. The heart of the build. | Both sizing envelopes in full (A: 180 mm Marlow; B: 450 mm Gemini); the canonical 12 stages and 15 parts verbatim from the master record; the 8 proposed redesign additions; tide presets (fill-rate only); the full cycle FILLING → DISCHARGE → RESET with flapper/foot-valve/needle states, stepped-piston fallback, accumulator plenum, EM pulse energy accounting, the sizing-paradox guard, and the lift check on the upstroke. | See §5 (pending slots) and §6 (modelling notes). |
| `src/components/BuoyCore3D.tsx` | Three.js scene: hull, scuppers + flapper ring, pan fill, stepped piston, hollow center needle + poppet, accelerator throat, 4 quad-venturi ports, foot valve, turbine (spins with turbineRPM), Fibonacci helix, Halbach ring, EM stator rings, air tank, solar crown, mooring. | Scene hierarchy + piston travel clamps + pan fill + turbine rotation, following the structure Gemini listed for the app's BuoyCore3D.tsx. Hull NEVER bobs (position.y stays 0); tide changes pan-fill rate only. | Air-tank motion: `tankOffsetY` defaults to 0 — see §5 slot 2. Step dimensions: both piston faces drawn at the bore until Ray trues the step. |
| `src/components/OperatingPrincipleAndSizing.tsx` | Operating Principle (6 steps, Ray's words) + sizing tables + paradox + redesign additions + conflicts table + missing list. | The shared Operating Principle section Gemini listed, extended with both envelopes side by side and the Nov 22 redesign. | Nothing structural — its content updates when the pending answers land. |
| `src/components/PartDetailModal.tsx` | Detail view for one part: the 15 canonical parts (NOT renumbered, no Part 16) + the featured Center Needle + proposed additions attached to their part. | The part-detail logic Gemini listed, with per-part spec lines drawn only from the documents. | Any spec line that reads "not specified in the design" waits on Ray. |
| `src/components/Schematics.tsx` | Flow-path schematic with valve states, bar readouts, Center Needle + Level/Cam Trigger, Solid-State Magnetic Resistance, TARGET banner. | The schematics structure Gemini listed. Flow path kept in the master record's stage order (turbine 04, then venturis 05). | The turbine-vs-venturi ordering question (see §4). |
| `src/App.tsx` | Global state: envelope choice, plungerSetting (0.50–1.50×), Over-Energize, Mode A/B, tide, EM pulse toggle, run/pause/reset, part detail, EM guards. | The app shell Gemini listed (plungerSetting, overEnergize, modeABoost, telemetry). | Envelope defaults to **unresolved** — the app opens in comparison mode and the simulator refuses to run until an envelope is picked. No winner is picked anywhere in this build. |
| `scripts/verify-sim.ts` | Bun-runnable verification: 27 checks (lift, thrust, power chains, coil EMF, full-cycle sims for both envelopes, EM deficit, unresolved refusal). | Proves the implementation reproduces the documents' numbers. | — |
| `scripts/check-syntax.ts` | Bun-runnable syntax + import check for all 7 source files (transpiler-based; react/three are externals and are NOT installed here). | Proves every file parses and every import resolves. | — |
| `package.json` | Minimal manifest: `bun run verify`, `bun run build:check`. No dependencies installed. | — | — |

### How to run the checks

```sh
cd ~/workspace/helix-program/generator-system-design/marlow-buoy-build-20261122
bun run verify       # 27 checks — lift, power chains, full-cycle sims, EM deficit
bun run build:check  # 7 source files parse; imports resolve (react/three external)
```

Both passed on Nov 22, 2026 (verify: 27/27; syntax: 7/7). The app itself has NOT been run in a browser — it needs a React + Three.js host (the AI Studio app or a Vite project). The logic (physics + data + simulation) is fully executed and verified by `verify-sim.ts`; the components are syntax-checked only.

---

## 3. Design decisions implemented

1. **Both envelopes, side by side, no winner.** Envelope A (Marlow: 180 mm bore × 1.00 m stroke, 25 L/shot at 30 cycles/min, 4.0 bar, 50 L tank) and Envelope B (Gemini: 450 mm bore × 0.65 m stroke, 103 L swept, 4.0 s cycle, 1.6 bar ΔP, 250 L tank). The simulator refuses to run until one is chosen explicitly.
2. **Positive lift, recomputed.** ΔP_lift ≥ (m_piston·g + m_water·g + F_friction)/A. Case A: 0.215 bar gauge (+ 0.181 bar hydrostatic at 1.8 m) → 1.41 bar abs. Case B: 0.109 bar gauge (+ 0.221 bar at 2.2 m) → 1.34 bar abs. Conclusion kept: 0.35–0.50 bar gauge lifts piston + water in either envelope.
3. **The sizing paradox, as a guard, not just a note.** At 4.0 bar the thrust is 10,180 N (A) / 63,600 N (B). The simulator raises a SIZING PARADOX warning if lift pressure is ever applied with the top scuppers open, and the flappers are shut on discharge and lift by design.
4. **Flow control redesign.** One-way flapper/reed ring at the top scuppers (Part 03); anti-siphon foot valve between the chamber and the quad-venturis (Part 08). Both are PROPOSED additions — they change the master record's open grilles and need Ray's word.
5. **Stepped differential-area piston.** Larger upper crown (A_water), smaller lower pneumatic face (A_pneumatic). The step dimensions are NOT in any document, so the simulator falls back to the single-bore piston (A_pneumatic = A_water) and flags the step as unspecified. Note: with a real step the lift pressure would be HIGHER than the lift summary's lower bound, because the lift face is smaller.
6. **Hollow center needle as shuttle/poppet valve.** Unseats at the bottom of the stroke, reseats at the top via the level/cam trigger, locking the charge beneath the piston.
7. **Pneumatic intensifier cycle.** The air tank is an accumulator-reservoir loop: the downstroke compresses air into a side accumulator plenum (Boyle approximation, labelled as such); the level/cam trigger admits the stored air at the bottom and fires the upstroke; a snifter/solar top-up valve (Stage 12) replenishes leakage. Leakage and top-up rates are unspecified (defaults 0, flagged).
8. **Marine seals.** Dual U-cup polyurethane seals facing opposite directions, sacrificial water-flushed wiper ring, ceramic/hard-chrome needle sleeve.
9. **EM repulsion coils, with the risks shown, not hidden.** Linear stator + Halbach ring on the piston; forward polarity down, reverse up; phase latching; velocity boost (P ∝ v³). The simulator models the pulse as an energy transaction only (spend 500 J — Gemini's illustrative example — return 50–70%) and the net is NEGATIVE by her own analysis: the verification run spent 2,002 J and got back 1,201 J (net −801 J). Thermal, demagnetization, and inductive-spike guards return UNEVALUABLE — coil resistance, stator thermal path, magnet coercivity, inductance, and di/dt are not specified in any document.
10. **H-bridge router upgrade (proposed).** Four-quadrant bi-directional H-bridge for motoring vs generating, stator coils potted against the hull (seawater heat sink), Mu-metal/silicon-steel flux barriers.
11. **Harvest/Boost modes.** Mode A stores; Mode B spends the bank in one pulse through the turbine (and the bank will not Boost when nearly empty — "let her harvest a while first").
12. **Stationary moored buoy.** The hull never bobs in the 3D scene or the sim. Tide changes the pan-fill rate only, never hull motion.

---

## 4. Conflicts flagged (no winner picked)

| # | Topic | Envelope A (Marlow) | Envelope B (Gemini) |
|---|-------|--------------------|--------------------|
| 1 | Bore | 180 mm | 450 mm |
| 2 | Stroke | 1.00 m | 0.65 m — and Gemini's own Nov 22 seal section says "1.0 m stroke" while her Nov 20 sizing says 650 mm (internal inconsistency, flagged not smoothed) |
| 3 | Shot / cycle | 25 L at 30 cycles/min (0.50 Hz) | 103 L swept, 4.0 s cycle, 1.6 s pulse |
| 4 | Driving pressure | 4.0 bar gauge net shot | 1.6 bar effective ΔP — and 0.35–0.50 bar gauge lifts in either envelope (the paradox) |
| 5 | Air tank | 50 L @ 4.0 bar (1.0–6.0) | 250 L @ 1.5–3.0 bar (5.0–7.0 over-energized) — Gemini's Nov 22 paradox applies Marlow's 4.0/6.0 figures to both; her own Nov 20 range is 1.5–3.0 / 5.0–7.0 |
| 6 | Turbine | 400 mm, 10 blades, 35°, 1,800 rpm | 280 mm OD, 8 blades, 28–34°, 650–950 RPM |
| 7 | Coils | 48 turns/phase, 2.5 mm², 0.50 T, 30 Hz | ~120 turns, 10 AWG eq., N52 0.95–1.1 T, frequency not stated (EMF not computable for B) |
| 8 | Efficiencies | 55% × 72.73% = 40% | 82% shaft, 81% generator, 50% total |
| 9 | Top slots | 4 × 52×40 mm (8,320 mm²) | 4 × 150×70 mm (420 cm²) |
| 10 | Venturi throats | 12.8 mm Ø each (510 mm²), mouth 38 mm | 65 → 35 mm ports |
| 11 | Hull | 1.20 m Ø × 2.40 m, 75% immersion | 850 mm OD × 2,800 mm, 2,200 mm draft |
| 12 | Mooring | 2,500 kg wet (4 × 625 kg, assumed) | ≥1,800 kg ballast + anchor |
| 13 | Supercaps | Not sized | 165 F @ 48 V (~190 kJ) |
| 14 | Cycle phase order | Not stated as a chain | Nov 20 sim: fill → trigger → plunger UP → discharge. Nov 22 redesign: fill → discharge (downstroke) → air-fired upstroke at the bottom. This build implements the Nov 22 order (later, more detailed, matching the master record). The app's real stepSimulation settles it on export. |
| 15 | Turbine vs venturi order | Master stage order: turbine (04) then venturis (05) | Nov 22 flow path reads venturis → turbine exhaust; Nov 20 calls the turbine "out bottom". Clarification item — the schematic keeps the master order. |

### Findings the simulator itself surfaced (not in any document)

- **Cycle-rate mismatch (both envelopes).** The stated phase timings do not fit inside the stated cycle if the phases run one after another. Envelope A: fill 2.0 s + discharge 2.0 s + reset 2.0 s = 6.0 s per cycle → 0.165 Hz emergent vs 0.50 Hz stated. Envelope B: 2.4 + 1.65 + 1.65 = 5.7 s → 0.175 Hz vs 0.25 Hz stated. Either the phases overlap or one of the stated rates must give. (Envelope A's own numbers are the tighter bind: its 12.5 L/s fill needs ~2.0 s to fill 25 L — the whole 2.0 s cycle.)
- **Plenum over-pressure (Envelope A).** Boyle compression of the 50 L tank by the 25 L stroke drives the plenum to ~9.0 bar gauge at the bottom of the stroke, above the 6.0 bar over-energized ceiling. The tank volume or the stroke must give. (Envelope B: 250 L × 103 L → ~4.5 bar gauge, inside its 7.0 bar ceiling.)
- **Envelope B's 3% internal difference.** Her stated 62.5 L/s × 1.6 s = 0.100 m³ against the 0.103 m³ swept volume from 450 mm × 650 mm. The build uses her stated flow (62.5 L/s) for the power chain so her 10,000 W pulse → 4,000 W average → 2,000 W reproduces exactly, and flags the 3%.
- **EM deficit, demonstrated.** See §3.9. The simulator shows the drain; it does not hide it.

---

## 5. Missing numbers — for Ray to true

(Gemini's 10 [G22 §4], plus the gaps this build found.)

1. Bore: 180 vs 450 mm — which is the physical baseline?
2. Stroke: 1.00 vs 0.65 m (and Gemini's 1.0 m seal note vs her 0.65 m sizing).
3. Piston mass: unspecified (assumed 20 / 45 kg in the lift working).
4. Water head height above the piston: unspecified.
5. Scupper valving: open grilles in the diagram; flappers proposed, Ray's word needed.
6. Air tank volume & pre-charge: 50 L @ 4.0 bar vs 250 L @ 1.5–3.0 bar; sealed spring or compressor-charged?
7. Stepped piston dimensions: A_water and A_pneumatic — no dimensions anywhere.
8. Halbach specs: grade (N42/N52), block dimensions, inner bore; "24 blocks" is illustrative only; field assumed 0.5–1.0 T.
9. Coil turns/gauge/topology: 48 turns 2.5 mm² vs ~120 turns 10 AWG; star vs delta, single vs 3-phase?
10. Wave sea state: H_s and T_p unspecified (calculations arbitrarily assumed 0.5 Hz / 2 s).
11. Coil resistance, stator thermal path, magnet coercivity, inductance, di/dt — needed before the EM guards can evaluate.
12. Tide preset fill-rate multipliers — live in the app's rayDesignData.ts, pending export (all 1.0 until then).
13. Level/cam trigger threshold — the sim uses a full pan (1.0) and flags it.
14. Upstroke duration — the sim uses the discharge duration as its reference and flags it.
15. **2,000 W target: TARGET ONLY — NOT MEASURED.**

---

## 6. Pending inputs — where each one slots in

| # | Pending answer | Slots in here |
|---|---------------|---------------|
| 1 | **Regenerative cycle** (Gemini, asked ~19:14 Nov 22) — stay charged, release air pressure, re-inject through the water jets that propel the turbine faster, excess electrical energy pumps the air tank back up; all a cycle, adjustable. | `stepSimulation()`: the RESET phase and the accumulator loop. If her cycle changes the valve timing, pressure setpoints, or pump trigger, the phase machine and the `SimControls` gain those inputs. The current loop is the Nov 22 intensifier cycle; her regenerative answer may replace or extend it. |
| 2 | **3D model spec** (asked ~19:15) — ports and a buoy release system for the jets and the injection system; all parts visible; air tank vertical, going up and down at the bottom; capacity accurate for what it must hold. | `BuoyCore3D.tsx`: `tankOffsetY` (currently 0 — the tank mesh sits fixed) becomes the tank-motion driver; new meshes for the jet/injection ports and the release system; the capacity readouts in `Schematics.tsx` take her accurate capacity figures. |
| 3 | **Compressor in the moving unit** (asked ~19:16) — buoy pressure and compressor in the same unit going up and down, like a refrigerator compressor; high compression rate, discharge rate matched. | `rayDesignData.ts`: a compressor stage in the cycle (new phase input or a compressor block on the accumulator); `PROPOSED_ADDITIONS` gains the compressor; the tank sizing in both envelopes is re-checked against the matched discharge rate. |
| 4 | **EM force as the compression agent** (asked ~19:17) — vertical compressor type unit, NOT a cylinder; momentum from the release and buoyancy factor; jet flow in/out uses the extra weight of ocean water filling the tank inside the buoy and expelling water through the center vents. | `rayDesignData.ts`: the EM model gains a compression role (today it is a pulse/thrust transaction only); `BuoyCore3D.tsx`: the vertical non-cylinder compressor mesh; the water-weight-as-ballast coupling enters the force balance. |
| 5 | **Tank sizing from the flow** (asked ~19:18) — size the air tank from the jet pressure/velocity, flow per stroke, cycle rate, stroke volume, and lift pressure, for BOTH envelopes; high-pressure jet around the turbine; compensate with EM force. | `ENVELOPES` tank fields and `liftSummary()`: her derived volumes and pre-charges replace the current 50 L / 250 L figures (or sit beside them as a third, flow-derived sizing — flagged, not merged). The plenum over-pressure finding (§4) is re-checked against her numbers. |
| 6 | **Four-layer hollow-core piston** (asked ~19:19) — center piston with a hollow core; compressor rod and other piston components sealed inside another hollow tube; "think four layers." | `BuoyCore3D.tsx`: the piston group gains four concentric layers (outer wall, hollow core, sealing tube, rod + components); `PartDetailModal.tsx` "plunger" specs gain the layer stack; the piston mass assumption (20/45 kg) is re-checked against the four-layer construction. |
| 7 | **Gemini's full code evaluation** of the Buoy 3D Core app (rayDesignData.ts, BuoyCore3D.tsx, OperatingPrincipleAndSizing.tsx, PartDetailModal.tsx, App.tsx, Schematics.tsx) — waits on the app code being exported from Ray's AI Studio account (blocked on the builder daily limit until ~midnight Nov 22). | Everything: her extracted `stepSimulation()` equations (displacementBar, plungerAirBar, waterLevel, turbineRPM), the power derivation (P = V × I or an empirical curve scaled to 2,000 W?), the piston travel clamps, Mode B boost behaviour, and the TIDE_PRESETS values replace this build's flagged placeholders and reconcile the phase-order question (§4.14) and the bar-readout definitions. |

---

## 7. Modelling notes (choices made, labelled as such)

- **Phase order:** Nov 22 (fill → discharge → air-fired upstroke) over Nov 20 (trigger → upstroke → discharge). Rationale in §4.14. The app export settles it.
- **Boyle approximation:** the accumulator plenum uses isothermal compression (P₂ = P₁·V₁/V₂). Real compression is closer to adiabatic; temperature, leakage, and hysteresis are unspecified. Labelled in the code.
- **Plenum during the upstroke:** the sim holds the plenum pressure from the end of discharge through RESET (it does not model the gas expanding as the piston rises). The lift margin is so large (9.0 bar available vs 0.40 bar needed in A; 4.5 vs 0.33 in B) that the simplification does not change the outcome; it is noted here, not hidden.
- **Envelope B tank nominal 2.25 bar:** the midpoint of her stated 1.5–3.0 bar range. Her doc states a range, not a single nominal. Labelled in the code.
- **Envelope B turbine rpm reference 950:** the top of her stated 650–950 RPM pulse range, used as the sim's reference point. Labelled in the code.
- **EM return fraction 0.6:** the midpoint of her stated 250–350 J back per 500 J spent (50–70%). The range itself is carried in the controls and the warning text. Labelled in the code.
- **Turbine RPM** scales linearly with discharge flow from the envelope's nominal point. The app's real turbine curve is pending export.
- **Coil volts** are computed only for Envelope A (63.936 V peak/phase, reproducing Marlow's calc). Envelope B reads null — frequency and active area are not stated for it.
- **The sim does not model** Bernoulli losses, pressure decay beyond the Boyle plenum, sealing leakage (rate 0, flagged), cavitation, turbine stall, coil impedance, or the fluid geometry that routes water from above the crown to the venturis. The documents do not dimension those; the sim follows the documents' stated operating principle instead of re-deriving the fluid mechanics.
- **No winner picked anywhere.** The app opens in comparison mode; the simulator refuses with a plain warning until an envelope is chosen.

---

## 8. Verification record

- `bun run verify` — **27/27 PASS** (Nov 22, 2026). Lift Case A/B reproduce Gemini's numbers (0.215/0.109 bar gauge; 1.41/1.34 bar abs; 10,179/63,617 N thrust at 4.0 bar); both power chains land on the 2,000 W target by their own arithmetic (A: 5,000 → 2,750 → 2,000 W; B: 10,000 W pulse → 4,000 W avg → 2,000 W); coil EMF A reproduces 63.936 V; both envelopes complete 3 full cycles with the piston clamped and the phase order FILLING → DISCHARGE → RESET; the cycle-rate mismatch and the Envelope A plenum over-pressure fire as findings; the EM run nets −801 J over 2 cycles; the unresolved envelope refuses.
- `bun run build:check` — **7/7 files parse; imports resolve** (react/three external). One real bug was caught and fixed by this check during the build: `crownGeo` was declared twice in BuoyCore3D.tsx (piston crown vs solar crown) — the solar one is now `solarCrownGeo`.
- Three check failures during the build were fixed by correcting the build (not the documents): the lift thrust was first computed at each envelope's tank nominal instead of the 4.0 bar paradox pressure; Envelope B's pulse flow was first derived from the swept volume (64.6 L/s) instead of her stated 62.5 L/s, which surfaced the 3% swept-volume difference (§4) — now flagged in the derivation.
- The app has NOT been run in a browser. The logic is executed and verified; the components are syntax-checked only.

---

## 9. Stewardship

- Copy only — this build copies nothing from the local buoy app and edits no live app. It is a new local implementation from the documents listed in §1.
- Nothing published or shared. Nothing about the design changes without Ray's word. The 8 redesign additions are PROPOSED, not Ray's design.
- No prices, no budgets anywhere.
- Logs ship empty; true numbers only. No sample readings, ever.
- If any input file in §1 changes, re-run `bun run verify` and note the date — do not repair the inputs in place.
