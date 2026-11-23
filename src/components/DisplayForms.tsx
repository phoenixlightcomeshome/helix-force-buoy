import React, { useState } from 'react';
import { CheckSquare, Pause, Play, Square, Trash2, Zap } from 'lucide-react';
import {
  FAMILY_LAW,
  GATHER_PARTS,
  SimTelemetry,
  STAGES,
  TARGET_OUTPUT_LABEL,
  TIDE_PRESETS,
  TideLevel,
  TRIAL_PROTOCOL,
} from '../data/rayDesignData';

interface DisplayFormsProps {
  telemetry: SimTelemetry;
  tide: TideLevel;
  paused: boolean;
  plungerSetting: number;
  overEnergize: boolean;
  selectedStageId: string | null;
  onSelectStage: (stageId: string | null) => void;
  onChangeTide: (tide: TideLevel) => void;
  onChangePlungerSetting: (value: number) => void;
  onToggleOverEnergize: () => void;
  onTogglePause: () => void;
  onTriggerBoost: () => void;
  onSetHarvest: () => void;
  onOpenPartDetail: (partNumber: number) => void;
  onOpenCenterNeedle: () => void;
}

interface EnergyLogRow {
  id: string;
  seaState: string;
  flow: string;
  deltaP: string;
  coilVolts: string;
  charge: string;
  mode: string;
}

interface WaterLogRow {
  id: string;
  tdsIn: string;
  tdsOut: string;
  delta: string;
  notes: string;
}

interface SignedLogRow {
  id: string;
  date: string;
  signedBy: string;
  note: string;
}

export const DisplayForms: React.FC<DisplayFormsProps> = ({
  telemetry,
  tide,
  paused,
  plungerSetting,
  overEnergize,
  selectedStageId,
  onSelectStage,
  onChangeTide,
  onChangePlungerSetting,
  onToggleOverEnergize,
  onTogglePause,
  onTriggerBoost,
  onSetHarvest,
  onOpenPartDetail,
  onOpenCenterNeedle,
}) => {
  const [checkedParts, setCheckedParts] = useState<Record<number, boolean>>({});
  const [checkedTrials, setCheckedTrials] = useState<Record<number, boolean>>({});

  // Logs ship EMPTY by design — true numbers only, no sample readings anywhere.
  const [energyLogs, setEnergyLogs] = useState<EnergyLogRow[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterLogRow[]>([]);
  const [signedLogs, setSignedLogs] = useState<SignedLogRow[]>([]);

  const [energyDraft, setEnergyDraft] = useState({
    seaState: '',
    flow: '',
    deltaP: '',
    coilVolts: '',
    charge: '',
    mode: 'Harvest',
  });
  const [waterDraft, setWaterDraft] = useState({
    tdsIn: '',
    tdsOut: '',
    notes: '',
  });
  const [signedDraft, setSignedDraft] = useState({
    date: '',
    signedBy: '',
    note: '',
  });

  const togglePart = (num: number) => {
    setCheckedParts((prev) => ({ ...prev, [num]: !prev[num] }));
  };

  const toggleTrial = (num: number) => {
    setCheckedTrials((prev) => ({ ...prev, [num]: !prev[num] }));
  };

  const handleAddEnergyLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!energyDraft.seaState && !energyDraft.deltaP && !energyDraft.coilVolts) return;
    setEnergyLogs((prev) => [
      ...prev,
      { id: String(Date.now()), ...energyDraft },
    ]);
    setEnergyDraft({
      seaState: '',
      flow: '',
      deltaP: '',
      coilVolts: '',
      charge: '',
      mode: 'Harvest',
    });
  };

  const handleAddWaterLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waterDraft.tdsIn && !waterDraft.tdsOut) return;
    const inNum = parseFloat(waterDraft.tdsIn);
    const outNum = parseFloat(waterDraft.tdsOut);
    const delta =
      !Number.isNaN(inNum) && !Number.isNaN(outNum)
        ? `${(outNum - inNum).toFixed(1)} ppm`
        : '—';
    setWaterLogs((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        tdsIn: waterDraft.tdsIn || '—',
        tdsOut: waterDraft.tdsOut || '—',
        delta,
        notes: waterDraft.notes,
      },
    ]);
    setWaterDraft({ tdsIn: '', tdsOut: '', notes: '' });
  };

  const handleAddSignedLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signedDraft.date && !signedDraft.signedBy) return;
    setSignedLogs((prev) => [
      ...prev,
      { id: String(Date.now()), ...signedDraft },
    ]);
    setSignedDraft({ date: '', signedBy: '', note: '' });
  };

  const gatheredCount = Object.values(checkedParts).filter(Boolean).length;
  const trialDoneCount = Object.values(checkedTrials).filter(Boolean).length;
  const isBoost = telemetry.mode === 'Boost';

  return (
    <section
      aria-label="Specification Sheets and Display Forms"
      className="blueprint-grid-subtle bg-[#050b16] min-h-[calc(100vh-120px)] px-6 py-6 text-slate-100"
    >
      <div className="max-w-[1360px] mx-auto space-y-8">
        {/* Operating Principle / Family Law */}
        <div className="bg-[#071225] border border-cyan-500/25 rounded-lg p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-mono tracking-wider text-amber-300">
              OPERATING PRINCIPLE · RAY MROCZKOWSKI (RAY&apos;S IRONWORKS) · {TARGET_OUTPUT_LABEL}
            </p>
            <p className="text-sm sm:text-base text-slate-100 mt-1.5 leading-relaxed">
              &ldquo;{FAMILY_LAW}&rdquo;
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenCenterNeedle}
              className="px-3 py-1.5 text-xs font-mono bg-[#0b182e] text-amber-200 border border-amber-400/45 rounded hover:bg-amber-400/15 transition-colors whitespace-nowrap shrink-0"
            >
              Air Plunger — Center Needle · 3D &amp; Spec
            </button>
            <span className="text-xs font-mono text-slate-400">
              Unpublished Draft · No Invented Specs or Prices
            </span>
          </div>
        </div>

        {/* 1. Harvest / Boost Mode Panel & Live Simulation Readouts */}
        <div className="bg-[#071225] border border-cyan-500/25 rounded-lg p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-cyan-500/15">
            <div>
              <p className="text-xs font-mono text-amber-300">
                SIMULATION READOUTS — NOT MEASURED DATA · {TARGET_OUTPUT_LABEL}
              </p>
              <h2 className="font-display text-xl font-semibold text-slate-100 mt-0.5">
                Harvest / Boost Mode Panel &amp; Live Readouts
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-[#040a15] p-1 rounded border border-cyan-500/20">
                {(['Calm', 'Moderate', 'Swell', 'Heavy'] as TideLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => onChangeTide(level)}
                    className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap shrink-0 ${
                      tide === level
                        ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/40 font-medium'
                        : 'text-slate-400 hover:text-white border border-transparent'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-[#040a15] p-1 rounded border border-cyan-500/20">
                <button
                  type="button"
                  onClick={onSetHarvest}
                  className={`px-3 py-1 text-xs rounded transition-colors whitespace-nowrap shrink-0 ${
                    !isBoost
                      ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/40 font-medium'
                      : 'text-slate-400 hover:text-white border border-transparent'
                  }`}
                >
                  Mode A: Harvest
                </button>
                <button
                  type="button"
                  onClick={onTriggerBoost}
                  className={`flex items-center gap-1 px-3 py-1 text-xs rounded transition-colors whitespace-nowrap shrink-0 ${
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
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#040a15] text-slate-200 border border-cyan-500/20 rounded hover:border-cyan-400/50 whitespace-nowrap shrink-0"
              >
                {paused ? <Play className="w-3.5 h-3.5 text-cyan-300" /> : <Pause className="w-3.5 h-3.5 text-cyan-300" />}
                <span>{paused ? 'Resume' : 'Pause'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="bg-[#040a15] border border-amber-400/25 rounded p-3">
              <div className="text-xs text-slate-400">Displacement Diff</div>
              <div className="font-mono text-xl font-semibold text-amber-300 mt-1">
                {telemetry.displacementBar.toFixed(2)}{' '}
                <span className="text-xs text-slate-400 font-normal">bar</span>
              </div>
            </div>
            <div className="bg-[#040a15] border border-cyan-500/20 rounded p-3">
              <div className="text-xs text-slate-400">Plunger Air Tank</div>
              <div className="font-mono text-xl font-semibold text-cyan-300 mt-1">
                {telemetry.plungerAirBar.toFixed(2)}{' '}
                <span className="text-xs text-slate-400 font-normal">bar</span>
              </div>
            </div>
            <div className="bg-[#040a15] border border-cyan-500/20 rounded p-3">
              <div className="text-xs text-slate-400">ΔP (P_in − P_throat)</div>
              <div className="font-mono text-xl font-semibold text-cyan-300 mt-1">
                {telemetry.deltaP} <span className="text-xs text-slate-400 font-normal">Pa</span>
              </div>
            </div>
            <div className="bg-[#040a15] border border-cyan-500/20 rounded p-3">
              <div className="text-xs text-slate-400">Pan Fill / Trigger</div>
              <div className="font-mono text-lg font-semibold text-cyan-200 mt-1">
                {Math.round(telemetry.waterLevel * 100)}% · {telemetry.triggerPhase}
              </div>
            </div>
            <div className="bg-[#040a15] border border-cyan-500/20 rounded p-3">
              <div className="text-xs text-slate-400">Turbine Speed</div>
              <div className="font-mono text-xl font-semibold text-slate-100 mt-1">
                {telemetry.turbineRpm}{' '}
                <span className="text-xs text-slate-400 font-normal">RPM</span>
              </div>
            </div>
            <div className="bg-[#040a15] border border-cyan-500/20 rounded p-3">
              <div className="text-xs text-slate-400">Coil Volts / Sim W</div>
              <div className="font-mono text-lg font-semibold text-amber-300 mt-1">
                {telemetry.coilVolts.toFixed(1)} V · {telemetry.simPowerWatts} W
              </div>
            </div>
            <div className="bg-[#040a15] border border-cyan-500/20 rounded p-3">
              <div className="text-xs text-slate-400">Cap Bank Charge</div>
              <div className="font-mono text-xl font-semibold text-cyan-300 mt-1">
                {telemetry.charge.toFixed(0)}
                <span className="text-xs text-slate-400 font-normal">%</span>
              </div>
            </div>
            <div className="bg-[#040a15] border border-cyan-500/20 rounded p-3">
              <div className="text-xs text-slate-400">Active Mode</div>
              <div
                className={`font-display text-base font-semibold mt-1 ${
                  isBoost ? 'text-amber-300' : 'text-cyan-200'
                }`}
              >
                {isBoost ? 'Mode B: Boost' : 'Mode A: Harvest'}
              </div>
            </div>
          </div>

          {/* Synced Adjustable Air Tank Plunger & Over-Energize Controls */}
          <div className="bg-[#040a15] border border-cyan-500/20 rounded p-3 flex flex-wrap items-center justify-between gap-4 text-xs">
            <label className="flex items-center gap-3 flex-1 min-w-[260px]">
              <span className="font-mono text-cyan-200 whitespace-nowrap">
                Air Tank Plunger — Adjustable: {plungerSetting.toFixed(2)}x
              </span>
              <input
                type="range"
                min={0.5}
                max={1.5}
                step={0.05}
                value={plungerSetting}
                onChange={(e) => onChangePlungerSetting(parseFloat(e.target.value))}
                className="flex-1 accent-cyan-400 cursor-pointer"
              />
            </label>
            <button
              type="button"
              onClick={onToggleOverEnergize}
              className={`px-3 py-1.5 rounded font-mono text-xs border transition-colors whitespace-nowrap shrink-0 ${
                overEnergize
                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-semibold'
                  : 'bg-[#081326] text-amber-200 border-amber-400/40 hover:bg-amber-400/15'
              }`}
            >
              Over-Energize: {overEnergize ? 'ON (High Displacement Bar)' : 'OFF'}
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Tide state <span className="font-mono text-slate-200">{tide}</span> (Stationary moored buoy — wave rate fills top pan):{' '}
            {TIDE_PRESETS[tide].description}
          </p>

          {telemetry.boostMessage && (
            <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-400/25 rounded px-3 py-2">
              {telemetry.boostMessage}
            </div>
          )}
        </div>

        {/* 2. Canonical 12-Stage Stack (Verbatim) */}
        <div className="bg-[#071225] border border-cyan-500/25 rounded-lg p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-100">
                Canonical 12-Stage Stack — Ray&apos;s Exact Order &amp; Verbatim Notes
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Never reordered or renamed. Includes all 10 labeled diagram parts plus Air Accelerator (03) and Solar Crown (12).
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-300">12 STAGES</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-cyan-500/25 text-xs font-mono text-cyan-300">
                  <th className="py-2.5 px-3 w-16">Stage</th>
                  <th className="py-2.5 px-3 w-64">Stage Name</th>
                  <th className="py-2.5 px-3 w-44">Flow Channel</th>
                  <th className="py-2.5 px-3">Ray&apos;s Note (Verbatim)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/12 text-sm">
                {STAGES.map((stage) => {
                  const isSel = selectedStageId === stage.id;
                  return (
                    <tr
                      key={stage.id}
                      onClick={() => onSelectStage(stage.id)}
                      className={`cursor-pointer transition-colors ${
                        isSel ? 'bg-amber-400/10' : 'hover:bg-cyan-500/5'
                      }`}
                    >
                      <td className="py-3 px-3 font-mono font-semibold text-amber-300 align-top">
                        {stage.id}
                      </td>
                      <td className="py-3 px-3 align-top">
                        <div className="font-medium text-slate-100">{stage.name}</div>
                        {stage.diagramLabel && (
                          <div className="text-[11px] font-mono text-cyan-300/80 mt-0.5">
                            Diagram: {stage.diagramLabel}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-cyan-300 align-top whitespace-nowrap">
                        {stage.flowChannel}
                      </td>
                      <td className="py-3 px-3 text-slate-200 leading-relaxed align-top">
                        &ldquo;{stage.note}&rdquo;
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. 15-Part Gather List & 11-Step Trial Protocol */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 15-Part Gather List (NO prices) */}
          <div className="bg-[#071225] border border-cyan-500/25 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-cyan-500/15">
              <div>
                <h2 className="font-display text-lg font-semibold text-slate-100">
                  15-Part Gather List
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  No prices anywhere — Ray&apos;s standing rule.
                </p>
              </div>
              <span className="font-mono text-xs text-cyan-300">
                {gatheredCount} / 15 gathered
              </span>
            </div>

            {/* Featured Center-Needle Card (Does not renumber Parts 01-15) */}
            <div className="bg-[#040a15] border border-amber-400/35 rounded p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-mono text-[11px] text-amber-300">
                  FEATURED CORE MECHANISM · STATIONARY BUOY CENTER AXIS
                </div>
                <div className="text-sm font-medium text-slate-100 mt-0.5">
                  Air Plunger — Center Needle (Adjustable + Level/Cam Trigger)
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenCenterNeedle}
                className="px-2.5 py-1 text-xs font-mono bg-[#0b182e] text-amber-200 border border-amber-400/45 rounded hover:bg-amber-400/15 transition-colors whitespace-nowrap shrink-0"
              >
                3D &amp; Spec
              </button>
            </div>

            <div className="divide-y divide-cyan-500/12">
              {GATHER_PARTS.map((item) => {
                const checked = !!checkedParts[item.number];
                return (
                  <div
                    key={item.number}
                    className="py-2.5 px-2 flex items-start justify-between gap-3 hover:bg-cyan-500/5 rounded transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => togglePart(item.number)}
                      className="flex-1 text-left flex items-start gap-3 min-w-0"
                    >
                      <span className="mt-0.5 text-cyan-300 shrink-0">
                        {checked ? (
                          <CheckSquare className="w-4 h-4 text-amber-300" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500" />
                        )}
                      </span>
                      <span className="font-mono text-xs text-cyan-300 w-6 shrink-0 mt-0.5">
                        {String(item.number).padStart(2, '0')}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span
                          className={`block text-sm font-medium ${
                            checked ? 'text-slate-400 line-through' : 'text-slate-100'
                          }`}
                        >
                          {item.part}
                        </span>
                        <span className="block text-xs text-slate-400 mt-0.5">
                          {item.detail}
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenPartDetail(item.number)}
                      className="px-2.5 py-1 text-xs font-mono bg-[#040a15] text-cyan-200 border border-cyan-500/30 rounded hover:border-amber-400 hover:text-amber-200 transition-colors whitespace-nowrap shrink-0"
                    >
                      3D &amp; Spec
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 11-Step Trial Protocol */}
          <div className="bg-[#071225] border border-cyan-500/25 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-cyan-500/15">
              <div>
                <h2 className="font-display text-lg font-semibold text-slate-100">
                  11-Step Trial Protocol
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bench, tank, and mooring verification sequence.
                </p>
              </div>
              <span className="font-mono text-xs text-amber-300">
                {trialDoneCount} / 11 completed
              </span>
            </div>

            <div className="divide-y divide-cyan-500/12">
              {TRIAL_PROTOCOL.map((item) => {
                const checked = !!checkedTrials[item.number];
                return (
                  <button
                    key={item.number}
                    type="button"
                    onClick={() => toggleTrial(item.number)}
                    className="w-full text-left py-2.5 px-2 flex items-start gap-3 hover:bg-cyan-500/5 rounded transition-colors"
                  >
                    <span className="mt-0.5 text-cyan-300 shrink-0">
                      {checked ? (
                        <CheckSquare className="w-4 h-4 text-amber-300" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500" />
                      )}
                    </span>
                    <span className="font-mono text-xs text-amber-300 w-6 shrink-0 mt-0.5">
                      {String(item.number).padStart(2, '0')}
                    </span>
                    <span className="flex-1">
                      <span
                        className={`block text-sm font-medium ${
                          checked ? 'text-slate-400 line-through' : 'text-slate-100'
                        }`}
                      >
                        {item.step}
                      </span>
                      <span className="block text-xs text-slate-400 mt-0.5">
                        {item.detail}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. Measured Logs (Ship EMPTY by design — true numbers only) */}
        <div className="bg-[#071225] border border-cyan-500/25 rounded-lg p-5 space-y-6">
          <div className="border-b border-cyan-500/15 pb-3">
            <p className="text-xs font-mono text-amber-300">
              TRUE NUMBERS ONLY — SHIPS EMPTY BY DESIGN
            </p>
            <h2 className="font-display text-xl font-semibold text-slate-100 mt-0.5">
              Bench &amp; Field Trial Logs
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              No true measured readings exist yet for this engine. Simulation readouts above are kept separate from measured bench logs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Energy Log */}
            <div className="bg-[#040a15] border border-cyan-500/20 rounded p-4 space-y-3">
              <h3 className="font-display text-sm font-semibold text-cyan-200">
                Energy Log
              </h3>
              <form onSubmit={handleAddEnergyLog} className="grid grid-cols-2 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Sea state"
                  value={energyDraft.seaState}
                  onChange={(e) => setEnergyDraft({ ...energyDraft, seaState: e.target.value })}
                  className="bg-[#081326] border border-cyan-500/20 rounded px-2 py-1.5 text-slate-100 placeholder:text-slate-500"
                />
                <input
                  type="text"
                  placeholder="Flow"
                  value={energyDraft.flow}
                  onChange={(e) => setEnergyDraft({ ...energyDraft, flow: e.target.value })}
                  className="bg-[#081326] border border-cyan-500/20 rounded px-2 py-1.5 text-slate-100 placeholder:text-slate-500"
                />
                <input
                  type="text"
                  placeholder="ΔP (Pa)"
                  value={energyDraft.deltaP}
                  onChange={(e) => setEnergyDraft({ ...energyDraft, deltaP: e.target.value })}
                  className="bg-[#081326] border border-cyan-500/20 rounded px-2 py-1.5 text-slate-100 placeholder:text-slate-500"
                />
                <input
                  type="text"
                  placeholder="Coil volts"
                  value={energyDraft.coilVolts}
                  onChange={(e) => setEnergyDraft({ ...energyDraft, coilVolts: e.target.value })}
                  className="bg-[#081326] border border-cyan-500/20 rounded px-2 py-1.5 text-slate-100 placeholder:text-slate-500"
                />
                <input
                  type="text"
                  placeholder="Charge"
                  value={energyDraft.charge}
                  onChange={(e) => setEnergyDraft({ ...energyDraft, charge: e.target.value })}
                  className="bg-[#081326] border border-cyan-500/20 rounded px-2 py-1.5 text-slate-100 placeholder:text-slate-500"
                />
                <select
                  value={energyDraft.mode}
                  onChange={(e) => setEnergyDraft({ ...energyDraft, mode: e.target.value })}
                  className="bg-[#081326] border border-cyan-500/20 rounded px-2 py-1.5 text-slate-100"
                >
                  <option value="Harvest">Harvest</option>
                  <option value="Boost">Boost</option>
                </select>
                <button
                  type="submit"
                  className="col-span-2 py-1.5 px-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 rounded font-medium"
                >
                  Record Measured Energy Entry
                </button>
              </form>

              {energyLogs.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center border border-dashed border-cyan-500/15 rounded">
                  Empty — awaiting measured bench readings.
                </p>
              ) : (
                <ul className="space-y-1.5 text-xs font-mono">
                  {energyLogs.map((row) => (
                    <li
                      key={row.id}
                      className="flex items-center justify-between gap-2 bg-[#081326] px-2.5 py-1.5 rounded border border-cyan-500/15"
                    >
                      <span className="truncate">
                        {row.seaState} · {row.deltaP} Pa · {row.coilVolts} V · {row.mode}
                      </span>
                      <button
                        type="button"
                        aria-label="Remove entry"
                        onClick={() => setEnergyLogs((l) => l.filter((x) => x.id !== row.id))}
                        className="text-slate-400 hover:text-rose-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Water Log (TDS in -> out delta) */}
            <div className="bg-[#040a15] border border-cyan-500/20 rounded p-4 space-y-3">
              <h3 className="font-display text-sm font-semibold text-cyan-200">
                Water Log (TDS in → out delta)
              </h3>
              <form onSubmit={handleAddWaterLog} className="grid grid-cols-2 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="TDS in (ppm)"
                  value={waterDraft.tdsIn}
                  onChange={(e) => setWaterDraft({ ...waterDraft, tdsIn: e.target.value })}
                  className="bg-[#081326] border border-cyan-500/20 rounded px-2 py-1.5 text-slate-100 placeholder:text-slate-500"
                />
                <input
                  type="text"
                  placeholder="TDS out (ppm)"
                  value={waterDraft.tdsOut}
                  onChange={(e) => setWaterDraft({ ...waterDraft, tdsOut: e.target.value })}
                  className="bg-[#081326] border border-cyan-500/20 rounded px-2 py-1.5 text-slate-100 placeholder:text-slate-500"
                />
                <input
                  type="text"
                  placeholder="Sample notes"
                  value={waterDraft.notes}
                  onChange={(e) => setWaterDraft({ ...waterDraft, notes: e.target.value })}
                  className="col-span-2 bg-[#081326] border border-cyan-500/20 rounded px-2 py-1.5 text-slate-100 placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  className="col-span-2 py-1.5 px-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 rounded font-medium"
                >
                  Record Water Sample
                </button>
              </form>

              {waterLogs.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center border border-dashed border-cyan-500/15 rounded">
                  Empty — awaiting TDS in / out sampling.
                </p>
              ) : (
                <ul className="space-y-1.5 text-xs font-mono">
                  {waterLogs.map((row) => (
                    <li
                      key={row.id}
                      className="flex items-center justify-between gap-2 bg-[#081326] px-2.5 py-1.5 rounded border border-cyan-500/15"
                    >
                      <span className="truncate">
                        In: {row.tdsIn} → Out: {row.tdsOut} ({row.delta})
                      </span>
                      <button
                        type="button"
                        aria-label="Remove entry"
                        onClick={() => setWaterLogs((l) => l.filter((x) => x.id !== row.id))}
                        className="text-slate-400 hover:text-rose-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Signed Build Log */}
            <div className="bg-[#040a15] border border-cyan-500/20 rounded p-4 space-y-3">
              <h3 className="font-display text-sm font-semibold text-amber-200">
                Signed Build Log
              </h3>
              <form onSubmit={handleAddSignedLog} className="grid grid-cols-2 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Date"
                  value={signedDraft.date}
                  onChange={(e) => setSignedDraft({ ...signedDraft, date: e.target.value })}
                  className="bg-[#081326] border border-cyan-500/20 rounded px-2 py-1.5 text-slate-100 placeholder:text-slate-500"
                />
                <input
                  type="text"
                  placeholder="Signed by"
                  value={signedDraft.signedBy}
                  onChange={(e) => setSignedDraft({ ...signedDraft, signedBy: e.target.value })}
                  className="bg-[#081326] border border-cyan-500/20 rounded px-2 py-1.5 text-slate-100 placeholder:text-slate-500"
                />
                <input
                  type="text"
                  placeholder="Session evidence note"
                  value={signedDraft.note}
                  onChange={(e) => setSignedDraft({ ...signedDraft, note: e.target.value })}
                  className="col-span-2 bg-[#081326] border border-cyan-500/20 rounded px-2 py-1.5 text-slate-100 placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  className="col-span-2 py-1.5 px-3 bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/40 rounded font-medium"
                >
                  Sign &amp; Log Session
                </button>
              </form>

              {signedLogs.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center border border-dashed border-cyan-500/15 rounded">
                  Empty — awaiting signed bench session.
                </p>
              ) : (
                <ul className="space-y-1.5 text-xs font-mono">
                  {signedLogs.map((row) => (
                    <li
                      key={row.id}
                      className="flex items-center justify-between gap-2 bg-[#081326] px-2.5 py-1.5 rounded border border-cyan-500/15"
                    >
                      <span className="truncate">
                        {row.date} · {row.signedBy} — {row.note}
                      </span>
                      <button
                        type="button"
                        aria-label="Remove entry"
                        onClick={() => setSignedLogs((l) => l.filter((x) => x.id !== row.id))}
                        className="text-slate-400 hover:text-rose-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
