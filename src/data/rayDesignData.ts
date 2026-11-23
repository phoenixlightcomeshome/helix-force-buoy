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
  boylePressurePa,
} from '../lib/physics';

export type FlowChannelId =
  | 'THE POUR'
  | 'THE PLUNGER CHANNEL'
  | 'THE THROUGH-FLOW'
  | 'THE VENTURI CHANNEL'
  | 'THE RETURN';

export type TideLevel = 'Calm' | 'Moderate' | 'Swell' | 'Heavy';

export type OperatingMode = 'Harvest' | 'Boost';

export interface BuoyStage {
  id: string;
  order: number;
  name: string;
  diagramLabel: string | null;
  flowChannel: FlowChannelId;
  note: string;
  roleTag:
    | 'Hydraulic Intake'
    | 'Wave Drive'
    | 'Enhancement'
    | 'Turbine'
    | 'Core Field'
    | 'Storage & Base'
    | 'Control & Solar';
  baseY: number;
  explodeOffset: number;
}

export interface FlowChannelSpec {
  id: FlowChannelId;
  title: string;
  sourceSummary: string;
  stageIds: string[];
}

export interface GatherPart {
  number: number;
  part: string;
  detail: string;
}

export interface SubPartSpec {
  id: string;
  name: string;
  material: string;
  role: string;
}

export interface PartTechnicalSpec {
  number: number;
  part: string;
  detail: string;
  stageIds: string[];
  flowChannels: FlowChannelId[];
  diagramLabels: string[];
  bucketSheetLabels: string[];
  material: string;
  dimensions: string;
  plainLanguage: string;
  technicalDescription: string;
  functionSummary: string;
  motionInMachine: string;
  subParts: SubPartSpec[];
}

export interface TrialStep {
  number: number;
  step: string;
  detail: string;
}

export interface DiagramHotspot {
  id: number;
  label: string;
  stageId: string;
  xPercent: number;
  yPercent: number;
  anchorSide: 'left' | 'right';
}

export interface TidePreset {
  id: TideLevel;
  label: string;
  intensity: number;
  waveFrequency: number;
  strokeAmplitude: number;
  description: string;
}

export type PartSelection = number | 'center-needle';

export type TriggerPhase = 'FILLING' | 'TRIGGERED' | 'DISCHARGE';

export interface SimControls {
  plungerSetting: number; // Adjustable Air Tank Plunger setting (0.50 .. 1.50)
  overEnergize: boolean; // Over-Energize toggle for high displacement pressure difference (bar)
  // Gemini corrected spec File 2: sizing envelope for the plenum guard and
  // the dual-envelope power math. Optional so existing callers still
  // compile; absent means 'unresolved' (simulator refuses to run).
  envelope?: EnvelopeId | 'unresolved';
  // Gemini fix spec (Nov 22, 9:10 PM) File 6: center axial turbine pitch,
  // 15° .. 55°. Optional: absent means the envelope default (35° A / 31° B).
  turbinePitchDeg?: number;
}

export interface SizingCalculationRow {
  id: string;
  element: string;
  relatedParts: string;
  calculatedSize: string;
  assumptions: string;
  engineeringBasis: string;
}

export interface OperatingPrincipleStep {
  step: number;
  title: string;
  plainLanguage: string;
  technicalDetail: string;
}

export interface SimTelemetry {
  deltaP: number;
  displacementBar: number;
  plungerAirBar: number;
  turbineRpm: number;
  strokeDepth: number;
  coilVolts: number;
  simPowerWatts: number;
  charge: number;
  mode: OperatingMode;
  boostProgress: number;
  boostMessage: string | null;
  phase: number;
  waveElevation: number;
  waterLevel: number;
  triggerThreshold: number;
  triggerPhase: TriggerPhase;
  triggerFired: boolean;
  camAngle: number;
  dischargePulse: number;
  pistonPosition: number;
  pistonVelocity: number;
  flowRateNorm: number;
  solarTrickleActive: boolean;
  // Gemini spec guards (Nov 22 evaluation) — null while no envelope is chosen.
  simTimeS: number;
  cycleCount: number;
  cycleStartTimeS: number;
  emergentCycleHz: number | null;
  plenumBarGauge: number | null;
  plenumOverPressure: boolean | null;
  sizingParadox: boolean;
  // Valve-state machine + accumulator (Gemini corrected spec File 2).
  // Derived live from the real trigger phase each step.
  flapperOpen: boolean;
  footValveOpen: boolean;
  needleValve: 'SEATED' | 'UNSEATED';
  accumulatorBar: number;
  warnings: string[];
  // Gemini fix spec (Nov 22, 9:10 PM) File 1: turbine pitch + lever angles
  // + coil current/loss, all derived live each step (never measured data).
  turbinePitchDeg: number;
  intakeFlapperAngleDeg: number; // 0° (shut) to 35° (open)
  exhaustFlapperAngleDeg: number; // 0° (shut) to 45° (open)
  coilCurrentA: number; // bus current = sim power / 48 V bus (simulation readout)
  coilOhmicLossW: number; // I²R estimate from coilCurrentA + envelope resistance
}

export const APP_TITLE = 'Helix-Force Buoy 3D Core — Electric Field Generator System';
export const APP_SUBTITLE = "Ray's design, visualized under his direction.";
export const TARGET_OUTPUT_LABEL = 'TARGET: 2,000 W — NOT MEASURED';
export const SIZING_TABLE_HEADING =
  'Sized for 2,000 W target — calculation, for Ray to review and true.';
export const OPERATING_PRINCIPLE_RAY_WORDS =
  'when the pan fills up with water the air is trying to force up and it is triggered by a level or cam when the level of water hits it as it fills the body of the stationary buoy up with water initially causing a chain reaction of forces to spin and shoot the water out the ports turning the turbine generator fins out the bottom.';
export const FAMILY_LAW =
  'water enters, turns in a spiral, meets a magnetic heart, leaves cleaner than it came — and the turning pays for the cleaning.';
export const APP_FOOTER =
  'His design. Her memory. One change at a time. Slow and smooth, smooth is fast.';
export const BOOST_EMPTY_MESSAGE =
  'The bank is nearly empty — let her harvest a while first';

export const DIAGRAM_IMAGE_SRC = `${import.meta.env.BASE_URL}assets/aistudio/341_12_upel_cca0cfe0.png`;
export const PIER_CUTAWAY_IMAGE_SRC = `${import.meta.env.BASE_URL}assets/aistudio/4527_2_q532_ee33dffa.jpg`;

export const DIAGRAM_LABELS: DiagramHotspot[] = [
  {
    id: 1,
    label: 'Central Air-Plunger top scupper Intake',
    stageId: '01',
    xPercent: 31,
    yPercent: 21,
    anchorSide: 'left',
  },
  {
    id: 2,
    label: 'Central Air-Plunger (Weighted Piston)',
    stageId: '02',
    xPercent: 69,
    yPercent: 21,
    anchorSide: 'right',
  },
  {
    id: 3,
    label: 'Axial-Flow Turbine (Hybrid Motor/Generator)',
    stageId: '04',
    xPercent: 31,
    yPercent: 35,
    anchorSide: 'left',
  },
  {
    id: 4,
    label: 'Quad-Venturi Acceleration Ports',
    stageId: '05',
    xPercent: 28,
    yPercent: 46,
    anchorSide: 'left',
  },
  {
    id: 5,
    label: 'Graphene-Ion Scrub Electrodes',
    stageId: '06',
    xPercent: 72,
    yPercent: 46,
    anchorSide: 'right',
  },
  {
    id: 6,
    label: 'Halbach Magnetic Matrix',
    stageId: '07',
    xPercent: 28,
    yPercent: 57,
    anchorSide: 'left',
  },
  {
    id: 7,
    label: 'Fibonacci Helical Core',
    stageId: '08',
    xPercent: 72,
    yPercent: 68,
    anchorSide: 'right',
  },
  {
    id: 8,
    label: 'High-Density Supercapacitors',
    stageId: '09',
    xPercent: 28,
    yPercent: 78,
    anchorSide: 'left',
  },
  {
    id: 9,
    label: 'Smart-Switch Capacitor Base',
    stageId: '10',
    xPercent: 72,
    yPercent: 78,
    anchorSide: 'right',
  },
  {
    id: 10,
    label: 'Smart-Switch Power Router',
    stageId: '11',
    xPercent: 28,
    yPercent: 88,
    anchorSide: 'left',
  },
];

// Canonical 12-stage stack IN RAY'S EXACT ORDER, never reordered or renamed.
export const STAGES: BuoyStage[] = [
  {
    id: '01',
    order: 1,
    name: 'Central Air-Plunger — Top Scupper Intake',
    diagramLabel: 'Central Air-Plunger top scupper Intake',
    flowChannel: 'THE POUR',
    note: 'The crown breathes here. Waves wash over the top scuppers and the sea enters the machine — air and water taken in together at the surface.',
    roleTag: 'Hydraulic Intake',
    baseY: 2.35,
    explodeOffset: 2.4,
  },
  {
    id: '02',
    order: 2,
    name: 'Central Air-Plunger (Weighted Piston)',
    diagramLabel: 'Central Air-Plunger (Weighted Piston)',
    flowChannel: 'THE PLUNGER CHANNEL',
    note: "Inside the stationary moored buoy, water pours through the top slots and fills the pan while air pushes up against the central plunger; when pan water hits the level or cam trigger, the plunger strokes and drives the chain reaction of air and water force out the ports and through the turbine below — the buoy's heartbeat.",
    roleTag: 'Wave Drive',
    baseY: 1.65,
    explodeOffset: 1.85,
  },
  {
    id: '03',
    order: 3,
    name: 'Air Accelerator Unit — Pascal ΔP (THE ENHANCEMENT)',
    diagramLabel: null,
    flowChannel: 'THE PLUNGER CHANNEL',
    note: 'The enhancement: a tapered throat in the plunger path. Pressure taps read P_in at the wide mouth and P_throat at the narrow; ΔP = P_in − P_throat (pascals) is the working number — it sets how hard the flow accelerates and entrains on its way down. Tune the throat, tune the machine.',
    roleTag: 'Enhancement',
    baseY: 1.05,
    explodeOffset: 1.25,
  },
  {
    id: '04',
    order: 4,
    name: 'Axial-Flow Turbine (Hybrid Motor/Generator)',
    diagramLabel: 'Axial-Flow Turbine (Hybrid Motor/Generator)',
    flowChannel: 'THE THROUGH-FLOW',
    note: 'The accelerated stream spins the axial turbine. As a generator it harvests the flow; as a motor it can spend banked charge back into the water — one machine, both directions.',
    roleTag: 'Turbine',
    baseY: 0.45,
    explodeOffset: 0.7,
  },
  {
    id: '05',
    order: 5,
    name: 'Quad-Venturi Acceleration Ports',
    diagramLabel: 'Quad-Venturi Acceleration Ports',
    flowChannel: 'THE VENTURI CHANNEL',
    note: 'Four tapered ports squeeze the stream a second time. Each narrowing trades pressure for speed, jetting the flow into the core chamber already spinning.',
    roleTag: 'Core Field',
    baseY: -0.05,
    explodeOffset: 0.15,
  },
  {
    id: '06',
    order: 6,
    name: 'Graphene-Ion Scrub Electrodes',
    diagramLabel: 'Graphene-Ion Scrub Electrodes',
    flowChannel: 'THE VENTURI CHANNEL',
    note: 'The spinning water runs past the graphene-ion scrub electrodes, which draw ions and debris out of the stream as it passes — the water leaves cleaner than it came in.',
    roleTag: 'Core Field',
    baseY: -0.4,
    explodeOffset: -0.35,
  },
  {
    id: '07',
    order: 7,
    name: 'Halbach Magnetic Matrix',
    diagramLabel: 'Halbach Magnetic Matrix',
    flowChannel: 'THE VENTURI CHANNEL',
    note: 'The magnetic heart. The Halbach array focuses its field inward on the core and cancels it outside, so the moving conductive seawater crosses the strongest field exactly where the coils listen.',
    roleTag: 'Core Field',
    baseY: -1.15,
    explodeOffset: -0.9,
  },
  {
    id: '08',
    order: 8,
    name: 'Fibonacci Helical Core',
    diagramLabel: 'Fibonacci Helical Core',
    flowChannel: 'THE VENTURI CHANNEL',
    note: 'The vortex winds down the Fibonacci helix — each turn in golden proportion, the spiral tightening as it falls. Copper induction coils around the core harvest the crossing field as electromagnetic energy: the blue pulses in the drawing.',
    roleTag: 'Core Field',
    baseY: -1.15,
    explodeOffset: -1.5,
  },
  {
    id: '09',
    order: 9,
    name: 'High-Density Supercapacitors',
    diagramLabel: 'High-Density Supercapacitors',
    flowChannel: 'THE RETURN',
    note: "The bank in the base. Supercapacitors catch the harvest pulse by pulse — fast in, fast out — smoothing the sea's rhythm into stored charge.",
    roleTag: 'Storage & Base',
    baseY: -2.1,
    explodeOffset: -2.05,
  },
  {
    id: '10',
    order: 10,
    name: 'Smart-Switch Capacitor Base',
    diagramLabel: 'Smart-Switch Capacitor Base',
    flowChannel: 'THE RETURN',
    note: 'The armored foundation that houses the bank and the brain, ballasts the buoy upright, and carries the through-flow out the bottom, back to the sea.',
    roleTag: 'Storage & Base',
    baseY: -2.35,
    explodeOffset: -2.65,
  },
  {
    id: '11',
    order: 11,
    name: 'Smart-Switch Power Router',
    diagramLabel: 'Smart-Switch Power Router',
    flowChannel: 'THE RETURN',
    note: "The HELIX-MHD brain's hand. Mode A Harvest: the router quietly stores. Mode B Boost: it spends the bank back through the turbine in one stronger pulse. Store or release — the router decides.",
    roleTag: 'Control & Solar',
    baseY: -2.2,
    explodeOffset: -3.2,
  },
  {
    id: '12',
    order: 12,
    name: 'Solar Crown',
    diagramLabel: null,
    flowChannel: 'THE POUR',
    note: 'Panels on the crown top up the bank under sun and keep the router, sensors, and beacon alive through flat calms when the sea gives nothing.',
    roleTag: 'Control & Solar',
    baseY: 2.82,
    explodeOffset: 3.15,
  },
];

export const FLOW_CHANNELS: FlowChannelSpec[] = [
  {
    id: 'THE POUR',
    title: 'THE POUR',
    sourceSummary: 'Top scupper intake — waves wash over the crown and sea + air enter together at the surface; Solar Crown tops up the bank.',
    stageIds: ['12', '01'],
  },
  {
    id: 'THE PLUNGER CHANNEL',
    title: 'THE PLUNGER CHANNEL',
    sourceSummary: "Source: the Helix-Force Buoy Core's level/cam-triggered central air-plunger and tapered Air Accelerator Unit — Pascal ΔP = P_in − P_throat (pascals).",
    stageIds: ['02', '03'],
  },
  {
    id: 'THE THROUGH-FLOW',
    title: 'THE THROUGH-FLOW',
    sourceSummary: 'Axial-Flow Turbine (Hybrid Motor/Generator) — harvests accelerated flow in Mode A Harvest or pulses banked energy back into the water in Mode B Boost.',
    stageIds: ['04'],
  },
  {
    id: 'THE VENTURI CHANNEL',
    title: 'THE VENTURI CHANNEL',
    sourceSummary: "Source: the buoy's quad-Venturi acceleration ports → Graphene-Ion Scrub Electrodes → Halbach Magnetic Matrix → Fibonacci Helical Core with copper induction coils.",
    stageIds: ['05', '06', '07', '08'],
  },
  {
    id: 'THE RETURN',
    title: 'THE RETURN',
    sourceSummary: 'Smart-Switch Capacitor Base, High-Density Supercapacitors & Smart-Switch Power Router — armored ballast foundation carrying treated through-flow out the bottom, back to the sea.',
    stageIds: ['09', '10', '11'],
  },
];

// Exact 15-part gather list from Master Record §1.5 — NO prices anywhere.
export const GATHER_PARTS: GatherPart[] = [
  { number: 1, part: 'Hull / body shell', detail: "The buoy's pressure hull and outer skin" },
  { number: 2, part: 'Central air-plunger + weighted piston', detail: 'Piston, rod, and guide seals' },
  { number: 3, part: 'Top scuppers', detail: 'Intake grilles at the crown' },
  { number: 4, part: 'Air accelerator throat', detail: 'Tapered throat insert for the plunger path' },
  { number: 5, part: 'Pressure taps + ΔP sensor', detail: 'P_in and P_throat taps, differential sensor in Pa' },
  { number: 6, part: 'Axial-flow turbine', detail: 'Hybrid motor/generator unit' },
  { number: 7, part: 'Copper induction coils', detail: 'Harvest coils around the core chamber' },
  { number: 8, part: 'Quad-Venturi ports', detail: 'Four tapered acceleration ports' },
  { number: 9, part: 'Fibonacci helical core', detail: 'Helical insert, golden-proportion turns' },
  { number: 10, part: 'Halbach magnetic matrix', detail: 'Magnet array, field focused inward' },
  { number: 11, part: 'Graphene-ion scrub electrodes', detail: 'Electrode set for the scrub chamber' },
  { number: 12, part: 'High-density supercapacitors', detail: 'The cap bank for the base' },
  { number: 13, part: 'Smart-switch router + capacitor base', detail: 'Router board, base housing, ballast' },
  { number: 14, part: 'Solar crown panels', detail: 'Crown panels + charge feed' },
  { number: 15, part: 'Mooring / anchor fittings', detail: 'Anchor points, chain, swivel, marker light' },
];

// Technical drawing descriptions for each of the 15 parts — written as the direct basis
// for each part's 3D model, using ONLY Ray's exact labels & specified materials.
export const PART_DETAILS: Record<number, PartTechnicalSpec> = {
  1: {
    number: 1,
    part: 'Hull / body shell',
    detail: "The buoy's pressure hull and outer skin",
    stageIds: ['01', '10'],
    flowChannels: ['THE POUR', 'THE PLUNGER CHANNEL', 'THE THROUGH-FLOW', 'THE VENTURI CHANNEL', 'THE RETURN'],
    diagramLabels: [],
    bucketSheetLabels: ['Clear funnel (bucket unit)'],
    material: 'not specified in the design (bucket-unit sheet specifies "Clear funnel (bucket unit)")',
    dimensions: 'not specified in the design',
    plainLanguage:
      'The sturdy outer shell and inner tube that hold all 12 stages in one vertical column under the water.',
    technicalDescription:
      'Vertical cylindrical pressure hull and outer skin enclosing the entire 12-stage internal stack. Built in the 3D model as a concentric outer shell and inner pressure liner joined by upper, mid-chamber, and lower structural flange rings, with upper scupper reliefs and a lower seat for the Smart-Switch Capacitor Base. Shown with a cutaway inspection window matching Ray\'s pier diagram.',
    functionSummary:
      'Houses and aligns all 12 stages vertically under the waterline, isolates the outer marine skin from internal flow chambers, and seats onto the armored capacitor base.',
    motionInMachine:
      'Remains fixed and stationary—moored down by weights tied to the sea floor (does NOT bob); waves wash over the top slots while the internal pan fills and triggers.',
    subParts: [
      {
        id: 'hull-outer',
        name: 'Outer skin cylinder',
        material: 'not specified in the design',
        role: 'Primary cylindrical marine enclosure exposed to sea water',
      },
      {
        id: 'hull-inner',
        name: 'Inner pressure liner',
        material: 'not specified in the design',
        role: 'Inner bore guiding the plunger, turbine shroud, and core stack',
      },
      {
        id: 'hull-flanges',
        name: 'Upper, mid & base flange rings',
        material: 'not specified in the design',
        role: 'Structural seam rings for seal & leak check (Trial Step 2)',
      },
    ],
  },
  2: {
    number: 2,
    part: 'Central air-plunger + weighted piston',
    detail: 'Four-layer hollow-core piston (Gemini Answer 6, Nov 22) — outer shell, annular air core, sealing tube, compressor rod',
    stageIds: ['02'],
    flowChannels: ['THE PLUNGER CHANNEL'],
    diagramLabels: ['Central Air-Plunger (Weighted Piston)', 'Weighted Piston'],
    bucketSheetLabels: [],
    material: 'not specified in the design',
    dimensions: 'not specified in the design — 45 mm OD hollow center needle stem is the only diameter the documents state; wall thicknesses, annular gap, D3/t3 and materials are missing for Ray to true',
    plainLanguage:
      'A central air-filled plunger and weighted piston down the middle, built as four concentric layers: an outer stepped shell that pushes the water, a hollow ring inside it that carries high-pressure air to the jets, a sealed inner tube that keeps the working parts dry, and a central rod with the needle valve and magnets. As water fills the pan inside the stationary buoy, trapped air pushes up until a level or cam triggers the stroke, forcing air and water down through the machine.',
    technicalDescription:
      'Four-layer hollow-core piston (Gemini Answer 6, Nov 22). Layer 1: outer stepped piston barrel and crown (bore OD, seawater side) with dual U-cup polyurethane seals facing opposite directions and a sacrificial water-flushed wiper ring. Layer 2: annular hollow core — the air conduit/plenum carrying 4-6 bar injection air to the jets, no hoses. Layer 3: inner sealing tube, a hermetic bulkhead with a hard-chromed bore, isolating the dry internals (nitrogen or dielectric oil). Layer 4: central compressor rod with the needle valve (unseats at the bottom of the stroke, reseats at the top via the level/cam trigger) and the magnetic runner for the EM stator. Two modes: synchronous (rigid) or differential/telescoping (rod cycles 2-5 Hz while the buoy strokes 0.25-0.50 Hz). Mass impact (Gemini stated): Marlow 20 -> 32 kg, lift 0.215 -> 0.26 bar; Gemini 45 -> 78 kg, lift 0.109 -> 0.132 bar; lift stays well under 0.35 bar; tank sizes unchanged (50 L / 250 L). Wall thicknesses, annular gap, D3/t3, stroke coupling, materials (316L/Ti/composite) and seal specs are missing — Ray to true.',
    functionSummary:
      'Holds air force inside the stationary moored buoy while the pan fills from the top slots; when rising water hits the level/cam trigger, its triggered stroke drives the air-and-water chain reaction through the Air Accelerator Unit and out the bottom ports — the buoy\'s heartbeat. Layer 2 carries the injection air; Layer 3 keeps Layer 4 dry; Layer 4 fires the needle valve and the magnetic runner.',
    motionInMachine:
      'Inside the stationary hull, settles slightly as pan water fills, then strokes cleanly when the level/cam trigger fires—forcing high displacement pressure down into Stage 03. The four layers move together in synchronous mode; in telescoping mode the Layer 4 rod cycles faster than the shell.',
    subParts: [
      {
        id: 'piston-layer-1-outer-shell',
        name: 'Layer 1 — Outer stepped piston barrel',
        material: 'not specified in the design',
        role: 'Seawater side; stepped crown (A_water) drives water down through the venturis; dual U-cups + wiper ring',
      },
      {
        id: 'piston-layer-2-hollow-core',
        name: 'Layer 2 — Annular hollow core (air conduit)',
        material: 'not specified in the design',
        role: 'Carries 4-6 bar injection air to the jets — the hollow core IS the air path, no hoses',
      },
      {
        id: 'piston-layer-3-sealing-tube',
        name: 'Layer 3 — Inner sealing tube (dry isolation barrier)',
        material: 'Hard-chromed bore (Gemini) — Ray to true',
        role: 'Hermetic bulkhead; PTFE chevron V-packing + lantern ring; keeps Layer 4 dry (nitrogen or dielectric oil)',
      },
      {
        id: 'piston-layer-4-compressor-rod',
        name: 'Layer 4 — Central compressor rod + needle valve + magnetic runner',
        material: 'not specified in the design',
        role: 'Dry sealed internals; needle valve unseats at bottom / reseats at top; magnetic runner for the EM stator',
      },
    ],
  },
  3: {
    number: 3,
    part: 'Top scuppers',
    detail: 'Intake grilles at the crown',
    stageIds: ['01'],
    flowChannels: ['THE POUR'],
    diagramLabels: ['Central Air-Plunger top scupper Intake'],
    bucketSheetLabels: ['4x air-plunger top scuppers'],
    material: 'not specified in the design',
    dimensions: 'not specified in the design',
    plainLanguage:
      'Four screened openings around the top collar where waves wash in, letting surface water and air enter together.',
    technicalDescription:
      'Annular crown intake collar positioned just above the mean waterline, pierced by four radial scupper intake chutes spaced 90° apart. Each chute in the 3D model features a flared entry lip, debris-screening intake grille bars, and an internal curved deflector ring guiding surface water and air inward into the plunger chamber.',
    functionSummary:
      'Receives surface wave wash ("THE POUR") through the top slots so seawater fills the pan above the airtight plunger assembly.',
    motionInMachine:
      'Stationary with the fixed moored hull; waves wash over the top intake slots on each crest to fill the pan.',
    subParts: [
      {
        id: 'scupper-collar',
        name: 'Crown intake collar',
        material: 'not specified in the design',
        role: 'Structural top ring connecting hull top to Solar Crown rim',
      },
      {
        id: 'scupper-chutes',
        name: 'Four radial scupper ports & lips',
        material: 'not specified in the design',
        role: 'Channels surface wave water and entrained air inward',
      },
      {
        id: 'scupper-grilles',
        name: 'Intake grille bars',
        material: 'not specified in the design',
        role: 'Screens coarse surface debris while passing air and water',
      },
    ],
  },
  4: {
    number: 4,
    part: 'Air accelerator throat',
    detail: 'Tapered throat insert for the plunger path',
    stageIds: ['03'],
    flowChannels: ['THE PLUNGER CHANNEL'],
    diagramLabels: [],
    bucketSheetLabels: ['Air Accelerator Throat'],
    material: 'not specified in the design',
    dimensions: 'not specified in the design',
    plainLanguage:
      'A funnel-shaped narrow throat below the piston that squeezes the flow so it speeds up before hitting the turbine.',
    technicalDescription:
      'Converging-diverging axisymmetric tapered throat insert mounted directly below the plunger chamber and upstream of the Axial-Flow Turbine. Modeled via a revolved Lathe profile from wide mouth (P_in) down to a narrow Venturi constriction (P_throat) and flared exit, seated inside the hull by an outer mounting collar.',
    functionSummary:
      'Ray\'s enhancement (Stage 03): narrows the plunger path so pressure drops at the throat (ΔP = P_in − P_throat in pascals), accelerating and entraining the air-water stream onto the turbine.',
    motionInMachine:
      'Fixed insert; accelerates flow velocity quadratically as the triggered plunger stroke forces water and air downward.',
    subParts: [
      {
        id: 'throat-cone',
        name: 'Converging-diverging throat insert',
        material: 'not specified in the design',
        role: 'Narrows the flow passage from wide mouth to narrow throat',
      },
      {
        id: 'throat-collar',
        name: 'Outer seating ring',
        material: 'not specified in the design',
        role: 'Seats the throat insert coaxially inside the plunger channel',
      },
    ],
  },
  5: {
    number: 5,
    part: 'Pressure taps + ΔP sensor',
    detail: 'P_in and P_throat taps, differential sensor in Pa',
    stageIds: ['03'],
    flowChannels: ['THE PLUNGER CHANNEL'],
    diagramLabels: [],
    bucketSheetLabels: ['Air Accelerator Throat', '2 pressure taps + ΔP sensor'],
    material: 'not specified in the design',
    dimensions: 'not specified in the design',
    plainLanguage:
      'Two small pressure ports—one at the wide mouth and one at the narrow throat—plus a gauge that reads the pressure drop (ΔP) driving the flow.',
    technicalDescription:
      'Dual static pressure tap ports paired with a side-mounted differential pressure transducer housing. In the 3D model, the upper tap probe (P_in) enters at the wide mouth of the Air Accelerator Throat, the lower tap probe (P_throat) enters at the narrow constriction, and twin impulse tubes feed the differential ΔP sensor body.',
    functionSummary:
      'Measures P_in at the wide mouth and P_throat at the narrow throat to report ΔP = P_in − P_throat (pascals) — the working number for tuning the machine.',
    motionInMachine:
      'Fixed sensing manifold; live pressure differential rises and falls with each triggered plunger discharge stroke and Boost pulse.',
    subParts: [
      {
        id: 'tap-pin',
        name: 'P_in wide-mouth pressure tap',
        material: 'not specified in the design',
        role: 'Samples upstream static pressure at the wide mouth of Stage 03',
      },
      {
        id: 'tap-pth',
        name: 'P_throat narrow-throat pressure tap',
        material: 'not specified in the design',
        role: 'Samples constricted throat pressure at Stage 03',
      },
      {
        id: 'dp-sensor',
        name: 'Differential ΔP sensor housing (Pa)',
        material: 'not specified in the design',
        role: 'Reads ΔP = P_in − P_throat in pascals for router & logs',
      },
    ],
  },
  6: {
    number: 6,
    part: 'Axial-flow turbine',
    detail: 'Hybrid motor/generator unit',
    stageIds: ['04'],
    flowChannels: ['THE THROUGH-FLOW'],
    diagramLabels: ['Axial-Flow Turbine (Hybrid Motor/Generator)'],
    bucketSheetLabels: ['Axial turbine (hybrid motor/generator)'],
    material: 'not specified in the design',
    dimensions: 'not specified in the design',
    plainLanguage:
      'A spinning underwater fan at the bottom that works two ways: forced discharge water spins the turbine generator fins to harvest power, or stored power spins it in reverse for a stronger Boost pulse.',
    technicalDescription:
      'Coaxial multi-blade axial hydro-turbine housed within an outer stator shroud ring directly beneath the Air Accelerator Throat. The 3D model builds a streamlined central rotor hub, eight pitched hydrofoil blades arranged symmetrically, and an enclosing stator shroud ring.',
    functionSummary:
      'Operates as a hybrid motor/generator ("THE THROUGH-FLOW"): in Mode A Harvest the triggered port and bottom discharge spins the rotor to generate; in Mode B Boost it receives banked charge from the router to pulse back into the water.',
    motionInMachine:
      'Rotates continuously with physical rotational inertia—spinning up on triggered port/bottom discharge strokes, coasting while the pan refills, and reversing/surging during Boost pulses.',
    subParts: [
      {
        id: 'turbine-hub',
        name: 'Central rotor hub',
        material: 'not specified in the design',
        role: 'Carries the pitched blades and couples to the hybrid motor/generator winding',
      },
      {
        id: 'turbine-blades',
        name: 'Eight pitched axial blades',
        material: 'not specified in the design',
        role: 'Converts axial stream momentum to torque (and vice versa in Boost)',
      },
      {
        id: 'turbine-shroud',
        name: 'Outer stator shroud ring',
        material: 'not specified in the design',
        role: 'Confines tip flow through the swept blade annulus',
      },
    ],
  },
  7: {
    number: 7,
    part: 'Copper induction coils',
    detail: 'Harvest coils around the core chamber',
    stageIds: ['08'],
    flowChannels: ['THE VENTURI CHANNEL'],
    diagramLabels: ['Fibonacci Helical Core'],
    bucketSheetLabels: ['Copper coils (Litz string 1 + 2)', 'Litz Wire Coil Channels'],
    material: 'Copper (bucket-unit sheet labels "Copper coils (Litz string 1 + 2)" and "Litz Wire Coil Channels")',
    dimensions: 'not specified in the design',
    plainLanguage:
      'Loops of copper wire wrapped around the spinning water chamber that pick up electricity as the vortex crosses the magnetic field.',
    technicalDescription:
      'Perimeter induction winding assembly wrapping the Fibonacci Helical Core chamber inside the Halbach Magnetic Matrix. Modeled in 3D with vertical copper coil bobbins, three horizontal circumferential copper pickup rings, and dual Litz wire channel feeds ("Litz String 1+2") leading downward to the rectifier/router.',
    functionSummary:
      'Harvests electromagnetic energy ("the blue pulses in the drawing") as conductive seawater spirals down the Fibonacci Helical Core across the inward-focused Halbach magnetic field.',
    motionInMachine:
      'Stationary coils; induced voltage and blue/cyan electromagnetic pulse glow rise in phase with vortex speed and ΔP.',
    subParts: [
      {
        id: 'coil-bobbins',
        name: 'Vertical copper induction bobbins',
        material: 'Copper',
        role: 'Circumferential pickup windings surrounding the helical flow chamber',
      },
      {
        id: 'coil-rings',
        name: 'Horizontal copper pickup rings',
        material: 'Copper',
        role: 'Three-tier axial coil loops listening along the tightening helix',
      },
      {
        id: 'litz-channels',
        name: 'Litz Wire Coil Channels (String 1+2)',
        material: 'Copper (Litz wire on bucket-unit sheet)',
        role: 'Carries harvested coil output down to the Schottky rectifier / router',
      },
    ],
  },
  8: {
    number: 8,
    part: 'Quad-Venturi ports',
    detail: 'Four tapered acceleration ports',
    stageIds: ['05'],
    flowChannels: ['THE VENTURI CHANNEL'],
    diagramLabels: ['Quad-Venturi Acceleration Ports'],
    bucketSheetLabels: ['Quad-Venturi ports'],
    material: 'not specified in the design',
    dimensions: 'not specified in the design',
    plainLanguage:
      'Four angled jets that squeeze and aim the water sideways so it enters the lower chamber already spinning in a tight swirl.',
    technicalDescription:
      'Circular manifold ring carrying four tapered converging Venturi nozzles spaced 90° apart and angled tangentially inward. Each nozzle in the 3D model tapers from a wide intake bell to a focused exit tip aimed along the inner perimeter of the core chamber.',
    functionSummary:
      'Squeezes the stream a second time after the turbine, trading pressure for speed and jetting the flow into the core chamber already spinning.',
    motionInMachine:
      'Fixed manifold; imparts tangential swirl acceleration to water entering the scrub & core chamber.',
    subParts: [
      {
        id: 'venturi-ring',
        name: 'Distribution manifold ring',
        material: 'not specified in the design',
        role: 'Supports and seals the four radial ports inside the core head',
      },
      {
        id: 'venturi-nozzles',
        name: 'Four tapered Venturi nozzles',
        material: 'not specified in the design',
        role: 'Accelerates and angles jets tangentially to initiate the vortex',
      },
    ],
  },
  9: {
    number: 9,
    part: 'Fibonacci helical core',
    detail: 'Helical insert, golden-proportion turns',
    stageIds: ['08'],
    flowChannels: ['THE VENTURI CHANNEL'],
    diagramLabels: ['Fibonacci Helical Core'],
    bucketSheetLabels: ['Fibonacci Spiral Liner (helical core)', '0.2mm Riblet Texture'],
    material: 'not specified in the design',
    dimensions: '0.2mm Riblet Texture labeled on bucket-unit sheet; overall core dimensions not specified in the design',
    plainLanguage:
      'A tightening golden-proportion spiral track that funnels the spinning water faster and tighter straight down through the magnetic heart.',
    technicalDescription:
      'Tapered golden-proportion (φ) helical core insert seated coaxially inside the magnetic chamber and transparent flow sleeve. Modeled in 3D as a multi-turn logarithmic Fibonacci spiral TubeGeometry tightening downward toward the base throat, nested inside a grooved riblet liner cylinder.',
    functionSummary:
      'Guides the spinning vortex down a tightening golden-proportion spiral inside the Halbach field so conductive seawater crosses maximum flux density while copper coils harvest the pulse.',
    motionInMachine:
      'Fixed helical insert; water & ion particles spiral rapidly down its tightening turns, glowing cyan with induced field intensity.',
    subParts: [
      {
        id: 'helix-spiral',
        name: 'Golden-proportion Fibonacci spiral vane',
        material: 'not specified in the design',
        role: 'Tightens vortex radius by golden ratio from top entry to bottom exit',
      },
      {
        id: 'helix-liner',
        name: 'Spiral liner + 0.2mm Riblet Texture sleeve',
        material: 'not specified in the design',
        role: 'Outer chamber liner matching bucket-unit sheet cross-check label',
      },
    ],
  },
  10: {
    number: 10,
    part: 'Halbach magnetic matrix',
    detail: 'Magnet array, field focused inward',
    stageIds: ['07'],
    flowChannels: ['THE VENTURI CHANNEL'],
    diagramLabels: ['Halbach Magnetic Matrix'],
    bucketSheetLabels: ['24-block Halbach Matrix Cage'],
    material: 'Permanent magnet array (specific magnet grade not specified in the design)',
    dimensions: '24-block cage count from bucket-unit sheet; physical dimensions not specified in the design',
    plainLanguage:
      'A ring of 24 magnets arranged to aim all their magnetic strength inward across the spinning water while keeping the outside calm.',
    technicalDescription:
      '24-block permanent magnet stator cage encircling the Fibonacci Helical Core chamber, held by upper and lower circular retainer rings. Built in 3D as 24 discrete oriented magnet blocks arranged in a circular Halbach sequence with alternating inward-focusing polarity indicators, canceling exterior stray field and concentrating magnetic flux inward across the core.',
    functionSummary:
      'The magnetic heart: focuses its field inward onto the helical core chamber and cancels it outside so moving conductive seawater crosses the strongest possible field right where the copper coils listen.',
    motionInMachine:
      'Stationary stator ring; sustains continuous inward magnetic field across the spinning vortex.',
    subParts: [
      {
        id: 'halbach-blocks',
        name: '24-block Halbach magnet cage',
        material: 'Permanent magnet array (grade not specified in the design)',
        role: 'Rotates magnetization vector block-by-block to focus field inward',
      },
      {
        id: 'halbach-retainers',
        name: 'Upper & lower retainer rings',
        material: 'not specified in the design',
        role: 'Locks the 24 magnet blocks in circular alignment around the core',
      },
    ],
  },
  11: {
    number: 11,
    part: 'Graphene-ion scrub electrodes',
    detail: 'Electrode set for the scrub chamber',
    stageIds: ['06'],
    flowChannels: ['THE VENTURI CHANNEL'],
    diagramLabels: ['Graphene-Ion Scrub Electrodes'],
    bucketSheetLabels: ['Graphene-Ion Scrub Liner'],
    material: 'Graphene-Ion electrode / liner (substrate not specified in the design)',
    dimensions: 'not specified in the design',
    plainLanguage:
      'Electrified inner rings and liner plates that pull ions and debris out of the swirling water so it leaves cleaner than it entered.',
    technicalDescription:
      'Concentric electrode liner and inner scrub ring positioned directly below the Quad-Venturi Acceleration Ports at the head of the vortex chamber. Modeled in 3D with a cylindrical graphene-ion scrub liner sleeve, an inner concentric electrode ring, and six radial busbar ribs.',
    functionSummary:
      'Draws ions and debris out of the fast-spinning seawater stream as it enters the vortex chamber — "water enters, turns in a spiral, meets a magnetic heart, leaves cleaner than it came."',
    motionInMachine:
      'Stationary scrub stage; surface ionization glow intensifies as Venturi vortex velocity increases.',
    subParts: [
      {
        id: 'scrub-liner',
        name: 'Graphene-Ion Scrub Liner sleeve',
        material: 'Graphene-Ion',
        role: 'Outer cylindrical scrub surface contacting the spinning boundary flow',
      },
      {
        id: 'scrub-ring',
        name: 'Inner electrode ring & busbar ribs',
        material: 'Graphene-Ion + conductor ribs (alloy not specified in the design)',
        role: 'Maintains radial electric scrub field across the incoming stream',
      },
    ],
  },
  12: {
    number: 12,
    part: 'High-density supercapacitors',
    detail: 'The cap bank for the base',
    stageIds: ['09'],
    flowChannels: ['THE RETURN'],
    diagramLabels: ['High-Density Supercapacitors'],
    bucketSheetLabels: ['Supercapacitor Bank'],
    material: 'not specified in the design',
    dimensions: 'not specified in the design',
    plainLanguage:
      'A ring of fast-charging electrical storage cells in the base that soak up wave pulses and hold them ready for quick release.',
    technicalDescription:
      'Radial ring of vertical cylindrical high-density supercapacitor cells seated inside the lower capacitor base bay, interconnected by upper and lower collector bus rings and individual cell charge-level bars. Modeled in 3D as ten vertical cylindrical cells ringing the central power router.',
    functionSummary:
      'Catches the harvested induction pulses fast-in, fast-out, smoothing the sea\'s wave rhythm into stored charge ready for either steady reserve or a single Mode B Boost pulse.',
    motionInMachine:
      'Stationary storage bank; charge level bars fill pulse-by-pulse during Mode A Harvest and discharge in one pulse during Mode B Boost.',
    subParts: [
      {
        id: 'cap-cells',
        name: 'Cylindrical supercapacitor cells',
        material: 'not specified in the design',
        role: 'Stores pulse-by-pulse charge from copper coils and Solar Crown',
      },
      {
        id: 'cap-bus',
        name: 'Top & bottom collector bus rings',
        material: 'not specified in the design',
        role: 'Parallels the bank into the Smart-Switch Power Router',
      },
    ],
  },
  13: {
    number: 13,
    part: 'Smart-switch router + capacitor base',
    detail: 'Router board, base housing, ballast',
    stageIds: ['10', '11'],
    flowChannels: ['THE RETURN'],
    diagramLabels: ['Smart-Switch Capacitor Base', 'Smart-Switch Power Router'],
    bucketSheetLabels: ['Schottky Diodes', 'Schottky Rectifier Board', 'Final DC Output', 'Electronics & Cap Base'],
    material: 'not specified in the design',
    dimensions: 'not specified in the design',
    plainLanguage:
      'The heavy bottom housing that anchors the buoy upright, vents cleaned water back to the sea, converts coil pulses to DC, and switches between Harvest (store) and Boost (release).',
    technicalDescription:
      'Armored lower ballast base housing combined with the central Smart-Switch Power Router assembly. In the 3D model, the assembly separates into four clear layers in Exploded View: the armored base ring & ballast floor disk, the flared bottom through-flow discharge bell ("THE RETURN"), the Schottky Rectifier Board (with discrete Schottky diode bridge blocks and Final DC Output terminals), and the central Smart-Switch Power Router module.',
    functionSummary:
      'Armored base houses the bank and brain, ballasts the buoy upright, carries treated water out the bottom, rectifies coil pulses, and switches between Mode A Harvest (store) and Mode B Boost (release one pulse through the turbine).',
    motionInMachine:
      'Stationary armored foundation; router switches state glow cleanly from cyan (Mode A Harvest) to forged gold (Mode B Boost pulse).',
    subParts: [
      {
        id: 'base-housing',
        name: 'Armored capacitor base & ballast floor',
        material: 'not specified in the design',
        role: 'Ballasts buoy upright and protects the lower electronics & cap bank',
      },
      {
        id: 'base-nozzle',
        name: 'Flared through-flow discharge bell',
        material: 'not specified in the design',
        role: 'Carries treated water out the bottom back to the sea (THE RETURN)',
      },
      {
        id: 'rectifier-board',
        name: 'Schottky Rectifier Board & Diodes / Final DC Output',
        material: 'not specified in the design',
        role: 'Rectifies Litz coil AC pulses to DC output for the supercapacitor bank',
      },
      {
        id: 'power-router',
        name: 'Smart-Switch Power Router',
        material: 'not specified in the design',
        role: 'HELIX-MHD control brain deciding Mode A Harvest vs Mode B Boost',
      },
    ],
  },
  14: {
    number: 14,
    part: 'Solar crown panels',
    detail: 'Crown panels + charge feed',
    stageIds: ['12'],
    flowChannels: ['THE POUR'],
    diagramLabels: [],
    bucketSheetLabels: ['Solar Crown (panels)'],
    material: 'Photovoltaic panels (cell chemistry/frame material not specified in the design)',
    dimensions: 'not specified in the design',
    plainLanguage:
      'A ring of solar panels on the very top lid that trickle-charges the storage bank and keeps the beacon and router awake during flat calm seas.',
    technicalDescription:
      'Annular photovoltaic panel ring mounted atop the crown rim above the top scuppers, surrounding the central plunger rod hub and topped by a surface marker beacon. Modeled in 3D with the outer crown trim ring, segmented photovoltaic cell surface, charge-feed stem, and beacon cap.',
    functionSummary:
      'Tops up the supercapacitor bank under sun and keeps the Smart-Switch Power Router, ΔP sensors, and marker beacon alive through flat calms when the sea gives nothing.',
    motionInMachine:
      'Stationary crown cap; supplies steady trickle charge into the router bus especially visible in Calm sea states.',
    subParts: [
      {
        id: 'solar-ring',
        name: 'Annular solar PV array ring',
        material: 'Photovoltaic panels (chemistry not specified in the design)',
        role: 'Generates supplemental DC charge under sunlight',
      },
      {
        id: 'solar-feed',
        name: 'Crown rim & charge feed stem',
        material: 'not specified in the design',
        role: 'Routes top-up feed down to the Smart-Switch Power Router',
      },
      {
        id: 'solar-beacon',
        name: 'Crown marker beacon',
        material: 'not specified in the design',
        role: 'Surface visibility light kept alive during flat calms',
      },
    ],
  },
  15: {
    number: 15,
    part: 'Mooring / anchor fittings',
    detail: 'Anchor points, chain, swivel, marker light',
    stageIds: ['10', '12'],
    flowChannels: ['THE RETURN', 'THE POUR'],
    diagramLabels: [],
    bucketSheetLabels: ['Mooring/Anchor Fittings'],
    material: 'not specified in the design',
    dimensions: 'not specified in the design',
    plainLanguage:
      'The anchor loop, chain, twist-free swivel, and surface marker light that keep the buoy safely in place beside a pier or at sea.',
    technicalDescription:
      'Station-keeping hardware set consisting of hull/base anchor padeye lugs, forged anchor shackle, linked mooring chain, inline anti-twist swivel, and surface marker light assembly. Built in the 3D model as a connected vertical mooring line assembly with articulated chain links, rotating swivel barrel, shackle pin, and crown marker lantern.',
    functionSummary:
      'Holds the buoy upright on station beside the pier or sea mooring while allowing free rotation via the swivel (Trial Step 10) and maintaining surface visibility via the marker light.',
    motionInMachine:
      'Seafloor mooring weights and taut anchor lines hold the buoy stationary so it does not bob, while the swivel relieves current twist.',
    subParts: [
      {
        id: 'mooring-lugs',
        name: 'Anchor points & shackle',
        material: 'not specified in the design',
        role: 'Structural tie-in points on the lower hull / capacitor base',
      },
      {
        id: 'mooring-chain',
        name: 'Mooring chain & inline swivel',
        material: 'not specified in the design',
        role: 'Prevents cable twist during tidal current shifts (Trial Step 10)',
      },
      {
        id: 'mooring-light',
        name: 'Marker light housing',
        material: 'not specified in the design',
        role: 'Surface beacon verified during deployment check',
      },
    ],
  },
};

// Featured Core Mechanism: Air Plunger — Center Needle (NOT Part 16; preserves the 15-part list 01..15)
export const AIR_PLUNGER_CENTER_NEEDLE: PartTechnicalSpec & { badgeLabel: string } = {
  number: 0,
  badgeLabel: 'FEATURED CORE MECHANISM · CENTER NEEDLE',
  part: 'Air Plunger — Center Needle',
  detail: 'Slim air-filled needle plunger running down the exact center axis, with adjustable air tank & level/cam trigger',
  stageIds: ['01', '02', '03', '04', '08', '10'],
  flowChannels: ['THE POUR', 'THE PLUNGER CHANNEL', 'THE THROUGH-FLOW', 'THE VENTURI CHANNEL', 'THE RETURN'],
  diagramLabels: ['Central Air-Plunger (Weighted Piston)', 'Central Air-Plunger top scupper Intake'],
  bucketSheetLabels: ['Weighted Piston', 'Air Accelerator Throat', 'Electronics & Cap Base'],
  material: 'not specified in the design',
  dimensions: 'not specified in the design (see separate 2,000 W Target Sizing calculations below for review)',
  plainLanguage:
    'A long, slim, air-filled needle running straight down the center of a stationary seafloor-moored buoy. As seawater pours into the top slots and fills the pan/body, trapped air tries to force upward until a level/cam trigger trips—releasing a chain reaction of air pressure that seals the plunger airtight and blasts the water out the ports and bottom to spin the turbine generator fins.',
  technicalDescription:
    'Full-length coaxial needle-like air-filled plunger extending vertically down the center datum from the adjustable top air tank through the upper pan/scupper chamber, weighted piston & airtight seal collar, Air Accelerator throat, Axial-Flow Turbine hub, Fibonacci Helical Core bore, and bottom discharge throat. Equipped with an adjustable plunger setting collar ("Air Tank Plunger — Adjustable"), a level/cam trigger latch actuated by rising internal water level, and an over-energize pneumatic displacement mode measured in bars.',
  functionSummary:
    'The center of the entire idea: converts rising pan water fill inside a stationary moored buoy into a triggered pneumatic-hydraulic chain reaction—driving high displacement pressure difference (bar) through the ports and bottom discharge with airtight sealing against magnetic coils and solid-state magnetic resistance.',
  motionInMachine:
    'While the hull stays anchored stationary to seafloor weights (zero bobbing), rising pan water trips the level/cam trigger; air forces the center needle plunger up/through its triggered stroke, releasing a high-velocity bottom port discharge that spins the turbine generator fins.',
  subParts: [
    {
      id: 'needle-shaft',
      name: 'Air-filled center needle plunger stem',
      material: 'not specified in the design',
      role: 'Slim central pneumatic needle running top-to-bottom along the buoy axis',
    },
    {
      id: 'needle-air-tank',
      name: 'Adjustable air tank plunger chamber',
      material: 'not specified in the design',
      role: 'Stores & adjusts pre-charge air force ("Air Tank Plunger — Adjustable" & Over-Energize)',
    },
    {
      id: 'needle-seal',
      name: 'Airtight plunger seal & guide collar',
      material: 'not specified in the design',
      role: 'Seals the chamber airtight so pressurized displacement forces flow out the ports & bottom',
    },
    {
      id: 'needle-cam',
      name: 'Level / cam trigger arm & float latch',
      material: 'not specified in the design',
      role: 'Trips mechanically when rising pan water hits the set fill level, firing the chain reaction',
    },
  ],
};

export const OPERATING_PRINCIPLE_STEPS: OperatingPrincipleStep[] = [
  {
    step: 1,
    title: 'Stationary Moored Buoy (Does Not Bob)',
    plainLanguage: 'The buoy is moored in place; it does not bob. Operation: Stationary, moored buoy. Seafloor weights hold it steady while waves wash over the top slots.',
    technicalDetail: 'Station-keeping deadweight mooring anchors the hull vertically to the seabed; tide and swell change intake fill rate only, never hull heave.',
  },
  {
    step: 2,
    title: 'Water In Top Slots → Pan / Body Fills',
    plainLanguage: 'Ocean water pours in through the top scupper slots and steadily fills the inner pan and upper body.',
    technicalDetail: 'Top scupper intake slots ("THE POUR") admit seawater into the sealed pan chamber above the central plunger assembly.',
  },
  {
    step: 3,
    title: 'Trapped Air Forces Up → Level / Cam Trigger Trips',
    plainLanguage: 'As the pan fills, trapped air pushes upward until water hits a trigger lever or cam that snaps the latch open.',
    technicalDetail: 'Rising water level compresses air around the center needle plunger until `waterLevel` reaches the adjustable `triggerThreshold`, tripping the mechanical level/cam release.',
  },
  {
    step: 4,
    title: 'Air Tank Underneath the Unit (Return-Stroke Driver) & Chain Reaction',
    plainLanguage: 'An air tank underneath the unit feeds a riser pipe up to the piston — "That\'s what drives the piston up" on the return stroke (Return stroke — drives the piston up). With the airtight seal locked, the plunger fires the displacement jump (bars).',
    technicalDetail: 'Air Tank — Underneath the Unit supplies the return stroke that drives the piston / Air Plunger — Center Needle back up (size, volume, pressure & dimensions: not specified in the design); Over-Energize & adjustable setting govern simulation displacement difference (bar / Pa).',
  },
  {
    step: 5,
    title: 'Ports & Bottom Jet Spin Turbine Generator Fins',
    plainLanguage: 'Water shoots out the angled ports and straight out the bottom, spinning the underwater turbine fan blades.',
    technicalDetail: 'High-velocity discharge jets spin the Axial-Flow Turbine generator fins ("THE THROUGH-FLOW") and spiral down the Fibonacci Helical Core out the bottom ("THE RETURN").',
  },
  {
    step: 6,
    title: 'Magnetic Coils + Solid-State Magnetic Resistance → 2,000 W Target',
    plainLanguage: 'Copper coils inside the magnet ring harvest electricity against solid-state magnetic control, charging the supercapacitors toward the 2,000 W target.',
    technicalDetail: '24-block Halbach matrix + copper Litz coils with solid-state magnetic resistance load transfer pulse power through the Smart-Switch Power Router into High-Density Supercapacitors (`TARGET: 2,000 W — NOT MEASURED`).',
  },
];

// Calculated Engineering Sizing for 2,000 W Target — NOT Ray's specified dimensions and NOT measured values.
export const SIZING_2KW_ROWS: SizingCalculationRow[] = [
  {
    id: 'size-plunger',
    element: 'Plunger Bore, Stroke & Air Plunger — Center Needle',
    relatedParts: 'Part 02 · Center Needle',
    calculatedSize: '450 mm bore × 650 mm stroke (0.103 m³ swept); 45 mm OD hollow center needle stem',
    assumptions: '4.0 s wave/fill cycle, 40% active discharge duty (1.6 s pulse), 50% total water-to-wire efficiency (4,000 W avg / 10,000 W pulse hydraulic input at 1.6 bar eff. ΔP).',
    engineeringBasis: 'At 1.6 bar (160 kPa) effective ΔP and 62.5 L/s pulse discharge over 1.6 s, swept volume is 0.100 m³: π×(0.225 m)²×0.65 m = 0.103 m³.',
  },
  {
    id: 'size-airtank',
    element: 'Adjustable Air Tank Volume & Operating Pressure',
    relatedParts: 'Center Needle · Stage 02/03',
    calculatedSize: '250 L (0.25 m³) internal air reservoir; 1.5–3.0 bar nominal / up to 5.0–7.0 bar Over-Energized',
    assumptions: 'Limits adiabatic pressure drop across the 0.103 m³ displacement stroke to ≤ 35% without starving end-of-stroke discharge velocity.',
    engineeringBasis: 'Receiver-to-displacement volume ratio ~2.4:1 maintains pneumatic push force through the level/cam trigger stroke.',
  },
  {
    id: 'size-ports',
    element: 'Top Scupper Slots, Air Accelerator Throat & Quad-Venturi Ports',
    relatedParts: 'Parts 03, 04, 08',
    calculatedSize: '4 top slots @ 150 × 70 mm (420 cm²); Accelerator throat 220 mm → 110 mm; 4 Quad-Venturi ports 65 mm → 35 mm exit throat',
    assumptions: '1.0 m/s gravity pan-fill inflow across 2.4 s refill window; discharge coefficient C_d = 0.90; seawater ρ = 1,025 kg/m³ yielding ~15.9 m/s Venturi jet at 1.6 bar.',
    engineeringBasis: 'Total 4-port exit area 38.5 cm² passes 62.5 L/s peak discharge while converting static displacement pressure into tangential vortex swirl.',
  },
  {
    id: 'size-turbine',
    element: 'Axial-Flow Turbine Diameter & Blades (Out Bottom)',
    relatedParts: 'Part 06 · Stage 04',
    calculatedSize: '280 mm rotor OD, 95 mm hub diameter, 8 hydrofoil blades (28°–34° pitch), ~650–950 RPM pulse speed',
    assumptions: '82% hydraulic-to-shaft turbine efficiency at 62.5 L/s peak pulse flow; reversible pitch/geometry for Mode B Boost.',
    engineeringBasis: 'Annular swept area 0.0545 m² matches 1.15–3.5 m/s through-flow velocity without cavitation at 2 m submerged draft.',
  },
  {
    id: 'size-coils-magnets',
    element: 'Copper Coils, 24-Block Halbach Matrix & Solid-State Magnetic Resistance',
    relatedParts: 'Parts 07, 10, 11',
    calculatedSize: 'Halbach cage 290 mm ID × 360 mm OD × 220 mm stack; 6 copper bobbins + 3 Litz rings (~120 turns, 10 AWG eq. Litz); 48 V DC solid-state load control',
    assumptions: 'N52 permanent magnets (~0.95–1.1 T inward radial flux); 81% generator + Schottky rectifier + solid-state magnetic damping efficiency.',
    engineeringBasis: '48 V nominal bus delivers ~42 A average (up to 105 A peak pulse) at 2,000 W target without excessive I²R copper heating.',
  },
  {
    id: 'size-hull-mooring',
    element: 'Stationary Hull / Body Dimensions & Seafloor Mooring Weights',
    relatedParts: 'Parts 01, 15 · Stage 10',
    calculatedSize: '850 mm outer hull diameter × 2,800 mm overall height (2,200 mm submerged draft, 600 mm freeboard); ≥ 1,800 kg total ballast + seafloor mooring weights',
    assumptions: 'Fully stationary buoy (zero wave bobbing) under 2.0 m swell; submerged displaced volume ~1.25 m³ (~1,280 kg seawater buoyancy force).',
    engineeringBasis: '1,800 kg combined base ballast and seafloor anchor deadweight gives > 1.4× anti-lift safety margin so waves wash over top slots rather than lifting the hull.',
  },
  {
    id: 'size-caps-router',
    element: 'Supercapacitor Bank, Schottky Rectifier & Smart-Switch Router',
    relatedParts: 'Parts 12, 13 · Stages 09–11',
    calculatedSize: '165 F @ 48 V supercapacitor bank (~190 kJ usable); Schottky bridge ≥ 120 A cont. / 200 A surge; solid-state MOSFET power router',
    assumptions: 'Smooths 1.6 s / 5 kW pulse into steady 2,000 W continuous target output with < 10% DC bus ripple and up to ~90 s Boost reserve.',
    engineeringBasis: 'Stored pulse energy per 4 s wave is ~8 kJ; 165 F at 48 V holds > 20 wave cycles of ride-through buffer.',
  },
];

// Exact 11-step trial protocol from Master Record §1.6.
export const TRIAL_PROTOCOL: TrialStep[] = [
  { number: 1, step: 'Dry assembly', detail: 'Full stack together on the bench, no water' },
  { number: 2, step: 'Seal & leak test', detail: 'Every seam checked before she floats' },
  { number: 3, step: 'Float test (tank)', detail: 'Trim and ballast — she should ride upright and true' },
  { number: 4, step: 'Plunger stroke check', detail: 'Full travel, smooth, no binding' },
  { number: 5, step: 'Vortex spin-up', detail: 'Log flow and ΔP as the spiral forms' },
  { number: 6, step: 'Coil output logging', detail: 'Peak volts off the induction coils' },
  { number: 7, step: 'Water in / out sampling', detail: 'TDS at the intake and at the outflow' },
  { number: 8, step: 'Cap-bank charge', detail: 'Time the bank to full in Harvest' },
  { number: 9, step: 'Timed Boost release', detail: 'One pulse through the router — time it' },
  { number: 10, step: 'Mooring / deployment check', detail: 'Anchor set, swivel free, light on' },
  { number: 11, step: 'Sign the log', detail: 'Date it, sign it — the session becomes evidence' },
];

export const TIDE_PRESETS: Record<TideLevel, TidePreset> = {
  Calm: {
    id: 'Calm',
    label: 'Calm',
    intensity: 0.30,
    waveFrequency: 0.85,
    strokeAmplitude: 0.22,
    description: 'Slow top-slot pan fill (hull stays stationary moored); Solar Crown maintains router & beacon',
  },
  Moderate: {
    id: 'Moderate',
    label: 'Moderate',
    intensity: 0.56,
    waveFrequency: 1.25,
    strokeAmplitude: 0.36,
    description: 'Steady pan fill into stationary buoy; rhythmic level/cam trigger & bottom port discharge',
  },
  Swell: {
    id: 'Swell',
    label: 'Swell',
    intensity: 0.82,
    waveFrequency: 1.65,
    strokeAmplitude: 0.52,
    description: 'Rapid pan fill & frequent cam trips; high port discharge velocity spinning turbine generator fins',
  },
  Heavy: {
    id: 'Heavy',
    label: 'Heavy',
    intensity: 1.0,
    waveFrequency: 2.05,
    strokeAmplitude: 0.68,
    description: 'Maximum top-slot fill rate into stationary buoy; rapid plunger chain reaction & peak discharge',
  },
};

/* ------------------------------------------------------------------ */
/* Dual sizing envelopes — Gemini spec File 2 (Nov 22 evaluation)     */
/* Ported verbatim from Marlow's verified build                        */
/* (marlow-buoy-build-20261122/src/data/rayDesignData.ts). Both        */
/* envelopes size the SAME machine for the SAME 2,000 W TARGET and     */
/* they disagree. Keep both. Never merge them. Default: unresolved.   */
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

// Gemini fix spec (Nov 22, 9:10 PM) File 1 — coil electro-physics +
// circuitry parameters. Resistances are ESTIMATES flagged for Ray to true;
// nothing here is measured data.
export const COIL_ELECTRICAL_DATA = {
  conductivityCopperSm: 5.96e7,
  conductivitySeawaterSm: 4.8,
  resistivityCopperOhmM: 1.68e-8,
  envelopeA: {
    conductor: '2.5 mm² copper solid',
    turnsPerPhase: 48,
    phases: 3,
    resistanceEstimateOhm: 0.18, // For Ray to true
  },
  envelopeB: {
    conductor: '10 AWG equivalent Litz wire',
    turnsPerPhase: 120,
    phases: 3,
    resistanceEstimateOhm: 0.08, // For Ray to true
  },
  // Live induced peak EMF readout from the spec (Envelope A); B is flagged
  // as missing frequency in the spec — not derived here.
  inducedPeakEmfVoltsA: 63.9,
};

export const CIRCUITRY_DATA = {
  supercapacitorBank: '165 F @ 48 V (190 kJ usable)',
  supercapacitorFarads: 165,
  supercapacitorVolts: 48,
  usableEnergyKJ: 190,
  rectifier: 'Schottky Diode Bridge (120 A cont. / 200 A surge)',
  rectifierForwardDropV: 0.38,
  routerTopology: 'Four-Quadrant Bi-directional H-Bridge MOSFET',
  busVoltageV: 48,
  targetCurrentA: 41.67, // Envelope A
  targetCurrentB: 42.0, // Envelope B
  boostReserveSeconds: 90,
  requiredEnergyPerShotKJA: 10.0,
  requiredEnergyPerShotKJB: 16.5,
};


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
    note: "Gemini's own two accounts order the upstroke differently. Marlow's build implemented the Nov 22 order; the REAL app machine keeps its Nov 20 order (FILLING -> TRIGGERED -> DISCHARGE -> FILLING). Gemini's corrected spec (real-code verification) asks to integrate FILLING -> DISCHARGE -> RESET; reconciled as: TRIGGERED = cam snap transition, DISCHARGE -> FILLING return = RESET (see PHASE_ORDER_NOTE). The real stepSimulation() is patched, not replaced. SETTLED by the app export (Nov 22): the real stepSimulation runs FILLING → TRIGGERED → DISCHARGE → FILLING; TRIGGERED is the cam snap / air-fire transition and the return to FILLING is the reset. The real machine is kept intact — see PHASE_ORDER_NOTE.",
  },
  {
    topic: "Flow-path order — turbine vs venturis",
    envelopeA: "Master stage order: turbine (04) then venturis (05)",
    envelopeB: "Nov 22 flow path reads venturis → turbine exhaust; Nov 20 calls the turbine 'out bottom'",
    note: "Clarification item, not a hard conflict: does the turbine sit above the venturis (master stage order) or below them? The schematic keeps the master stage order and flags the question.",
  },
];


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
  "Tide preset fill-rate multipliers: PRESENT in the exported app's rayDesignData.ts (Calm 0.30 / Moderate 0.56 / Swell 0.82 / Heavy 1.00 intensity; waveFrequency 0.85-2.05). The VALUES are the app's own and still for Ray to true as design numbers.",
  "Level/cam trigger threshold: the exported app computes it from the plunger setting \u2014 0.52 + (plungerAdj \u2212 0.5) \u00d7 0.34, i.e. 0.56..0.88 fill level. The FORMULA is the app's own; the trip level itself is still not specified in the design documents \u2014 Ray to true.",
  "Upstroke duration: not specified. The exported app has no fixed upstroke duration \u2014 the piston returns on spring dynamics (stiffness 26.0 fired / 10.0 filling) \u2014 so the duration is emergent, not specified.",
  "2,000 W target: TARGET ONLY — NOT MEASURED. Kept explicitly labelled as target.",
];

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
/* Gemini spec File 2 — four-layer piston, flow-derived tank sizing,   */
/* EM energy balance, verified findings, phase-order note (Nov 22)     */
/* ------------------------------------------------------------------ */

/**
 * Four-layer hollow-core piston — Gemini's Answer 6 (Nov 22, 7:25 PM).
 * The 45 mm OD hollow center needle stem is the only diameter the
 * documents state; wall thicknesses, annular gap, D3/t3 and materials
 * are MISSING (see MISSING_FOR_RAY) — Ray to true.
 */
export const FOUR_LAYER_PISTON = {
  source: "Gemini Answer 6 (Nov 22, 7:25 PM) — four-layer hollow-core piston",
  layers: [
    {
      id: "piston-layer-1-outer-shell",
      layer: 1,
      name: "Outer stepped piston barrel (stepped crown)",
      role: "Seawater side; larger upper crown (A_water) drives water down through the venturis.",
      material: "Not specified in the design (316L / Ti / composite suggested by Gemini — Ray to true)",
      seals: "Dual U-cup polyurethane seals facing opposite directions + sacrificial water-flushed wiper ring above the top seal.",
    },
    {
      id: "piston-layer-2-hollow-core",
      layer: 2,
      name: "Annular hollow core (air conduit / plenum)",
      role: "Carries high-pressure injection air (4-6 bar) to the jets — no hoses. The hollow core IS the air path.",
      material: "Not specified in the design",
      seals: "Static O-ring / weld at the bulkhead (Layer 3 boundary).",
    },
    {
      id: "piston-layer-3-sealing-tube",
      layer: 3,
      name: "Inner sealing tube (dry isolation barrier)",
      role: "Hermetic bulkhead isolating the dry Layer 4 internals from the wet/air sides; hard-chromed bore guides the rod.",
      material: "Hard-chromed bore (Gemini) — Ray to true",
      seals: "PTFE chevron V-packing + lantern ring; Layer 4 isolated with nitrogen or dielectric oil.",
    },
    {
      id: "piston-layer-4-compressor-rod",
      layer: 4,
      name: "Central compressor rod + needle valve + magnetic runner",
      role: "Dry, sealed internals: compressor rod, needle valve (unseats at bottom of stroke, reseats at top via level/cam trigger), magnetic runner for the EM stator.",
      material: "Not specified in the design",
      seals: "Sealed inside the Layer 3 tube; two modes — synchronous (rigid) or differential/telescoping (rod cycles 2-5 Hz while the buoy strokes 0.25-0.50 Hz).",
    },
  ],
  massImpact: {
    note: "Gemini's stated mass impact (A6) — her numbers, not measurements.",
    envelopeA: "Piston 20 kg -> 32 kg (+60%); lift pressure 0.215 -> 0.26 bar; water 25.4 -> 23.5 L.",
    envelopeB: "Piston 45 kg -> 78 kg (+73%); lift pressure 0.109 -> 0.132 bar; water 103.4 -> 99.2 L.",
    liftStillUnder: "Lift pressure stays well under 0.35 bar in both envelopes after the four-layer mass.",
    tankUnchanged: "Tank sizes unchanged (50 L / 250 L) with 5-7% extra droop margin.",
  },
  missing: [
    "Wall thicknesses, annular gap, D3/t3, D4 (45 mm hollow stem noted)",
    "Stroke coupling (synchronous vs telescoping)",
    "Materials (316L / Ti / composite)",
    "Seal specifications",
  ],
};

/**
 * Flow-derived tank sizing — Gemini's Answer 5 (Nov 22, 7:22 PM) and
 * the Nov 22 evaluation. Rule: V_tank,pneumatic >= 4.0 x V_air,pulse
 * (droop <= 25%); receiver ratio >= 1.5-2.4x stroke volume. Picking
 * the bore dictates the tank. NOTE on the B nominal: Gemini's
 * evaluation shorthand says "250 L @ 2.5 bar"; her sizing doc states
 * the range 1.5-3.0 bar, and ENVELOPE_B uses the 2.25 bar midpoint.
 */
export const FLOW_DERIVED_TANK_SIZING = {
  source: "Gemini Answer 5 (Nov 22, 7:22 PM) + Nov 22 evaluation",
  rule: "V_tank,pneumatic >= 4.0 x V_air,pulse (droop <= 25%); receiver ratio >= 1.5-2.4x stroke volume.",
  envelopeA: "180 mm bore -> 50 L @ 4.0 bar; 4 ports, 12.8 mm throats (510 mm2); 4x 3.0 mm micro-taps at 30 deg; jet velocity 24 m/s; pulse 1.0 s.",
  envelopeB: "450 mm bore -> 250 L @ 2.25 bar midpoint (CORRECTED spec, Nov 22 real-code verification; her A5 sizing shorthand said 2.5 bar — difference flagged, Ray has not trued it; doc range 1.5-3.0 bar); 4 ports, 35.0 mm throats (3,850 mm2); 4x 3.0 mm micro-taps at 30 deg; jet velocity 16 m/s; pulse 1.6 s.",
  emCompensation: "Tank supplies 75-80% of the shot; EM stator trims 20-25% to flat-top the pressure. Required peak EM thrust 2.55 kN (A) / 7.95 kN (B). Anti-backflow closes injection if the tank is within 0.2 bar of the throat.",
};

/**
 * EM energy balance — Gemini's Nov 22 evaluation, Answer 1(b) finding 4.
 * Documented data, NOT live telemetry: the real stepSimulation has no
 * EM pulse-energy variable, so the deficit is carried as a stated
 * balance, not a simulated field.
 */
export const EM_ENERGY_BALANCE = {
  source: "Gemini Nov 22 evaluation, Answer 1(b) finding 4 (CONFIRMED)",
  spentJ: 2000,
  spentNote: "4 pulses x 500 J",
  returnedJ: 1200,
  returnedNote: "2,000 J x 60% return fraction",
  netJ: -800,
  buildMeasuredNetJ: -801,
  buildNote: "Marlow's build measured 2,002 J spent / 1,201 J returned over 2 cycles = -801 J; the 1 J difference from Gemini's -800 J is rounding.",
  verdict: "Pulsed electromagnetic coils cannot create free energy in a closed loop. They must capture wave momentum or phase-latch the stroke, not continuously repel without wave assist. Round-trip loop efficiency <= 28%.",
};

/**
 * The four verified build findings — Gemini's Nov 22 evaluation,
 * Answer 1(b). All four CONFIRMED.
 */
export const BUILD_FINDINGS = [
  {
    id: "cycle-rate-mismatch",
    title: "Cycle-rate mismatch (sequential batching limits frequency to ~0.17 Hz)",
    status: "CONFIRMED (Critical)",
    detail: "Sequential phases reach 0.167 Hz (A) / 0.177 Hz (B) against the stated 0.50 / 0.25 Hz. A: fill 2.00 s + discharge 2.00 s + reset 2.00 s = 6.00 s. B: fill 2.4 s + discharge 1.6 s + reset ~1.65 s = 5.65 s. To go faster the scuppers must be bigger or the upstroke pneumatically accelerated.",
  },
  {
    id: "plenum-over-pressure",
    title: "Envelope A plenum over-pressure (Boyle compression spikes the 50 L tank to 9.2 bar)",
    status: "CONFIRMED (Critical)",
    detail: "25 L stroke into a 50 L tank pre-charged to 4.0 bar gauge hits 9.20 bar gauge isothermal (12.5 bar adiabatic), over the 6.0 bar ceiling. Fix for Ray: enlarge the tank to ~75-80 L, shorten the stroke, or vent air into the water jets on the downstroke.",
  },
  {
    id: "envelope-b-3pct-delta",
    title: "3% swept-volume delta in Envelope B (100 L vs 103.4 L)",
    status: "CONFIRMED (Minor)",
    detail: "62.5 L/s x 1.6 s = 100.0 L for the power math vs 103.38 L geometric swept volume (450 mm x 650 mm). Use 100 L for the power chain so the 2,000 W target lands cleanly; flag the 3.4 L (3.3%) displacement buffer.",
  },
  {
    id: "em-energy-deficit",
    title: "EM energy deficit (-801 J over 2 cycles without wave capture)",
    status: "CONFIRMED (Governing)",
    detail: "Spent 2,000 J (4 x 500 J pulses), recovered 1,200 J (60%) — net -800 J (build measured -801 J). Coils capture wave momentum / phase-latch; they cannot make free energy.",
  },
];

/**
 * PHASE-ORDER NOTE — the one place the spec and the real file differ,
 * settled in favour of the REAL file (see report).
 * Real exported machine: FILLING -> TRIGGERED -> DISCHARGE -> FILLING
 * (Nov 20 order: trigger -> air forces the plunger UP -> discharge).
 * Gemini's spec order: FILLING -> DISCHARGE -> RESET (Nov 22 order).
 * Mapping, kept in the code and the UI: TRIGGERED is the cam snap /
 * air-fire transition between FILLING and DISCHARGE; the return to
 * FILLING after DISCHARGE is the RESET (air-fired upstroke + refill).
 * The real stepSimulation() is NOT rewritten — it is documented, and
 * the guards are computed on top of it. Needs Gemini to confirm or
 * correct the mapping; needs Ray to true the phase order if he wants
 * the Nov 22 order instead.
 */
export const PHASE_ORDER_NOTE =
  "Real machine (exported app code): FILLING -> TRIGGERED -> DISCHARGE -> FILLING. " +
  "Gemini Answer 1 order: FILLING -> DISCHARGE -> RESET. Gemini corrected spec (Nov 22, real-code " +
  "verification): integrate FILLING -> DISCHARGE -> RESET into stepSimulation. Reconciliation, kept in " +
  "the code: TRIGGERED is the cam snap / air-fire transition between FILLING and DISCHARGE, and the " +
  "DISCHARGE -> FILLING return IS the RESET (air-fired upstroke + refill, detected live as cycle " +
  "completion). The real stepSimulation() function is NOT replaced — replacing it with a new phase " +
  "machine would break the Boost mode, the spring dynamics, and the three workspace tabs that depend " +
  "on the real SimTelemetry/triggerPhase interface. Mapping flagged for Gemini to confirm and Ray to true.";

export const SIMULATION_LABEL = "SIMULATION READOUTS — NOT MEASURED DATA";

export const ENVELOPE_SELECTOR_PAUSED_MESSAGE =
  "SIMULATOR PAUSED — Select Envelope A or Envelope B to simulate. Ray must true the baseline bore.";

/* ------------------------------------------------------------------ */
/* Corrected-spec Files 4-6 reconciliation (Nov 22 real-code check):    */
/* the tidal-flow / wave / piston-stroke / power / RPM / drag /          */
/* buoyancy constants in THIS file ARE the real app's values — they     */
/* are the authority and are NOT rewritten. The envelope model sits     */
/* alongside as reference: stroke lengths 1.00 m (A) / 0.65 m (B) and   */
/* tank volumes 50 L (A) / 250 L (B) live in ENVELOPE_A / ENVELOPE_B;   */
/* the dual-envelope power chains live in headlinePowerChain(); the     */
/* live turbine RPM is already driven by discharge flow (confirmed, no  */
/* idle clock) and the live power math stays the app's own. Any         */
/* retuning of the app's constants to the envelopes needs Ray's word.   */
/* ------------------------------------------------------------------ */

/**
 * Phase order — REAL machine kept intact (see PHASE_ORDER_NOTE):
 * FILLING -> TRIGGERED -> DISCHARGE -> FILLING. TRIGGERED is the cam
 * snap / air-fire transition; the return to FILLING is the RESET.
 * Gemini's spec order (FILLING -> DISCHARGE -> RESET) maps onto it;
 * the mapping is flagged for Gemini to confirm and Ray to true.
 * Guards computed on top of the real machine: emergent cycle rate,
 * plenum Boyle guard (full-stroke, isothermal), sizing-paradox flag, and
 * the valve-state machine (flapper / foot valve / needle / accumulator).
 * The envelope comes from controls.envelope (default 'unresolved');
 * unresolved leaves the plenum guard null and pauses the physics.
 */
export function stepSimulation(
  prev: SimTelemetry,
  tide: TideLevel,
  dt: number,
  paused: boolean,
  controls: SimControls = { plungerSetting: 1.0, overEnergize: false }
): SimTelemetry {
  if (paused) return prev;
  // Refusal guard (Gemini corrected spec File 2): with no envelope chosen
  // the physics pauses and the unresolved-selection warning is raised.
  // The app also blocks its sim loop while unresolved (App.tsx) — this
  // branch is the sim-level guard, verified by the sim-check script.
  if ((controls.envelope ?? 'unresolved') === 'unresolved') {
    return { ...prev, warnings: [ENVELOPE_SELECTOR_PAUSED_MESSAGE] };
  }
  const preset = TIDE_PRESETS[tide];
  const clampedDt = Math.min(dt, 0.08);
  const plungerAdj = Math.max(0.5, Math.min(1.5, controls.plungerSetting));
  const overMult = controls.overEnergize ? 2.65 : 1.0;

  // Sea waves keep moving visually while the moored buoy hull itself stays 100% stationary
  const omega = preset.waveFrequency * Math.PI * 1.2;
  const nextPhase = prev.phase + clampedDt * omega;
  const primaryWave = Math.sin(nextPhase);
  const secondarySwell = 0.18 * Math.sin(nextPhase * 0.57 + 0.8);
  const waveElevation = Math.max(-1, Math.min(1, (primaryWave + secondarySwell) / 1.18));

  // Adjustable Air Tank Plunger sets the level/cam trigger fill height (0.56 .. 0.88)
  const triggerThreshold = Number((0.52 + (plungerAdj - 0.5) * 0.34).toFixed(2));

  let nextWaterLevel = prev.waterLevel;
  let nextTriggerPhase: TriggerPhase = prev.triggerPhase;
  let nextDischargePulse = prev.dischargePulse;
  let nextCamAngle = prev.camAngle;

  // Water enters top slots at a rate governed ONLY by Tide (never hull heave)
  const tideFillRate = (0.14 + preset.intensity * 0.34) * (0.85 + Math.max(0, waveElevation) * 0.3);

  if (prev.triggerPhase === 'FILLING') {
    nextWaterLevel = Math.min(1, prev.waterLevel + tideFillRate * clampedDt);
    nextDischargePulse = Math.max(0, prev.dischargePulse - clampedDt * 2.4);
    nextCamAngle = THREE_DAMP(prev.camAngle, Math.max(0, (nextWaterLevel / triggerThreshold) * 0.35), 6, clampedDt);

    if (nextWaterLevel >= triggerThreshold) {
      // Water hits level/cam trigger -> air forces center needle plunger up -> chain reaction begins
      nextTriggerPhase = 'TRIGGERED';
      nextDischargePulse = 1.0;
      nextCamAngle = 1.0;
    }
  } else if (prev.triggerPhase === 'TRIGGERED') {
    // Peak cam snap & airtight seal pressurization (~0.25s peak before sustained port/bottom blast)
    nextDischargePulse = Math.min(1.25, prev.dischargePulse + clampedDt * 1.6);
    nextWaterLevel = Math.max(0.14, prev.waterLevel - clampedDt * 0.42);
    nextCamAngle = 1.0;
    if (nextWaterLevel <= triggerThreshold - 0.08) {
      nextTriggerPhase = 'DISCHARGE';
    }
  } else {
    // DISCHARGE: chain reaction blasts water out the ports and bottom until pan drains to reset level
    const drainRate = (0.48 + plungerAdj * 0.28) * (controls.overEnergize ? 1.25 : 1.0);
    nextWaterLevel = Math.max(0.12, prev.waterLevel - drainRate * clampedDt);
    const remainingRatio = Math.max(0, (nextWaterLevel - 0.12) / Math.max(0.2, triggerThreshold - 0.12));
    nextDischargePulse = Math.max(0.15, Math.sin(remainingRatio * Math.PI * 0.7 + 0.2));
    nextCamAngle = THREE_DAMP(prev.camAngle, remainingRatio * 0.85, 8, clampedDt);

    if (nextWaterLevel <= 0.13) {
      nextTriggerPhase = 'FILLING';
      nextDischargePulse = 0.08;
    }
  }

  const triggerFired = nextTriggerPhase !== 'FILLING';

  // Center Needle + Weighted Piston target: creeps down subtly during fill, then air forces plunger UP cleanly when triggered
  const fillWeightSag = -0.18 * nextWaterLevel;
  const airUpstroke = nextTriggerPhase === 'FILLING' ? 0 : (0.55 + plungerAdj * 0.35) * nextDischargePulse;
  const targetPiston = fillWeightSag + airUpstroke;

  const springStiffness = triggerFired ? 26.0 : 10.0;
  const damping = triggerFired ? 6.2 : 5.4;
  const accel =
    (targetPiston - prev.pistonPosition) * springStiffness - prev.pistonVelocity * damping;
  const nextPistonVel = prev.pistonVelocity + accel * clampedDt;
  const nextPistonPos = prev.pistonPosition + nextPistonVel * clampedDt;

  // --- Gemini spec guards (Nov 22 evaluation) ---
  // Emergent cycle rate: a cycle completes when DISCHARGE drains back to
  // FILLING. Sequential phases imply ~0.167 Hz (A) / ~0.177 Hz (B) against
  // the stated 0.50 / 0.25 Hz — the cycle-rate mismatch finding.
  const nextSimTimeS = prev.simTimeS + clampedDt;
  const cycleCompleted = prev.triggerPhase === 'DISCHARGE' && nextTriggerPhase === 'FILLING';
  const nextCycleCount = prev.cycleCount + (cycleCompleted ? 1 : 0);
  const cycleElapsedS = nextSimTimeS - prev.cycleStartTimeS;
  const nextEmergentCycleHz =
    cycleCompleted && cycleElapsedS > 0 ? 1 / cycleElapsedS : prev.emergentCycleHz;
  const nextCycleStartTimeS = cycleCompleted ? nextSimTimeS : prev.cycleStartTimeS;

  // Plenum Boyle guard: full-stroke isothermal compression of the selected
  // envelope's tank (a guard value from the envelope's own numbers, NOT a
  // live pressure sensor). Null while no envelope is chosen.
  // A: 50 L @ 4.0 bar, swept 25.45 L -> 9.20 bar gauge (ceiling 6.0 -> OVER).
  // B: 250 L @ 2.25 bar midpoint, swept 103.38 L -> ~4.55 bar gauge (ceiling 7.0).
  let nextPlenumBarGauge: number | null = null;
  let nextPlenumOverPressure: boolean | null = null;
  const selectedEnvelope = controls.envelope ?? 'unresolved';
  if (selectedEnvelope !== 'unresolved') {
    const env = ENVELOPES[selectedEnvelope];
    const p1AbsPa = env.tankNominalPa + P_ATM_PA;
    const v2M3 = env.tankVolumeM3 - env.sweptVolumeM3;
    const p2AbsPa = boylePressurePa(p1AbsPa, env.tankVolumeM3, v2M3);
    nextPlenumBarGauge = Number(paToBar(p2AbsPa - P_ATM_PA).toFixed(2));
    nextPlenumOverPressure = nextPlenumBarGauge > paToBar(env.overEnergizedPa);
  }

  // Sizing-paradox guard: lift air applied while the scuppers are open
  // (FILLING) would erupt water out the top instead of through the
  // turbine. The real sim applies zero air upstroke during FILLING by
  // construction, so this reads false — the honest result, computed live
  // from the phase and the air-upstroke term, not hard-coded.
  const nextSizingParadox = nextTriggerPhase === 'FILLING' && airUpstroke > 0;

  const strokeDepth = Number(
    Math.max(0.05, Math.abs(nextPistonPos) * 0.72 + (triggerFired ? 0.18 * plungerAdj : 0)).toFixed(2)
  );

  // Port & bottom discharge flow rate is driven by the triggered chain reaction + plunger adjustment + over-energize
  const triggerFlow = triggerFired
    ? (0.55 + 0.65 * nextDischargePulse) * (0.75 + 0.45 * plungerAdj)
    : 0.12 * preset.intensity;
  const baseFlowNorm = Math.min(1.65, triggerFlow * (controls.overEnergize ? 1.32 : 1.0) + preset.intensity * 0.18);

  // Plunger Air Pressure (bar) and Displacement Pressure Difference (bar)
  const targetPlungerAirBar =
    (0.85 + plungerAdj * 0.95 + nextWaterLevel * 0.45 + (triggerFired ? 0.65 * nextDischargePulse : 0)) *
    overMult;
  const smoothPlungerAirBar = Number(
    (prev.plungerAirBar + (targetPlungerAirBar - prev.plungerAirBar) * Math.min(1, clampedDt * 7.5)).toFixed(2)
  );

  const targetDisplacementBar =
    (triggerFired
      ? (0.58 + 1.05 * nextDischargePulse * plungerAdj) * overMult
      : (0.14 + nextWaterLevel * 0.24) * (0.75 + 0.35 * plungerAdj) * (controls.overEnergize ? 1.65 : 1.0));

  // Valve-state machine (Gemini corrected spec File 2) — derived live
  // from the real trigger phase. FILLING: flappers open (pan filling),
  // foot shut, needle seated. TRIGGERED: cam snap — flappers shut, foot
  // shut, needle unseated. DISCHARGE: flappers shut, foot open, needle
  // unseated. RESET (Gemini's 3rd phase) is the DISCHARGE -> FILLING
  // return: the air-fired upstroke + refill, detected above as
  // cycleCompleted. The real TRIGGERED phase is kept — it is the cam
  // snap / air-fire transition between FILLING and DISCHARGE.
  const nextFlapperOpen = nextTriggerPhase === 'FILLING';
  const nextFootValveOpen = nextTriggerPhase === 'DISCHARGE';
  const nextNeedleValve: 'SEATED' | 'UNSEATED' =
    nextTriggerPhase === 'FILLING' ? 'SEATED' : 'UNSEATED';
  // Accumulator: the real sim has no separate accumulator state; the
  // plunger air pressure IS the accumulator-plenum pressure in this
  // machine (air tank underneath drives the piston up).
  const nextAccumulatorBar = smoothPlungerAirBar;

  // Gemini fix spec File 1 — turbine pitch + lever angles, derived live.
  // Pitch: an explicit control wins; otherwise the envelope default
  // (35° A / 31° B). Lever angles are magnitudes; the 3D view applies
  // the sign (−35° intake open, +45° exhaust open).
  const nextTurbinePitchDeg =
    controls.turbinePitchDeg ?? (selectedEnvelope === 'B-gemini' ? 31 : 35);
  const nextIntakeFlapperAngleDeg = nextFlapperOpen ? 35 : 0;
  const nextExhaustFlapperAngleDeg = nextFootValveOpen ? 45 : 0;
  // Coil current/loss (simulation readouts): bus current = sim power /
  // 48 V bus; I²R from the envelope's estimated phase resistance.
  const coilResistanceOhm =
    selectedEnvelope === 'B-gemini'
      ? COIL_ELECTRICAL_DATA.envelopeB.resistanceEstimateOhm
      : COIL_ELECTRICAL_DATA.envelopeA.resistanceEstimateOhm;
  const coilCurrentAndLoss = (powerWatts: number) => {
    const coilCurrentA = Number((powerWatts / CIRCUITRY_DATA.busVoltageV).toFixed(1));
    const coilOhmicLossW = Number(
      (coilCurrentA * coilCurrentA * coilResistanceOhm).toFixed(1)
    );
    return { coilCurrentA, coilOhmicLossW };
  };

  if (prev.mode === 'Boost') {
    const boostDuration = 2.4;
    const nextProgress = prev.boostProgress + clampedDt / boostDuration;
    const pulseEnvelope =
      Math.sin(Math.min(nextProgress, 1) * Math.PI) * Math.exp(-nextProgress * 0.55);
    const dischargeRate = 18 + 62 * Math.max(0.15, pulseEnvelope);
    const nextCharge = Math.max(4, prev.charge - clampedDt * dischargeRate);

    const boostFlowNorm = Math.min(1.85, baseFlowNorm + 0.95 * pulseEnvelope);
    const boostDispBar = Number(
      (prev.displacementBar + (targetDisplacementBar + 1.45 * pulseEnvelope * overMult - prev.displacementBar) * Math.min(1, clampedDt * 8)).toFixed(2)
    );
    const targetDeltaP = 420 + Math.round(2400 * boostFlowNorm * boostFlowNorm + boostDispBar * 320);
    const smoothDeltaP = Math.round(
      prev.deltaP + (targetDeltaP - prev.deltaP) * Math.min(1, clampedDt * 8)
    );

    const targetRpm = 220 + preset.intensity * 180 + 480 * pulseEnvelope + (controls.overEnergize ? 160 : 0);
    const smoothRpm = Math.round(
      prev.turbineRpm + (targetRpm - prev.turbineRpm) * Math.min(1, clampedDt * 7)
    );

    const targetVolts = 16 + 24 * pulseEnvelope + (controls.overEnergize ? 10 : 0);
    const smoothVolts = Number(
      (prev.coilVolts + (targetVolts - prev.coilVolts) * Math.min(1, clampedDt * 7)).toFixed(1)
    );
    const simPowerWatts = Math.round(Math.min(2650, smoothRpm * 2.25 + boostDispBar * 195));

    const finished = nextProgress >= 1 || nextCharge <= 5;
    return {
      deltaP: smoothDeltaP,
      displacementBar: boostDispBar,
      plungerAirBar: smoothPlungerAirBar,
      turbineRpm: smoothRpm,
      strokeDepth,
      coilVolts: smoothVolts,
      simPowerWatts,
      charge: Number(nextCharge.toFixed(1)),
      mode: finished ? 'Harvest' : 'Boost',
      boostProgress: finished ? 0 : nextProgress,
      boostMessage: null,
      phase: nextPhase,
      waveElevation,
      waterLevel: Number(nextWaterLevel.toFixed(3)),
      triggerThreshold,
      triggerPhase: nextTriggerPhase,
      triggerFired,
      camAngle: nextCamAngle,
      dischargePulse: nextDischargePulse,
      pistonPosition: nextPistonPos,
      pistonVelocity: nextPistonVel,
      flowRateNorm: boostFlowNorm,
      solarTrickleActive: true,
      simTimeS: nextSimTimeS,
      cycleCount: nextCycleCount,
      cycleStartTimeS: nextCycleStartTimeS,
      emergentCycleHz: nextEmergentCycleHz,
      plenumBarGauge: nextPlenumBarGauge,
      plenumOverPressure: nextPlenumOverPressure,
      sizingParadox: nextSizingParadox,
      flapperOpen: nextFlapperOpen,
      footValveOpen: nextFootValveOpen,
      needleValve: nextNeedleValve,
      accumulatorBar: nextAccumulatorBar,
      turbinePitchDeg: nextTurbinePitchDeg,
      intakeFlapperAngleDeg: nextIntakeFlapperAngleDeg,
      exhaustFlapperAngleDeg: nextExhaustFlapperAngleDeg,
      ...coilCurrentAndLoss(simPowerWatts),
      warnings: [],
    };
  }

  // Mode A: Harvest — port/bottom discharge spins turbine generator fins against magnetic coils + solid-state magnetic resistance
  const smoothDisplacementBar = Number(
    (prev.displacementBar + (targetDisplacementBar - prev.displacementBar) * Math.min(1, clampedDt * 8.5)).toFixed(2)
  );
  const targetDeltaP = Math.round(1350 * baseFlowNorm * baseFlowNorm + smoothDisplacementBar * 280);
  const smoothDeltaP = Math.round(
    prev.deltaP + (targetDeltaP - prev.deltaP) * Math.min(1, clampedDt * 8)
  );

  // Turbine generator fins spin up on triggered port discharge and coast on inertia while pan refills
  const targetRpm = triggerFired
    ? Math.round((240 + 360 * plungerAdj * nextDischargePulse) * (controls.overEnergize ? 1.38 : 1.0))
    : Math.round(35 + preset.intensity * 65);
  const rpmTau = targetRpm > prev.turbineRpm ? 6.2 : 1.45;
  const smoothRpm = Math.round(
    prev.turbineRpm + (targetRpm - prev.turbineRpm) * Math.min(1, clampedDt * rpmTau)
  );

  // Induced coil voltage & simulated electric power (with solid-state magnetic resistance)
  const targetVolts = Math.max(1.2, (smoothRpm / 750) * 44 + smoothDisplacementBar * 2.2);
  const smoothVolts = Number(
    (prev.coilVolts + (targetVolts - prev.coilVolts) * Math.min(1, clampedDt * 6.5)).toFixed(1)
  );
  const simPowerWatts = Math.round(
    Math.min(2400, (smoothVolts * smoothVolts) / 1.45 + smoothRpm * 1.1)
  );

  const headroom = Math.max(0.08, (100 - prev.charge) / 100);
  const harvestPulseRate = (smoothVolts / 48) * 14.5 * headroom * (triggerFired ? 1.45 : 0.45);
  const solarCrownTrickle = 0.28 * headroom;
  const nextCharge = Math.min(100, prev.charge + clampedDt * (harvestPulseRate + solarCrownTrickle));

  return {
    deltaP: smoothDeltaP,
    displacementBar: smoothDisplacementBar,
    plungerAirBar: smoothPlungerAirBar,
    turbineRpm: smoothRpm,
    strokeDepth,
    coilVolts: smoothVolts,
    simPowerWatts,
    charge: Number(nextCharge.toFixed(1)),
    mode: 'Harvest',
    boostProgress: 0,
    boostMessage: prev.boostMessage,
    phase: nextPhase,
    waveElevation,
    waterLevel: Number(nextWaterLevel.toFixed(3)),
    triggerThreshold,
    triggerPhase: nextTriggerPhase,
    triggerFired,
    camAngle: nextCamAngle,
    dischargePulse: nextDischargePulse,
    pistonPosition: nextPistonPos,
    pistonVelocity: nextPistonVel,
    flowRateNorm: baseFlowNorm,
    solarTrickleActive: true,
    simTimeS: nextSimTimeS,
    cycleCount: nextCycleCount,
    cycleStartTimeS: nextCycleStartTimeS,
    emergentCycleHz: nextEmergentCycleHz,
    plenumBarGauge: nextPlenumBarGauge,
    plenumOverPressure: nextPlenumOverPressure,
    sizingParadox: nextSizingParadox,
    flapperOpen: nextFlapperOpen,
    footValveOpen: nextFootValveOpen,
    needleValve: nextNeedleValve,
    accumulatorBar: nextAccumulatorBar,
    turbinePitchDeg: nextTurbinePitchDeg,
    intakeFlapperAngleDeg: nextIntakeFlapperAngleDeg,
    exhaustFlapperAngleDeg: nextExhaustFlapperAngleDeg,
    ...coilCurrentAndLoss(simPowerWatts),
    warnings: [],
  };
}

function THREE_DAMP(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}
