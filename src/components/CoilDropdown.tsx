import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import {
  CIRCUITRY_DATA,
  COIL_ELECTRICAL_DATA,
  EnvelopeId,
  SimTelemetry,
  TARGET_OUTPUT_LABEL,
} from '../data/rayDesignData';

interface CoilDropdownProps {
  telemetry: SimTelemetry;
  envelope: EnvelopeId | 'unresolved';
}

// Gemini fix spec (Nov 22, 9:10 PM) File 4 — "Coil Analysis & Electrics"
// dropdown in the top navigation bar. Live parameter matrix: conductivity,
// resistivity, wire gauge, turns, induced EMF formula + live readout, and
// real-time I²R loss from the live coil amps. All values are simulation
// readouts or spec constants — nothing here is measured data. Resistances
// are estimates flagged for Ray to true.
export const CoilDropdown: React.FC<CoilDropdownProps> = ({ telemetry, envelope }) => {
  const [open, setOpen] = useState(false);
  const envData =
    envelope === 'B-gemini' ? COIL_ELECTRICAL_DATA.envelopeB : COIL_ELECTRICAL_DATA.envelopeA;
  const envLabel =
    envelope === 'B-gemini'
      ? 'Envelope B (450 mm)'
      : envelope === 'A-marlow'
        ? 'Envelope A (180 mm)'
        : 'Envelope A (180 mm) — pick an envelope to switch';

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded transition-colors whitespace-nowrap border ${
          open
            ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/50'
            : 'bg-[#0b1b33] text-cyan-200 border-cyan-500/25 hover:bg-cyan-500/15'
        }`}
      >
        <span>Coil Electrics</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close coil analysis"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-transparent"
          />
          <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(460px,92vw)] bg-[#071122] border border-cyan-500/30 rounded-lg shadow-2xl shadow-black/60 p-4 space-y-3 text-left">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-sm font-semibold text-cyan-200">
                  Coil Analysis &amp; Electrics
                </h3>
                <p className="text-[11px] font-mono text-amber-300 mt-0.5">
                  SIMULATION READOUTS — NOT MEASURED DATA · {TARGET_OUTPUT_LABEL}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <table className="w-full text-xs border-collapse">
              <tbody>
                <tr className="border-b border-cyan-500/10">
                  <td className="py-1.5 pr-2 text-slate-400">Conductivity (σ) — annealed copper</td>
                  <td className="py-1.5 font-mono text-slate-100 text-right">
                    5.96 × 10⁷ S/m
                  </td>
                </tr>
                <tr className="border-b border-cyan-500/10">
                  <td className="py-1.5 pr-2 text-slate-400">Conductivity (σ) — seawater</td>
                  <td className="py-1.5 font-mono text-slate-100 text-right">4.8 S/m</td>
                </tr>
                <tr className="border-b border-cyan-500/10">
                  <td className="py-1.5 pr-2 text-slate-400">Resistivity (ρe) — copper</td>
                  <td className="py-1.5 font-mono text-slate-100 text-right">
                    1.68 × 10⁻⁸ Ω·m
                  </td>
                </tr>
                <tr className="border-b border-cyan-500/10">
                  <td className="py-1.5 pr-2 text-slate-400">Conductor wire — {envLabel}</td>
                  <td className="py-1.5 font-mono text-slate-100 text-right">
                    {envData.conductor}
                  </td>
                </tr>
                <tr className="border-b border-cyan-500/10">
                  <td className="py-1.5 pr-2 text-slate-400">Turns per phase</td>
                  <td className="py-1.5 font-mono text-slate-100 text-right">
                    {envData.turnsPerPhase} · {envData.phases} phases
                  </td>
                </tr>
                <tr className="border-b border-cyan-500/10">
                  <td className="py-1.5 pr-2 text-slate-400">
                    Phase resistance (estimate — for Ray to true)
                  </td>
                  <td className="py-1.5 font-mono text-slate-100 text-right">
                    {envData.resistanceEstimateOhm.toFixed(2)} Ω
                  </td>
                </tr>
                <tr className="border-b border-cyan-500/10">
                  <td className="py-1.5 pr-2 text-slate-400">Induced peak EMF — E ≈ 4.44 · f · N · B · A</td>
                  <td className="py-1.5 font-mono text-slate-100 text-right">
                    {envelope === 'B-gemini'
                      ? '— (frequency not stated — for Ray to true)'
                      : `${COIL_ELECTRICAL_DATA.inducedPeakEmfVoltsA.toFixed(1)} V peak (A, spec)`}
                  </td>
                </tr>
                <tr className="border-b border-cyan-500/10">
                  <td className="py-1.5 pr-2 text-slate-400">Live coil voltage (sim)</td>
                  <td className="py-1.5 font-mono text-cyan-200 text-right">
                    {telemetry.coilVolts.toFixed(1)} V
                  </td>
                </tr>
                <tr className="border-b border-cyan-500/10">
                  <td className="py-1.5 pr-2 text-slate-400">
                    Live current — bus amps (sim power / {CIRCUITRY_DATA.busVoltageV} V bus)
                  </td>
                  <td className="py-1.5 font-mono text-cyan-200 text-right">
                    {telemetry.coilCurrentA.toFixed(1)} A
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 pr-2 text-slate-400">
                    Live I²R ohmic heating (estimate)
                  </td>
                  <td className="py-1.5 font-mono text-cyan-200 text-right">
                    {telemetry.coilOhmicLossW.toFixed(1)} W
                  </td>
                </tr>
              </tbody>
            </table>

            <p className="text-[11px] leading-relaxed text-slate-400">
              Current is the DC-bus current derived live from sim power; the
              I²R figure is an estimate from the envelope&apos;s resistance
              (0.18 Ω A / 0.08 Ω B — estimates, for Ray to true). Envelope B
              EMF needs a frequency Ray has not stated.
            </p>
          </div>
        </>
      )}
    </div>
  );
};
