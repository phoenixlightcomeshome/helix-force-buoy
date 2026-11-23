# Generator System Design — Master Record

**Design:** Helix-Force Buoy — Energy Generator Engine (Ray's wave-buoy energy generator engine)
**Owner:** Ray Mroczkowski (Ray's Ironworks)
**Stewardship directive:** Ray's word, Nov 20, 2026 ~00:29 AM PST — "Take care of my generator system design it's very important."
**Record created:** Nov 20, 2026 (preservation pass, copy only — no original was moved or edited, no live app was touched, nothing published or shared)
**Archive folder:** `~/workspace/helix-program/generator-system-design/`
**Rule for this design:** Ray's design, kept under his direction. Never redesigned, never repriced, no invented specs. Nothing about the design changes without his word.

---

## 1. The design in full

### 1.1 The diagram (10 labeled parts)

Source: `341_12_upel.png` — the labeled cutaway Ray sent Nov 20, 2026. A cylindrical device hanging in water under a dock, water in at the top scuppers, water out at the bottom. The ten labels, exactly as drawn:

1. Central Air-Plunger top scupper Intake
2. Central Air-Plunger (Weighted Piston)
3. Axial-Flow Turbine (Hybrid Motor/Generator)
4. Quad-Venturi Acceleration Ports
5. Graphene-Ion Scrub Electrodes
6. Halbach Magnetic Matrix
7. Fibonacci Helical Core
8. High-Density Supercapacitors
9. Smart-Switch Capacitor Base
10. Smart-Switch Power Router

### 1.2 The 12-stage stack (canonical, from the local buoy app)

Source: `client/src/App.tsx` in the Helix-Force Smart-Hybrid Buoy app (`STAGES`, verified verbatim Nov 20, 2026). The app's stack has 12 stages: the diagram's 10 parts plus two more — the Air Accelerator (stage 03, Ray's enhancement from the bucket-proto thread) and the Solar Crown (stage 12).

- **01 — Central Air-Plunger — Top Scupper Intake.** "The crown breathes here. Waves wash over the top scuppers and the sea enters the machine — air and water taken in together at the surface."
- **02 — Central Air-Plunger (Weighted Piston).** "The heavy piston rides each wave's rise and fall. On the downstroke it drives the column of air and water below it — the buoy's heartbeat, powered by the sea itself."
- **03 — Air Accelerator Unit — Pascal ΔP (THE ENHANCEMENT).** "The enhancement: a tapered throat in the plunger path. Pressure taps read P_in at the wide mouth and P_throat at the narrow; ΔP = P_in − P_throat (pascals) is the working number — it sets how hard the flow accelerates and entrains on its way down. Tune the throat, tune the machine."
- **04 — Axial-Flow Turbine (Hybrid Motor/Generator).** "The accelerated stream spins the axial turbine. As a generator it harvests the flow; as a motor it can spend banked charge back into the water — one machine, both directions."
- **05 — Quad-Venturi Acceleration Ports.** "Four tapered ports squeeze the stream a second time. Each narrowing trades pressure for speed, jetting the flow into the core chamber already spinning."
- **06 — Graphene-Ion Scrub Electrodes.** "The spinning water runs past the graphene-ion scrub electrodes, which draw ions and debris out of the stream as it passes — the water leaves cleaner than it came in."
- **07 — Halbach Magnetic Matrix.** "The magnetic heart. The Halbach array focuses its field inward on the core and cancels it outside, so the moving conductive seawater crosses the strongest field exactly where the coils listen."
- **08 — Fibonacci Helical Core.** "The vortex winds down the Fibonacci helix — each turn in golden proportion, the spiral tightening as it falls. Copper induction coils around the core harvest the crossing field as electromagnetic energy: the blue pulses in the drawing."
- **09 — High-Density Supercapacitors.** "The bank in the base. Supercapacitors catch the harvest pulse by pulse — fast in, fast out — smoothing the sea's rhythm into stored charge."
- **10 — Smart-Switch Capacitor Base.** "The armored foundation that houses the bank and the brain, ballasts the buoy upright, and carries the through-flow out the bottom, back to the sea."
- **11 — Smart-Switch Power Router.** "The HELIX-MHD brain's hand. Mode A Harvest: the router quietly stores. Mode B Boost: it spends the bank back through the turbine in one stronger pulse. Store or release — the router decides."
- **12 — Solar Crown.** "Panels on the crown top up the bank under sun and keep the router, sensors, and beacon alive through flat calms when the sea gives nothing."

### 1.3 Operating principle (as drawn)

From `Rays-Power-and-Healing-Systems-Dossier.md` §2.1: "Waves work the central air-plunger (a weighted piston). Water enters at the top scupper intakes, is driven down through an axial-flow turbine (drawn as a hybrid motor/generator — it can push as well as harvest), accelerates through quad-Venturi ports, and enters the Fibonacci helical core, where the Halbach magnetic matrix focuses the field and the graphene-ion scrub electrodes treat the water. Output is smoothed in a base of high-density supercapacitors under a smart-switch power router, and discharged downward."

Role in the system (dossier): "The reference design — every other water device in the family is a variation on this stack: plunger → turbine → helix → field → scrub → storage."

Family law (from the buoy app's DATA-PLAN.md, Ray's brief verbatim): "water enters, turns in a spiral, meets a magnetic heart, leaves cleaner than it came — and the turning pays for the cleaning."

Footer (verbatim, required by the brief): "His design. Her memory. One change at a time. Slow and smooth, smooth is fast."

### 1.4 Harvest / Boost modes

- **Mode A — Harvest:** the router quietly stores. In the simulator, the bank fills at a rate driven by wave height and ΔP.
- **Mode B — Boost:** the router spends the bank back through the turbine in one stronger pulse. In the simulator, Boost spends the bank in one pulse and returns to Harvest; the bank will not Boost when nearly empty ("The bank is nearly empty — let her harvest a while first").

### 1.5 The 15-part gather list

Source: `PARTS` in `App.tsx` (verified verbatim Nov 20, 2026). No prices anywhere — Ray's standing correction.

| # | Part | Detail |
|---|------|--------|
| 1 | Hull / body shell | The buoy's pressure hull and outer skin |
| 2 | Central air-plunger + weighted piston | Piston, rod, and guide seals |
| 3 | Top scuppers | Intake grilles at the crown |
| 4 | Air accelerator throat | Tapered throat insert for the plunger path |
| 5 | Pressure taps + ΔP sensor | P_in and P_throat taps, differential sensor in Pa |
| 6 | Axial-flow turbine | Hybrid motor/generator unit |
| 7 | Copper induction coils | Harvest coils around the core chamber |
| 8 | Quad-Venturi ports | Four tapered acceleration ports |
| 9 | Fibonacci helical core | Helical insert, golden-proportion turns |
| 10 | Halbach magnetic matrix | Magnet array, field focused inward |
| 11 | Graphene-ion scrub electrodes | Electrode set for the scrub chamber |
| 12 | High-density supercapacitors | The cap bank for the base |
| 13 | Smart-switch router + capacitor base | Router board, base housing, ballast |
| 14 | Solar crown panels | Crown panels + charge feed |
| 15 | Mooring / anchor fittings | Anchor points, chain, swivel, marker light |

### 1.6 The 11-step trial protocol

Source: `PROTOCOL` in `App.tsx` (verified verbatim Nov 20, 2026).

| # | Step | Detail |
|---|------|--------|
| 1 | Dry assembly | Full stack together on the bench, no water |
| 2 | Seal & leak test | Every seam checked before she floats |
| 3 | Float test (tank) | Trim and ballast — she should ride upright and true |
| 4 | Plunger stroke check | Full travel, smooth, no binding |
| 5 | Vortex spin-up | Log flow and ΔP as the spiral forms |
| 6 | Coil output logging | Peak volts off the induction coils |
| 7 | Water in / out sampling | TDS at the intake and at the outflow |
| 8 | Cap-bank charge | Time the bank to full in Harvest |
| 9 | Timed Boost release | One pulse through the router — time it |
| 10 | Mooring / deployment check | Anchor set, swivel free, light on |
| 11 | Sign the log | Date it, sign it — the session becomes evidence |

### 1.7 Logs (ship empty — true numbers only)

Energy log (sea state, flow, ΔP, coil volts, charge, Harvest/Boost mode), water log (TDS in → out delta), signed build log. All ship EMPTY by design; no sample readings anywhere. No true readings exist yet for this engine.

---

## 2. Every place the design lives (inventory, verified Nov 20, 2026)

### 2.1 Local files — VERIFIED INTACT

| # | Location | What it is | Size | md5 | State |
|---|----------|------------|------|-----|-------|
| 1 | `~/workspace/user/files/341_12_upel.png` | Design diagram Ray sent Nov 20, 2026 ("for the design 3d model") — the 10-label cutaway | 211,934 B | `9546093f281eabe209a158ee6b7e8632` | Intact. NOTE: the file holds JPEG data (1408×768) despite the `.png` name. Byte-identical to `341_0_xtp6.png` from Oct 21 — the Nov 20 send is a second copy of the same drawing, not a new drawing. |
| 2 | `~/workspace/user/files/4527_2_q532.jpg` | Canonical pier cutaway — the face of the buoy app | 211,942 B | `e39f4e62b51c343e73ac1e8866eb0527` | Intact. JPEG 1408×768. |
| 3 | `~/workspace/ts-spaces/helix-force-smart-hybrid-buoy/` | Local functional buoy app (TypeScript space, slug `helix-force-smart-hybrid-buoy`). Canonical content in `client/src/App.tsx` (48,124 B, md5 `64770b1f879a00264a5c3e179b38a3f6`, 1,134 lines, mtime Oct 22, 2026 02:48). Five tabs: The Buoy, Build, Trials, Logs, Simulator. | — | — | Intact, READ ONLY. Its AGENTS.md forbids building from it or hand-editing it; `app.db` (36,864 B) holds user-entered logs/checklists and was not opened or touched. Built + verified Oct 21, 2026 (afternoon); audits passed twice. |
| 4a | `~/workspace/helix-program/media-generation-helix-force-buoy-realistic-uni-0-a065c7b3-05b4-4c20-a82d-a23369623a35.webp` | Photorealistic Helix-Force buoy as a built machine (Oct 22, 2026) | 607,632 B | `03e241730bb7c976c2a036df7af63bbf` | Intact. |
| 4b | `~/workspace/helix-program/media-generation-buoy-plunger-system-realistic-0-2b84a078-6fd3-4a87-abb5-ef3c4708a6aa.webp` | Realistic plunger-system cutaway (Oct 22, 2026) | 770,602 B | `dd077544173121180d104b1084057ba1` | Intact. |
| 4c | `~/workspace/helix-program/media-generation-helix-force-buoy-realistic-unit-1792627922.json` + `media-generation-buoy-plunger-system-realistic-1792629367.json` | Generation receipts for the two renders above (snapshot IDs + source URLs) | 631 B each | `796ab9cd251a2b82c5a9a2eba6be94b6`, `44a0fe9fc2806211bede877a9188960b` | Intact. NOTE: the URLs inside point at Meta CDN links that expire — the local `.webp` files are the durable copies. |
| 4d | `~/workspace/helix-program/Rays-Power-and-Healing-Systems-Dossier.md` (+ `.pdf`) | The design dossier for the whole Helix family (39,412 B md / 41,066 B pdf), incl. the buoy's operating principle, components, role, and v-next enhancements (flagged honestly as enhancements) | 39,412 B / 41,066 B | md `a4ebd69f9c435a51d3003b62f1dda084`, pdf `2bd8af0c44349b8989ba1466db7534e6` | Intact. |
| 5 | Other design sheets in `~/workspace/user/files/` (same family, copied to archive) | `346_11_x9ky.png` Helix-Force v2 Buoy engineering cutaway (211,985 B, `6aacff604d5c32813d02e1eb35dde4c0`); `349_12_ejp1.png` Project Helix — Upward, pier tidal pump (191,834 B, `bab2266a0c42fe0dcc1143106d43d165`); `267_10_oimz.png` Solid-State Helical MHD (151,726 B, `4cd09b08cc8f94effe1e6bc5ba566fd0`); `389_15_0lfg.png` Submersible MHD SUB-MHD-REV.B (187,159 B, `f8039fae09319623e483c94a79ee3b03`); `390_16_mlj0.png` bucket bench unit (152,529 B, `f53b5316d3fe27feafa3ab30c1d22a10`); `344_13_w6lo.png` Helix-Force buoy pier cutaway (269,182 B, `250338cd31f9ad14e5e0576955d4b4ad` — same bytes as `344_1_26xt.png`) | — | — | Intact. |

### 2.2 Apps — state as found (last live checks Nov 20, 2026, by the parent agent's browser tasks)

| # | App | Account | Link | State as found |
|---|-----|---------|------|----------------|
| 6 | **The Core Atlas** — Ray's Generation Systems & Designs | Ray's AI Studio (raysironworks101@gmail.com) | https://aistudio.google.com/apps/32e5e14d-932e-467a-a754-6805a9207014 | **FIXED Nov 20 ~00:29 AM PST** (browser task, Ray's word "Fix it so it works please"). The failed Gemini step was a Gemini-side failure, not a code error; retry with Gemini 4 Hydrogen fixed a stale-closure bug in the Hangar Three.js loop, WebGL fallback, strict-TS issues, a missing SVG arrow marker, unwired Hero slider + FLOW toggle, and modal/timer cleanup. tsc strict 0 errors; dev server 200 OK. **Preview now launches and renders; all 7 sections clicked through and verified** (Hero; 6 Core Systems incl. Helix-Force Buoy Core + Flow Channels; Zephyr Fleet; Hangar with live Three.js Zephyr-Aries orbit view; TABs Homes; Knowledge Base; Steward's Console 8/8 nodes online). Draft only, nothing published. One non-blocking warning left: THREE.Clock deprecated. The Atlas holds the buoy as: Section 02 "Core Generation Systems" — "Helix-Force Buoy Core: Fibonacci helical core, copper induction coils, quad Venturi ports, supercapacitor base..."; Steward's Console — "Buoy Core (HFB-CORE-V2): VENTURI DRAW: POSITIVE // SMART-SWITCH: SURGE READY"; FLOW CHANNELS panel — "THE PLUNGER CHANNEL — Source: the Helix-Force Buoy Core's wave-driven air-plunger" and "THE VENTURI CHANNEL — Source: the buoy's quad-Venturi acceleration ports". |
| 7 | **HydroDraft: Pump Manifold Designer** | Ray's AI Studio | https://aistudio.google.com/apps/5b5ade6e-fe70-4c49-b79d-4ad25757f6e2 | Created Oct 22, 2026. **Blank preview on Launch Nov 20** — shows as "Migrated" with only a Python/matplotlib code fragment visible. Not fixed; not in the Core Atlas fix. A pump candidate, not confirmed functional. |
| 8 | **PrecisionPump Designer** | Ray's AI Studio | https://aistudio.google.com/apps/365630a8-fc77-4838-8e57-9f00eda51c6b | Created Oct 22, 2026. **Blank preview on Launch Nov 20** — "Migrated", matplotlib fragment only. Not fixed. A pump candidate, not confirmed functional. |
| 9 | **HydroCore** — Water, Pump & Generation Field Studio | Phoenix's AI Studio (phoenixlightcomeshome@gmail.com) | https://aistudio.google.com/apps/9c9817e5-d4bc-4112-93d4-f3173a55e069 | Built Nov 17, 2026; all 6 tabs verified rendering then (Site & POD Water Intake; Pump Sizing & Curve Desk; Manifold & Valve Layout; Off-Grid Generation & Energy Balance; Unified Technical Schematic & Print Sheet; Field Bill of Materials & JSON Archive). Unpublished draft. Not re-checked live Nov 20. Watch number at defaults: 5.11 L/Wh — **that is this app's default, NOT the buoy engine's rating.** |
| 10 | **AI Studio buoy build (Oct 22, 2026)** | Ray's AI Studio (reported) | — | Reported built Oct 22 at Ray's ask ("create that one as well enhance everything"), from the pier cutaway as canonical face, verified end to end then (stages tapped, a part ticked and saved, a log entry written, Harvest/Boost cycle run). **Current location UNVERIFIED:** the Nov 20 inventory of Ray's 22 AI Studio apps found no standalone buoy-named app (filters for buoy/ocean/wave/marine/water/energy returned 0 matches). It may live inside another app or under another name — do not guess. |

### 2.3 Design docs — what they say

- `~/workspace/faceless-youtube-growth-studio/planet-bio-max-20261117.md` (32,887 B): the Planet + Bio max-logic design. HydroCore is App 2 (Water, Pump & Generation Field Studio); it merges PrecisionPump Designer, HydroDraft, both ProjectSchem renderers, and The Core Atlas as a source. The Core Atlas is to be kept as a static read-only source reference feeding HydroCore & IronConflux. The document does **not** name the buoy by name.
- `~/workspace/faceless-youtube-growth-studio/rays-22-apps-inventory-20261117.md` (11,329 B): The Core Atlas entry lists 6 cores — Quantum Core, Mk. V Leviathan 5.2kW, Solid-State Helical MHD, **Helix-Force Buoy**, Bucket Vortex, H-Cell — plus Flow Channels (5), Zephyr Fleet, The Hangar 3D, TABs Homes, Knowledge Base, Steward's Console (8 units). It also notes a pre-existing "Error: An internal error occurred." in the Atlas's Gemini panel (predating the Nov 20 fix). No HydroCore entry — the inventory predates HydroCore (Nov 17).
- `~/workspace/helix-program/Ideas-Healing-Systems-and-Arts.md`: healing-center concepts that grow from the Helix family (Scrub Garden, Elements Circuit, Light-Helix) — related thinking, not the generator design itself. Not copied to this archive; noted here only.

### 2.4 Archive contents (this folder)

Copies only — every file below was verified byte-identical (md5) to its original on Nov 20, 2026; no original was moved or edited.

- `341_12_upel.png` — design diagram as sent Nov 20
- `4527_2_q532.jpg` — canonical pier cutaway
- `341_0_xtp6.png` — Oct 21 original of the diagram (same bytes as `341_12_upel.png`)
- `344_13_w6lo.png` — pier cutaway original (same bytes as `344_1_26xt.png`)
- `346_11_x9ky.png` — Helix-Force v2 Buoy cutaway
- `349_12_ejp1.png` — Project Helix pier tidal pump
- `267_10_oimz.png` — Solid-State Helical MHD
- `389_15_0lfg.png` — Submersible MHD SUB-MHD-REV.B
- `390_16_mlj0.png` — bucket bench unit
- `media-generation-helix-force-buoy-realistic-uni-0-a065c7b3-05b4-4c20-a82d-a23369623a35.webp` + `.json` — realistic buoy render
- `media-generation-buoy-plunger-system-realistic-0-2b84a078-6fd3-4a87-abb5-ef3c4708a6aa.webp` + `.json` — realistic plunger-system render
- `Rays-Power-and-Healing-Systems-Dossier.md` + `.pdf` — the family dossier
- `App.tsx.snapshot-20261120` — snapshot copy of the canonical buoy-app source (48,124 B, md5 `64770b1f879a00264a5c3e179b38a3f6`)
- `DATA-PLAN.md.snapshot-20261120` — snapshot copy of the app's data plan (provenance, empty-log rule, no-prices rule)
- `space.json.snapshot-20261120` — snapshot copy of the app's slug record
- `GENERATOR-SYSTEM-DESIGN-20261120.md` — this record

---

## 3. Verification results (Nov 20, 2026)

- **Exists and intact:** the design diagram, the pier cutaway, all nine design sheets in `user/files/`, the two helix renders + receipts, the dossier (md + pdf), the local buoy app source (`App.tsx` — 12 stages, 15 parts, 11 trials all present and matching Ray's words), the app's data plan, the Core Atlas (fixed and launching Nov 20 ~00:29, all 7 sections verified), the two design docs.
- **At risk / unverified:**
  - **HydroDraft and PrecisionPump do not launch in preview** (blank, "Migrated", matplotlib fragment only, as of Nov 20 ~00:19). Neither was fixed. Which app is the "functional hydro pump app" Ray remembers is **still unresolved** — no standalone functional hydro pump app was found in either of his accounts that night.
  - **The Oct 22 AI Studio buoy build's current location is unverified** (see §2.2 item 10).
  - **HydroCore was not re-checked live on Nov 20** — its last verified state is Nov 17 (all 6 tabs rendering).
  - **The media receipt `.json` files point at expiring Meta CDN URLs** — treat the local `.webp` files as the durable copies.
  - **The diagram file `341_12_upel.png` is JPEG data with a `.png` extension** — harmless, but noted so nothing downstream chokes on the mismatch.
  - **No measured performance numbers exist anywhere for this engine** — see §4.
  - **Core Atlas has one non-blocking warning left** (THREE.Clock deprecated) after its fix.

## 4. Honest limits

- This record is Ray's design **as drawn and as written** — a design, not a tested machine. No flow rate, wattage, efficiency, or pressure figure in this record was ever measured. Anything unmeasured is marked unmeasured.
- **HydroCore's 5.11 L/Wh is that app's default** (1,200 L/day, 12 m head, 2,000 L tank, 6 h/day). It is NOT this engine's rating and must never be attached to the buoy.
- The dossier's "helical power amplification" and the v-next enhancements (resonant tuning, modular array, jet-port station-keeping) are design language and proposals, not measured results.
- The Air Accelerator ΔP figure is a working number to be logged (ΔP = P_in − P_throat, pascals) — a measurement to take, not a result already in hand.
- The 12-stage stack in the app is the canonical list; the diagram shows 10 labeled parts. The difference is the Air Accelerator enhancement (stage 03) and the Solar Crown (stage 12), both Ray's own additions, not an error.

## 5. Work in flight elsewhere (not this pass — noted only)

- **Core Atlas fix — DONE Nov 20 ~00:29 AM PST** (parent agent's browser task): preview launches, all 7 sections verified. The diagram + 10 labels addition to the Atlas was pending on the launch and is now unblocked — it is the parent agent's job, not this pass.
- **Separate Base44 app "Helix-Force Buoy — Energy Generator Engine"** — building in Phoenix's Base44 account (draft only), content from the local buoy app. The design will live there too once it lands.
- **Core Atlas on Base44 — build started Nov 20 ~00:30 AM PST** (Ray's word: "create the core Atlas app next on base 44 please") in Ray's own Base44 account (Raymond's Workspace), draft only, source = the fixed AI Studio app + the buoy diagram.
- **3D model viewer** — standalone interactive viewer of the diagram, building; an email with its link goes to raysironworks101@gmail.com once the link exists and is verified. Nothing about the design changes in it.
- **Lesson 1 video** (Manifestation course) — unrelated work, running separately.

## 6. Stewardship rules (standing)

1. Copy only — never move or edit an original, never touch the local buoy app (its AGENTS.md forbids building from it or hand-editing it), never touch a live app except on Ray's explicit word for that app.
2. Nothing published or shared. Nothing about the design changes without Ray's word.
3. No prices, no budgets anywhere in the design's records.
4. Logs start empty; true numbers only. No sample readings, ever.
5. If any copy in this archive ever fails a hash check against its original, re-copy from the original and note the date — do not repair the copy in place.
