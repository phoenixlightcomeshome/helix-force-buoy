/**
 * App — Helix-Force Buoy, Marlow's local implementation from Gemini's design.
 *
 * Follows the structure Gemini listed for the Buoy 3D Core app's App.tsx
 * [G22 §5]: global state variables (plungerSetting, overEnergize,
 * modeABoost, telemetry state handlers).
 *
 * STATE RULES:
 *  - Envelope: NO default winner. The app opens in comparison mode and
 *    the simulator refuses to run until Ray (or the viewer) picks an
 *    envelope explicitly. Both envelopes are shown side by side.
 *  - plungerSetting 0.50×–1.50×, overEnergize toggle, Mode A Harvest /
 *    Mode B Boost, tide presets (fill-rate only, never hull motion).
 *  - Logs ship empty; true numbers only. No prices anywhere.
 *
 * This file is a local implementation for Ray's review. It does NOT edit
 * the Buoy 3D Core app in AI Studio or any Base44 app, and it publishes
 * nothing.
 */

import { useEffect, useRef, useState } from "react";
import {
  ENVELOPES,
  STAGES,
  PARTS,
  TIDE_PRESETS,
  SIMULATION_LABEL,
  TARGET_OUTPUT_LABEL,
  defaultControls,
  initialState,
  stepSimulation,
  evaluateEmGuards,
  type EnvelopeId,
  type SimControls,
  type SimState,
} from "./data/rayDesignData";
import { BuoyCore3D } from "./components/BuoyCore3D";
import { OperatingPrincipleAndSizing } from "./components/OperatingPrincipleAndSizing";
import { PartDetailModal, type PartSelection } from "./components/PartDetailModal";
import { Schematics } from "./components/Schematics";

export function App() {
  const [controls, setControls] = useState<SimControls>(defaultControls());
  const [sim, setSim] = useState<SimState>(() => initialState(defaultControls()));
  const [detailPart, setDetailPart] = useState<PartSelection>(null);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const envelope =
    controls.envelope === "unresolved" ? null : ENVELOPES[controls.envelope];

  // Simulator loop: 10 steps per second while running.
  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    if (!running || !envelope) return;
    timer.current = setInterval(() => {
      setSim((prev) => stepSimulation(prev, controls, 0.1));
    }, 100);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running, envelope, controls]);

  const pickEnvelope = (id: EnvelopeId) => {
    const next = { ...controls, envelope: id };
    setControls(next);
    setSim(initialState(next));
  };

  const setPlungerSetting = (v: number) =>
    setControls((c) => ({ ...c, plungerSetting: v }));
  const setOverEnergize = (v: boolean) =>
    setControls((c) => ({ ...c, overEnergize: v }));
  const setMode = (mode: "Harvest" | "Boost") =>
    setControls((c) => ({ ...c, mode }));
  const setTide = (tide: SimControls["tide"]) =>
    setControls((c) => ({ ...c, tide }));
  const setEmPulse = (v: boolean) =>
    setControls((c) => ({ ...c, emPulseEnabled: v }));

  const emGuards = envelope ? evaluateEmGuards(envelope) : [];

  return (
    <div>
      <header>
        <p>HELIX-FORCE</p>
        <h1>Smart-Hybrid Buoy — Marlow&rsquo;s build from Gemini&rsquo;s design</h1>
        <p>
          Ray&rsquo;s wave-energy buoy: a weighted plunger and a spiral of
          water, a Halbach heart and a bank of supercapacitors — built to
          harvest the sea&rsquo;s motion and scrub the water that passes
          through her.
        </p>
        <p>{TARGET_OUTPUT_LABEL}</p>
        <p>{SIMULATION_LABEL}</p>
      </header>

      {/* Envelope choice — no default winner. */}
      <section aria-label="Sizing envelope">
        <h2>1 · Choose a sizing envelope</h2>
        <p>
          The two envelopes disagree (bore 180 vs 450 mm, tank 50 L vs
          250 L). Both are kept. The simulator will not run until one is
          picked — this build picks no winner.
        </p>
        <div role="group" aria-label="Sizing envelope">
          {(Object.keys(ENVELOPES) as EnvelopeId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => pickEnvelope(id)}
              aria-pressed={controls.envelope === id}
            >
              {ENVELOPES[id].name}
            </button>
          ))}
        </div>
        {envelope ? (
          <p>
            Active: {envelope.name} — {envelope.sourceDoc}. Bore{" "}
            {envelope.boreM * 1000} mm × {envelope.strokeM.toFixed(2)} m
            stroke, tank {Math.round(envelope.tankVolumeM3 * 1000)} L @{" "}
            {(envelope.tankNominalPa / 100000).toFixed(2)} bar nominal.
          </p>
        ) : (
          <p>No envelope chosen — the simulator is waiting.</p>
        )}
      </section>

      {envelope ? (
        <>
          {/* Controls */}
          <section aria-label="Controls">
            <h2>2 · Controls</h2>
            <div>
              <label htmlFor="plunger-setting">
                Air Tank Plunger — Adjustable ({controls.plungerSetting.toFixed(2)}
                ×)
              </label>
              <input
                id="plunger-setting"
                type="range"
                min={0.5}
                max={1.5}
                step={0.05}
                value={controls.plungerSetting}
                onChange={(e) => setPlungerSetting(Number(e.target.value))}
              />
              <span>0.50×–1.50×</span>
            </div>
            <div>
              <label htmlFor="over-energize">
                <input
                  id="over-energize"
                  type="checkbox"
                  checked={controls.overEnergize}
                  onChange={(e) => setOverEnergize(e.target.checked)}
                />{" "}
                Over-Energize (tank to its ceiling:{" "}
                {(envelope.overEnergizedPa / 100000).toFixed(1)} bar)
              </label>
            </div>
            <div role="group" aria-label="Router mode">
              <button
                type="button"
                onClick={() => setMode("Harvest")}
                aria-pressed={controls.mode === "Harvest"}
              >
                A · Harvest
              </button>
              <button
                type="button"
                onClick={() => setMode("Boost")}
                aria-pressed={controls.mode === "Boost"}
              >
                B · Boost
              </button>
            </div>
            <div>
              <label htmlFor="tide">Tide (fill-rate only)</label>
              <select
                id="tide"
                value={controls.tide}
                onChange={(e) => setTide(e.target.value as SimControls["tide"])}
              >
                {TIDE_PRESETS.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="em-pulse">
                <input
                  id="em-pulse"
                  type="checkbox"
                  checked={controls.emPulseEnabled}
                  onChange={(e) => setEmPulse(e.target.checked)}
                />{" "}
                EM repulsion pulse (Ray&rsquo;s concept — net energy deficit
                applies; see guards)
              </label>
            </div>
            <div>
              <button
                type="button"
                onClick={() => setRunning((r) => !r)}
                disabled={!envelope}
              >
                {running ? "Pause the sea" : "Run the cycle"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRunning(false);
                  setSim(initialState(controls));
                }}
              >
                Reset
              </button>
            </div>
          </section>

          {/* 3D core */}
          <section aria-label="3D core">
            <h2>3 · 3D Core</h2>
            <BuoyCore3D envelope={envelope} telemetry={sim.telemetry} />
            <p>
              Phase: {sim.telemetry.phase} · Piston{" "}
              {sim.telemetry.pistonY.toFixed(2)} m of{" "}
              {envelope.strokeM.toFixed(2)} m · Pan fill{" "}
              {(sim.telemetry.waterLevel * 100).toFixed(0)}% · Turbine{" "}
              {Math.round(sim.telemetry.turbineRPM)} RPM ·{" "}
              {sim.telemetry.electricalW.toFixed(0)} W (simulation) · Cycles:{" "}
              {sim.cycles}
              {sim.emergentCycleHz !== null
                ? ` · Emergent cycle rate: ${sim.emergentCycleHz.toFixed(2)} Hz (stated: ${envelope.cycleHz.toFixed(2)} Hz)`
                : ""}
            </p>
            {sim.telemetry.warnings.length > 0 ? (
              <div role="alert">
                <h3>Warnings</h3>
                <ul>
                  {sim.telemetry.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          {/* Schematics */}
          <Schematics
            envelope={envelope}
            telemetry={sim.telemetry}
            onOpenPart={(key) => setDetailPart(key as PartSelection)}
          />

          {/* EM guards */}
          <section aria-label="EM coil guards">
            <h2>EM repulsion coil guards</h2>
            <ul>
              {emGuards.map((g) => (
                <li key={g.check}>
                  <strong>
                    {g.check} — {g.result}
                  </strong>
                  : {g.detail}
                </li>
              ))}
            </ul>
          </section>

          {/* Parts */}
          <section aria-label="Parts">
            <h2>15-part gather list</h2>
            <ul>
              {PARTS.map((p) => (
                <li key={p.key}>
                  <button type="button" onClick={() => setDetailPart(p.key)}>
                    {p.num}. {p.name}
                  </button>{" "}
                  — {p.detail}
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => setDetailPart("center-needle")}>
              Featured: Air Plunger — Center Needle
            </button>
          </section>

          {/* Stages */}
          <section aria-label="Stages">
            <h2>12-stage stack</h2>
            <ol>
              {STAGES.map((s) => (
                <li key={s.key}>
                  {s.num} · {s.name} — {s.note}
                </li>
              ))}
            </ol>
          </section>
        </>
      ) : null}

      {/* Operating principle + sizing — always visible. */}
      <OperatingPrincipleAndSizing />

      <PartDetailModal
        selection={detailPart}
        onClose={() => setDetailPart(null)}
      />

      <footer>
        <p>
          Water enters, turns in a spiral, meets a magnetic heart, leaves
          cleaner than it came — and the turning pays for the cleaning.
        </p>
        <p>
          His design. Her memory. One change at a time. Slow and smooth,
          smooth is fast.
        </p>
      </footer>
    </div>
  );
}
