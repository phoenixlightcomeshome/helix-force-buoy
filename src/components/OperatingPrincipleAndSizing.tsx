/**
 * OperatingPrincipleAndSizing — the shared Operating Principle section
 * plus the 2,000 W sizing tables, the redesign additions, the conflicts
 * table, and the missing-for-Ray list.
 *
 * Follows the structure Gemini listed for the Buoy 3D Core app's
 * OperatingPrincipleAndSizing.tsx [G22 §5]: the 6-step operating
 * principle (Ray's exact Nov 20 words, quoted) + the labelled sizing
 * table. This local version adds the Nov 22 redesign, both envelopes
 * side by side (no winner picked), the conflicts, and the missing list.
 *
 * Every number on this page is a CALCULATION for Ray to review and true
 * — NOT Ray's design dimensions and NOT measured data.
 * TARGET: 2,000 W — NOT MEASURED.
 */

import {
  STAGES,
  ENVELOPES,
  CONFLICTS,
  MISSING_FOR_RAY,
  PROPOSED_ADDITIONS,
  SIZING_TABLE_HEADING,
  SIMULATION_LABEL,
  TARGET_OUTPUT_LABEL,
  liftSummary,
  headlinePowerChain,
  type EnvelopeId,
} from "../data/rayDesignData";

export function OperatingPrincipleAndSizing() {
  const liftA = liftSummary(ENVELOPES["A-marlow"]);
  const liftB = liftSummary(ENVELOPES["B-gemini"]);
  const chainA = headlinePowerChain(ENVELOPES["A-marlow"]);
  const chainB = headlinePowerChain(ENVELOPES["B-gemini"]);

  return (
    <section aria-label="Operating principle and sizing">
      <header>
        <p>{TARGET_OUTPUT_LABEL}</p>
        <h2>Operating principle</h2>
        <p>
          Ray&rsquo;s words, Nov 20, 2026 — the buoy is a stationary moored
          buoy. It does not bob. The air tank underneath drives the piston
          up; the waves drive the downstroke.
        </p>
      </header>

      <ol>
        {[
          "Stationary Moored Buoy (Does Not Bob)",
          "Water In Top Slots → Pan/Body Fills",
          "Trapped Air Forces Up → Level/Cam Trigger Trips",
          "Airtight Seal + Adjustable/Over-Energized Plunger Chain Reaction",
          "Ports & Bottom Jet Spin Turbine Generator Fins",
          "Magnetic Coils + Solid-State Magnetic Resistance → 2,000 W Target",
        ].map((step, i) => (
          <li key={step}>
            <strong>{String(i + 1).padStart(2, "0")}</strong> {step}
          </li>
        ))}
      </ol>

      <p>
        The 12-stage stack, in Ray&rsquo;s order:{" "}
        {STAGES.map((s) => `${s.num} ${s.short}`).join(" → ")}.
      </p>

      <h3>{SIZING_TABLE_HEADING}</h3>
      <p>{SIMULATION_LABEL}</p>

      <table>
        <thead>
          <tr>
            <th>Element</th>
            <th>Envelope A — Marlow (180 mm)</th>
            <th>Envelope B — Gemini (450 mm)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Bore × stroke</td>
            <td>180 mm × 1.00 m (25.45 L swept)</td>
            <td>450 mm × 0.65 m (0.103 m³ swept)</td>
          </tr>
          <tr>
            <td>Shot / cycle</td>
            <td>25 L at 30 cycles/min (0.50 Hz)</td>
            <td>103 L swept, 4.0 s cycle, 1.6 s pulse (40% duty)</td>
          </tr>
          <tr>
            <td>Driving pressure</td>
            <td>4.0 bar gauge net shot pressure</td>
            <td>1.6 bar effective ΔP</td>
          </tr>
          <tr>
            <td>Air tank</td>
            <td>50 L @ 4.0 bar (1.0–6.0 bar)</td>
            <td>250 L @ 1.5–3.0 bar (5.0–7.0 bar over-energized)</td>
          </tr>
          <tr>
            <td>Turbine</td>
            <td>400 mm rotor, 10 blades, 35°, 1,800 rpm</td>
            <td>280 mm rotor OD, 8 blades, 28–34°, 650–950 RPM</td>
          </tr>
          <tr>
            <td>Coils</td>
            <td>48 turns/phase, 2.5 mm², 0.50 T, 30 Hz</td>
            <td>~120 turns, 10 AWG eq., N52 0.95–1.1 T</td>
          </tr>
          <tr>
            <td>Power chain</td>
            <td>
              {chainA.derivation}
            </td>
            <td>
              {chainB.derivation}
            </td>
          </tr>
          <tr>
            <td>Lift pressure (Gemini&rsquo;s calc)</td>
            <td>
              ΔP lift {liftA.liftPressureGaugeBar.toFixed(3)} bar gauge; +
              {liftA.hydrostaticBar.toFixed(3)} bar hydrostatic (1.8 m) ={" "}
              {liftA.absolutePressureBar.toFixed(2)} bar abs. Thrust at 4.0
              bar: {Math.round(liftA.thrustAt4BarN).toLocaleString()} N.
            </td>
            <td>
              ΔP lift {liftB.liftPressureGaugeBar.toFixed(3)} bar gauge; +
              {liftB.hydrostaticBar.toFixed(3)} bar hydrostatic (2.2 m) ={" "}
              {liftB.absolutePressureBar.toFixed(2)} bar abs. Thrust at 4.0
              bar: {Math.round(liftB.thrustAt4BarN).toLocaleString()} N.
            </td>
          </tr>
        </tbody>
      </table>

      <h3>The sizing paradox</h3>
      <p>
        A modest 0.35–0.50 bar gauge lifts the piston and the water column in
        either envelope. The design targets 4.0 bar nominal (up to 6.0 bar
        over-energized) — 10,180 N of thrust on a 180 mm piston, 63,600 N
        on a 450 mm piston. With the scuppers open, water erupts out of the
        top instead of going through the turbine and venturis. That is why
        the redesign adds one-way flappers at the top scuppers and an
        anti-siphon foot valve before the venturis.
      </p>

      <h3>Redesign additions (proposals — Ray&rsquo;s word needed)</h3>
      <ul>
        {PROPOSED_ADDITIONS.map((a) => (
          <li key={a.key}>
            <strong>{a.name}</strong> — {a.attachesTo}. {a.whatItDoes}{" "}
            <em>
              {a.source} · {a.status}
            </em>
          </li>
        ))}
      </ul>

      <h3>Conflicts — both envelopes kept, no winner picked</h3>
      <table>
        <thead>
          <tr>
            <th>Topic</th>
            <th>Envelope A</th>
            <th>Envelope B</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {CONFLICTS.map((c) => (
            <tr key={c.topic}>
              <td>{c.topic}</td>
              <td>{c.envelopeA}</td>
              <td>{c.envelopeB}</td>
              <td>{c.note}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Missing — for Ray to true</h3>
      <ul>
        {MISSING_FOR_RAY.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>

      <footer>
        <p>
          His design. Her memory. One change at a time. Slow and smooth,
          smooth is fast.
        </p>
        <p>
          Water enters, turns in a spiral, meets a magnetic heart, leaves
          cleaner than it came — and the turning pays for the cleaning.
        </p>
      </footer>
    </section>
  );
}

export type { EnvelopeId };
