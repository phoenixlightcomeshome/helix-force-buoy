import { useCallback, useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { BuoyCore3D } from './components/BuoyCore3D';
import { DisplayForms } from './components/DisplayForms';
import { OperatingPrincipleAndSizing } from './components/OperatingPrincipleAndSizing';
import { PartDetailModal } from './components/PartDetailModal';
import { Schematics } from './components/Schematics';
import { TechnicalDrawings } from './components/TechnicalDrawings';
import {
  APP_FOOTER,
  APP_SUBTITLE,
  APP_TITLE,
  BOOST_EMPTY_MESSAGE,
  EnvelopeId,
  ENVELOPES,
  ENVELOPE_SELECTOR_PAUSED_MESSAGE,
  PartSelection,
  SimTelemetry,
  stepSimulation,
  TARGET_OUTPUT_LABEL,
  TideLevel,
} from './data/rayDesignData';

type ActiveSection = 'core3d' | 'drawings' | 'schematics' | 'forms';

export default function App() {
  const [section, setSection] = useState<ActiveSection>('core3d');
  const [tide, setTide] = useState<TideLevel>('Moderate');
  const [paused, setPaused] = useState(false);
  const [plungerSetting, setPlungerSetting] = useState(1.0);
  const [overEnergize, setOverEnergize] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [detailPartNumber, setDetailPartNumber] = useState<PartSelection | null>(null);
  // Gemini spec File 7 — dual-envelope selector. Default "unresolved":
  // the simulator refuses to run until Ray picks a baseline bore.
  const [envelope, setEnvelope] = useState<EnvelopeId | 'unresolved'>('unresolved');
  const envelopeResolved = envelope !== 'unresolved';
  const selectedEnv = envelopeResolved ? ENVELOPES[envelope] : null;

  const [telemetry, setTelemetry] = useState<SimTelemetry>({
    deltaP: 840,
    displacementBar: 0.35,
    plungerAirBar: 1.45,
    turbineRpm: 118,
    strokeDepth: 0.22,
    coilVolts: 6.4,
    simPowerWatts: 180,
    charge: 42,
    mode: 'Harvest',
    boostProgress: 0,
    boostMessage: null,
    phase: 0,
    waveElevation: 0,
    waterLevel: 0.28,
    triggerThreshold: 0.69,
    triggerPhase: 'FILLING',
    triggerFired: false,
    camAngle: 0.14,
    dischargePulse: 0.1,
    pistonPosition: 0,
    pistonVelocity: 0,
    flowRateNorm: 0.35,
    solarTrickleActive: true,
    simTimeS: 0,
    cycleCount: 0,
    cycleStartTimeS: 0,
    emergentCycleHz: null,
    plenumBarGauge: null,
    plenumOverPressure: null,
    sizingParadox: false,
    flapperOpen: true,
    footValveOpen: false,
    needleValve: 'SEATED',
    accumulatorBar: 1.45,
    warnings: [],
  });

  // Shared live simulation loop so 3D Core, Technical Drawings, Schematics, and Display Forms stay synchronized.
  // Refusal guard (Gemini spec File 7): while the envelope is unresolved the
  // loop does not advance — the sim is paused until Ray picks a baseline bore.
  useEffect(() => {
    if (paused || !envelopeResolved) return;
    let rafId = 0;
    let last = performance.now();
    let uiAccum = 0;

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.08);
      last = now;
      uiAccum += dt;

      if (uiAccum >= 0.05) {
        const stepDt = uiAccum;
        uiAccum = 0;
        setTelemetry((prev) =>
          stepSimulation(prev, tide, stepDt, false, {
            plungerSetting,
            overEnergize,
            envelope,
          })
        );
      }
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [tide, paused, plungerSetting, overEnergize, envelope, envelopeResolved]);

  const handleTriggerBoost = useCallback(() => {
    setTelemetry((prev) => {
      if (prev.mode === 'Boost') return prev;
      if (prev.charge < 12) {
        return {
          ...prev,
          boostMessage: BOOST_EMPTY_MESSAGE,
        };
      }
      return {
        ...prev,
        mode: 'Boost',
        boostProgress: 0,
        boostMessage: null,
      };
    });
  }, []);

  const handleSetHarvest = useCallback(() => {
    setTelemetry((prev) => ({
      ...prev,
      mode: 'Harvest',
      boostProgress: 0,
      boostMessage: null,
    }));
  }, []);

  const handleOpenCenterNeedle = useCallback(() => {
    setDetailPartNumber('center-needle');
  }, []);

  const navItems: { id: ActiveSection; label: string }[] = [
    { id: 'core3d', label: '3D Core' },
    { id: 'drawings', label: 'Technical Drawings' },
    { id: 'schematics', label: 'Schematics' },
    { id: 'forms', label: 'Display Forms' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#050b16] text-slate-100">
      {/* Top Bar Contract: 3 clean zones separated by gap-8 */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-[#060e1d] border-b border-cyan-500/20">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => setSection('core3d')}
          className="font-display text-base sm:text-lg font-bold tracking-tight text-slate-100 hover:text-cyan-200 transition-colors whitespace-nowrap shrink-0 text-left"
        >
          Helix-Force Buoy 3D Core
        </button>

        {/* Zone 2: 4 single-line text navigation links */}
        <nav
          aria-label="Primary sections"
          className="flex items-center gap-6 overflow-x-auto"
        >
          {navItems.map((item) => {
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`text-sm font-medium pb-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'text-cyan-200 border-cyan-400'
                    : 'text-slate-400 border-transparent hover:text-slate-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: permanent TARGET banner (cannot be toggled off) + 1 primary action */}
        <div className="shrink-0 flex items-center gap-3">
          <span className="hidden lg:inline font-mono text-[11px] text-amber-300 whitespace-nowrap">
            {TARGET_OUTPUT_LABEL} · SIMULATION READOUTS ONLY
          </span>
          <button
            type="button"
            onClick={handleTriggerBoost}
            disabled={!envelopeResolved}
            title={!envelopeResolved ? ENVELOPE_SELECTOR_PAUSED_MESSAGE : undefined}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 border ${
              !envelopeResolved
                ? 'bg-[#0b1b33] text-slate-500 border-slate-600/40 cursor-not-allowed'
                : telemetry.mode === 'Boost'
                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-[#0b1b33] text-amber-300 border-amber-400/45 hover:bg-amber-400/15'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{telemetry.mode === 'Boost' ? 'Boosting Pulse' : 'Boost Pulse'}</span>
          </button>
        </div>
      </header>

      {/* Sub-header strip with exact App Title, Subtitle, Target Output & Draft Notice */}
      <div className="px-6 py-2 bg-[#040914] border-b border-cyan-500/12 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 text-slate-300">
          <span className="font-display font-medium text-cyan-200">{APP_TITLE}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="text-slate-300">{APP_SUBTITLE}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
          <span className="text-amber-300">{TARGET_OUTPUT_LABEL}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="text-slate-400">
            Ray Mroczkowski (Ray&apos;s Ironworks) · Unpublished Draft Only
          </span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          {/* Gemini spec File 7 — envelope selector */}
          <div className="flex items-center gap-2" role="group" aria-label="Sizing envelope">
            <button
              type="button"
              onClick={() => setEnvelope('A-marlow')}
              className={`px-2.5 py-1 rounded border text-[11px] transition-colors whitespace-nowrap ${
                envelope === 'A-marlow'
                  ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/50 font-semibold'
                  : 'bg-[#0b182e] text-slate-300 border-cyan-500/25 hover:text-white'
              }`}
            >
              Envelope A (180 mm)
            </button>
            <button
              type="button"
              onClick={() => setEnvelope('B-gemini')}
              className={`px-2.5 py-1 rounded border text-[11px] transition-colors whitespace-nowrap ${
                envelope === 'B-gemini'
                  ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/50 font-semibold'
                  : 'bg-[#0b182e] text-slate-300 border-cyan-500/25 hover:text-white'
              }`}
            >
              Envelope B (450 mm)
            </button>
            <button
              type="button"
              onClick={() => setEnvelope('unresolved')}
              className={`px-2.5 py-1 rounded border text-[11px] transition-colors whitespace-nowrap ${
                envelope === 'unresolved'
                  ? 'bg-amber-400/20 text-amber-200 border-amber-400/50 font-semibold'
                  : 'bg-[#0b182e] text-slate-300 border-cyan-500/25 hover:text-white'
              }`}
            >
              Compare / Unresolved
            </button>
            {selectedEnv && (
              <span className="text-slate-400 whitespace-nowrap">
                Stroke {selectedEnv.strokeM.toFixed(2)} m · Air{' '}
                {Math.round(selectedEnv.tankVolumeM3 * 1000)} L @{' '}
                {(selectedEnv.tankNominalPa / 100000).toFixed(2)} bar
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Refusal guard (Gemini spec File 7): unresolved envelope pauses the simulator */}
      {!envelopeResolved && (
        <div className="px-6 py-2 bg-amber-400/10 border-b border-amber-400/40 text-center">
          <span className="font-mono text-xs text-amber-200">
            {ENVELOPE_SELECTOR_PAUSED_MESSAGE}
          </span>
        </div>
      )}

      {/* Active Workspace Section */}
      <main className="flex-1 flex flex-col">
        {section === 'core3d' && (
          <BuoyCore3D
            telemetry={telemetry}
            tide={tide}
            paused={paused}
            plungerSetting={plungerSetting}
            overEnergize={overEnergize}
            selectedStageId={selectedStageId}
            onSelectStage={setSelectedStageId}
            onChangeTide={setTide}
            onChangePlungerSetting={setPlungerSetting}
            onToggleOverEnergize={() => setOverEnergize((prev) => !prev)}
            onTogglePause={() => setPaused((p) => !p)}
            onTriggerBoost={handleTriggerBoost}
            onSetHarvest={handleSetHarvest}
            onOpenPartDetail={(partNum) => setDetailPartNumber(partNum)}
            onOpenCenterNeedle={handleOpenCenterNeedle}
          />
        )}

        {section === 'drawings' && (
          <TechnicalDrawings
            telemetry={telemetry}
            tide={tide}
            selectedStageId={selectedStageId}
            onSelectStage={setSelectedStageId}
            onOpenPartDetail={(partNum) => setDetailPartNumber(partNum)}
            onOpenCenterNeedle={handleOpenCenterNeedle}
          />
        )}

        {section === 'schematics' && (
          <Schematics
            telemetry={telemetry}
            tide={tide}
            paused={paused}
            plungerSetting={plungerSetting}
            overEnergize={overEnergize}
            selectedStageId={selectedStageId}
            onSelectStage={setSelectedStageId}
            onTogglePause={() => setPaused((p) => !p)}
            onTriggerBoost={handleTriggerBoost}
            onSetHarvest={handleSetHarvest}
            onOpenPartDetail={(partNum) => setDetailPartNumber(partNum)}
            onOpenCenterNeedle={handleOpenCenterNeedle}
          />
        )}

        {section === 'forms' && (
          <DisplayForms
            telemetry={telemetry}
            tide={tide}
            paused={paused}
            plungerSetting={plungerSetting}
            overEnergize={overEnergize}
            selectedStageId={selectedStageId}
            onSelectStage={setSelectedStageId}
            onChangeTide={setTide}
            onChangePlungerSetting={setPlungerSetting}
            onToggleOverEnergize={() => setOverEnergize((prev) => !prev)}
            onTogglePause={() => setPaused((p) => !p)}
            onTriggerBoost={handleTriggerBoost}
            onSetHarvest={handleSetHarvest}
            onOpenPartDetail={(partNum) => setDetailPartNumber(partNum)}
            onOpenCenterNeedle={handleOpenCenterNeedle}
          />
        )}

        {/* Operating Principle & 2,000 W Sizing Reference Band */}
        <div className="px-6 py-6 bg-[#040914] border-t border-cyan-500/20">
          <div className="max-w-[1360px] mx-auto">
            <OperatingPrincipleAndSizing
              onOpenCenterNeedle={handleOpenCenterNeedle}
              showPrinciple
              showSizing={section !== 'drawings'}
              selectedEnvelope={envelope}
            />
          </div>
        </div>
      </main>

      {detailPartNumber !== null && (
        <PartDetailModal
          partNumber={detailPartNumber}
          onClose={() => setDetailPartNumber(null)}
          onSelectPart={setDetailPartNumber}
        />
      )}

      {/* Ray's Verbatim Footer */}
      <footer className="px-6 py-3 bg-[#040914] border-t border-cyan-500/15 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <span>{APP_FOOTER}</span>
        <span className="font-mono text-[11px] text-slate-500">
          Unpublished Draft · Ray&apos;s Design Only
        </span>
      </footer>
    </div>
  );
}
