import React from 'react';
import {
  BUILD_FINDINGS,
  CONFLICTS,
  ENVELOPES,
  EnvelopeId,
  MISSING_FOR_RAY,
  OPERATING_PRINCIPLE_RAY_WORDS,
  OPERATING_PRINCIPLE_STEPS,
  SIZING_2KW_ROWS,
  SIZING_TABLE_HEADING,
  TARGET_OUTPUT_LABEL,
} from '../data/rayDesignData';

interface OperatingPrincipleAndSizingProps {
  onOpenCenterNeedle?: () => void;
  showPrinciple?: boolean;
  showSizing?: boolean;
  compact?: boolean;
  selectedEnvelope?: EnvelopeId | 'unresolved';
}

export const OperatingPrincipleAndSizing: React.FC<OperatingPrincipleAndSizingProps> = ({
  onOpenCenterNeedle,
  showPrinciple = true,
  showSizing = true,
  compact = false,
  selectedEnvelope = 'unresolved',
}) => {
  return (
    <div className={compact ? 'space-y-5' : 'space-y-6'}>
      {showPrinciple && (
        <section
          aria-label="Operating Principle — Ray's Center Needle Mechanism"
          className="bg-[#060f20]/95 border border-cyan-500/25 rounded-lg p-5 space-y-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 pb-3 border-b border-cyan-500/15">
            <div>
              <p className="text-xs font-mono text-amber-300">
                OPERATING PRINCIPLE · STATIONARY MOORED BUOY · {TARGET_OUTPUT_LABEL}
              </p>
              <h2 className="font-display text-lg sm:text-xl font-semibold text-slate-100 mt-0.5">
                How Ray&apos;s Air Plunger — Center Needle Drives the Chain Reaction
              </h2>
            </div>

            {onOpenCenterNeedle && (
              <button
                type="button"
                onClick={onOpenCenterNeedle}
                className="px-3 py-1.5 text-xs font-mono bg-[#0b182e] text-amber-200 border border-amber-400/45 rounded hover:bg-amber-400/15 transition-colors whitespace-nowrap shrink-0"
              >
                Air Plunger — Center Needle · 3D &amp; Spec
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-[#040a15] border border-cyan-500/25 rounded px-4 py-2.5 text-sm text-cyan-100 font-medium">
              The buoy is moored in place; it does not bob.
            </div>
            <div className="bg-[#040a15] border border-amber-400/30 rounded px-4 py-2.5 text-sm font-mono text-amber-200">
              Operation: Stationary, moored buoy.
            </div>
          </div>

          <blockquote className="bg-[#040a15] border-l-2 border-amber-400 px-4 py-3 rounded-r text-sm text-slate-200 leading-relaxed">
            <span className="block text-[11px] font-mono text-amber-300 mb-1">
              RAY&apos;S EXACT WORDS (NOV 20):
            </span>
            &ldquo;{OPERATING_PRINCIPLE_RAY_WORDS}&rdquo;
          </blockquote>

          <div className="bg-[#040a15] border border-cyan-400/30 rounded px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="font-mono text-amber-300 font-semibold">
                Air Tank — Underneath the Unit · Return stroke — drives the piston up.
              </div>
              <p className="text-slate-200 leading-relaxed">
                &ldquo;Remember there is an air tank underneath the unit.&rdquo; &ldquo;That&apos;s what drives the piston up.&rdquo; — Connected by a riser pipe up to the piston / Air Plunger — Center Needle as the return-stroke driver.
              </p>
            </div>
            <span className="font-mono text-[11px] text-slate-400 border border-cyan-500/20 px-2.5 py-1 rounded">
              Tank size / volume / pressure: not specified in the design
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {OPERATING_PRINCIPLE_STEPS.map((item) => (
              <div
                key={item.step}
                className="bg-[#040a15] border border-cyan-500/20 rounded p-3.5 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
                    0{item.step}
                  </span>
                  <h3 className="font-display text-sm font-semibold text-slate-100">
                    {item.title}
                  </h3>
                </div>
                <div className="text-xs text-cyan-100 leading-relaxed">
                  <span className="font-mono text-[10px] text-cyan-300 uppercase tracking-wider block">
                    In Plain Language
                  </span>
                  {item.plainLanguage}
                </div>
                <div className="text-xs text-slate-400 leading-relaxed pt-1 border-t border-cyan-500/10">
                  <span className="font-mono text-[10px] text-amber-300 uppercase tracking-wider block">
                    Technical Detail
                  </span>
                  {item.technicalDetail}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}


      {/* Gemini spec File 4 — dual-envelope comparison, verified findings, missing numbers */}
      {showSizing && (
        <section
          aria-label="Dual-envelope comparison and verified build findings"
          className="bg-[#060f20]/95 border border-amber-400/30 rounded-lg p-5 space-y-4"
        >
          <div className="pb-3 border-b border-amber-400/20">
            <p className="text-xs font-mono text-amber-300">
              DUAL ENVELOPES · NO WINNER PICKED · {TARGET_OUTPUT_LABEL}
            </p>
            <h2 className="font-display text-lg sm:text-xl font-semibold text-slate-100 mt-0.5">
              Envelope A vs Envelope B — Same Machine, Two Sizings
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed mt-2">
              Both envelopes size the same machine for the same 2,000 W target — and they
              disagree. The simulator refuses to run until Ray picks a baseline bore
              (Envelope A: 180 mm, Marlow · Envelope B: 450 mm, Gemini).{' '}
              {selectedEnvelope === 'unresolved'
                ? 'No envelope is selected right now — the simulator is paused.'
                : selectedEnvelope === 'A-marlow'
                  ? 'Envelope A is selected — the plenum guard reads from the 180 mm envelope.'
                  : 'Envelope B is selected — the plenum guard reads from the 450 mm envelope.'}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-cyan-500/25 font-mono text-cyan-300">
                  <th className="py-2.5 px-3 min-w-[140px]">Topic</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Envelope A — Marlow (180 mm)</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Envelope B — Gemini (450 mm)</th>
                  <th className="py-2.5 px-3 min-w-[240px]">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/12">
                {CONFLICTS.map((c) => (
                  <tr key={c.topic} className="hover:bg-cyan-500/5 align-top">
                    <td className="py-3 px-3 font-medium text-slate-100">{c.topic}</td>
                    <td className="py-3 px-3 font-mono text-cyan-200 leading-relaxed">{c.envelopeA}</td>
                    <td className="py-3 px-3 font-mono text-cyan-200 leading-relaxed">{c.envelopeB}</td>
                    <td className="py-3 px-3 text-slate-300 leading-relaxed">{c.note}</td>
                  </tr>
                ))}
                <tr className="align-top bg-amber-400/5">
                  <td className="py-3 px-3 font-medium text-slate-100">Air tank (flow-derived)</td>
                  <td className="py-3 px-3 font-mono text-cyan-200 leading-relaxed">50 L @ 4.0 bar nominal</td>
                  <td className="py-3 px-3 font-mono text-cyan-200 leading-relaxed">250 L @ 2.25 bar midpoint (doc range 1.5–3.0 bar)</td>
                  <td className="py-3 px-3 text-slate-300 leading-relaxed">Rule: tank ≥ 4.0× the air pulse (droop ≤ 25%); receiver ratio ≥ 1.5–2.4× stroke volume. Picking the bore dictates the tank. Note: her A5 sizing shorthand said 2.5 bar; the corrected spec (Nov 22 real-code verification) uses 2.25 bar — difference flagged, Ray has not trued it.</td>
                </tr>
                <tr className="align-top bg-amber-400/5">
                  <td className="py-3 px-3 font-medium text-slate-100">Lift pressure (Gemini)</td>
                  <td className="py-3 px-3 font-mono text-cyan-200 leading-relaxed">0.215 bar gauge (0.26 bar with 4-layer piston)</td>
                  <td className="py-3 px-3 font-mono text-cyan-200 leading-relaxed">0.109 bar gauge (0.132 bar with 4-layer piston)</td>
                  <td className="py-3 px-3 text-slate-300 leading-relaxed">0.35–0.50 bar gauge lifts the piston + water in either envelope — far below the 4.0 bar shot pressure. That gap is the sizing paradox.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-[#040a15] border border-red-400/40 rounded p-4 space-y-3">
            <h3 className="font-display text-base font-semibold text-red-300">
              Four Verified Build Findings — Gemini&apos;s Nov 22 Evaluation (all CONFIRMED)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {BUILD_FINDINGS.map((f) => (
                <div key={f.id} className="bg-[#060f20] border border-red-400/25 rounded p-3 space-y-1">
                  <div className="text-xs font-semibold text-slate-100">{f.title}</div>
                  <div className="font-mono text-[11px] text-red-300">{f.status}</div>
                  <div className="text-xs text-slate-300 leading-relaxed">{f.detail}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#040a15] border border-cyan-500/25 rounded p-4 space-y-2">
            <h3 className="font-display text-base font-semibold text-cyan-200">
              15 Numbers for Ray to True
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Nothing below is decided by the app — each one needs Ray&apos;s word before it
              becomes the design.
            </p>
            <ol className="list-decimal list-inside space-y-1 text-xs text-slate-300 leading-relaxed">
              {MISSING_FOR_RAY.map((item) => (
                <li key={item.slice(0, 48)}>{item}</li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {showSizing && (
        <section
          aria-label="Sizing for 2,000 W Target"
          className="bg-[#060f20]/95 border border-amber-400/30 rounded-lg p-5 space-y-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-amber-400/20">
            <div>
              <p className="text-xs font-mono text-amber-300">
                {TARGET_OUTPUT_LABEL} · ENGINEERING CALCULATION (NOT RAY&apos;S SPECIFIED DIMENSIONS)
              </p>
              <h2 className="font-display text-lg sm:text-xl font-semibold text-slate-100 mt-0.5">
                {SIZING_TABLE_HEADING}
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-300 bg-[#040a15] border border-cyan-500/25 px-2.5 py-1 rounded">
              Calculated Target Only · Not Measured Data
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-[#040a15] border border-amber-400/30 rounded p-3">
            The sizing rows below are <strong className="text-amber-200">Envelope B&apos;s numbers</strong> (450 mm bore, Gemini&apos;s sizing) — they are kept as-is and annotated here rather than rewritten. Envelope A&apos;s numbers live in the comparison matrix above.
          </p>

          <p className="text-xs text-slate-300 leading-relaxed bg-[#040a15] border border-cyan-500/15 rounded p-3">
            Every dimension, volume, and electrical rating below is a <strong className="text-amber-200">calculated target specification</strong> derived from the stated engineering assumptions to reach <strong className="text-cyan-200">2,000 W</strong> continuous equivalent output — <strong className="text-amber-200">not</strong> Ray&apos;s specified design dimensions and <strong className="text-amber-200">not</strong> measured test data. Wherever Ray&apos;s own design record leaves a material or dimension open, it remains <span className="font-mono text-slate-200">not specified in the design</span>.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-cyan-500/25 font-mono text-cyan-300">
                  <th className="py-2.5 px-3 min-w-[180px]">System Element</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Calculated Size (For 2,000 W Target)</th>
                  <th className="py-2.5 px-3 min-w-[240px]">Stated Assumptions</th>
                  <th className="py-2.5 px-3 min-w-[220px]">Engineering Basis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/12">
                {SIZING_2KW_ROWS.map((row) => (
                  <tr key={row.id} className="hover:bg-cyan-500/5 align-top">
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-100">{row.element}</div>
                      <div className="font-mono text-[11px] text-amber-300 mt-0.5">
                        {row.relatedParts}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-cyan-200 leading-relaxed">
                      {row.calculatedSize}
                    </td>
                    <td className="py-3 px-3 text-slate-300 leading-relaxed">
                      {row.assumptions}
                    </td>
                    <td className="py-3 px-3 text-slate-400 leading-relaxed">
                      {row.engineeringBasis}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
