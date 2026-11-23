import React, { useEffect, useState } from 'react';
import { Pause, Play, Zap } from 'lucide-react';
import {
  FLOW_CHANNELS,
  PART_DETAILS,
  SimTelemetry,
  STAGES,
  TARGET_OUTPUT_LABEL,
  TIDE_PRESETS,
  TideLevel,
} from '../data/rayDesignData';

interface SchematicsProps {
  telemetry: SimTelemetry;
  tide: TideLevel;
  paused: boolean;
  plungerSetting: number;
  overEnergize: boolean;
  selectedStageId: string | null;
  onSelectStage: (stageId: string | null) => void;
  onTogglePause: () => void;
  onTriggerBoost: () => void;
  onSetHarvest: () => void;
  onOpenPartDetail: (partNumber: number) => void;
  onOpenCenterNeedle: () => void;
}

export const Schematics: React.FC<SchematicsProps> = ({
  telemetry,
  tide,
  paused,
  plungerSetting,
  overEnergize,
  selectedStageId,
  onSelectStage,
  onTogglePause,
  onTriggerBoost,
  onSetHarvest,
  onOpenPartDetail,
  onOpenCenterNeedle,
}) => {
  const [dotPhase, setDotPhase] = useState(0);
  const activeStage = STAGES.find((s) => s.id === (selectedStageId ?? '08')) ?? STAGES[7];
  const preset = TIDE_PRESETS[tide];
  const flowRateRef = React.useRef(telemetry.flowRateNorm);
  flowRateRef.current = telemetry.flowRateNorm;

  useEffect(() => {
    if (paused) return;
    let rafId = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.08);
      last = now;
      const rate = 0.14 + flowRateRef.current * 0.45 + (telemetry.mode === 'Boost' ? 0.35 : 0);
      setDotPhase((p) => (p + dt * rate) % 1);
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [paused, preset.intensity, telemetry.mode]);

  const isBoost = telemetry.mode === 'Boost';

  // Gemini spec File 6 — live valve-state tags, read straight from the
  // sim's valve-state machine (corrected spec File 2: flapperOpen /
  // footValveOpen / needleValve on SimTelemetry). FILLING: flappers open
  // (pan filling), foot shut, needle seated. TRIGGERED: cam snap —
  // flappers shut, foot shut, needle unseated. DISCHARGE: flappers shut,
  // foot open, needle unseated.
  const valves = {
    flappers: telemetry.flapperOpen ? 'OPEN' : 'SHUT',
    footValve: telemetry.footValveOpen ? 'OPEN' : 'SHUT',
    needleValve: telemetry.needleValve,
  };
  const plenumTag =
    telemetry.plenumBarGauge === null
      ? '— pick an envelope'
      : `${telemetry.plenumBarGauge.toFixed(2)} bar${telemetry.plenumOverPressure ? ' · OVER PRESSURE' : ''}`;

  // Flow schematic stage blocks along X (0..920)
  const flowNodes = [
    { id: '01', x: 56, y: 120, channel: 'THE POUR', short: 'Top Slots Intake' },
    { id: '02', x: 172, y: 120, channel: 'THE PLUNGER CHANNEL', short: 'Pan + Level/Cam' },
    { id: '03', x: 292, y: 120, channel: 'THE PLUNGER CHANNEL', short: 'Center Needle + ΔP' },
    { id: '04', x: 416, y: 120, channel: 'THE THROUGH-FLOW', short: 'Turbine Fins Bottom' },
    { id: '05', x: 540, y: 120, channel: 'THE VENTURI CHANNEL', short: 'Quad-Venturi Ports' },
    { id: '06', x: 660, y: 120, channel: 'THE VENTURI CHANNEL', short: 'Scrub Electrodes' },
    { id: '08', x: 782, y: 120, channel: 'THE VENTURI CHANNEL', short: 'Fibonacci Core + Halbach' },
    { id: '10', x: 902, y: 120, channel: 'THE RETURN', short: 'Ports Out Bottom' },
  ];

  // Animated dot positions along the horizontal flow trunk (x from 40 to 930)
  const flowDots = Array.from({ length: 12 }).map((_, i) => {
    const u = (dotPhase + i / 12) % 1;
    const x = 40 + u * 890;
    const y = 120 + (u > 0.62 && u < 0.86 ? Math.sin(u * 42) * 8 : 0);
    return { x, y, key: i };
  });

  // Electrical schematic animated charge dots
  // Harvest: Coils (x=280) -> Router (x=490) -> Supercapacitors (x=710) -> Mode A Harvest (x=885)
  // Boost: Supercapacitors (x=710) -> Router (x=490) -> Axial-Flow Turbine Motor Pulse (x=120)
  const electricalDots = Array.from({ length: 8 }).map((_, i) => {
    const u = (dotPhase * 1.15 + i / 8) % 1;
    if (isBoost) {
      // Reverse high-energy gold pulse from bank through router to turbine
      const x = 710 - u * 590;
      return { x, y: 185, key: i };
    }
    const x = 280 + u * 440;
    return { x, y: 125, key: i };
  });

  // Solar crown trickle dots into router
  const solarDots = Array.from({ length: 4 }).map((_, i) => {
    const u = (dotPhase * 0.7 + i / 4) % 1;
    return {
      x: 490,
      y: 48 + u * 62,
      key: i,
    };
  });

  return (
    <section
      aria-label="Electrical and Flow Schematics"
      className="blueprint-grid-subtle bg-[#050b16] min-h-[calc(100vh-120px)] px-6 py-6 text-slate-100"
    >
      <div className="max-w-[1360px] mx-auto space-y-6">
        {/* Header & Live Schematic Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-cyan-500/20">
          <div>
            <p className="text-xs font-mono tracking-wider text-cyan-300">
              LIVE ANIMATED SCHEMATICS · {TARGET_OUTPUT_LABEL}
            </p>
            <h2 className="font-display text-2xl font-semibold text-slate-100 mt-1">
              Flow Schematic &amp; Electrical Schematic
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenCenterNeedle}
              className="px-3 py-1.5 text-xs font-mono bg-[#0b182e] text-amber-200 border border-amber-400/45 rounded hover:bg-amber-400/15 transition-colors whitespace-nowrap shrink-0"
            >
              Air Plunger — Center Needle · 3D &amp; Spec
            </button>

            <div className="flex items-center gap-1 bg-[#071225] p-1 rounded border border-cyan-500/25">
              <button
                type="button"
                onClick={onSetHarvest}
                className={`px-3 py-1.5 text-xs rounded transition-colors whitespace-nowrap shrink-0 ${
                  !isBoost
                    ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/45 font-medium'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                Mode A: Harvest
              </button>
              <button
                type="button"
                onClick={onTriggerBoost}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded transition-colors whitespace-nowrap shrink-0 ${
                  isBoost
                    ? 'bg-amber-400/25 text-amber-200 border border-amber-400/50 font-medium'
                    : 'text-amber-300 hover:bg-amber-500/15 border border-transparent'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Mode B: Boost</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onTogglePause}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#071225] text-slate-200 border border-cyan-500/25 rounded hover:border-cyan-400/50 whitespace-nowrap shrink-0"
            >
              {paused ? <Play className="w-3.5 h-3.5 text-cyan-300" /> : <Pause className="w-3.5 h-3.5 text-cyan-300" />}
              <span>{paused ? 'Resume Flow' : 'Pause Flow'}</span>
            </button>
          </div>
        </div>

        {/* 1. FLOW SCHEMATIC */}
        <div className="bg-[#060f20]/95 border border-cyan-500/25 rounded-lg p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-semibold text-cyan-200">
                1. Hydraulic &amp; Center-Needle Chain-Reaction Flow Schematic
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                top slots → pan fills → level/cam trigger → Air Plunger — Center Needle + seal → ΔP {telemetry.displacementBar.toFixed(2)} bar → ports &amp; turbine generator fins out bottom
              </p>
            </div>
            <div className="text-xs font-mono text-amber-300">
              SIMULATION READOUTS — NOT MEASURED DATA · {telemetry.displacementBar.toFixed(2)} bar · ΔP {telemetry.deltaP} Pa · Pan {Math.round(telemetry.waterLevel * 100)}% ({telemetry.triggerPhase}) · Plunger {plungerSetting.toFixed(2)}x{overEnergize ? ' · OVER-ENERGIZED' : ''} · Tide {tide}
            </div>
          </div>

          {/* Gemini spec File 6 — regenerative cycle flow + live valve-state tags */}
          <div className="bg-[#040a15] border border-amber-400/30 rounded p-3 space-y-2">
            <p className="text-xs text-slate-200 leading-relaxed">
              <span className="font-mono text-[11px] text-amber-300 font-semibold">REGENERATIVE CYCLE: </span>
              Scuppers → Flappers → Chamber → Foot Valve → Venturis + Air Injection → Turbine → Center Vents → (air tank → plenum → lift chamber → upstroke → refill)
            </p>
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
              <span className="px-2 py-1 rounded border border-cyan-500/30 bg-[#071225] text-cyan-200">
                Flappers: {valves.flappers}
              </span>
              <span className="px-2 py-1 rounded border border-cyan-500/30 bg-[#071225] text-cyan-200">
                Foot Valve: {valves.footValve}
              </span>
              <span className="px-2 py-1 rounded border border-cyan-500/30 bg-[#071225] text-cyan-200">
                Needle Valve: {valves.needleValve}
              </span>
              <span className="px-2 py-1 rounded border border-cyan-500/30 bg-[#071225] text-cyan-200">
                Intake Levers: {telemetry.flapperOpen ? 'OPEN −35°' : 'SHUT 0°'}
              </span>
              <span className="px-2 py-1 rounded border border-cyan-500/30 bg-[#071225] text-cyan-200">
                Exhaust Levers: {telemetry.footValveOpen ? 'OPEN +45°' : 'SHUT 0°'}
              </span>
              <span className="px-2 py-1 rounded border border-cyan-500/30 bg-[#071225] text-cyan-200">
                Turbine Pitch: {telemetry.turbinePitchDeg}° · torque ×
                {(Math.sin((telemetry.turbinePitchDeg * Math.PI) / 180) / Math.sin((35 * Math.PI) / 180)).toFixed(2)}{' '}
                (sin-model estimate — for Ray to true)
              </span>
              <span className="px-2 py-1 rounded border border-cyan-500/30 bg-[#071225] text-cyan-200">
                Perimeter Ports: 12 × 60 mm — water cascades through the ring into the Quad-Venturi
                bells (count/diameter for Ray to true)
              </span>
              <span className={`px-2 py-1 rounded border bg-[#071225] ${telemetry.plenumOverPressure ? 'border-red-400/60 text-red-300' : 'border-amber-400/40 text-amber-200'}`}>
                Plenum Pressure: {plenumTag}
              </span>
              <span className="text-slate-400">
                Valve states derived from live phase ({telemetry.triggerPhase}); plenum is the full-stroke Boyle guard — pick an envelope to read it.
              </span>
            </div>
          </div>

          <div className="bg-[#040a15] border border-cyan-500/20 rounded p-3 overflow-x-auto">
            <svg
              viewBox="0 0 970 230"
              className="w-full min-w-[760px] h-auto select-none"
              role="img"
              aria-label="Animated hydraulic flow schematic across all five flow channels"
            >
              {/* Five Flow Channel Band Brackets */}
              {[
                { label: 'THE POUR', x1: 14, x2: 102 },
                { label: 'THE PLUNGER CHANNEL', x1: 114, x2: 350 },
                { label: 'THE THROUGH-FLOW', x1: 362, x2: 470 },
                { label: 'THE VENTURI CHANNEL', x1: 482, x2: 838 },
                { label: 'THE RETURN', x1: 850, x2: 956 },
              ].map((band) => (
                <g key={band.label}>
                  <rect
                    x={band.x1}
                    y="14"
                    width={band.x2 - band.x1}
                    height="24"
                    rx="2"
                    fill="rgba(0,229,255,0.06)"
                    stroke="rgba(0,229,255,0.28)"
                    strokeWidth="1"
                  />
                  <text
                    x={(band.x1 + band.x2) / 2}
                    y="30"
                    textAnchor="middle"
                    fill="#00e5ff"
                    fontSize="10"
                    fontFamily="IBM Plex Mono"
                    fontWeight="600"
                  >
                    {band.label}
                  </text>
                </g>
              ))}

              {/* Main Flow Conduit */}
              <line
                x1="20"
                y1="120"
                x2="950"
                y2="120"
                stroke="rgba(0,229,255,0.35)"
                strokeWidth="5"
                strokeLinecap="round"
              />

              {/* Animated Flow Dots */}
              {flowDots.map((d) => (
                <circle
                  key={d.key}
                  cx={d.x}
                  cy={d.y}
                  r="4.2"
                  fill={isBoost ? '#e5b842' : '#00e5ff'}
                />
              ))}

              {/* Stage Nodes */}
              {flowNodes.map((node) => {
                const isSel = activeStage.id === node.id;
                const stage = STAGES.find((s) => s.id === node.id)!;
                return (
                  <g
                    key={node.id}
                    className="cursor-pointer"
                    onClick={() => onSelectStage(node.id)}
                  >
                    <rect
                      x={node.x - 48}
                      y={node.y - 36}
                      width="96"
                      height="72"
                      rx="5"
                      fill={isSel ? 'rgba(229,184,66,0.18)' : '#091830'}
                      stroke={isSel ? '#e5b842' : '#00e5ff'}
                      strokeWidth={isSel ? 2 : 1.2}
                    />
                    <text
                      x={node.x}
                      y={node.y - 14}
                      textAnchor="middle"
                      fill={isSel ? '#fde68a' : '#00e5ff'}
                      fontSize="10.5"
                      fontFamily="IBM Plex Mono"
                      fontWeight="600"
                    >
                      STAGE {stage.id}
                    </text>
                    <text
                      x={node.x}
                      y={node.y + 4}
                      textAnchor="middle"
                      fill="#f1f5f9"
                      fontSize="10.5"
                      fontFamily="IBM Plex Sans"
                      fontWeight="500"
                    >
                      {node.short}
                    </text>
                    <text
                      x={node.x}
                      y={node.y + 22}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="9"
                      fontFamily="IBM Plex Mono"
                    >
                      {node.id === '03'
                        ? 'ΔP = P_in−P_throat'
                        : node.id === '08'
                        ? 'Core + Coils'
                        : 'Inspect'}
                    </text>
                  </g>
                );
              })}

              {/* Sea In / Sea Out indicators */}
              <text x="20" y="198" fill="#94a3b8" fontSize="11" fontFamily="IBM Plex Mono">
                STATIONARY MOORED BUOY · TOP SLOTS INTAKE →
              </text>
              <text
                x="950"
                y="198"
                textAnchor="end"
                fill="#00e5ff"
                fontSize="11"
                fontFamily="IBM Plex Mono"
              >
                → WATER SHOT OUT PORTS / TURBINE FINS BOTTOM
              </text>
            </svg>
          </div>
        </div>

        {/* 2. ELECTRICAL SCHEMATIC */}
        <div className="bg-[#060f20]/95 border border-cyan-500/25 rounded-lg p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-semibold text-amber-200">
                2. Electrical Energy, Magnetic Coils &amp; Solid-State Magnetic Resistance Schematic
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                magnetic coils (Fibonacci Core + Halbach Matrix) + solid-state magnetic resistance → Smart-Switch Power Router → High-Density Supercapacitors → Mode A Harvest / Mode B Boost
              </p>
            </div>
            <div className="text-xs font-mono text-cyan-300">
              SIMULATION READOUTS — NOT MEASURED DATA · {TARGET_OUTPUT_LABEL} · {telemetry.coilVolts.toFixed(1)} V · {telemetry.simPowerWatts} W (Sim) · Bank {telemetry.charge.toFixed(0)}% ·{' '}
              {isBoost ? 'MODE B: BOOST PULSE' : 'MODE A: HARVEST'}
            </div>
          </div>

          <div className="bg-[#040a15] border border-cyan-500/20 rounded p-3 overflow-x-auto">
            <svg
              viewBox="0 0 970 250"
              className="w-full min-w-[760px] h-auto select-none"
              role="img"
              aria-label="Animated electrical schematic from induction coils through smart-switch router to supercapacitor bank"
            >
              {/* Solar Crown trickle path down into Router */}
              <line
                x1="490"
                y1="44"
                x2="490"
                y2="110"
                stroke="#e5b842"
                strokeWidth="2.5"
                strokeDasharray="5 4"
              />
              {solarDots.map((d) => (
                <circle key={d.key} cx={d.x} cy={d.y} r="3.2" fill="#e5b842" />
              ))}

              {/* Mode A Harvest Bus (upper rail: Coils -> Router -> Supercapacitors -> Harvest State) */}
              <path
                d="M 275 125 L 880 125"
                fill="none"
                stroke={!isBoost ? 'rgba(0,229,255,0.55)' : 'rgba(0,229,255,0.2)'}
                strokeWidth="4"
              />

              {/* Mode B Boost Pulse Return Bus (lower rail: Supercapacitors -> Router -> Axial-Flow Turbine) */}
              <path
                d="M 710 185 L 120 185 L 120 156"
                fill="none"
                stroke={isBoost ? 'rgba(229,184,66,0.85)' : 'rgba(229,184,66,0.2)'}
                strokeWidth={isBoost ? '5' : '3'}
                strokeDasharray={isBoost ? undefined : '6 4'}
              />

              {/* Animated Electrical Dots */}
              {electricalDots.map((d) => (
                <circle
                  key={d.key}
                  cx={d.x}
                  cy={d.y}
                  r={isBoost ? 5.2 : 4.2}
                  fill={isBoost ? '#e5b842' : '#00e5ff'}
                />
              ))}

              {/* Solar Crown Node (Stage 12) */}
              <g className="cursor-pointer" onClick={() => onSelectStage('12')}>
                <rect
                  x="412"
                  y="12"
                  width="156"
                  height="38"
                  rx="4"
                  fill={activeStage.id === '12' ? 'rgba(229,184,66,0.18)' : '#091830'}
                  stroke={activeStage.id === '12' ? '#e5b842' : '#e5b842'}
                  strokeWidth={activeStage.id === '12' ? 2 : 1.2}
                />
                <text x="490" y="29" textAnchor="middle" fill="#fde68a" fontSize="10" fontFamily="IBM Plex Mono">
                  STAGE 12 · SOLAR CROWN
                </text>
                <text x="490" y="42" textAnchor="middle" fill="#cbd5e1" fontSize="9.5" fontFamily="IBM Plex Sans">
                  Top-up bank &amp; sensors
                </text>
              </g>

              {/* Axial-Flow Turbine Hybrid Motor/Generator Node (Stage 04) */}
              <g className="cursor-pointer" onClick={() => onSelectStage('04')}>
                <rect
                  x="26"
                  y="88"
                  width="172"
                  height="72"
                  rx="5"
                  fill={activeStage.id === '04' ? 'rgba(229,184,66,0.18)' : '#091830'}
                  stroke={isBoost || activeStage.id === '04' ? '#e5b842' : '#00e5ff'}
                  strokeWidth={activeStage.id === '04' ? 2 : 1.3}
                />
                <text x="112" y="109" textAnchor="middle" fill="#00e5ff" fontSize="10" fontFamily="IBM Plex Mono">
                  STAGE 04 · TURBINE
                </text>
                <text x="112" y="126" textAnchor="middle" fill="#f1f5f9" fontSize="11" fontFamily="IBM Plex Sans" fontWeight="600">
                  Axial-Flow Turbine
                </text>
                <text x="112" y="142" textAnchor="middle" fill="#94a3b8" fontSize="9.5" fontFamily="IBM Plex Sans">
                  Hybrid Motor / Generator
                </text>
              </g>

              {/* Copper Induction Coils + Core Node (Stages 07 & 08) */}
              <g className="cursor-pointer" onClick={() => onSelectStage('08')}>
                <rect
                  x="224"
                  y="88"
                  width="178"
                  height="72"
                  rx="5"
                  fill={activeStage.id === '08' ? 'rgba(229,184,66,0.18)' : '#091830'}
                  stroke={activeStage.id === '08' ? '#e5b842' : '#d97d3a'}
                  strokeWidth={activeStage.id === '08' ? 2 : 1.4}
                />
                <text x="313" y="109" textAnchor="middle" fill="#fbbf24" fontSize="10" fontFamily="IBM Plex Mono">
                  STAGES 07–08 · MAGNETIC COILS
                </text>
                <text x="313" y="126" textAnchor="middle" fill="#f1f5f9" fontSize="11" fontFamily="IBM Plex Sans" fontWeight="600">
                  Magnetic Coils &amp; Solid-State Res.
                </text>
                <text x="313" y="142" textAnchor="middle" fill="#94a3b8" fontSize="9.5" fontFamily="IBM Plex Sans">
                  Fibonacci Core + Halbach Matrix
                </text>
              </g>

              {/* Smart-Switch Power Router Node (Stage 11) */}
              <g className="cursor-pointer" onClick={() => onSelectStage('11')}>
                <rect
                  x="426"
                  y="88"
                  width="156"
                  height="72"
                  rx="5"
                  fill={activeStage.id === '11' ? 'rgba(229,184,66,0.18)' : '#091830'}
                  stroke={isBoost || activeStage.id === '11' ? '#e5b842' : '#00e5ff'}
                  strokeWidth={activeStage.id === '11' ? 2 : 1.4}
                />
                <text x="504" y="109" textAnchor="middle" fill="#00e5ff" fontSize="10" fontFamily="IBM Plex Mono">
                  STAGE 11 · ROUTER
                </text>
                <text x="504" y="126" textAnchor="middle" fill="#f1f5f9" fontSize="11" fontFamily="IBM Plex Sans" fontWeight="600">
                  Smart-Switch Power Router
                </text>
                <text x="504" y="142" textAnchor="middle" fill={isBoost ? '#fde68a' : '#67e8f9'} fontSize="9.5" fontFamily="IBM Plex Mono">
                  {isBoost ? 'BOOST DISCHARGE' : 'STORE TO BANK'}
                </text>
              </g>

              {/* High-Density Supercapacitors & Base (Stages 09 & 10) */}
              <g className="cursor-pointer" onClick={() => onSelectStage('09')}>
                <rect
                  x="612"
                  y="88"
                  width="178"
                  height="72"
                  rx="5"
                  fill={activeStage.id === '09' ? 'rgba(229,184,66,0.18)' : '#091830'}
                  stroke={activeStage.id === '09' ? '#e5b842' : '#00e5ff'}
                  strokeWidth={activeStage.id === '09' ? 2 : 1.4}
                />
                <text x="701" y="109" textAnchor="middle" fill="#00e5ff" fontSize="10" fontFamily="IBM Plex Mono">
                  STAGES 09–10 · CAP BANK
                </text>
                <text x="701" y="126" textAnchor="middle" fill="#f1f5f9" fontSize="11" fontFamily="IBM Plex Sans" fontWeight="600">
                  High-Density Supercapacitors
                </text>
                <text x="701" y="142" textAnchor="middle" fill="#94a3b8" fontSize="9.5" fontFamily="IBM Plex Mono">
                  Charge: {telemetry.charge.toFixed(0)}% (Sim)
                </text>
              </g>

              {/* Harvest / Boost Mode Terminal */}
              <rect
                x="822"
                y="92"
                width="126"
                height="64"
                rx="5"
                fill={isBoost ? 'rgba(229,184,66,0.15)' : 'rgba(0,229,255,0.1)'}
                stroke={isBoost ? '#e5b842' : '#00e5ff'}
                strokeWidth="1.4"
              />
              <text x="885" y="116" textAnchor="middle" fill="#f1f5f9" fontSize="11" fontFamily="IBM Plex Sans" fontWeight="600">
                {isBoost ? 'Mode B: Boost' : 'Mode A: Harvest'}
              </text>
              <text x="885" y="135" textAnchor="middle" fill={isBoost ? '#fde68a' : '#67e8f9'} fontSize="9.5" fontFamily="IBM Plex Mono">
                {isBoost ? '1-Pulse Release' : 'Quietly Storing'}
              </text>

              <text x="415" y="210" textAnchor="middle" fill={isBoost ? '#e5b842' : '#64748b'} fontSize="10.5" fontFamily="IBM Plex Mono">
                MODE B BOOST PULSE: BANK → ROUTER → HYBRID AXIAL-FLOW TURBINE
              </text>
            </svg>
          </div>
        </div>

        {/* Selected Stage Detail + Five Flow Channels Strip */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-[#060f20]/95 border border-amber-400/30 rounded-lg p-5 space-y-3">
            <div className="text-xs font-mono text-amber-300">
              STAGE {activeStage.id} · {activeStage.flowChannel}
            </div>
            <h3 className="font-display text-lg font-semibold text-slate-100">
              {activeStage.name}
            </h3>
            {activeStage.diagramLabel && (
              <div className="text-xs font-mono text-cyan-300">
                Diagram label: {activeStage.diagramLabel}
              </div>
            )}
            <p className="text-sm leading-relaxed text-slate-200">
              &ldquo;{activeStage.note}&rdquo;
            </p>
            <div className="border-t border-cyan-500/15 pt-3 space-y-1.5">
              <div className="text-[11px] font-mono text-cyan-300">
                OPEN PART 3D &amp; TECHNICAL DESCRIPTION
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={onOpenCenterNeedle}
                  className="text-xs px-2.5 py-1 bg-[#0b182e] text-amber-200 border border-amber-400/45 rounded hover:bg-amber-400/15 transition-colors"
                >
                  Air Plunger — Center Needle · 3D &amp; Spec
                </button>
                {Object.values(PART_DETAILS)
                  .filter((p) => p.stageIds.includes(activeStage.id))
                  .map((p) => (
                    <button
                      key={p.number}
                      type="button"
                      onClick={() => onOpenPartDetail(p.number)}
                      className="text-xs px-2.5 py-1 bg-[#0b182e] text-cyan-200 border border-cyan-400/35 rounded hover:border-amber-400 hover:text-amber-200 transition-colors"
                    >
                      Part {String(p.number).padStart(2, '0')}: {p.part} · 3D &amp; Spec
                    </button>
                  ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-[#060f20]/95 border border-cyan-500/25 rounded-lg p-5">
            <h3 className="font-display text-base font-semibold text-cyan-200 mb-3">
              The Five Flow Channels (Core Atlas Alignment)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FLOW_CHANNELS.map((ch) => (
                <div
                  key={ch.id}
                  className="bg-[#040a15] border border-cyan-500/15 rounded p-3 space-y-1"
                >
                  <div className="text-xs font-mono font-semibold text-cyan-300">
                    {ch.title}
                  </div>
                  <p className="text-xs leading-relaxed text-slate-300">
                    {ch.sourceSummary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
