/**
 * verify-sim.ts — run with: bun scripts/verify-sim.ts
 *
 * Checks the buoy implementation against the documents, with no render:
 *  1. Lift summaries reproduce Gemini's Case A / Case B numbers [G22 §1].
 *  2. Headline power chains land on the 2,000 W target [M20 §2, G20].
 *  3. Coil EMF for Envelope A reproduces Marlow's 63.936 V [M20 §3].
 *  4. Full-cycle simulation for both envelopes: phases visited in order,
 *     piston clamped to [0, stroke] at every step, emergent cycle rate
 *     reported, and the expected reconciliation warnings fire.
 *  5. EM pulse run: net energy is negative (Gemini's deficit, shown
 *     rather than hidden).
 *  6. Unresolved envelope: the simulator refuses with a plain warning.
 *
 * Exit 0 when every check passes; exit 1 otherwise.
 * SIMULATION — NOT MEASURED DATA. TARGET: 2,000 W — NOT MEASURED.
 */

import {
  ENVELOPES,
  liftSummary,
  headlinePowerChain,
  defaultControls,
  initialState,
  stepSimulation,
  type SimState,
  type SimControls,
} from "../src/data/rayDesignData";
import { coilEmfPeakV } from "../src/lib/physics";

let failures = 0;

function check(name: string, ok: boolean, detail: string) {
  const mark = ok ? "PASS" : "FAIL";
  console.log(`[${mark}] ${name} — ${detail}`);
  if (!ok) failures += 1;
}

function approx(actual: number, expected: number, tol: number) {
  return Math.abs(actual - expected) <= tol;
}

// --- 1. Lift summaries vs Gemini's Case A / Case B [G22 §1] ------------
const liftA = liftSummary(ENVELOPES["A-marlow"]);
check(
  "Lift A — ΔP lift",
  approx(liftA.liftPressureGaugeBar, 0.215, 0.002),
  `got ${liftA.liftPressureGaugeBar.toFixed(3)} bar gauge, Gemini states ≈0.215 bar`,
);
check(
  "Lift A — absolute pressure",
  approx(liftA.absolutePressureBar, 1.41, 0.01),
  `got ${liftA.absolutePressureBar.toFixed(2)} bar abs, Gemini states ≈1.41 bar`,
);
check(
  "Lift A — thrust at 4.0 bar",
  approx(liftA.thrustAt4BarN, 10180, 20),
  `got ${Math.round(liftA.thrustAt4BarN).toLocaleString()} N, Gemini states 10,180 N`,
);
check(
  "Lift A — total downward force",
  approx(liftA.totalDownN, 547.6, 1),
  `got ${liftA.totalDownN.toFixed(1)} N, Gemini states 547.6 N`,
);

const liftB = liftSummary(ENVELOPES["B-gemini"]);
check(
  "Lift B — ΔP lift",
  approx(liftB.liftPressureGaugeBar, 0.109, 0.002),
  `got ${liftB.liftPressureGaugeBar.toFixed(3)} bar gauge, Gemini states ≈0.109 bar`,
);
check(
  "Lift B — absolute pressure",
  approx(liftB.absolutePressureBar, 1.34, 0.01),
  `got ${liftB.absolutePressureBar.toFixed(2)} bar abs, Gemini states ≈1.34 bar`,
);
check(
  "Lift B — thrust at 4.0 bar",
  approx(liftB.thrustAt4BarN, 63600, 100),
  `got ${Math.round(liftB.thrustAt4BarN).toLocaleString()} N, Gemini states 63,600 N`,
);
check(
  "Lift B — total downward force",
  approx(liftB.totalDownN, 1727.2, 1),
  `got ${liftB.totalDownN.toFixed(1)} N, Gemini states 1,727.2 N`,
);

// --- 2. Headline power chains -------------------------------------------
const chainA = headlinePowerChain(ENVELOPES["A-marlow"]);
check(
  "Chain A — hydraulic",
  approx(chainA.hydraulicW, 5000, 1),
  `got ${chainA.hydraulicW.toFixed(0)} W, Marlow states 5,000 W`,
);
check(
  "Chain A — shaft",
  approx(chainA.shaftW, 2750, 1),
  `got ${chainA.shaftW.toFixed(0)} W, Marlow states 2,750 W`,
);
check(
  "Chain A — electrical (target)",
  approx(chainA.electricalW, 2000, 1),
  `got ${chainA.electricalW.toFixed(0)} W, target 2,000 W`,
);

const chainB = headlinePowerChain(ENVELOPES["B-gemini"]);
check(
  "Chain B — average hydraulic",
  approx(chainB.hydraulicW, 4000, 1),
  `got ${chainB.hydraulicW.toFixed(0)} W, Gemini's chain implies 4,000 W avg (10,000 W pulse × 40% duty)`,
);
check(
  "Chain B — electrical (target)",
  approx(chainB.electricalW, 2000, 1),
  `got ${chainB.electricalW.toFixed(0)} W, target 2,000 W`,
);

// --- 3. Coil EMF, Envelope A ----------------------------------------------
const emfA = coilEmfPeakV(30, 48, 0.5, 0.02);
check(
  "Coil EMF A",
  approx(emfA, 63.936, 0.01),
  `got ${emfA.toFixed(3)} V peak/phase, Marlow states 63.936 V`,
);

// --- 4. Full-cycle simulation, both envelopes ----------------------------
function runCycles(
  controls: SimControls,
  maxSeconds: number,
  wantCycles: number,
): { state: SimState; minPistonY: number; maxPistonY: number; phasesSeen: string[]; allWarnings: Set<string> } {
  let state = initialState(controls);
  const env = ENVELOPES[controls.envelope as "A-marlow" | "B-gemini"];
  let minPistonY = Infinity;
  let maxPistonY = -Infinity;
  const phasesSeen: string[] = [];
  const allWarnings = new Set<string>();
  const dt = 0.05;
  let lastPhase = "";
  for (let t = 0; t < maxSeconds && state.cycles < wantCycles; t += dt) {
    state = stepSimulation(state, controls, dt);
    const y = state.telemetry.pistonY;
    if (y < minPistonY) minPistonY = y;
    if (y > maxPistonY) maxPistonY = y;
    if (state.telemetry.phase !== lastPhase) {
      phasesSeen.push(state.telemetry.phase);
      lastPhase = state.telemetry.phase;
    }
    for (const w of state.telemetry.warnings) allWarnings.add(w.slice(0, 40));
    if (y < -1e-9 || y > env.strokeM + 1e-9) {
      console.log(`[FAIL] Piston out of clamp: y=${y} m, stroke=${env.strokeM} m`);
      failures += 1;
      break;
    }
  }
  return { state, minPistonY, maxPistonY, phasesSeen, allWarnings };
}

for (const id of ["A-marlow", "B-gemini"] as const) {
  const controls: SimControls = {
    ...defaultControls(),
    envelope: id,
    mode: "Harvest",
  };
  const env = ENVELOPES[id];
  const r = runCycles(controls, 120, 3);
  check(
    `Sim ${id} — 3 cycles complete`,
    r.state.cycles >= 3,
    `completed ${r.state.cycles} cycles in ${r.state.t.toFixed(1)} s`,
  );
  check(
    `Sim ${id} — piston clamped [0, stroke]`,
    r.minPistonY >= -1e-9 && r.maxPistonY <= env.strokeM + 1e-9,
    `min ${r.minPistonY.toFixed(3)} m, max ${r.maxPistonY.toFixed(3)} m, stroke ${env.strokeM} m`,
  );
  const order = ["FILLING", "DISCHARGE", "RESET", "FILLING"];
  const seqOk = order.every((p, i) => r.phasesSeen[i] === p);
  check(
    `Sim ${id} — phase order FILLING → DISCHARGE → RESET`,
    seqOk,
    `saw: ${r.phasesSeen.slice(0, 4).join(" → ")}`,
  );
  check(
    `Sim ${id} — emergent cycle rate reported`,
    r.state.emergentCycleHz !== null,
    `emergent ${r.state.emergentCycleHz?.toFixed(3) ?? "null"} Hz vs stated ${env.cycleHz.toFixed(2)} Hz`,
  );
  const mismatch = [...r.allWarnings].some((w) => w.startsWith("CYCLE-RATE MISMATCH"));
  check(
    `Sim ${id} — cycle-rate mismatch flagged (reconciliation, not hidden)`,
    mismatch,
    mismatch
      ? "the stated phase timings do not fit inside the stated cycle — flagged as a finding"
      : "expected the mismatch warning; it did not fire",
  );
  console.log(`      ${id} warnings seen: ${[...r.allWarnings].join(" | ") || "(none)"}`);
}

// Envelope A must also fire the plenum over-pressure finding.
{
  const controls: SimControls = { ...defaultControls(), envelope: "A-marlow", mode: "Harvest" };
  const r = runCycles(controls, 120, 1);
  const over = [...r.allWarnings].some((w) => w.startsWith("PLENUM OVER-PRESSURE"));
  check(
    "Sim A — plenum over-pressure flagged (50 L tank × 25 L stroke)",
    over,
    over
      ? "Boyle compression drives the 50 L plenum past the 6.0 bar ceiling — flagged as a finding"
      : "expected the plenum warning; it did not fire",
  );
}

// --- 5. EM pulse run: the deficit shows ------------------------------------
{
  const controls: SimControls = {
    ...defaultControls(),
    envelope: "B-gemini",
    mode: "Harvest",
    emPulseEnabled: true,
  };
  const r = runCycles(controls, 120, 2);
  check(
    "EM — net energy negative (Gemini's deficit, demonstrated)",
    r.state.telemetry.netEnergyJ < 0,
    `spent ${Math.round(r.state.telemetry.energySpentJ).toLocaleString()} J, returned ${Math.round(r.state.telemetry.energyHarvestedJ).toLocaleString()} J, net ${Math.round(r.state.telemetry.netEnergyJ).toLocaleString()} J`,
  );
}

// --- 6. Unresolved envelope refuses -----------------------------------------
{
  const controls = defaultControls(); // envelope: 'unresolved'
  const state = stepSimulation(initialState(controls), controls, 0.1);
  check(
    "Unresolved envelope — simulator refuses, no winner picked",
    state.telemetry.warnings.some((w) => w.startsWith("NO ENVELOPE CHOSEN")),
    "the simulator will not run until an envelope is chosen explicitly",
  );
}

console.log("");
if (failures === 0) {
  console.log("VERIFY OK — all checks passed. SIMULATION — NOT MEASURED DATA.");
  process.exit(0);
} else {
  console.log(`VERIFY FAILED — ${failures} check(s) failed.`);
  process.exit(1);
}
