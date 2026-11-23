import React, { useState } from 'react';
import {
  DIAGRAM_IMAGE_SRC,
  DIAGRAM_LABELS,
  FLOW_CHANNELS,
  PART_DETAILS,
  PIER_CUTAWAY_IMAGE_SRC,
  SimTelemetry,
  STAGES,
  TARGET_OUTPUT_LABEL,
  TideLevel,
} from '../data/rayDesignData';
import { OperatingPrincipleAndSizing } from './OperatingPrincipleAndSizing';

interface TechnicalDrawingsProps {
  telemetry: SimTelemetry;
  tide: TideLevel;
  selectedStageId: string | null;
  onSelectStage: (stageId: string | null) => void;
  onOpenPartDetail: (partNumber: number) => void;
  onOpenCenterNeedle: () => void;
}

type DrawingPlate = 'pier' | 'exploded' | 'detail';

export const TechnicalDrawings: React.FC<TechnicalDrawingsProps> = ({
  telemetry,
  tide,
  selectedStageId,
  onSelectStage,
  onOpenPartDetail,
  onOpenCenterNeedle,
}) => {
  const [plate, setPlate] = useState<DrawingPlate>('pier');
  const activeStage = STAGES.find((s) => s.id === (selectedStageId ?? '08')) ?? STAGES[7];

  return (
    <section
      aria-label="Technical Blueprint Drawings"
      className="blueprint-grid min-h-[calc(100vh-120px)] px-6 py-6 text-slate-100"
    >
      <div className="max-w-[1360px] mx-auto space-y-6">
        {/* Plate Selector & Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-cyan-500/20">
          <div>
            <p className="text-xs font-mono tracking-wider text-cyan-300">
              BLUEPRINT CAD PLATES · DRAFTING CYAN #00E5FF / FORGED GOLD #E5B842
            </p>
            <h2 className="font-display text-2xl font-semibold text-slate-100 mt-1">
              Technical Drawings — Core &amp; Full Unit
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
                onClick={() => setPlate('pier')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                  plate === 'pier'
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/45'
                    : 'text-slate-300 hover:text-white border border-transparent'
                }`}
              >
                Plate 01: Pier Cutaway &amp; 10 Labels
              </button>
              <button
                type="button"
                onClick={() => setPlate('exploded')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                  plate === 'exploded'
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/45'
                    : 'text-slate-300 hover:text-white border border-transparent'
                }`}
              >
                Plate 02: 12-Stage Exploded Stack
              </button>
              <button
                type="button"
                onClick={() => setPlate('detail')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                  plate === 'detail'
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/45'
                    : 'text-slate-300 hover:text-white border border-transparent'
                }`}
              >
                Plate 03: Coil Winding &amp; Venturi Detail
              </button>
            </div>
          </div>
        </div>

        {/* Synced Live Telemetry Strip across all 4 sections */}
        <div className="bg-[#060f20]/95 border border-cyan-500/20 rounded-lg px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3 font-mono">
            <span className="text-amber-300">SIMULATION READOUTS — NOT MEASURED DATA</span>
            <span className="text-cyan-200 border border-cyan-400/35 bg-[#040a15] px-2 py-0.5 rounded">
              {TARGET_OUTPUT_LABEL}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 font-mono text-slate-200">
            <span>Tide: <strong className="text-cyan-300">{tide}</strong></span>
            <span>Disp: <strong className="text-amber-300">{telemetry.displacementBar.toFixed(2)} bar</strong></span>
            <span>Air Tank: <strong className="text-cyan-300">{telemetry.plungerAirBar.toFixed(2)} bar</strong></span>
            <span>ΔP: <strong className="text-cyan-300">{telemetry.deltaP} Pa</strong></span>
            <span>
              Pan: <strong className="text-cyan-200">{Math.round(telemetry.waterLevel * 100)}%</strong> ({telemetry.triggerPhase})
            </span>
            <span>Turbine: <strong className="text-slate-100">{telemetry.turbineRpm} RPM</strong></span>
            <span>Volts: <strong className="text-amber-300">{telemetry.coilVolts.toFixed(1)} V</strong></span>
            <span>Bank: <strong className="text-cyan-300">{telemetry.charge.toFixed(0)}%</strong></span>
            <span>{telemetry.mode === 'Boost' ? 'Mode B: Boost' : 'Mode A: Harvest'}</span>
          </div>
        </div>

        {/* Main Plate Area + Stage Inspector Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-9 bg-[#060f20]/95 border border-cyan-500/25 rounded-lg p-5">
            {plate === 'pier' && (
              <div className="space-y-6">
                {/* CAD Pier Cutaway Elevation Blueprint */}
                <div>
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <h3 className="font-display text-base font-semibold text-cyan-200">
                      Pier Cutaway Elevation — Waterline Mounting &amp; 10-Part Callouts
                    </h3>
                    <span className="text-xs font-mono text-amber-300">
                      NO INVENTED DIMENSIONS · RAY&apos;S EXACT LABELS
                    </span>
                  </div>

                  <div className="bg-[#040a15] border border-cyan-500/20 rounded p-3 overflow-x-auto">
                    <svg
                      viewBox="0 0 980 620"
                      className="w-full min-w-[680px] h-auto select-none"
                      role="img"
                      aria-label="Pier cutaway blueprint elevation of the Helix-Force Buoy"
                    >
                      <defs>
                        <pattern id="bpGridSmall" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path
                            d="M 20 0 L 0 0 0 20"
                            fill="none"
                            stroke="rgba(0,229,255,0.07)"
                            strokeWidth="0.7"
                          />
                        </pattern>
                        <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgba(0,229,255,0.16)" />
                          <stop offset="100%" stopColor="rgba(0,40,80,0.06)" />
                        </linearGradient>
                      </defs>
                      <rect width="980" height="620" fill="url(#bpGridSmall)" />

                      {/* Seafloor & Waterline */}
                      <rect x="0" y="138" width="980" height="454" fill="url(#waterGrad)" />
                      <path
                        d="M 0 138 Q 70 130 140 138 T 280 138 T 420 138 T 560 138 T 700 138 T 840 138 T 980 138"
                        fill="none"
                        stroke="#00e5ff"
                        strokeWidth="1.6"
                      />
                      <text x="20" y="128" fill="#00e5ff" fontSize="11" fontFamily="IBM Plex Mono">
                        SURFACE WATERLINE (THE POUR)
                      </text>

                      {/* Wooden Pier Structure on Left */}
                      <rect x="35" y="102" width="175" height="18" fill="#132238" stroke="#e5b842" strokeWidth="1.2" />
                      <rect x="65" y="120" width="18" height="472" fill="#0c192d" stroke="#e5b842" strokeWidth="1" strokeDasharray="4 3" />
                      <rect x="155" y="120" width="18" height="472" fill="#0c192d" stroke="#e5b842" strokeWidth="1" strokeDasharray="4 3" />
                      <line x1="195" y1="112" x2="405" y2="112" stroke="#e5b842" strokeWidth="1" strokeDasharray="5 4" />
                      <text x="45" y="94" fill="#e5b842" fontSize="11" fontFamily="IBM Plex Mono">
                        DOCK / PIER MOUNTING
                      </text>

                      {/* Center Datum Axis */}
                      <line
                        x1="490"
                        y1="32"
                        x2="490"
                        y2="606"
                        stroke="rgba(0,229,255,0.35)"
                        strokeWidth="1"
                        strokeDasharray="8 4 2 4"
                      />

                      {/* Seafloor Datum & Mooring Weights (Buoy is Stationary — Does NOT Bob) */}
                      <line x1="0" y1="592" x2="980" y2="592" stroke="#e5b842" strokeWidth="1.2" strokeDasharray="6 4" />
                      <rect x="332" y="576" width="44" height="16" rx="2" fill="#18273e" stroke="#e5b842" strokeWidth="1.2" />
                      <rect x="604" y="576" width="44" height="16" rx="2" fill="#18273e" stroke="#e5b842" strokeWidth="1.2" />
                      <line x1="354" y1="576" x2="412" y2="468" stroke="#e5b842" strokeWidth="1.2" strokeDasharray="3 2" />
                      <line x1="626" y1="576" x2="568" y2="468" stroke="#e5b842" strokeWidth="1.2" strokeDasharray="3 2" />
                      <text x="20" y="582" fill="#e5b842" fontSize="10.5" fontFamily="IBM Plex Mono">
                        STATIONARY MOORED BUOY (DOES NOT BOB) · WEIGHTS TO SEA FLOOR
                      </text>

                      {/* Buoy Cutaway Silhouette */}
                      {/* Outer Cylinder Wall */}
                      <rect x="405" y="76" width="170" height="404" rx="8" fill="rgba(8,21,42,0.85)" stroke="#00e5ff" strokeWidth="1.8" />
                      {/* Solar Crown (Stage 12) */}
                      <rect x="401" y="64" width="178" height="12" rx="3" fill="#0d2542" stroke="#e5b842" strokeWidth="1.3" />
                      {/* Top Slots / Scuppers (Stage 01) */}
                      <rect x="398" y="84" width="20" height="22" fill="#050b16" stroke="#00e5ff" strokeWidth="1.2" />
                      <rect x="562" y="84" width="20" height="22" fill="#050b16" stroke="#00e5ff" strokeWidth="1.2" />
                      {/* Pan Fill Water Column + Level / Cam Trigger */}
                      <rect
                        x="418"
                        y={166 - Math.round(telemetry.waterLevel * 44)}
                        width="144"
                        height={Math.round(telemetry.waterLevel * 44)}
                        fill="rgba(0,229,255,0.2)"
                      />
                      <circle
                        cx="556"
                        cy="126"
                        r="7"
                        fill={telemetry.triggerFired ? '#e5b842' : '#0b1c36'}
                        stroke="#e5b842"
                        strokeWidth="1.4"
                      />
                      <line x1="538" y1="126" x2="556" y2="126" stroke="#e5b842" strokeWidth="1.4" />
                      {/* Central Air-Plunger (Weighted Piston) + Airtight Seal */}
                      <rect x="430" y="144" width="120" height="22" rx="2" fill="#1b3b63" stroke="#e5b842" strokeWidth="1.4" />
                      <line x1="426" y1="149" x2="554" y2="149" stroke="#00e5ff" strokeWidth="2" />
                      {/* Air Plunger — Center Needle (full-height slim central needle shaft) */}
                      <rect
                        x="485"
                        y="46"
                        width="10"
                        height="442"
                        rx="4"
                        fill="rgba(0,229,255,0.22)"
                        stroke="#00e5ff"
                        strokeWidth="1.6"
                      />
                      <polygon points="490,34 483,48 497,48" fill="#e5b842" />
                      {/* Air Accelerator Unit (Stage 03) */}
                      <polygon points="418,176 562,176 525,204 455,204" fill="none" stroke="#e5b842" strokeWidth="1.3" strokeDasharray="3 2" />
                      {/* Axial-Flow Turbine (Stage 04) */}
                      <rect x="444" y="210" width="92" height="24" fill="#0c2440" stroke="#00e5ff" strokeWidth="1.3" />
                      <line x1="448" y1="222" x2="532" y2="222" stroke="#e5b842" strokeWidth="1.2" />
                      {/* Quad-Venturi Acceleration Ports (Stage 05) */}
                      <polygon points="405,244 438,252 438,266 405,274" fill="#09213c" stroke="#00e5ff" strokeWidth="1.2" />
                      <polygon points="575,244 542,252 542,266 575,274" fill="#09213c" stroke="#00e5ff" strokeWidth="1.2" />
                      {/* Graphene-Ion Scrub Electrodes (Stage 06) */}
                      <line x1="436" y1="274" x2="544" y2="274" stroke="#00e5ff" strokeWidth="2.5" strokeDasharray="6 3" />
                      {/* Halbach Magnetic Matrix (Stage 07) */}
                      <rect x="415" y="292" width="22" height="106" fill="#152b48" stroke="#e5b842" strokeWidth="1.4" />
                      <rect x="543" y="292" width="22" height="106" fill="#152b48" stroke="#e5b842" strokeWidth="1.4" />
                      {/* Fibonacci Helical Core + Copper Coils (Stage 08) */}
                      <path
                        d="M 455 300 C 525 300, 525 325, 455 325 C 430 325, 540 350, 465 352 C 445 354, 520 375, 480 380 C 468 383, 505 395, 490 402"
                        fill="none"
                        stroke="#00e5ff"
                        strokeWidth="2.4"
                      />
                      {/* High-Density Supercapacitors (Stage 09) */}
                      {[420, 434, 448, 532, 546, 560].map((cx) => (
                        <rect
                          key={cx}
                          x={cx - 5}
                          y="416"
                          width="10"
                          height="38"
                          rx="2"
                          fill="#0a3254"
                          stroke="#00e5ff"
                          strokeWidth="1.1"
                        />
                      ))}
                      {/* Smart-Switch Power Router (Stage 11) */}
                      <rect x="468" y="422" width="44" height="24" rx="2" fill="#182a45" stroke="#e5b842" strokeWidth="1.3" />
                      {/* Smart-Switch Capacitor Base & Bottom Turbine Discharge Fins (Stage 10) */}
                      <polygon points="462,480 518,480 534,508 446,508" fill="#0d223c" stroke="#00e5ff" strokeWidth="1.4" />

                      {/* Riser pipe from Air Tank Underneath the Unit up to Piston / Center Needle */}
                      <line
                        x1="504"
                        y1="524"
                        x2="504"
                        y2="166"
                        stroke="#00e5ff"
                        strokeWidth="2.4"
                        strokeDasharray="6 3"
                      />
                      <circle cx="504" cy="166" r="3" fill="#00e5ff" />

                      {/* Air Tank — Underneath the Unit (below base, above seafloor mooring weights) */}
                      <line x1="452" y1="480" x2="452" y2="524" stroke="#94a3b8" strokeWidth="1.4" />
                      <line x1="528" y1="480" x2="528" y2="524" stroke="#94a3b8" strokeWidth="1.4" />
                      <rect
                        x="432"
                        y="524"
                        width="116"
                        height="30"
                        rx="15"
                        fill="#112847"
                        stroke="#e5b842"
                        strokeWidth="1.8"
                      />
                      <line x1="470" y1="524" x2="470" y2="554" stroke="#00e5ff" strokeWidth="1.1" />
                      <line x1="510" y1="524" x2="510" y2="554" stroke="#00e5ff" strokeWidth="1.1" />

                      {/* Air Tank — Underneath the Unit Callout */}
                      <g className="cursor-pointer" onClick={onOpenCenterNeedle}>
                        <line x1="548" y1="539" x2="625" y2="539" stroke="#e5b842" strokeWidth="1.6" />
                        <circle cx="548" cy="539" r="3.5" fill="#e5b842" />
                        <text
                          x="633"
                          y="534"
                          textAnchor="start"
                          fill="#fde68a"
                          fontSize="11.5"
                          fontFamily="IBM Plex Mono"
                          fontWeight="600"
                        >
                          Air Tank — Underneath the Unit
                        </text>
                        <text
                          x="633"
                          y="549"
                          textAnchor="start"
                          fill="#67e8f9"
                          fontSize="10.5"
                          fontFamily="IBM Plex Sans"
                        >
                          &ldquo;That&apos;s what drives the piston up.&rdquo;
                        </text>
                        <text
                          x="633"
                          y="563"
                          textAnchor="start"
                          fill="#cbd5e1"
                          fontSize="10"
                          fontFamily="IBM Plex Mono"
                        >
                          Return stroke — drives the piston up.
                        </text>
                      </g>

                      {/* Riser pipe callout on left */}
                      <g className="cursor-pointer" onClick={onOpenCenterNeedle}>
                        <line x1="504" y1="516" x2="355" y2="516" stroke="#00e5ff" strokeWidth="1.3" />
                        <circle cx="504" cy="516" r="3" fill="#00e5ff" />
                        <text
                          x="347"
                          y="520"
                          textAnchor="end"
                          fill="#67e8f9"
                          fontSize="10.5"
                          fontFamily="IBM Plex Mono"
                        >
                          Riser pipe to Piston / Center Needle
                        </text>
                      </g>

                      {/* Featured Callout: Air Plunger — Center Needle & Level/Cam Trigger */}
                      <g className="cursor-pointer" onClick={onOpenCenterNeedle}>
                        <line x1="490" y1="42" x2="355" y2="42" stroke="#e5b842" strokeWidth="1.6" />
                        <circle cx="490" cy="42" r="3.5" fill="#e5b842" />
                        <text
                          x="347"
                          y="46"
                          textAnchor="end"
                          fill="#fde68a"
                          fontSize="11.5"
                          fontFamily="IBM Plex Mono"
                          fontWeight="600"
                        >
                          Air Plunger — Center Needle (Adjustable)
                        </text>
                      </g>
                      <g className="cursor-pointer" onClick={onOpenCenterNeedle}>
                        <line x1="563" y1="126" x2="625" y2="126" stroke="#00e5ff" strokeWidth="1.4" />
                        <circle cx="563" cy="126" r="3" fill="#00e5ff" />
                        <text
                          x="633"
                          y="130"
                          textAnchor="start"
                          fill="#67e8f9"
                          fontSize="11"
                          fontFamily="IBM Plex Mono"
                        >
                          Level / Cam Trigger (Pan Water Hit)
                        </text>
                      </g>

                      {/* Callout Leader Lines for the 10 Exact Labels + Stage 03 & Stage 12 */}
                      {[
                        { y: 94, side: 'left', lx: 398, text: 'Central Air-Plunger top scupper Intake', stage: '01' },
                        { y: 155, side: 'right', lx: 560, text: 'Central Air-Plunger (Weighted Piston)', stage: '02' },
                        { y: 192, side: 'left', lx: 438, text: 'Air Accelerator Unit — Pascal ΔP (THE ENHANCEMENT)', stage: '03' },
                        { y: 222, side: 'right', lx: 536, text: 'Axial-Flow Turbine (Hybrid Motor/Generator)', stage: '04' },
                        { y: 259, side: 'left', lx: 405, text: 'Quad-Venturi Acceleration Ports', stage: '05' },
                        { y: 274, side: 'right', lx: 544, text: 'Graphene-Ion Scrub Electrodes', stage: '06' },
                        { y: 326, side: 'left', lx: 415, text: 'Halbach Magnetic Matrix', stage: '07' },
                        { y: 365, side: 'right', lx: 525, text: 'Fibonacci Helical Core', stage: '08' },
                        { y: 435, side: 'left', lx: 415, text: 'High-Density Supercapacitors', stage: '09' },
                        { y: 468, side: 'right', lx: 575, text: 'Smart-Switch Capacitor Base', stage: '10' },
                        { y: 492, side: 'left', lx: 468, text: 'Smart-Switch Power Router', stage: '11' },
                        { y: 68, side: 'right', lx: 579, text: 'Solar Crown', stage: '12' },
                      ].map((item) => {
                        const isSel = activeStage.id === item.stage;
                        const color = isSel ? '#e5b842' : '#00e5ff';
                        const tx = item.side === 'left' ? 355 : 625;
                        return (
                          <g
                            key={item.stage}
                            className="cursor-pointer"
                            onClick={() => onSelectStage(item.stage)}
                          >
                            <line
                              x1={item.lx}
                              y1={item.y}
                              x2={tx}
                              y2={item.y}
                              stroke={color}
                              strokeWidth={isSel ? 1.8 : 1}
                            />
                            <circle cx={item.lx} cy={item.y} r="3" fill={color} />
                            <text
                              x={item.side === 'left' ? tx - 8 : tx + 8}
                              y={item.y + 4}
                              textAnchor={item.side === 'left' ? 'end' : 'start'}
                              fill={isSel ? '#e5b842' : '#dbeafe'}
                              fontSize="11.5"
                              fontFamily="IBM Plex Sans"
                              fontWeight={isSel ? '600' : '400'}
                            >
                              {item.stage} · {item.text}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>

                {/* Ray's Canonical Source Sheets */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#040a15] border border-cyan-500/20 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-cyan-300">
                        SOURCE SHEET: 4527_2_q532.jpg
                      </span>
                      <span className="text-xs text-slate-400">Canonical Pier Cutaway</span>
                    </div>
                    <img
                      src={PIER_CUTAWAY_IMAGE_SRC}
                      alt="Ray Mroczkowski's canonical pier cutaway of the Helix-Force Buoy"
                      referrerPolicy="no-referrer"
                      className="w-full h-auto rounded border border-cyan-500/15"
                    />
                  </div>

                  <div className="bg-[#040a15] border border-cyan-500/20 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-amber-300">
                        SOURCE SHEET: 341_12_upel.png (10 Labeled Parts)
                      </span>
                      <span className="text-xs text-slate-400">Tap pin to inspect</span>
                    </div>
                    <div className="relative">
                      <img
                        src={DIAGRAM_IMAGE_SRC}
                        alt="Ray Mroczkowski's 10-part labeled design diagram"
                        referrerPolicy="no-referrer"
                        className="w-full h-auto rounded border border-cyan-500/15"
                      />
                      {DIAGRAM_LABELS.map((pin) => {
                        const isSel = activeStage.id === pin.stageId;
                        return (
                          <button
                            key={pin.id}
                            type="button"
                            onClick={() => onSelectStage(pin.stageId)}
                            title={pin.label}
                            style={{ left: `${pin.xPercent}%`, top: `${pin.yPercent}%` }}
                            className={`absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full text-[10px] font-mono font-semibold border transition-transform hover:scale-110 ${
                              isSel
                                ? 'bg-amber-400 text-slate-950 border-white'
                                : 'bg-[#050b16]/90 text-cyan-200 border-cyan-400'
                            }`}
                          >
                            {pin.id}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {plate === 'exploded' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h3 className="font-display text-base font-semibold text-cyan-200">
                    Exploded 12-Stage Stack — Canonical Order (01–12)
                  </h3>
                  <span className="text-xs font-mono text-amber-300">
                    NO INVENTED DIMENSIONS · RAY&apos;S EXACT LABELS
                  </span>
                </div>

                <div className="bg-[#040a15] border border-cyan-500/20 rounded p-4 overflow-x-auto">
                  <svg
                    viewBox="0 0 940 740"
                    className="w-full min-w-[660px] h-auto select-none"
                    role="img"
                    aria-label="Exploded blueprint stack of all 12 stages in Ray's order"
                  >
                    <defs>
                      <pattern id="bpGridExp" width="24" height="24" patternUnits="userSpaceOnUse">
                        <path
                          d="M 24 0 L 0 0 0 24"
                          fill="none"
                          stroke="rgba(0,229,255,0.065)"
                          strokeWidth="0.7"
                        />
                      </pattern>
                    </defs>
                    <rect width="940" height="740" fill="url(#bpGridExp)" />

                    {/* Center Assembly Axis */}
                    <line
                      x1="310"
                      y1="26"
                      x2="310"
                      y2="718"
                      stroke="rgba(229,184,66,0.45)"
                      strokeWidth="1.2"
                      strokeDasharray="10 5 2 5"
                    />
                    <text x="310" y="18" textAnchor="middle" fill="#e5b842" fontSize="11" fontFamily="IBM Plex Mono">
                      CENTRAL ASSEMBLY AXIS
                    </text>

                    {/* Flow Channel Brackets on Left */}
                    {FLOW_CHANNELS.map((ch, idx) => {
                      const bracketYs = [
                        { y1: 38, y2: 112 },
                        { y1: 126, y2: 222 },
                        { y1: 236, y2: 282 },
                        { y1: 296, y2: 500 },
                        { y1: 514, y2: 694 },
                      ][idx];
                      return (
                        <g key={ch.id}>
                          <path
                            d={`M 185 ${bracketYs.y1} L 170 ${bracketYs.y1} L 170 ${bracketYs.y2} L 185 ${bracketYs.y2}`}
                            fill="none"
                            stroke="#00e5ff"
                            strokeWidth="1.3"
                          />
                          <text
                            x="160"
                            y={(bracketYs.y1 + bracketYs.y2) / 2 + 4}
                            textAnchor="end"
                            fill="#00e5ff"
                            fontSize="11"
                            fontFamily="IBM Plex Mono"
                            fontWeight="600"
                          >
                            {ch.title}
                          </text>
                        </g>
                      );
                    })}

                    {/* 12 Stages drawn top-to-bottom in physical stack order, tagged in Ray's 01..12 numbering */}
                    {[
                      { id: '12', y: 52, w: 150, h: 20, shape: 'crown' },
                      { id: '01', y: 95, w: 164, h: 26, shape: 'scupper' },
                      { id: '02', y: 146, w: 128, h: 26, shape: 'piston' },
                      { id: '03', y: 198, w: 138, h: 28, shape: 'throat' },
                      { id: '04', y: 256, w: 120, h: 26, shape: 'turbine' },
                      { id: '05', y: 312, w: 156, h: 24, shape: 'venturi' },
                      { id: '06', y: 364, w: 126, h: 22, shape: 'electrodes' },
                      { id: '07', y: 418, w: 162, h: 32, shape: 'halbach' },
                      { id: '08', y: 476, w: 118, h: 36, shape: 'helix' },
                      { id: '09', y: 540, w: 148, h: 30, shape: 'caps' },
                      { id: '10', y: 598, w: 160, h: 30, shape: 'base' },
                      { id: '11', y: 658, w: 96, h: 26, shape: 'router' },
                    ].map((slot) => {
                      const stage = STAGES.find((s) => s.id === slot.id)!;
                      const isSel = activeStage.id === stage.id;
                      const stroke = isSel ? '#e5b842' : '#00e5ff';
                      const fill = isSel ? 'rgba(229,184,66,0.16)' : 'rgba(11,26,52,0.85)';
                      return (
                        <g
                          key={stage.id}
                          className="cursor-pointer"
                          onClick={() => onSelectStage(stage.id)}
                        >
                          <rect
                            x={310 - slot.w / 2}
                            y={slot.y - slot.h / 2}
                            width={slot.w}
                            height={slot.h}
                            rx="3"
                            fill={fill}
                            stroke={stroke}
                            strokeWidth={isSel ? 2 : 1.3}
                          />
                          <text
                            x="310"
                            y={slot.y + 4}
                            textAnchor="middle"
                            fill={isSel ? '#fde68a' : '#bae6fd'}
                            fontSize="11"
                            fontFamily="IBM Plex Mono"
                          >
                            STAGE {stage.id}
                          </text>

                          {/* Leader line to Right Callout */}
                          <line
                            x1={310 + slot.w / 2}
                            y1={slot.y}
                            x2="440"
                            y2={slot.y}
                            stroke={stroke}
                            strokeWidth={isSel ? 1.6 : 1}
                          />
                          <circle cx={310 + slot.w / 2} cy={slot.y} r="3" fill={stroke} />
                          <text
                            x="450"
                            y={slot.y + 4}
                            fill={isSel ? '#e5b842' : '#e2e8f0'}
                            fontSize="12.5"
                            fontFamily="IBM Plex Sans"
                            fontWeight={isSel ? '600' : '500'}
                          >
                            {stage.id} — {stage.name}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            )}

            {plate === 'detail' && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h3 className="font-display text-base font-semibold text-cyan-200">
                    Core Chamber, Coil Winding, Halbach Flux &amp; Quad-Venturi Port Details
                  </h3>
                  <span className="text-xs font-mono text-amber-300">
                    NO INVENTED DIMENSIONS · RAY&apos;S EXACT LABELS · ΔP = P_in − P_throat (PASCALS)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Halbach + Fibonacci + Copper Induction Coils */}
                  <div className="bg-[#040a15] border border-cyan-500/20 rounded p-3">
                    <div className="text-xs font-mono text-cyan-300 mb-2">
                      SECTION A-A: HALBACH MATRIX · FIBONACCI CORE · COPPER COILS
                    </div>
                    <svg viewBox="0 0 420 400" className="w-full h-auto">
                      <rect width="420" height="400" fill="#040a15" />
                      {/* Outer 24-block Halbach Ring Segments */}
                      {Array.from({ length: 24 }).map((_, i) => {
                        const a = (i * Math.PI * 2) / 24;
                        const cx = 210 + Math.cos(a) * 145;
                        const cy = 195 + Math.sin(a) * 145;
                        const deg = (a * 180) / Math.PI;
                        return (
                          <g key={i} transform={`translate(${cx},${cy}) rotate(${deg})`}>
                            <rect
                              x="-10"
                              y="-11"
                              width="20"
                              height="22"
                              fill={i % 2 === 0 ? '#142c4c' : '#2a2210'}
                              stroke="#e5b842"
                              strokeWidth="1.2"
                            />
                            {i % 2 === 0 && (
                              <>
                                <line x1="-14" y1="0" x2="-30" y2="0" stroke="#00e5ff" strokeWidth="1.1" />
                                <polygon points="-30,0 -24,-3 -24,3" fill="#00e5ff" />
                              </>
                            )}
                          </g>
                        );
                      })}

                      {/* Copper Induction Coils / Litz Wire Coil Channels Ring */}
                      <circle
                        cx="210"
                        cy="195"
                        r="102"
                        fill="none"
                        stroke="#d97d3a"
                        strokeWidth="7"
                        strokeDasharray="10 5"
                      />
                      <circle cx="210" cy="195" r="88" fill="none" stroke="#00e5ff" strokeWidth="1" strokeDasharray="3 3" />

                      {/* Fibonacci Spiral Plan Projection */}
                      <path
                        d="M 210 195 m 0 -68 a 68 68 0 1 1 -58 34 a 46 46 0 1 0 38 -24 a 30 30 0 1 1 -24 18 a 18 18 0 1 0 14 -12"
                        fill="none"
                        stroke="#00e5ff"
                        strokeWidth="2.5"
                      />
                      <circle cx="210" cy="195" r="6" fill="#e5b842" />

                      {/* Callouts */}
                      <text x="16" y="24" fill="#e5b842" fontSize="10.5" fontFamily="IBM Plex Mono">
                        Halbach Magnetic Matrix (24-block cage)
                      </text>
                      <text x="16" y="42" fill="#d97d3a" fontSize="10.5" fontFamily="IBM Plex Mono">
                        Copper induction coils / Litz Wire Coil Channels
                      </text>
                      <text x="16" y="372" fill="#00e5ff" fontSize="10.5" fontFamily="IBM Plex Mono">
                        Fibonacci Helical Core + 0.2mm Riblet Texture
                      </text>
                      <text x="16" y="388" fill="#94a3b8" fontSize="9.5" fontFamily="IBM Plex Mono">
                        NO INVENTED DIMENSIONS · RAY&apos;S EXACT LABELS
                      </text>
                    </svg>
                  </div>

                  {/* Right: Quad-Venturi Ports + Air Accelerator ΔP */}
                  <div className="bg-[#040a15] border border-cyan-500/20 rounded p-3">
                    <div className="text-xs font-mono text-amber-300 mb-2">
                      SECTION B-B: QUAD-VENTURI PORTS &amp; AIR ACCELERATOR ΔP
                    </div>
                    <svg viewBox="0 0 420 400" className="w-full h-auto">
                      <rect width="420" height="400" fill="#040a15" />

                      {/* Top half: Quad-Venturi 4-port plan */}
                      <circle cx="210" cy="112" r="76" fill="none" stroke="#00e5ff" strokeWidth="1.4" />
                      <circle cx="210" cy="112" r="40" fill="none" stroke="#e5b842" strokeWidth="1.4" strokeDasharray="4 3" />
                      {[0, 90, 180, 270].map((deg) => (
                        <g key={deg} transform={`translate(210,112) rotate(${deg})`}>
                          <polygon
                            points="76,-16 44,-6 44,6 76,16"
                            fill="#0c2646"
                            stroke="#00e5ff"
                            strokeWidth="1.3"
                          />
                          <path d="M 42 4 Q 20 22 0 30" fill="none" stroke="#00e5ff" strokeWidth="1.4" />
                        </g>
                      ))}
                      <text x="20" y="24" fill="#00e5ff" fontSize="11" fontFamily="IBM Plex Mono">
                        Quad-Venturi Acceleration Ports (4 tapered jets)
                      </text>

                      {/* Divider */}
                      <line x1="16" y1="210" x2="404" y2="210" stroke="rgba(0,229,255,0.2)" strokeWidth="1" />

                      {/* Bottom half: Air Accelerator Unit (THE ENHANCEMENT) */}
                      <text x="20" y="232" fill="#e5b842" fontSize="11" fontFamily="IBM Plex Mono">
                        Air Accelerator Unit — Pascal ΔP (THE ENHANCEMENT)
                      </text>
                      {/* Tapered throat cross section */}
                      <path
                        d="M 110 250 L 165 305 L 165 322 L 135 362"
                        fill="none"
                        stroke="#00e5ff"
                        strokeWidth="2"
                      />
                      <path
                        d="M 310 250 L 255 305 L 255 322 L 285 362"
                        fill="none"
                        stroke="#00e5ff"
                        strokeWidth="2"
                      />
                      {/* P_in tap */}
                      <line x1="115" y1="262" x2="62" y2="262" stroke="#e5b842" strokeWidth="1.5" />
                      <circle cx="115" cy="262" r="3.5" fill="#e5b842" />
                      <text x="20" y="266" fill="#e5b842" fontSize="11" fontFamily="IBM Plex Mono">
                        P_in
                      </text>

                      {/* P_throat tap */}
                      <line x1="165" y1="314" x2="62" y2="314" stroke="#e5b842" strokeWidth="1.5" />
                      <circle cx="165" cy="314" r="3.5" fill="#e5b842" />
                      <text x="16" y="318" fill="#e5b842" fontSize="11" fontFamily="IBM Plex Mono">
                        P_throat
                      </text>

                      {/* Formula callout */}
                      <text x="210" y="384" textAnchor="middle" fill="#bae6fd" fontSize="12" fontFamily="IBM Plex Mono">
                        ΔP = P_in − P_throat (pascals)
                      </text>
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Stage Callout & Verbatim Note Column */}
          <aside className="lg:col-span-3 bg-[#060f20]/95 border border-cyan-500/25 rounded-lg p-4 space-y-4">
            <div>
              <div className="text-xs font-mono text-amber-300">
                STAGE {activeStage.id} · {activeStage.flowChannel}
              </div>
              <h3 className="font-display text-lg font-semibold text-slate-100 mt-1">
                {activeStage.name}
              </h3>
              {activeStage.diagramLabel && (
                <p className="text-xs font-mono text-cyan-300 mt-1">
                  Diagram Label: {activeStage.diagramLabel}
                </p>
              )}
            </div>

            <p className="text-sm leading-relaxed text-slate-200 border-t border-cyan-500/15 pt-3">
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

            <div className="border-t border-cyan-500/15 pt-3">
              <div className="text-xs font-mono text-slate-400 mb-2">
                ALL 12 STAGES (RAY&apos;S ORDER)
              </div>
              <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                {STAGES.map((stage) => {
                  const active = activeStage.id === stage.id;
                  return (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => onSelectStage(stage.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors flex items-center gap-2 ${
                        active
                          ? 'bg-amber-400/15 text-amber-200 border border-amber-400/40'
                          : 'text-slate-300 hover:bg-cyan-500/10 border border-transparent'
                      }`}
                    >
                      <span className="font-mono text-[11px] shrink-0 text-cyan-300">
                        {stage.id}
                      </span>
                      <span className="truncate">{stage.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>

        {/* 15-Part Technical Drawing Descriptions & 3D Models Directory */}
        <div className="bg-[#060f20]/95 border border-cyan-500/25 rounded-lg p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-cyan-500/15">
            <div>
              <p className="text-xs font-mono text-amber-300">
                NO INVENTED DIMENSIONS · RAY&apos;S EXACT LABELS
              </p>
              <h3 className="font-display text-lg font-semibold text-slate-100 mt-0.5">
                15-Part Technical Drawing Descriptions &amp; 3D Part Models
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onOpenCenterNeedle}
                className="px-3 py-1.5 text-xs font-mono bg-[#0b182e] text-amber-200 border border-amber-400/45 rounded hover:bg-amber-400/15 transition-colors"
              >
                Featured: Air Plunger — Center Needle · 3D &amp; Spec
              </button>
              <span className="text-xs text-slate-400">
                Select any part (01–15) to open its material spec, stack fit &amp; 3D model
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.values(PART_DETAILS).map((p) => (
              <div
                key={p.number}
                className="bg-[#040a15] border border-cyan-500/20 hover:border-amber-400/50 rounded p-3.5 transition-colors flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-amber-300">
                      PART {String(p.number).padStart(2, '0')}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenPartDetail(p.number)}
                      className="px-2.5 py-1 text-[11px] font-mono bg-[#0b182e] text-cyan-200 border border-cyan-400/35 rounded hover:border-amber-400 hover:text-amber-200 transition-colors"
                    >
                      3D &amp; Spec
                    </button>
                  </div>
                  <div className="font-medium text-sm text-slate-100">{p.part}</div>
                  <div className="text-xs text-slate-400 line-clamp-2">{p.plainLanguage}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Separate Calculated 2,000 W Sizing Reference Table (Never mixed with CAD dimensions) */}
        <OperatingPrincipleAndSizing
          onOpenCenterNeedle={onOpenCenterNeedle}
          showPrinciple={false}
          showSizing
        />
      </div>
    </section>
  );
};
