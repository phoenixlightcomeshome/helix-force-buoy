/**
 * Schematics — the technical schematic view.
 *
 * Follows the structure Gemini listed for the Buoy 3D Core app's
 * Schematics.tsx [G22 §5]: Center Needle, Level/Cam Trigger, bar
 * readouts, Solid-State Magnetic Resistance, 2,000 W banner, and the
 * detail launch button.
 *
 * The flow path is drawn in the master record's stage order
 * (turbine Stage 04, then venturis Stage 05 [MDR §1.2]) — Gemini's
 * Nov 22 flow-path wording (venturis → turbine exhaust) is flagged as
 * a clarification item in CONFLICTS, not silently resolved.
 *
 * All readouts are SIMULATION — NOT MEASURED DATA.
 */

import {
  SIMULATION_LABEL,
  TARGET_OUTPUT_LABEL,
  type SizingEnvelope,
  type SimTelemetry,
} from "../data/rayDesignData";

export type SchematicsProps = {
  envelope: SizingEnvelope;
  telemetry: SimTelemetry;
  onOpenPart: (partKey: string) => void;
};

export function Schematics({ envelope, telemetry, onOpenPart }: SchematicsProps) {
  const flowSteps = [
    {
      label: "Waves / Sea Surface",
      state: "intake",
      detail: telemetry.flapperOpen
        ? "Flappers OPEN — pan filling"
        : "Flappers SHUT — discharge / lift",
    },
    {
      label: "Top Intake Scuppers + One-Way Flappers (Part 03)",
      state: telemetry.flapperOpen ? "open" : "shut",
      detail: telemetry.flapperOpen
        ? "Gravity / wave wash filling the pan"
        : "Snapped shut — pressure rising in the cylinder",
    },
    {
      label: "Top Compression Chamber — water above the piston",
      state: "water",
      detail: `Pan fill ${(telemetry.waterLevel * 100).toFixed(0)}% · Level/cam trigger at a full pan`,
    },
    {
      label: "Piston / Center Needle (Part 02)",
      state: telemetry.phase,
      detail: `Piston ${telemetry.pistonY.toFixed(2)} m of ${envelope.strokeM.toFixed(2)} m stroke · needle ${telemetry.needleValve}`,
    },
    {
      label: "Lower Pneumatic Lift Tank + Accumulator Plenum",
      state: "air",
      detail: `Plenum ${telemetry.accumulatorBar.toFixed(2)} bar gauge · lift chamber ${telemetry.plungerAirBar.toFixed(2)} bar abs`,
    },
    {
      label: "Quad-Venturis / Core + One-Way Foot Valve (Part 08)",
      state: telemetry.footValveOpen ? "open" : "shut",
      detail: telemetry.footValveOpen
        ? "Foot valve OPEN — discharge to the venturis"
        : "Foot valve SHUT — no back-suction through the turbine",
    },
    {
      label: "Axial Turbine Generator Exhaust (Part 06)",
      state: "turbine",
      detail: `Turbine ${Math.round(telemetry.turbineRPM)} RPM · flow ${telemetry.flowLPerS.toFixed(1)} L/s · ${telemetry.electricalW.toFixed(0)} W (simulation)`,
    },
  ];

  return (
    <section aria-label="Schematics">
      <header>
        <p>{TARGET_OUTPUT_LABEL}</p>
        <h2>Schematics — {envelope.name}</h2>
        <p>{SIMULATION_LABEL}</p>
      </header>

      <ol>
        {flowSteps.map((s, i) => (
          <li key={s.label}>
            <strong>{String(i + 1).padStart(2, "0")}</strong> {s.label} —{" "}
            {s.detail}
          </li>
        ))}
      </ol>

      <h3>Bar readouts</h3>
      <dl>
        <div>
          <dt>Displacement Diff</dt>
          <dd>{telemetry.displacementBar.toFixed(2)} bar</dd>
        </div>
        <div>
          <dt>Plunger Air</dt>
          <dd>{telemetry.plungerAirBar.toFixed(2)} bar</dd>
        </div>
        <div>
          <dt>Accumulator Plenum</dt>
          <dd>{telemetry.accumulatorBar.toFixed(2)} bar gauge</dd>
        </div>
        <div>
          <dt>Phase</dt>
          <dd>{telemetry.phase}</dd>
        </div>
        <div>
          <dt>Coil volts</dt>
          <dd>
            {telemetry.coilVoltsV === null
              ? "— (not computable for this envelope)"
              : `${telemetry.coilVoltsV.toFixed(1)} V peak/phase`}
          </dd>
        </div>
        <div>
          <dt>Cap bank</dt>
          <dd>
            {Math.round(telemetry.capBankJ).toLocaleString()} J
            {telemetry.capBankPct !== null
              ? ` (${telemetry.capBankPct.toFixed(1)}%)`
              : " (capacity not sized for this envelope)"}
          </dd>
        </div>
      </dl>

      <h3>Center Needle + Level/Cam Trigger</h3>
      <p>
        The hollow center needle is the internal shuttle valve: it unseats
        at the bottom of the stroke and reseats at the top via the level/cam
        trigger, locking the high-pressure pneumatic charge beneath the
        piston [G22 §2B]. Needle now: {telemetry.needleValve}. The level/cam
        trigger trips at a full pan (threshold not specified in the local
        documents — pending the app export).
      </p>

      <h3>Solid-State Magnetic Resistance</h3>
      <p>
        The Halbach matrix focuses its field inward on the core while the
        copper induction coils harvest the crossing field [MDR §1.2]. The EM
        repulsion stator (proposed) needs Mu-metal / silicon-steel flux
        barriers between the drive coils and the harvest coils, and stator
        coils potted against the hull so the seawater carries the heat
        [G22 §3D]. EM net energy this run:{" "}
        {Math.round(telemetry.netEnergyJ).toLocaleString()} J (spent{" "}
        {Math.round(telemetry.energySpentJ).toLocaleString()} J, returned{" "}
        {Math.round(telemetry.energyHarvestedJ).toLocaleString()} J).
      </p>

      {telemetry.warnings.length > 0 ? (
        <div role="alert">
          <h3>Warnings this step</h3>
          <ul>
            {telemetry.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <button type="button" onClick={() => onOpenPart("center-needle")}>
        Open Center Needle detail
      </button>
    </section>
  );
}
