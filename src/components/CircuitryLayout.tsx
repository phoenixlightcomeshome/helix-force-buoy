import { useEffect, useRef } from 'react';
import {
  CIRCUITRY_DATA,
  COIL_ELECTRICAL_DATA,
  EnvelopeId,
  SimTelemetry,
  TARGET_OUTPUT_LABEL,
} from '../data/rayDesignData';

interface CircuitryLayoutProps {
  telemetry: SimTelemetry;
  envelope: EnvelopeId | 'unresolved';
}

// Gemini fix spec (Nov 22, 9:10 PM) File 5 — "Circuitry & Energy", the 5th
// workspace view. Single-line power-flow schematic, capacitance & battery
// bank, required energy per shot, and the hydrodynamic vs. electrical flow
// correlation. Every number is a simulation readout or a spec constant —
// nothing here is measured data. Resistances and the shot energies are
// estimates flagged for Ray to true.
export const CircuitryLayout: React.FC<CircuitryLayoutProps> = ({ telemetry, envelope }) => {
  const isBoost = telemetry.mode === 'Boost';
  const envData =
    envelope === 'B-gemini' ? COIL_ELECTRICAL_DATA.envelopeB : COIL_ELECTRICAL_DATA.envelopeA;
  const envLabel =
    envelope === 'B-gemini'
      ? 'Envelope B (450 mm)'
      : envelope === 'A-marlow'
        ? 'Envelope A (180 mm)'
        : 'Envelope A (180 mm) — pick an envelope to switch';
  const requiredShotKJ =
    envelope === 'B-gemini'
      ? CIRCUITRY_DATA.requiredEnergyPerShotKJB
      : CIRCUITRY_DATA.requiredEnergyPerShotKJA;
  const targetBusCurrentA =
    envelope === 'B-gemini' ? CIRCUITRY_DATA.targetCurrentB : CIRCUITRY_DATA.targetCurrentA;
  const storedEnergyKJ = Number(
    ((CIRCUITRY_DATA.usableEnergyKJ * telemetry.charge) / 100).toFixed(1)
  );

  // Rolling flow-to-power history (last 60 samples, ~3 s of sim time).
  // Flow is the sim's normalized flow rate (0–1.85); no invented L/s
  // conversion — the stated peak flows are noted under the chart.
  const historyRef = useRef<{ flow: number; watts: number }[]>([]);
  useEffect(() => {
    historyRef.current.push({ flow: telemetry.flowRateNorm, watts: telemetry.simPowerWatts });
    if (historyRef.current.length > 60) historyRef.current.shift();
  }, [telemetry.flowRateNorm, telemetry.simPowerWatts]);
  const history = historyRef.current;
  const chartW = 560;
  const chartH = 170;
  const wattsToY = (w: number) => chartH - 12 - (Math.min(2400, Math.max(0, w)) / 2400) * (chartH - 24);
  const flowToY = (f: number) => chartH - 12 - (Math.min(1.85, Math.max(0, f)) / 1.85) * (chartH - 24);
  const xAt = (i: number) => 8 + (i / Math.max(1, 59)) * (chartW - 16);
  const wattsPoints = history.map((s, i) => `${xAt(i)},${wattsToY(s.watts)}`).join(' ');
  const flowPoints = history.map((s, i) => `${xAt(i)},${flowToY(s.flow)}`).join(' ');

  const nodes = [
    { label: 'Coils (Litz AC)', value: `${telemetry.coilVolts.toFixed(1)} V · ${telemetry.coilCurrentA.toFixed(1)} A` },
    { label: 'Schottky Rectifier', value: `${CIRCUITRY_DATA.rectifierForwardDropV.toFixed(2)} V drop` },
    { label: 'Smart Router (H-Bridge)', value: isBoost ? 'Boost (Motoring)' : 'Harvest (Generating)' },
    { label: 'Supercapacitor Bank', value: `${CIRCUITRY_DATA.supercapacitorFarads} F / ${CIRCUITRY_DATA.supercapacitorVolts} V · ${telemetry.charge.toFixed(0)}%` },
    { label: 'DC Bus', value: `${CIRCUITRY_DATA.busVoltageV} V · ${targetBusCurrentA.toFixed(2)} A target` },
  ];

  return (
    <section
      aria-label="Circuitry and Energy Storage"
      className="blueprint-grid-subtle bg-[#050b16] min-h-[calc(100vh-120px)] px-6 py-6 text-slate-100"
    >
      <style>{`@keyframes circuitry-dash { to { stroke-dashoffset: -24; } } .circuitry-flow { stroke-dasharray: 6 6; animation: circuitry-dash 1.2s linear infinite; }`}</style>
      <div className="max-w-[1360px] mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-cyan-500/20">
          <div>
            <p className="text-xs font-mono tracking-wider text-cyan-300">
              CIRCUITRY &amp; ENERGY · {TARGET_OUTPUT_LABEL}
            </p>
            <h2 className="font-display text-2xl font-semibold text-slate-100 mt-1">
              Circuitry &amp; Energy Storage
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              {envLabel} · {telemetry.triggerPhase} · {telemetry.mode}
            </p>
          </div>
          <div className="text-xs font-mono text-amber-300">
            SIMULATION READOUTS — NOT MEASURED DATA
          </div>
        </div>

        {/* 1. Power-flow single-line schematic */}
        <div className="bg-[#060f20]/95 border border-cyan-500/25 rounded-lg p-5 space-y-4">
          <h3 className="font-display text-lg font-semibold text-cyan-200">
            Power-Flow Single-Line Schematic
          </h3>
          <svg
            viewBox="0 0 960 150"
            className="w-full h-auto select-none"
            role="img"
            aria-label="Power flow: coils, rectifier, router, supercapacitor bank, DC bus"
          >
            {nodes.map((n, i) => {
              const cx = 96 + i * 192;
              return (
                <g key={n.label}>
                  {i < nodes.length - 1 && (
                    <line
                      x1={cx + 78}
                      y1={62}
                      x2={cx + 114}
                      y2={62}
                      stroke="#22d3ee"
                      strokeWidth={2}
                      className="circuitry-flow"
                    />
                  )}
                  <rect
                    x={cx - 78}
                    y={30}
                    width={156}
                    height={64}
                    rx={8}
                    fill="#071225"
                    stroke="#22d3ee"
                    strokeOpacity={0.45}
                  />
                  <text x={cx} y={56} textAnchor="middle" fill="#e2e8f0" fontSize={12} fontWeight={600}>
                    {n.label}
                  </text>
                  <text x={cx} y={78} textAnchor="middle" fill="#67e8f9" fontSize={11} fontFamily="monospace">
                    {n.value}
                  </text>
                </g>
              );
            })}
          </svg>
          <p className="text-xs text-slate-400">
            Coils (Litz AC) ⟶ Schottky Rectifier ⟶ Smart Router ⟶ Supercapacitor Bank (165 F /
            48 V) ⟶ DC Bus (48 V / 42 A). Dashes animate with the live flow.
          </p>
        </div>

        {/* 2. Live cards */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="bg-[#060f20]/95 border border-cyan-500/25 rounded-lg p-4 space-y-2">
            <h4 className="font-display text-sm font-semibold text-cyan-200">
              Supercapacitor Bank
            </h4>
            <p className="text-xs font-mono text-slate-200">
              {CIRCUITRY_DATA.supercapacitorFarads} F @ {CIRCUITRY_DATA.supercapacitorVolts} V ·{' '}
              {CIRCUITRY_DATA.usableEnergyKJ} kJ usable ceiling
            </p>
            <p className="text-xs font-mono text-slate-200">
              Charge: {telemetry.charge.toFixed(0)}% · Stored ≈ {storedEnergyKJ} kJ
              (estimate from charge level)
            </p>
            <p className="text-xs font-mono text-slate-400">
              Buffer: {CIRCUITRY_DATA.boostReserveSeconds} s Boost reserve
            </p>
          </div>

          <div className="bg-[#060f20]/95 border border-cyan-500/25 rounded-lg p-4 space-y-2">
            <h4 className="font-display text-sm font-semibold text-cyan-200">
              Schottky Rectifier
            </h4>
            <p className="text-xs font-mono text-slate-200">
              Forward drop {CIRCUITRY_DATA.rectifierForwardDropV.toFixed(2)} V
            </p>
            <p className="text-xs font-mono text-slate-200">{CIRCUITRY_DATA.rectifier}</p>
            <p className="text-xs font-mono text-slate-400">
              Bridge temperature status: sim only — no sensor in this build
            </p>
          </div>

          <div className="bg-[#060f20]/95 border border-cyan-500/25 rounded-lg p-4 space-y-2">
            <h4 className="font-display text-sm font-semibold text-cyan-200">
              Four-Quadrant H-Bridge
            </h4>
            <p className="text-xs font-mono text-slate-200">{CIRCUITRY_DATA.routerTopology}</p>
            <p className="text-xs font-mono text-amber-200">
              Mode: {isBoost ? 'Boost (Motoring)' : 'Harvest (Generating)'}
            </p>
            <p className="text-xs font-mono text-slate-400">
              Live bus current {telemetry.coilCurrentA.toFixed(1)} A · I²R loss{' '}
              {telemetry.coilOhmicLossW.toFixed(1)} W (estimate)
            </p>
          </div>

          <div className="bg-[#060f20]/95 border border-cyan-500/25 rounded-lg p-4 space-y-2">
            <h4 className="font-display text-sm font-semibold text-cyan-200">
              Battery Reserve &amp; Required Energy
            </h4>
            <p className="text-xs font-mono text-slate-200">
              Required energy per shot: {requiredShotKJ.toFixed(1)} kJ ({envLabel.split(' ')[1] ?? ''})
            </p>
            <p className="text-xs font-mono text-slate-200">
              Bank reserve: {CIRCUITRY_DATA.usableEnergyKJ} kJ usable · {telemetry.charge.toFixed(0)}%
              charged
            </p>
            <p className="text-xs font-mono text-slate-400">
              Chemical battery bank: not specified in the design — for Ray to
              true (chemistry + Ah rating)
            </p>
          </div>

          <div className="bg-[#060f20]/95 border border-cyan-500/25 rounded-lg p-4 space-y-2">
            <h4 className="font-display text-sm font-semibold text-cyan-200">
              Coil — Live (Sim)
            </h4>
            <p className="text-xs font-mono text-slate-200">
              {envData.conductor} · {envData.turnsPerPhase} turns/phase · {envData.phases} phases
            </p>
            <p className="text-xs font-mono text-slate-200">
              {telemetry.coilVolts.toFixed(1)} V · {telemetry.coilCurrentA.toFixed(1)} A · I²R{' '}
              {telemetry.coilOhmicLossW.toFixed(1)} W
            </p>
            <p className="text-xs font-mono text-slate-400">
              Phase resistance {envData.resistanceEstimateOhm.toFixed(2)} Ω — estimate, for Ray
              to true
            </p>
          </div>

          <div className="bg-[#060f20]/95 border border-cyan-500/25 rounded-lg p-4 space-y-2">
            <h4 className="font-display text-sm font-semibold text-cyan-200">
              Generator Output (Sim)
            </h4>
            <p className="text-xs font-mono text-slate-200">
              {telemetry.simPowerWatts} W · Turbine {telemetry.turbineRpm} RPM · Pitch{' '}
              {telemetry.turbinePitchDeg}°
            </p>
            <p className="text-xs font-mono text-amber-300">{TARGET_OUTPUT_LABEL}</p>
            <p className="text-xs font-mono text-slate-400">
              Power is a simulation readout, not a measurement
            </p>
          </div>
        </div>

        {/* 3. Flow-to-power correlation */}
        <div className="bg-[#060f20]/95 border border-cyan-500/25 rounded-lg p-5 space-y-3">
          <h3 className="font-display text-lg font-semibold text-cyan-200">
            Hydrodynamic vs. Electrical Flow Correlation
          </h3>
          <p className="text-xs text-slate-300">
            Live: flow rate (normalized, cyan) against generator wattage (amber). Last 60
            samples. Flow now {telemetry.flowRateNorm.toFixed(2)} (norm) ·{' '}
            {telemetry.simPowerWatts} W.
          </p>
          <svg
            viewBox={`0 0 ${chartW} ${chartH}`}
            className="w-full h-auto select-none"
            role="img"
            aria-label="Rolling chart of normalized flow rate against generator wattage"
          >
            <line x1={8} y1={chartH - 12} x2={chartW - 8} y2={chartH - 12} stroke="#334155" strokeWidth={1} />
            <line x1={8} y1={12} x2={chartW - 8} y2={12} stroke="#1e293b" strokeWidth={1} />
            {flowPoints && (
              <polyline
                points={flowPoints}
                fill="none"
                stroke="#22d3ee"
                strokeWidth={2}
                strokeLinejoin="round"
              />
            )}
            {wattsPoints && (
              <polyline
                points={wattsPoints}
                fill="none"
                stroke="#fbbf24"
                strokeWidth={2}
                strokeLinejoin="round"
              />
            )}
            <text x={10} y={24} fill="#67e8f9" fontSize={11} fontFamily="monospace">
              Flow (norm 0–1.85)
            </text>
            <text x={10} y={40} fill="#fbbf24" fontSize={11} fontFamily="monospace">
              Power (W, 0–2400)
            </text>
          </svg>
          <p className="text-[11px] leading-relaxed text-slate-400">
            Stated flows from the design (not derived here): Envelope B peak pulse discharge
            62.5 L/s [G20]; Envelope A mean fill flow 12.5 L/s. The chart plots the sim&apos;s
            normalized flow rate because no L/s conversion is defined in the sim — nothing
            invented.
          </p>
        </div>
      </div>
    </section>
  );
};
