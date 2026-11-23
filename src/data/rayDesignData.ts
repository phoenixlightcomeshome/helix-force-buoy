/**
 * Helix-Force Buoy — design data + stepSimulation().
 *
 * The design data here is Ray's design (master record [MDR]) plus the two
 * calculation envelopes that size it for his 2,000 W TARGET:
 *  - Envelope A — Marlow, BUOY-2KW-SIZING-SPEC-20261120.md [M20]
 *  - Envelope B — Gemini, gemini-buoy-air-plunger-sizing-20261120.md [G20]
 * and Gemini's Nov 22 redesign + lift evaluation [G22].
 *
 * RULES this file follows (Ray's standing rules + the brief):
 *  - 2,000 W is a TARGET, never measured. Every output is labelled
 *    SIMULATION — NOT MEASURED DATA.
 *  - Where the two envelopes disagree, BOTH are kept and the conflict is
 *    listed in CONFLICTS. No winner is picked. The simulator refuses to
 *    run until an envelope is chosen explicitly.
 *  - Where a number is an assumption (not a design dimension), the
 *    assumption is carried next to the number with its source.
 *  - Where a number is missing, the field is null and the gap is listed
 *    in MISSING_FOR_RAY. Nothing is invented to fill it.
 *  - Logs ship empty; true numbers only. No prices anywhere.
 *
 * Pending inputs (see README.md §6 for where each slots in):
 *  - Gemini's follow-up answers: regenerative cycle, 3D model spec
 *    (ports, release system, all parts visible, air-tank motion,
 *    accurate capacity), compressor-in-the-moving-unit, EM vertical
 *    compressor, tank sizing from the flow, four-layer hollow-core piston.
 *  - Her full code evaluation of the Buoy 3D Core app (rayDesignData.ts,
 *    BuoyCore3D.tsx, OperatingPrincipleAndSizing.tsx, PartDetailModal.tsx,
 *    App.tsx, Schematics.tsx) — waits on the app export from Ray's
 *    AI Studio account.
 */

import {
  SEAWATER_RHO_KG_M3,
  G_M_S2,
  P_ATM_PA,
  barToPa,
  paToBar,
  pistonFaceAreaM2,
  sweptVolumeM3,
  hydrostaticHeadPa,
  liftPressureGaugePa,
  downwardForceN,
  thrustAtPressureN,
  hydraulicPowerW,
  powerChainW,
  meanFlowM3PerS,
  pulseFlowM3PerS,
  coilEmfPeakV,
  shotEnergyJ,
  boylePressurePa,
  clamp,
} from "../lib/physics";

/* ------------------------------------------------------------------ */
/* Labels                                                              */
/* ------------------------------------------------------------------ */

export const TARGET_OUTPUT_LABEL = "TARGET: 2,000 W — NOT MEASURED";
export const SIMULATION_LABEL = "SIMULATION READOUTS — NOT MEASURED DATA";
export const SIZING_TABLE_HEADING =
  "Sized for 2,000 W target — calculation, for Ray to review and true.";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/** An assumed value: the number + what was assumed + where it came from. */
export type Assumed<T> = {
  value: T;
  assumed: true;
  basis: string;
};

/** A value that is either known from a document or explicitly missing. */
export type Known<T> = { value: T; source: string };
export type MaybeKnown<T> = Known<T> | { value: null; missing: string };

export type EnvelopeId = "A-marlow" | "B-gemini";

/**
 * One complete sizing envelope. Both envelopes size the SAME machine
 * (Ray's design) for the SAME 2,000 W target — and they disagree.
 * Keep both. Never merge them into one "average" machine.
 */
export type SizingEnvelope = {
  id: EnvelopeId;
  name: string;
  sourceDoc: string;
  /** Bore diameter, m. */
  boreM: number;
  /** Piston stroke, m. */
  strokeM: number;
  /** Piston face area, m² (derived from bore). */
  faceAreaM2: number;
  /** Swept volume per full stroke, m³ (derived). */
  sweptVolumeM3: number;
  /** Water volume per shot/cycle, m³. */
  shotVolumeM3: number;
  /** Stated cycle rate, Hz. */
  cycleHz: number;
  /** Stated cycle period, s (derived). */
  cycleSeconds: number;
  /** Net driving pressure of the shot, Pa. NOTE the two envelopes define
   * this differently — see drivingPressureNote. */
  drivingPressurePa: number;
  drivingPressureNote: string;
  /** Air tank nominal gas volume, m³. */
  tankVolumeM3: number;
  /** Air tank nominal pressure, Pa gauge. */
  tankNominalPa: number;
  /** Air tank pressure range, Pa gauge [low, high]. */
  tankRangePa: [number, number];
  /** Over-energized pressure ceiling, Pa gauge. */
  overEnergizedPa: number;
  /** Top-slot intake: count × width × height, m; total area, m². */
  topSlots: { count: number; widthM: number; heightM: number; totalAreaM2: number };
  /** Intake velocity assumption, m/s. */
  intakeVelocityMPerS: number;
  /** Quad-Venturi throat diameter each, m; total throat area, m². */
  venturiThroatM: number;
  venturiThroatTotalAreaM2: number;
  /** Quad-Venturi mouth diameter each, m. */
  venturiMouthM: number;
  /** Turbine rotor diameter, m. */
  turbineRotorM: number;
  /** Turbine blade count. */
  turbineBlades: number;
  /** Turbine blade pitch, degrees (range or single). */
  turbinePitchDeg: string;
  /** Turbine operating speed, rpm (range or single). */
  turbineRpm: string;
  /** Turbine rpm at the envelope's nominal flow (sim reference point). */
  turbineRpmAtNominalFlow: number;
  /** Nominal flow the turbine rpm is quoted at, m³/s. */
  turbineNominalFlowM3PerS: number;
  /**
   * Discharge flow, m³/s. A: mean flow derived from shot × rate
   * (0.025 m³ × 0.50 Hz = 0.0125 m³/s) [M20 §2]. B: STATED 62.5 L/s
   * [G20] — note 62.5 L/s × 1.6 s = 0.100 m³ against the 0.103 m³
   * swept volume from 450 mm × 650 mm: a 3% difference inside her own
   * numbers, flagged in the power-chain derivation, not smoothed over.
   */
  dischargeFlowM3PerS: number;
  /** Turbine hydraulic efficiency (0..1). */
  etaTurbine: number;
  /** Electrical conversion efficiency (0..1). */
  etaElec: number;
  /** Coil turns per phase. */
  coilTurnsPerPhase: MaybeKnown<number>;
  /** Coil conductor. */
  coilConductor: string;
  /** Magnetic field at the coil, T (assumption). */
  coilFieldT: Assumed<number>;
  /** Electrical frequency, Hz (assumption). */
  coilFrequencyHz: MaybeKnown<number>;
  /** Coil active area, m² (assumption). */
  coilActiveAreaM2: MaybeKnown<number>;
  /** Bus voltage, V. */
  busVoltageV: number;
  /** Bus current at target, A. */
  busCurrentA: number;
  /** Hull outer diameter, m. */
  hullDiameterM: number;
  /** Hull height, m. */
  hullHeightM: number;
  /** Submerged draft, m. */
  draftM: number;
  /** Freeboard, m (null when the envelope does not state it). */
  freeboardM: MaybeKnown<number>;
  /** Mooring / ballast envelope. */
  mooring: string;
  /** Supercapacitor bank capacity, J (null when the envelope does not size it). */
  capBankCapacityJ: MaybeKnown<number>;
  /** Piston assembly mass, kg — NOT specified in any document.
   * Gemini's lift working assumes 20 kg (A) / 45 kg (B) [G22 §1]. */
  pistonMassKg: Assumed<number>;
  /** Seal friction, N — NOT specified; Gemini assumes 100 N (A) / 250 N (B). */
  frictionN: Assumed<number>;
  /** Operating immersion / hydrostatic head height, m (Gemini's reading). */
  immersionM: number;
  /** Fill time for one shot at the stated intake, s (derived; B states 2.4 s). */
  fillSeconds: number;
  /** Discharge pulse duration, s (null when the envelope does not state it). */
  pulseSeconds: MaybeKnown<number>;
};

export type Stage = {
  num: string;
  key: string;
  name: string;
  short: string;
  note: string;
  enhanced?: boolean;
};

export type Part = {
  num: number;
  key: string;
  name: string;
  detail: string;
};

/**
 * A redesign addition from Gemini's Nov 22 answer [G22 §2–§3].
 * These are PROPOSALS, not Ray's design — they change parts of the
 * master record and need Ray's word before they become the design.
 */
export type ProposedAddition = {
  key: string;
  name: string;
  attachesTo: string;
  whatItDoes: string;
  source: string;
  status: "PROPOSED — needs Ray's word";
};

export type TidePreset = {
  key: "calm" | "moderate" | "swell" | "heavy";
  label: string;
  /** Fill-rate multiplier. The multiplier VALUES are not in the local
   * documents — the app's TIDE_PRESETS live in its rayDesignData.ts,
   * pending export. Until then every preset is 1.0 (no change) and the
   * mechanism (tide scales fill rate only, never hull motion) is what
   * this file implements [G20]. */
  fillRateMultiplier: number;
  fillRateNote: string;
};

export type SimPhase = "FILLING" | "DISCHARGE" | "RESET";

export type SimControls = {
  /** Envelope to simulate. 'unresolved' refuses to run — no winner picked. */
  envelope: EnvelopeId | "unresolved";
  /** Adjustable air-tank plunger setting, 0.50×–1.50× [G20]. */
  plungerSetting: number;
  /** Over-Energize toggle — tank goes to its over-energized ceiling. */
  overEnergize: boolean;
  /** Router mode: A Harvest (store) / B Boost (spend the bank). */
  mode: "Harvest" | "Boost";
  /** Tide preset — fill-rate only, never hull motion. */
  tide: TidePreset["key"];
  /** EM repulsion coils: pulse on the strokes (Ray's concept [G22 §3]). */
  emPulseEnabled: boolean;
  /** Energy spent per EM pulse, J. Default is Gemini's ILLUSTRATIVE
   * example (500 J) [G22 §3C] — not a design value. */
  emPulseEnergyJ: number;
  /**
   * Fraction of EM pulse energy returned through the turbine.
   * Gemini's stated range: 250–350 J back per 500 J spent [G22 §3C].
   * The sim uses the midpoint 0.6 ONLY as a labelled modelling choice;
   * the range itself is carried in emReturnRange.
   */
  emReturnFraction: number;
  emReturnRange: [number, number];
};

export type SimTelemetry = {
  phase: SimPhase;
  /** Pan fill, 0..1. */
  waterLevel: number;
  /** Piston position above bottom of stroke, m. Clamped to [0, stroke]. */
  pistonY: number;
  /** Piston velocity, m/s (positive = rising). */
  pistonVelocityMPerS: number;
  /** Differential pressure across the piston, bar (gauge). */
  displacementBar: number;
  /** Absolute pressure in the lift chamber, bar. */
  plungerAirBar: number;
  /** Turbine speed, rpm — driven by discharge, not by waves [G20]. */
  turbineRPM: number;
  /** Discharge flow, L/s. */
  flowLPerS: number;
  /** Coil peak volts per phase (null when the envelope lacks f/N/B/A). */
  coilVoltsV: number | null;
  /** Capacitor bank stored energy, J. */
  capBankJ: number;
  /** Capacitor bank charge, % (null when the envelope does not size it). */
  capBankPct: number | null;
  /** Router mode. */
  mode: "Harvest" | "Boost";
  /** Top-scupper flappers: open while filling, shut on discharge/lift. */
  flapperOpen: boolean;
  /** Anti-siphon foot valve: open on discharge, shut on upstroke/fill. */
  footValveOpen: boolean;
  /** Center-needle shuttle valve: seated (charge locked) / unseated. */
  needleValve: "seated" | "unseated";
  /** Accumulator plenum pressure, bar (gauge). */
  accumulatorBar: number;
  /** EM coil pulse firing this step. */
  emPulseActive: boolean;
  /** EM energy spent so far this run, J. */
  energySpentJ: number;
  /** EM energy returned through the turbine so far, J. */
  energyHarvestedJ: number;
  /** Net EM energy balance so far, J (negative = the bank is draining). */
  netEnergyJ: number;
  /** Electrical power this step, W (SIMULATION — NOT MEASURED DATA). */
  electricalW: number;
  /** Warnings raised this step (sizing paradox, lift shortfall, …). */
  warnings: string[];
};

export type SimState = {
  telemetry: SimTelemetry;
  /** Seconds elapsed in this run. */
  t: number;
  /** Completed cycles. */
  cycles: number;
  /** Emergent cycle rate, Hz (computed from completed cycles, not imposed). */
  emergentCycleHz: number | null;
};

/* ------------------------------------------------------------------ */
/* The 12-stage stack — canonical, from the master record [MDR §1.2]   */
/* ------------------------------------------------------------------ */

export const STAGES: Stage[] = [
  {
    num: "01",
    key: "scupper",
    name: "Central Air-Plunger — Top Scupper Intake",
    short: "Scupper intake",
    note: "The crown breathes here. Waves wash over the top scuppers and the sea enters the machine — air and water taken in together at the surface.",
  },
  {
    num: "02",
    key: "plunger",
    name: "Central Air-Plunger (Weighted Piston)",
    short: "Weighted piston",
    note: "The heavy piston rides each wave's rise and fall. On the downstroke it drives the column of air and water below it — the buoy's heartbeat, powered by the sea itself.",
  },
  {
    num: "03",
    key: "accelerator",
    name: "Air Accelerator Unit — Pascal ΔP",
    short: "Air accelerator · ΔP",
    note: "The enhancement: a tapered throat in the plunger path. Pressure taps read P_in at the wide mouth and P_throat at the narrow; ΔP = P_in − P_throat (pascals) is the working number — it sets how hard the flow accelerates and entrains on its way down. Tune the throat, tune the machine.",
    enhanced: true,
  },
  {
    num: "04",
    key: "turbine",
    name: "Axial-Flow Turbine (Hybrid Motor/Generator)",
    short: "Axial turbine",
    note: "The accelerated stream spins the axial turbine. As a generator it harvests the flow; as a motor it can spend banked charge back into the water — one machine, both directions.",
  },
  {
    num: "05",
    key: "venturi",
    name: "Quad-Venturi Acceleration Ports",
    short: "Quad-Venturi ports",
    note: "Four tapered ports squeeze the stream a second time. Each narrowing trades pressure for speed, jetting the flow into the core chamber already spinning.",
  },
  {
    num: "06",
    key: "scrub",
    name: "Graphene-Ion Scrub Electrodes",
    short: "Graphene scrub",
    note: "The spinning water runs past the graphene-ion scrub electrodes, which draw ions and debris out of the stream as it passes — the water leaves cleaner than it came in.",
  },
  {
    num: "07",
    key: "halbach",
    name: "Halbach Magnetic Matrix",
    short: "Halbach matrix",
    note: "The magnetic heart. The Halbach array focuses its field inward on the core and cancels it outside, so the moving conductive seawater crosses the strongest field exactly where the coils listen.",
  },
  {
    num: "08",
    key: "core",
    name: "Fibonacci Helical Core",
    short: "Fibonacci core",
    note: "The vortex winds down the Fibonacci helix — each turn in golden proportion, the spiral tightening as it falls. Copper induction coils around the core harvest the crossing field as electromagnetic energy: the blue pulses in the drawing.",
  },
  {
    num: "09",
    key: "supercaps",
    name: "High-Density Supercapacitors",
    short: "Supercap bank",
    note: "The bank in the base. Supercapacitors catch the harvest pulse by pulse — fast in, fast out — smoothing the sea's rhythm into stored charge.",
  },
  {
    num: "10",
    key: "base",
    name: "Smart-Switch Capacitor Base",
    short: "Capacitor base",
    note: "The armored foundation that houses the bank and the brain, ballasts the buoy upright, and carries the through-flow out the bottom, back to the sea.",
  },
  {
    num: "11",
    key: "router",
    name: "Smart-Switch Power Router",
    short: "Power router",
    note: "The HELIX-MHD brain's hand. Mode A Harvest: the router quietly stores. Mode B Boost: it spends the bank back through the turbine in one stronger pulse. Store or release — the router decides.",
  },
  {
    num: "12",
    key: "solar",
    name: "Solar Crown",
    short: "Solar panels",
    note: "Panels on the crown top up the bank under sun and keep the router, sensors, and beacon alive through flat calms when the sea gives nothing.",
  },
];

/* ------------------------------------------------------------------ */
/* The 15-part gather list — canonical [MDR §1.5]                      */
/* ------------------------------------------------------------------ */

export const PARTS: Part[] = [
  { num: 1, key: "hull", name: "Hull / body shell", detail: "The buoy's pressure hull and outer skin" },
  { num: 2, key: "plunger", name: "Central air-plunger + weighted piston", detail: "Piston, rod, and guide seals" },
  { num: 3, key: "scuppers", name: "Top scuppers", detail: "Intake grilles at the crown" },
  { num: 4, key: "accelerator", name: "Air accelerator throat", detail: "Tapered throat insert for the plunger path" },
  { num: 5, key: "taps", name: "Pressure taps + ΔP sensor", detail: "P_in and P_throat taps, differential sensor in Pa" },
  { num: 6, key: "turbine", name: "Axial-flow turbine", detail: "Hybrid motor/generator unit" },
  { num: 7, key: "coils", name: "Copper induction coils", detail: "Harvest coils around the core chamber" },
  { num: 8, key: "venturi", name: "Quad-Venturi ports", detail: "Four tapered acceleration ports" },
  { num: 9, key: "core", name: "Fibonacci helical core", detail: "Helical insert, golden-proportion turns" },
  { num: 10, key: "halbach", name: "Halbach magnetic matrix", detail: "Magnet array, field focused inward" },
  { num: 11, key: "scrub", name: "Graphene-ion scrub electrodes", detail: "Electrode set for the scrub chamber" },
  { num: 12, key: "supercaps", name: "High-density supercapacitors", detail: "The cap bank for the base" },
  { num: 13, key: "routerbase", name: "Smart-switch router + capacitor base", detail: "Router board, base housing, ballast" },
  { num: 14, key: "solar", name: "Solar crown panels", detail: "Crown panels + charge feed" },
  { num: 15, key: "mooring", name: "Mooring / anchor fittings", detail: "Anchor points, chain, swivel, marker light" },
];

/* ------------------------------------------------------------------ */
/* Proposed additions — Gemini's Nov 22 redesign [G22 §2–§3]           */
/* PROPOSALS, not Ray's design. They change the master record and need  */
/* Ray's word before they become the design. The 15 parts are NOT       */
/* renumbered — no Part 16 exists [G20].                               */
/* ------------------------------------------------------------------ */

export const PROPOSED_ADDITIONS: ProposedAddition[] = [
  {
    key: "flapper-ring",
    name: "Top Scupper Check Gate — one-way flapper / reed ring",
    attachesTo: "Part 03 — Top scuppers",
    whatItDoes:
      "Passive elastomeric or counterweighted check flappers at the top scuppers. They open under gravity/wave wash when the pan fills, but snap shut when pressure rises in the cylinder — so the upstroke cannot push water back out the top. Without them the sizing paradox bites: at 4.0 bar the water erupts out of the top scuppers instead of going through the turbine and venturis.",
    source: "[G22 §2A]",
    status: "PROPOSED — needs Ray's word",
  },
  {
    key: "foot-valve",
    name: "Anti-siphon foot valve (check flap)",
    attachesTo: "Part 08 — Quad-Venturi ports",
    whatItDoes:
      "A check flap between the central chamber and the Quad-Venturi ports, so that during the upstroke/fill phase the piston does not suck sea water backwards through the turbine.",
    source: "[G22 §2A]",
    status: "PROPOSED — needs Ray's word",
  },
  {
    key: "stepped-piston",
    name: "Step-displacement (differential-area) piston",
    attachesTo: "Part 02 — Central air-plunger + weighted piston",
    whatItDoes:
      "A dual-diameter stepped piston: a larger upper crown (A_water) that drives the water down through the venturis, and a smaller lower pneumatic annular face (A_pneumatic) sealed against the air tank. The step dimensions are NOT specified in any document — the simulator falls back to the single-bore piston (A_pneumatic = A_water) and flags the step as unspecified.",
    source: "[G22 §2B]",
    status: "PROPOSED — needs Ray's word",
  },
  {
    key: "needle-shuttle",
    name: "Hollow center needle as internal shuttle / poppet valve",
    attachesTo: "Part 02 — Central air-plunger + weighted piston",
    whatItDoes:
      "The center needle serves as an internal shuttle valve: at the bottom of the stroke it mechanically unseats an internal poppet to balance air pressure; at the top of the stroke the level/cam trigger mechanically reseats it, locking the high-pressure pneumatic charge beneath the piston.",
    source: "[G22 §2B]",
    status: "PROPOSED — needs Ray's word",
  },
  {
    key: "accumulator-plenum",
    name: "Pneumatic intensifier — side accumulator plenum",
    attachesTo: "Air tank underneath (Stage 02 / Part 02)",
    whatItDoes:
      "The air tank works as an accumulator-reservoir loop, not a vented spring. On the downstroke the heavy piston and wave mass compress air into a side accumulator plenum, storing mechanical energy. At the bottom of the stroke the level/cam trigger trips, admitting stored high-pressure air into the bottom lift chamber and firing the upstroke. A snifter / solar top-up valve linked to Stage 12 (Solar Crown) draws atmospheric air on the downstroke to replenish seal leakage.",
    source: "[G22 §2C]",
    status: "PROPOSED — needs Ray's word",
  },
  {
    key: "seal-set",
    name: "Marine seal set — dual U-cups + wiper + needle sleeve",
    attachesTo: "Part 02 — Central air-plunger + weighted piston",
    whatItDoes:
      "Dual U-cup polyurethane seals facing in opposite directions (upper seal keeps saltwater and grit out of the guide chamber; lower seal holds air pressure in the pneumatic tank). A sacrificial water-flushed wiper ring above the top seal sheds debris. A low-friction ceramic or hard-chrome needle sleeve guides the center needle to prevent cocking and binding along its stroke. Seawater with suspended sand and grit destroys conventional elastomeric O-rings in hours.",
    source: "[G22 §2D]",
    status: "PROPOSED — needs Ray's word",
  },
  {
    key: "em-stator",
    name: "EM repulsion coil stator + Halbach ring on the piston",
    attachesTo: "Part 07 — Copper induction coils; Part 10 — Halbach matrix",
    whatItDoes:
      "A linear coil stator coaxial along the central cylinder barrel, with a secondary Halbach ring integrated into the moving piston head. Forward polarity repels the piston down; reverse polarity repels it up. Adds phase latching (magnetic latch holds the piston to wave-crest maximum) and a bidirectional velocity boost (P_mech ∝ v³). RISKS: net energy deficit (spend 500 J, harvest back 250–350 J); thermal runaway from 50–100 A pulses (I²R); demagnetization of NdFeB (N52) above coercivity / 60–80 °C; inductive spikes (V = L di/dt) near the harvest coils and router.",
    source: "[G22 §3]",
    status: "PROPOSED — needs Ray's word",
  },
  {
    key: "h-bridge-router",
    name: "Four-quadrant bi-directional H-bridge inverter / converter",
    attachesTo: "Part 13 — Smart-switch router + capacitor base (Stage 11)",
    whatItDoes:
      "Upgrades the smart-switch router (Part 10 / Stage 11) from a passive diode/MOSFET router to a full four-quadrant bi-directional H-bridge capable of bi-directional power flow (motoring mode vs. generating mode). Required companions: stator coils potted directly against the outer metallic pressure hull (seawater as heat sink) and Mu-metal / silicon-steel flux barriers between the drive coils and the harvest coils.",
    source: "[G22 §3D]",
    status: "PROPOSED — needs Ray's word",
  },
];

/* ------------------------------------------------------------------ */
/* The two sizing envelopes                                            */
/* ------------------------------------------------------------------ */

/** Envelope A — Marlow, BUOY-2KW-SIZING-SPEC-20261120.md [M20]. */
export const ENVELOPE_A: SizingEnvelope = {
  id: "A-marlow",
  name: "Envelope A — Marlow (180 mm bore)",
  sourceDoc: "BUOY-2KW-SIZING-SPEC-20261120.md (Marlow, Nov 20, 2026)",
  boreM: 0.18,
  strokeM: 1.0,
  faceAreaM2: pistonFaceAreaM2(0.18),
  sweptVolumeM3: sweptVolumeM3(pistonFaceAreaM2(0.18), 1.0),
  shotVolumeM3: 0.025,
  cycleHz: 0.5,
  cycleSeconds: 2.0,
  drivingPressurePa: barToPa(4.0),
  drivingPressureNote:
    "Net shot pressure 4.0 bar gauge [M20 §1–§2]. This is the pressure the power chain is built on — it is NOT the lift pressure (Gemini's lift calc says 0.35–0.50 bar gauge lifts the piston + water [G22 §1]). The gap between them is the sizing paradox.",
  tankVolumeM3: 0.05,
  tankNominalPa: barToPa(4.0),
  tankRangePa: [barToPa(1.0), barToPa(6.0)],
  overEnergizedPa: barToPa(6.0),
  topSlots: {
    count: 4,
    widthM: 0.052,
    heightM: 0.04,
    totalAreaM2: 0.00832,
  },
  intakeVelocityMPerS: 1.5,
  venturiThroatM: 0.0128,
  venturiThroatTotalAreaM2: 0.00051,
  venturiMouthM: 0.038,
  turbineRotorM: 0.4,
  turbineBlades: 10,
  turbinePitchDeg: "35° nominal",
  turbineRpm: "1,800 rpm nominal",
  turbineRpmAtNominalFlow: 1800,
  turbineNominalFlowM3PerS: 0.0125,
  dischargeFlowM3PerS: 0.0125,
  etaTurbine: 0.55,
  etaElec: 0.7273,
  coilTurnsPerPhase: { value: 48, source: "[M20 §3] E ≈ 4.44 f N B A" },
  coilConductor: "2.5 mm² copper nominal [M20 §3]",
  coilFieldT: {
    value: 0.5,
    assumed: true,
    basis: "Field-strength assumption used only for the coil voltage estimate [M20 §1, §3]",
  },
  coilFrequencyHz: { value: 30, source: "[M20 §1] electrical-frequency sizing assumption" },
  coilActiveAreaM2: { value: 0.02, source: "[M20 §1] coil/lap active area" },
  busVoltageV: 48,
  busCurrentA: 41.67,
  hullDiameterM: 1.2,
  hullHeightM: 2.4,
  draftM: 1.8,
  freeboardM: { value: 0.6, source: "[M20 §3] 2.40 m height at 75% immersion → 0.60 m freeboard (derived)" },
  mooring: "2,500 kg wet total, assumed 4 × 625 kg — one calculation option, not a design recommendation [M20 §3, §5]",
  capBankCapacityJ: {
    value: null,
    missing: "Marlow's spec sizes the 48 V / 41.67 A load but does NOT size the supercapacitor bank. Bank capacity is missing for this envelope.",
  },
  pistonMassKg: {
    value: 20,
    assumed: true,
    basis: "Gemini's lift working assumes 20 kg for stainless rod, needle, and seals [G22 §1 Case A]. The design does not specify piston mass.",
  },
  frictionN: {
    value: 100,
    assumed: true,
    basis: "Gemini's lift working assumes 100 N seal friction [G22 §1 Case A]. The design does not specify friction.",
  },
  immersionM: 1.8,
  fillSeconds: 0.025 / (1.5 * 0.00832),
  pulseSeconds: {
    value: null,
    missing: "Marlow's spec states a 0.50 Hz cycle rate and a mean flow of 12.5 L/s, but no pulse duration. The simulator derives discharge time from the shot volume and the mean flow.",
  },
};

/** Envelope B — Gemini, gemini-buoy-air-plunger-sizing-20261120.md [G20]. */
export const ENVELOPE_B: SizingEnvelope = {
  id: "B-gemini",
  name: "Envelope B — Gemini (450 mm bore)",
  sourceDoc: "gemini-buoy-air-plunger-sizing-20261120.md (Gemini, Nov 20, 2026)",
  boreM: 0.45,
  strokeM: 0.65,
  faceAreaM2: pistonFaceAreaM2(0.45),
  sweptVolumeM3: sweptVolumeM3(pistonFaceAreaM2(0.45), 0.65),
  shotVolumeM3: 0.103,
  cycleHz: 0.25,
  cycleSeconds: 4.0,
  drivingPressurePa: barToPa(1.6),
  drivingPressureNote:
    "Effective ΔP 1.6 bar (160 kPa) [G20]. Basis: 62.5 L/s pulse discharge over a 1.6 s pulse. This is the pressure the pulse power is built on — different from Marlow's 4.0 bar net shot pressure, and far above the 0.35–0.50 bar gauge Gemini's own lift calc says is enough to lift [G22 §1].",
  tankVolumeM3: 0.25,
  // Nominal 2.25 bar is the MIDPOINT of her stated 1.5–3.0 bar range —
  // a modelling choice, labelled as such. Her doc states a range, not
  // a single nominal [G20].
  tankNominalPa: barToPa(2.25),
  tankRangePa: [barToPa(1.5), barToPa(3.0)],
  overEnergizedPa: barToPa(7.0),
  topSlots: {
    count: 4,
    widthM: 0.15,
    heightM: 0.07,
    totalAreaM2: 0.042,
  },
  intakeVelocityMPerS: 1.0,
  venturiThroatM: 0.035,
  venturiThroatTotalAreaM2: 0.00385,
  venturiMouthM: 0.065,
  turbineRotorM: 0.28,
  turbineBlades: 8,
  turbinePitchDeg: "28°–34° pitch",
  turbineRpm: "~650–950 RPM pulse speed",
  turbineRpmAtNominalFlow: 950,
  turbineNominalFlowM3PerS: 0.0625,
  dischargeFlowM3PerS: 0.0625,
  etaTurbine: 0.82,
  etaElec: 0.81,
  coilTurnsPerPhase: {
    value: 120,
    source: "[G20] 6 copper bobbins + 3 Litz rings (~120 turns, 10 AWG eq.)",
  },
  coilConductor: "10 AWG equivalent, Litz rings [G20]",
  coilFieldT: {
    value: 1.0,
    assumed: true,
    basis: "N52 magnets (~0.95–1.1 T inward radial flux) [G20]. Midpoint of her stated range, used only as the sim's reference point.",
  },
  coilFrequencyHz: {
    value: null,
    missing: "Gemini's sizing does not state an electrical frequency for this envelope, so coil EMF (E ≈ 4.44 f N B A) cannot be computed for it. Coil volts read null for Envelope B.",
  },
  coilActiveAreaM2: {
    value: null,
    missing: "Gemini's sizing does not state a coil active area for this envelope, so coil EMF cannot be computed for it.",
  },
  busVoltageV: 48,
  busCurrentA: 42,
  hullDiameterM: 0.85,
  hullHeightM: 2.8,
  draftM: 2.2,
  freeboardM: { value: 0.6, source: "[G20] 2,800 mm height, 2,200 mm submerged draft, 600 mm freeboard" },
  mooring: "≥1,800 kg total ballast + seafloor anchor deadweight; >1.4× anti-lift margin so waves wash over the top slots rather than lifting the hull [G20]",
  capBankCapacityJ: {
    value: 190000,
    source: "[G20] 165 F @ 48 V (~190 kJ usable); smooths the 1.6 s / 5 kW pulse into steady 2,000 W target output with <10% ripple and ~90 s Boost reserve",
  },
  pistonMassKg: {
    value: 45,
    assumed: true,
    basis: "Gemini's lift working estimates 45 kg for a 450 mm piston + center needle [G22 §1 Case B]. The design does not specify piston mass.",
  },
  frictionN: {
    value: 250,
    assumed: true,
    basis: "Gemini's lift working assumes 250 N seal friction [G22 §1 Case B]. The design does not specify friction.",
  },
  immersionM: 2.2,
  fillSeconds: 2.4,
  pulseSeconds: { value: 1.6, source: "[G20] 40% active discharge duty of the 4.0 s cycle (1.6 s pulse)" },
};

export const ENVELOPES: Record<EnvelopeId, SizingEnvelope> = {
  "A-marlow": ENVELOPE_A,
  "B-gemini": ENVELOPE_B,
};

/* ------------------------------------------------------------------ */
/* Tide presets — fill-rate only, never hull motion [G20]               */
/* ------------------------------------------------------------------ */

export const TIDE_PRESETS: TidePreset[] = [
  {
    key: "calm",
    label: "Calm",
    fillRateMultiplier: 1.0,
    fillRateNote:
      "Multiplier value pending the Buoy 3D Core app export (TIDE_PRESETS live in its rayDesignData.ts). Until then 1.0 — no change.",
  },
  {
    key: "moderate",
    label: "Moderate",
    fillRateMultiplier: 1.0,
    fillRateNote:
      "Multiplier value pending the Buoy 3D Core app export. Until then 1.0 — no change.",
  },
  {
    key: "swell",
    label: "Swell",
    fillRateMultiplier: 1.0,
    fillRateNote:
      "Multiplier value pending the Buoy 3D Core app export. Until then 1.0 — no change.",
  },
  {
    key: "heavy",
    label: "Heavy",
    fillRateMultiplier: 1.0,
    fillRateNote:
      "Multiplier value pending the Buoy 3D Core app export. Until then 1.0 — no change.",
  },
];

export function tidePreset(key: TidePreset["key"]): TidePreset {
  return TIDE_PRESETS.find((t) => t.key === key) ?? TIDE_PRESETS[1];
}

/* ------------------------------------------------------------------ */
/* Conflicts — both envelopes kept, no winner picked                     */
/* ------------------------------------------------------------------ */

export type Conflict = {
  topic: string;
  envelopeA: string;
  envelopeB: string;
  note: string;
};

export const CONFLICTS: Conflict[] = [
  {
    topic: "Piston bore",
    envelopeA: "180 mm",
    envelopeB: "450 mm",
    note: "The single biggest fork. Every downstream number (swept volume, thrust, tank, turbine) follows from it. Ray must true which bore is the physical baseline [G22 §4].",
  },
  {
    topic: "Piston stroke",
    envelopeA: "1.00 m",
    envelopeB: "0.65 m",
    note: "Gemini's own Nov 22 seal section says '1.0 m stroke' for the needle sleeve [G22 §2D] while her Nov 20 sizing table says 650 mm — an internal inconsistency inside her own answers, flagged here rather than smoothed over.",
  },
  {
    topic: "Shot volume / cycle rate",
    envelopeA: "25 L per shot at 30 cycles/min (0.50 Hz)",
    envelopeB: "103 L swept at a 4.0 s cycle (0.25 Hz), 40% duty (1.6 s pulse)",
    note: "Envelope A's own fill rate (12.5 L/s at 1.5 m/s intake) needs ~2.0 s to fill 25 L — the whole 2.0 s cycle — leaving no time for discharge or reset if the phases run one after another. The simulator reports the emergent cycle rate so this can be seen, not hidden.",
  },
  {
    topic: "Driving pressure",
    envelopeA: "4.0 bar gauge net shot pressure",
    envelopeB: "1.6 bar effective ΔP",
    note: "And Gemini's Nov 22 lift calc says 0.35–0.50 bar gauge is enough to lift the piston + water in EITHER envelope. The 4.0 bar figure is ~8–11× the lift pressure — the sizing paradox [G22 §1].",
  },
  {
    topic: "Air tank",
    envelopeA: "50 L @ 4.0 bar nominal (1.0–6.0 bar range)",
    envelopeB: "250 L @ 1.5–3.0 bar nominal (5.0–7.0 bar over-energized)",
    note: "Gemini's Nov 22 paradox paragraph applies Marlow's 4.0/6.0 bar figures to both envelopes; her own Nov 20 tank range is 1.5–3.0 / 5.0–7.0 bar. The two ranges are kept separate here.",
  },
  {
    topic: "Turbine",
    envelopeA: "400 mm rotor, 10 blades, 35° pitch, 1,800 rpm nominal",
    envelopeB: "280 mm rotor OD, 95 mm hub, 8 blades, 28°–34° pitch, ~650–950 RPM pulse",
    note: "Different rotor, blade count, pitch, and speed. Turbine rpm in the simulator is driven by discharge flow, not by waves [G20].",
  },
  {
    topic: "Coils — turns & gauge",
    envelopeA: "48 turns/phase, 2.5 mm² copper, 0.50 T, 30 Hz",
    envelopeB: "~120 turns, 10 AWG eq., N52 0.95–1.1 T, frequency not stated",
    note: "Envelope B cannot compute coil EMF (E ≈ 4.44 f N B A) because frequency and active area are not stated for it. Coil volts read null for B.",
  },
  {
    topic: "Efficiencies",
    envelopeA: "55% turbine × 72.73% electrical = 40% combined",
    envelopeB: "82% hydraulic-to-shaft, 81% generator, 50% total water-to-wire",
    note: "Both chains are arithmetic that lands on the 2,000 W target by construction. Neither verifies real losses [M20 §2, §7].",
  },
  {
    topic: "Top slots",
    envelopeA: "4 slots, 52 × 40 mm (8,320 mm² total)",
    envelopeB: "4 slots, 150 × 70 mm (420 cm² total)",
    note: "A five-fold difference in intake area, following from the different flow assumptions (12.5 L/s mean vs 62.5 L/s pulse).",
  },
  {
    topic: "Quad-Venturi throats",
    envelopeA: "12.8 mm diameter each (510 mm² total); mouth 38 mm",
    envelopeB: "65 mm → 35 mm ports (throat 35 mm)",
    note: "An order-of-magnitude difference, following from the different jet-velocity assumptions (24 m/s vs ~15.9 m/s).",
  },
  {
    topic: "Hull",
    envelopeA: "1.20 m Ø × 2.40 m, 75% immersion, ~2,086 kgf buoyancy",
    envelopeB: "850 mm OD × 2,800 mm, 2,200 mm draft, 600 mm freeboard, ~1,280 kg buoyancy",
    note: "Different hull, different draft — and Gemini's Case A hydrostatic note (1.8 m) matches Marlow's 75% immersion of 2.40 m. That agreement is noted; the hulls still differ.",
  },
  {
    topic: "Mooring / ballast",
    envelopeA: "2,500 kg wet (4 × 625 kg, assumed)",
    envelopeB: "≥1,800 kg ballast + seafloor anchor deadweight",
    note: "Both are calculation envelopes, not a sea-floor holding design. Wave height, current, depth, seabed, chain size, and factor of safety are unspecified in both [M20 §5, §7].",
  },
  {
    topic: "Supercapacitor bank",
    envelopeA: "Not sized (48 V / 41.67 A load only)",
    envelopeB: "165 F @ 48 V (~190 kJ usable)",
    note: "Envelope A reports bank charge in joules with no capacity and no percent. Envelope B reports both.",
  },
  {
    topic: "Cycle phase order",
    envelopeA: "Not stated as a phase chain",
    envelopeB: "Nov 20 sim: fill → trigger → plunger UP → discharge → turbine. Nov 22 redesign: fill → discharge (downstroke, turbine spins, air compressed to plenum) → air-fired upstroke at the bottom.",
    note: "Gemini's own two accounts order the upstroke differently. This file implements the Nov 22 order (later, more detailed, and matching the master record: waves drive the downstroke, air drives the upstroke). The app's real stepSimulation will settle it when the code is exported.",
  },
  {
    topic: "Flow-path order — turbine vs venturis",
    envelopeA: "Master stage order: turbine (04) then venturis (05)",
    envelopeB: "Nov 22 flow path reads venturis → turbine exhaust; Nov 20 calls the turbine 'out bottom'",
    note: "Clarification item, not a hard conflict: does the turbine sit above the venturis (master stage order) or below them? The schematic keeps the master stage order and flags the question.",
  },
];

/* ------------------------------------------------------------------ */
/* Missing — for Ray to true [G22 §4]                                  */
/* ------------------------------------------------------------------ */

export const MISSING_FOR_RAY: string[] = [
  "Piston bore: 180 mm (Marlow) vs 450 mm (Gemini) — which is the physical baseline?",
  "Piston stroke: 1.00 m (Marlow) vs 0.65 m (Gemini) — and Gemini's seal section says 1.0 m while her sizing says 0.65 m.",
  "Piston mass: unspecified in all documents (assumed 20–45 kg in the lift working). What does the weighted piston + needle assembly actually weigh?",
  "Water head height above the piston: unspecified. Depends on hull draft and intake depth.",
  "Scupper valving: the diagram shows open top grilles. Are there internal check valves/flappers to stop backflow on discharge? (Gemini proposes flappers — Ray's word needed.)",
  "Air tank volume & pre-charge: 50 L @ 4.0 bar (Marlow) vs 250 L @ 1.5–3.0 bar (Gemini). Sealed air spring or compressor-charged?",
  "Stepped piston dimensions: the larger upper crown (A_water) and smaller lower pneumatic face (A_pneumatic) have no dimensions in any document. The simulator falls back to the single-bore piston until Ray trues them.",
  "Halbach array: '24 blocks' is illustrative from the bucket sheet; field assumed 0.5–1.0 T. Magnet grade (N42, N52), block dimensions, inner bore diameter?",
  "Induction coils: 48 turns/phase, 2.5 mm² (Marlow) vs ~120 turns, 10 AWG (Gemini). Actual turn count, gauge, wiring topology (star vs delta, single vs 3-phase)?",
  "Wave sea state: unspecified. Calculations arbitrarily assumed 0.5 Hz / 2 s period. What design wave height (H_s) and period (T_p) is the buoy sized for?",
  "Coil resistance, stator thermal path, magnet coercivity: needed before the EM thermal/demagnetization guards can evaluate anything. Until then they report UNEVALUABLE.",
  "Tide preset fill-rate multipliers: live in the Buoy 3D Core app's rayDesignData.ts, pending export. Until then every preset is 1.0.",
  "Level/cam trigger threshold: the pan-fill level that trips the trigger is not specified in the local documents. The simulator uses a full pan (1.0) and flags it.",
  "Upstroke duration: not specified. The simulator uses the discharge duration as its reference and flags it.",
  "2,000 W target: TARGET ONLY — NOT MEASURED. Kept explicitly labelled as target.",
];

/* ------------------------------------------------------------------ */
/* Lift summary — Gemini's Case A / Case B, recomputed [G22 §1]         */
/* ------------------------------------------------------------------ */

export type LiftSummary = {
  envelopeId: EnvelopeId;
  waterMassKg: number;
  waterWeightN: number;
  pistonWeightN: number;
  frictionN: number;
  totalDownN: number;
  liftPressureGaugeBar: number;
  hydrostaticBar: number;
  absolutePressureBar: number;
  /**
   * Upward thrust at 4.0 bar gauge — the sizing-paradox pressure
   * [G22 §1]: 10,180 N (180 mm) / 63,600 N (450 mm). Computed at 4.0
   * bar for BOTH envelopes, not at each envelope's tank nominal.
   */
  thrustAt4BarN: number;
  thrustAt4Bar: number;
  notes: string[];
};

export function liftSummary(env: SizingEnvelope): LiftSummary {
  const waterMassKg = env.shotVolumeM3 * SEAWATER_RHO_KG_M3;
  const waterWeightN = waterMassKg * G_M_S2;
  const pistonWeightN = env.pistonMassKg.value * G_M_S2;
  const totalDownN = downwardForceN(
    env.pistonMassKg.value,
    waterMassKg,
    env.frictionN.value,
  );
  const liftPa = liftPressureGaugePa(
    env.pistonMassKg.value,
    waterMassKg,
    env.frictionN.value,
    env.faceAreaM2,
  );
  const hydroPa = hydrostaticHeadPa(SEAWATER_RHO_KG_M3, env.immersionM);
  const absPa = P_ATM_PA + liftPa + hydroPa;
  const thrust4BarN = thrustAtPressureN(barToPa(4.0), env.faceAreaM2);
  return {
    envelopeId: env.id,
    waterMassKg,
    waterWeightN,
    pistonWeightN,
    frictionN: env.frictionN.value,
    totalDownN,
    liftPressureGaugeBar: paToBar(liftPa),
    hydrostaticBar: paToBar(hydroPa),
    absolutePressureBar: paToBar(absPa),
    thrustAt4BarN: thrust4BarN,
    thrustAt4Bar: 4.0,
    notes: [
      `Piston mass ${env.pistonMassKg.value} kg and friction ${env.frictionN.value} N are ${env.id === "A-marlow" ? "Gemini's assumptions for the 180 mm envelope" : "Gemini's assumptions for the 450 mm envelope"} [G22 §1] — the design does not specify them.`,
      `Immersion ${env.immersionM} m is Gemini's reading [G22 §1], not a measurement.`,
      `Lift pressure is computed on the single-bore face area. With Gemini's stepped piston the lift face is the SMALLER A_pneumatic, so the required pressure would be HIGHER — the step dimensions are missing, so this is a lower bound, not the stepped answer.`,
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Headline power chain — the arithmetic that lands on the target       */
/* ------------------------------------------------------------------ */

export type PowerChainSummary = {
  envelopeId: EnvelopeId;
  hydraulicW: number;
  shaftW: number;
  electricalW: number;
  derivation: string;
};

export function headlinePowerChain(env: SizingEnvelope): PowerChainSummary {
  if (env.id === "A-marlow") {
    const flow = meanFlowM3PerS(env.shotVolumeM3, env.cycleHz);
    const hyd = hydraulicPowerW(env.drivingPressurePa, flow);
    const { shaftW, electricalW } = powerChainW(hyd, env.etaTurbine, env.etaElec);
    return {
      envelopeId: env.id,
      hydraulicW: hyd,
      shaftW,
      electricalW,
      derivation:
        "400 kPa × 0.0125 m³/s = 5,000 W hydraulic; × 55% turbine = 2,750 W shaft; × 72.73% electrical = 2,000 W [M20 §2]. Arithmetic only — it does not verify Bernoulli losses, pressure decay, sealing, cavitation, turbine stall, coil impedance, or real output.",
    };
  }
  // Envelope B: pulse power averaged over the cycle.
  // Pulse flow is her STATED 62.5 L/s [G20], not derived from the swept
  // volume — 62.5 L/s × 1.6 s = 0.100 m³ against the 0.103 m³ swept
  // volume, a 3% difference inside her own numbers (see the derivation).
  const pulseFlow = env.dischargeFlowM3PerS;
  const pulseHyd = hydraulicPowerW(env.drivingPressurePa, pulseFlow);
  const duty = (env.pulseSeconds.value ?? 1.6) / env.cycleSeconds;
  const avgHyd = pulseHyd * duty;
  const electricalW = avgHyd * 0.5; // 50% total water-to-wire [G20]
  return {
    envelopeId: env.id,
    hydraulicW: avgHyd,
    shaftW: avgHyd * env.etaTurbine,
    electricalW,
    derivation:
      "160 kPa × 0.0625 m³/s = 10,000 W during the 1.6 s pulse; × 40% duty = 4,000 W average hydraulic; × 50% total water-to-wire = 2,000 W average [G20]. Note: 62.5 L/s × 1.6 s = 0.100 m³, against the 0.103 m³ swept volume from 450 mm × 650 mm — a 3% difference inside her own numbers, flagged not smoothed. Arithmetic only — not verified, not measured.",
  };
}

/* ------------------------------------------------------------------ */
/* stepSimulation — the cycle                                          */
/*                                                                     */
/* Phase order (Nov 22 redesign [G22 §2], matching the master record:  */
/* waves drive the downstroke, air drives the upstroke):               */
/*   FILLING → DISCHARGE (downstroke) → RESET (air-fired upstroke)     */
/*                                                                     */
/*  FILLING: pan fills from the top slots. Flappers OPEN, foot valve   */
/*    SHUT, needle SEATED, piston at the top. At a full pan the        */
/*    level/cam trigger trips.                                         */
/*  DISCHARGE: piston descends, driving the shot down through the      */
/*    venturis; turbine RPM is driven by discharge, not by waves.      */
/*    Flappers SHUT (or the paradox fires), foot valve OPEN. The       */
/*    descending piston compresses air into the accumulator plenum     */
/*    (Boyle approximation, labelled as such). At the bottom the       */
/*    needle unseats.                                                  */
/*  RESET: stored plenum air is admitted to the lift chamber and       */
/*    fires the piston back UP. Flappers SHUT, foot valve SHUT (no     */
/*    back-suction through the turbine). At the top the needle         */
/*    reseats and the cycle repeats.                                   */
/*                                                                     */
/* EM coils (when enabled): fire forward on DISCHARGE and reverse on   */
/* RESET. They are an ENERGY TRANSACTION only — spend the pulse energy  */
/* from the bank, return Gemini's stated fraction through the turbine. */
/* The net is negative by her own analysis (spend 500 J, get back     */
/* 250–350 J); the simulator shows the drain, it does not hide it.    */
/*                                                                     */
/* SIZING PARADOX GUARD: if lift pressure is applied while the         */
/* flappers are open, the water erupts out of the top scuppers         */
/* instead of going through the turbine and venturis [G22 §1]. The     */
/* simulator raises the warning and diverts the flow.                  */
/*                                                                     */
/* ORDERING NOTE: Gemini's Nov 20 sim chain fires the upstroke right   */
/* after the trigger and before discharge; this file implements the    */
/* Nov 22 order (discharge first, air-fired upstroke at the bottom).   */
/* The app's real stepSimulation settles it when the code is exported. */
/* ------------------------------------------------------------------ */

export const TRIGGER_LEVEL = 1.0; // Full pan. NOT specified in the local documents — flagged in MISSING_FOR_RAY.

export function defaultControls(): SimControls {
  return {
    envelope: "unresolved",
    plungerSetting: 1.0,
    overEnergize: false,
    mode: "Harvest",
    tide: "moderate",
    emPulseEnabled: false,
    emPulseEnergyJ: 500,
    emReturnFraction: 0.6,
    emReturnRange: [0.5, 0.7],
  };
}

export function initialState(controls: SimControls): SimState {
  const env =
    controls.envelope === "unresolved" ? null : ENVELOPES[controls.envelope];
  return {
    t: 0,
    cycles: 0,
    emergentCycleHz: null,
    telemetry: {
      phase: "FILLING",
      waterLevel: 0,
      pistonY: env ? env.strokeM : 0,
      pistonVelocityMPerS: 0,
      displacementBar: 0,
      plungerAirBar: paToBar(P_ATM_PA),
      turbineRPM: 0,
      flowLPerS: 0,
      coilVoltsV: null,
      capBankJ: 0,
      capBankPct: null,
      mode: controls.mode,
      flapperOpen: true,
      footValveOpen: false,
      needleValve: "seated",
      accumulatorBar: env ? paToBar(env.tankNominalPa) : 0,
      emPulseActive: false,
      energySpentJ: 0,
      energyHarvestedJ: 0,
      netEnergyJ: 0,
      electricalW: 0,
      warnings: [],
    },
  };
}

export function stepSimulation(
  state: SimState,
  controls: SimControls,
  dtSeconds: number,
): SimState {
  if (controls.envelope === "unresolved") {
    return {
      ...state,
      telemetry: {
        ...state.telemetry,
        warnings: [
          ...state.telemetry.warnings,
          "NO ENVELOPE CHOSEN — the two sizing envelopes disagree (bore 180 vs 450 mm, tank 50 L vs 250 L). Pick an envelope explicitly; this simulator will not pick a winner.",
        ],
      },
    };
  }

  const env = ENVELOPES[controls.envelope];
  const tel = { ...state.telemetry, warnings: [] as string[] };
  const tide = tidePreset(controls.tide);
  const wasPhase = state.telemetry.phase; // entry-gate: Boost spends once per discharge
  let { t, cycles } = state;

  // --- Tank pressure under the controls ------------------------------
  // plungerSetting 0.50–1.50× scales the nominal; Over-Energize takes
  // the tank to its over-energized ceiling [G20, M20 §4].
  const tankGaugePa = controls.overEnergize
    ? env.overEnergizedPa
    : env.tankNominalPa * clamp(controls.plungerSetting, 0.5, 1.5);

  // --- Discharge timing ----------------------------------------------
  // Discharge expels the shot at the envelope's discharge flow.
  // A: mean flow 12.5 L/s [M20 §2]. B: stated 62.5 L/s pulse [G20].
  const dischargeFlowM3PerS = env.dischargeFlowM3PerS;
  const dischargeSeconds = env.shotVolumeM3 / dischargeFlowM3PerS;
  // Upstroke duration is NOT specified in any document; the simulator
  // uses the discharge duration as its reference and flags it.
  const upstrokeSeconds = dischargeSeconds;

  // --- Coil volts (only computable where f, N, B, A are all known) ---
  let coilVoltsV: number | null = null;
  if (
    env.coilFrequencyHz.value !== null &&
    env.coilTurnsPerPhase.value !== null &&
    env.coilActiveAreaM2.value !== null
  ) {
    coilVoltsV = coilEmfPeakV(
      env.coilFrequencyHz.value,
      env.coilTurnsPerPhase.value,
      env.coilFieldT.value,
      env.coilActiveAreaM2.value,
    );
  }

  // --- Phase machine ---------------------------------------------------
  let phaseTime = dtSeconds;
  // Track how far through the current phase we are via waterLevel/pistonY.
  if (tel.phase === "FILLING") {
    tel.flapperOpen = true;
    tel.footValveOpen = false;
    tel.needleValve = "seated";
    tel.pistonY = env.strokeM; // piston waits at the top while the pan fills
    tel.pistonVelocityMPerS = 0;
    tel.turbineRPM = 0;
    tel.flowLPerS = 0;
    tel.electricalW = 0;
    tel.displacementBar = 0;
    tel.plungerAirBar = paToBar(P_ATM_PA + tankGaugePa);
    tel.emPulseActive = false;
    const fillRate =
      (1 / env.fillSeconds) * tide.fillRateMultiplier * phaseTime;
    tel.waterLevel = clamp(tel.waterLevel + fillRate, 0, 1);
    if (tel.waterLevel >= TRIGGER_LEVEL) {
      tel.phase = "DISCHARGE";
      tel.waterLevel = TRIGGER_LEVEL;
    }
  } else if (tel.phase === "DISCHARGE") {
    tel.flapperOpen = false;
    tel.footValveOpen = true;
    tel.needleValve = "seated";
    tel.emPulseActive = controls.emPulseEnabled;
    // Piston descends the full stroke over the discharge time.
    const descendRate = (env.strokeM / dischargeSeconds) * phaseTime;
    const prevY = tel.pistonY;
    tel.pistonY = clamp(tel.pistonY - descendRate, 0, env.strokeM);
    tel.pistonVelocityMPerS = -((prevY - tel.pistonY) / phaseTime);
    // Water leaves through the venturis at the discharge flow.
    tel.flowLPerS = dischargeFlowM3PerS * 1000;
    tel.waterLevel = clamp(
      tel.waterLevel - (dischargeFlowM3PerS * phaseTime) / env.shotVolumeM3,
      0,
      1,
    );
    // Turbine RPM is driven by discharge, not by waves [G20].
    tel.turbineRPM =
      env.turbineRpmAtNominalFlow *
      (dischargeFlowM3PerS / env.turbineNominalFlowM3PerS);
    // Driving pressure across the piston during discharge.
    tel.displacementBar = paToBar(env.drivingPressurePa);
    // The descending piston compresses the gas below it into the
    // accumulator plenum (Boyle approximation — labelled as such).
    // Gas volume under the piston shrinks by the swept fraction.
    const sweptFraction = 1 - tel.pistonY / env.strokeM;
    const gasVolumeNow =
      env.tankVolumeM3 * (1 - (sweptFraction * env.sweptVolumeM3) / env.tankVolumeM3);
    const plenumPa = boylePressurePa(
      P_ATM_PA + tankGaugePa,
      env.tankVolumeM3,
      Math.max(gasVolumeNow, env.tankVolumeM3 * 0.05),
    );
    tel.accumulatorBar = paToBar(plenumPa - P_ATM_PA);
    tel.plungerAirBar = paToBar(plenumPa);
    // Electrical power this step (SIMULATION — NOT MEASURED DATA).
    const hydW = hydraulicPowerW(env.drivingPressurePa, dischargeFlowM3PerS);
    const { electricalW } = powerChainW(hydW, env.etaTurbine, env.etaElec);
    tel.electricalW = electricalW;
    // Harvest into the bank (Mode A). Mode B spends it — see below.
    if (controls.mode === "Harvest") {
      tel.capBankJ += electricalW * phaseTime;
    }
    // EM pulse on the downstroke: spend from the bank, return the
    // stated fraction through the turbine [G22 §3C]. Net is negative
    // by her own analysis — the simulator shows the drain.
    if (controls.emPulseEnabled) {
      const spent = controls.emPulseEnergyJ * (phaseTime / dischargeSeconds);
      const returned = spent * controls.emReturnFraction;
      tel.energySpentJ += spent;
      tel.energyHarvestedJ += returned;
      tel.netEnergyJ = tel.energyHarvestedJ - tel.energySpentJ;
      tel.capBankJ += returned - spent;
      if (tel.netEnergyJ < 0 && state.cycles === 0 && tel.waterLevel > 0.9) {
        tel.warnings.push(
          `EM ENERGY DEFICIT — the coils spend ${controls.emPulseEnergyJ} J per pulse and return ${(controls.emReturnFraction * 100).toFixed(0)}% (${controls.emReturnRange[0] * 100}–${controls.emReturnRange[1] * 100}% per Gemini [G22 §3C]). Continuous dual-direction repulsion drains the bank unless phase-matching captures more wave energy.`,
        );
      }
    }
    // Plenum pressure vs the over-energized ceiling.
    if (paToBar(plenumPa - P_ATM_PA) > paToBar(env.overEnergizedPa)) {
      tel.warnings.push(
        `PLENUM OVER-PRESSURE — Boyle compression of the ${Math.round(env.tankVolumeM3 * 1000)} L tank by the ${Math.round(env.sweptVolumeM3 * 1000)} L stroke drives the plenum to ${paToBar(plenumPa - P_ATM_PA).toFixed(2)} bar gauge, above the ${paToBar(env.overEnergizedPa).toFixed(1)} bar over-energized ceiling. The tank volume or the stroke must give.`,
      );
    }
    if (tel.pistonY <= 0) {
      tel.phase = "RESET";
      tel.needleValve = "unseated"; // bottom of stroke: poppet unseats [G22 §2B]
      tel.pistonY = 0;
      tel.pistonVelocityMPerS = 0;
    }
  } else {
    // RESET — the air-fired upstroke [G22 §2C].
    tel.flapperOpen = false; // shut, or the paradox fires (guard below)
    tel.footValveOpen = false; // shut — no back-suction through the turbine
    tel.needleValve = "unseated";
    tel.emPulseActive = controls.emPulseEnabled;
    // Lift check: stored plenum air must beat lift + hydrostatic.
    const lift = liftSummary(env);
    const liftNeededPa =
      barToPa(lift.liftPressureGaugeBar) +
      barToPa(lift.hydrostaticBar);
    const liftAvailablePa =
      barToPa(tel.accumulatorBar) + P_ATM_PA - P_ATM_PA; // accumulator gauge
    const liftAvailableAbsPa = barToPa(tel.accumulatorBar) + P_ATM_PA;
    void liftAvailablePa;
    if (barToPa(tel.accumulatorBar) < liftNeededPa) {
      tel.warnings.push(
        `INSUFFICIENT LIFT — stored plenum air ${tel.accumulatorBar.toFixed(2)} bar gauge is below the ${paToBar(liftNeededPa).toFixed(2)} bar gauge needed to lift piston + water (${lift.liftPressureGaugeBar.toFixed(3)} bar lift + ${lift.hydrostaticBar.toFixed(3)} bar hydrostatic [G22 §1]). The piston stalls at the bottom.`,
      );
      tel.pistonVelocityMPerS = 0;
    } else {
      const riseRate = (env.strokeM / upstrokeSeconds) * phaseTime;
      const prevY = tel.pistonY;
      tel.pistonY = clamp(tel.pistonY + riseRate, 0, env.strokeM);
      tel.pistonVelocityMPerS = (tel.pistonY - prevY) / phaseTime;
    }
    tel.turbineRPM = 0;
    tel.flowLPerS = 0;
    tel.electricalW = 0;
    tel.displacementBar = paToBar(liftNeededPa);
    tel.plungerAirBar = paToBar(liftAvailableAbsPa);
    // EM pulse on the upstroke (reverse polarity) — same transaction.
    if (controls.emPulseEnabled) {
      const spent = controls.emPulseEnergyJ * (phaseTime / upstrokeSeconds);
      const returned = spent * controls.emReturnFraction;
      tel.energySpentJ += spent;
      tel.energyHarvestedJ += returned;
      tel.netEnergyJ = tel.energyHarvestedJ - tel.energySpentJ;
      tel.capBankJ += returned - spent;
    }
    // SIZING PARADOX GUARD: lift pressure with the scuppers open.
    if (tel.flapperOpen) {
      tel.warnings.push(
        "SIZING PARADOX — lift pressure applied with the top scuppers OPEN. At the design pressures the water erupts out of the top scuppers instead of going through the turbine and venturis [G22 §1]. The flappers must be shut on the upstroke.",
      );
    }
    if (tel.pistonY >= env.strokeM) {
      tel.phase = "FILLING";
      tel.needleValve = "seated"; // top of stroke: trigger reseats it [G22 §2B]
      tel.waterLevel = 0;
      tel.pistonY = env.strokeM;
      tel.pistonVelocityMPerS = 0;
      tel.accumulatorBar = paToBar(tankGaugePa);
      cycles += 1;
    }
  }

  // --- Router Mode B: spend the bank in one pulse ----------------------
  // Fires ONCE, on entering DISCHARGE in Boost mode (the app's boost()
  // spends the bank in one pulse and returns to Harvest [MDR §1.4]).
  // The simulator cannot change the operator's mode itself — the app
  // layer returns to Harvest after the spend; until then the bank stays
  // empty and the guard below says so once, on entry.
  if (controls.mode === "Boost" && tel.phase === "DISCHARGE" && wasPhase !== "DISCHARGE") {
    const capacity =
      env.capBankCapacityJ.value !== null ? env.capBankCapacityJ.value : null;
    const floorJ =
      capacity !== null ? capacity * 0.05 : tel.electricalW * 0.05;
    if (tel.capBankJ < floorJ) {
      tel.warnings.push(
        "The bank is nearly empty — let her harvest a while first. [MDR §1.4]",
      );
    } else {
      const spent = tel.capBankJ;
      tel.capBankJ = 0;
      tel.warnings.push(
        `Boost released: the router spent ${Math.round(spent).toLocaleString()} J of the bank through the turbine in one pulse. Back to Harvest — the sea refills her. [MDR §1.4]`,
      );
    }
  }

  // --- Bank percent (only where the envelope sizes the bank) -----------
  tel.capBankPct =
    env.capBankCapacityJ.value !== null
      ? clamp((tel.capBankJ / env.capBankCapacityJ.value) * 100, 0, 100)
      : null;
  tel.coilVoltsV = coilVoltsV;
  tel.mode = controls.mode;

  t += dtSeconds;
  const emergentCycleHz = cycles > 0 && t > 0 ? cycles / t : null;

  // --- Emergent cycle rate vs the stated cycle rate --------------------
  if (emergentCycleHz !== null && cycles >= 2) {
    const stated = env.cycleHz;
    const ratio = emergentCycleHz / stated;
    if (ratio < 0.8 || ratio > 1.25) {
      tel.warnings.push(
        `CYCLE-RATE MISMATCH — the stated phase timings imply ${emergentCycleHz.toFixed(2)} Hz, but the envelope states ${stated.toFixed(2)} Hz (ratio ${ratio.toFixed(2)}×). Fill, discharge, and reset cannot all run one after another inside the stated cycle. Either the phases overlap or one of the stated rates must give.`,
      );
    }
  }

  return { t, cycles, emergentCycleHz, telemetry: tel };
}

/* ------------------------------------------------------------------ */
/* EM guard evaluation — returns UNEVALUABLE where inputs are missing   */
/* ------------------------------------------------------------------ */

export type EmGuard = {
  check: string;
  result: "PASS" | "WARN" | "UNEVALUABLE";
  detail: string;
};

export function evaluateEmGuards(env: SizingEnvelope): EmGuard[] {
  return [
    {
      check: "Net energy — EM pulse vs harvest return",
      result: "WARN",
      detail:
        "Gemini's own analysis: spend 500 J of capacitor energy, harvest back 250–350 J (50–70%). Continuous dual-direction repulsion drains the supercapacitor bank unless phase-matching captures more wave energy [G22 §3C]. The simulator demonstrates this drain; it cannot fix it.",
    },
    {
      check: "Thermal — stator I²R heating in a sealed hull",
      result: "UNEVALUABLE",
      detail:
        "Coil resistance is not specified in any document, so I²R heating cannot be computed. Gemini states 50–100 A pulses and requires the stator coils potted against the hull (seawater heat sink) [G22 §3C–D]. Until resistance and the thermal path are specified, this guard cannot evaluate.",
    },
    {
      check: "Demagnetization — NdFeB (N52) coercivity / 60–80 °C",
      result: "UNEVALUABLE",
      detail:
        "Magnet grade is assumed N52 in Envelope B and unspecified in Envelope A; intrinsic coercivity (H_ci) and the opposing field from the drive coils are not specified. Gemini warns strong opposing fields can permanently demagnetize N52 above coercivity, especially above 60–80 °C [G22 §3C]. Cannot evaluate until grade, field, and temperature are specified.",
    },
    {
      check: "Inductive spikes — V = L di/dt near harvest coils/router",
      result: "UNEVALUABLE",
      detail:
        "Coil inductance (L) and current slew rate (di/dt) are not specified in any document. Gemini warns of massive voltage spikes risking rectifiers and supercapacitor banks, and requires Mu-metal / silicon-steel flux barriers [G22 §3C–D]. Cannot evaluate until L and di/dt are specified.",
    },
    {
      check: "H-bridge — four-quadrant bi-directional power flow",
      result: "WARN",
      detail:
        "The current router (Part 13, Stage 11) is a passive diode/MOSFET router. EM motoring mode needs a full four-quadrant bi-directional H-bridge inverter/converter [G22 §3D]. This is a proposed change, not Ray's design.",
    },
  ];
}
