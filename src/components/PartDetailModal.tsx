/**
 * PartDetailModal — detail view for one part of the Helix-Force Buoy.
 *
 * Follows the structure Gemini listed for the Buoy 3D Core app's
 * PartDetailModal.tsx [G22 §5]: the logic and state management for the
 * Center Needle, the Level/Cam Trigger, and the 12-stage / 15-part
 * directories.
 *
 * The 15 parts are Ray's canonical list [MDR §1.5] — NOT renumbered, no
 * Part 16 exists [G20]. The Nov 22 redesign additions ride as
 * PROPOSED sub-entries on the part they attach to, never as new part
 * numbers. Where a spec is not in any document it reads "not specified
 * in the design" — never an invented number.
 */

import { PARTS, PROPOSED_ADDITIONS, type Part } from "../data/rayDesignData";

export type PartSelection = Part["key"] | "center-needle" | null;

export type PartDetailModalProps = {
  selection: PartSelection;
  onClose: () => void;
};

/** Spec lines per part key. Values come only from the documents. */
const PART_SPECS: Record<string, string[]> = {
  hull: [
    "Envelope A: 1.20 m Ø × 2.40 m, 75% immersion [M20 §3].",
    "Envelope B: 850 mm OD × 2,800 mm, 2,200 mm draft, 600 mm freeboard [G20].",
    "Stationary moored buoy — does not bob [MDR §1.2, G20].",
  ],
  plunger: [
    "Envelope A: 180 mm bore × 1.00 m stroke, 2.40 m overall length [M20 §3].",
    "Envelope B: 450 mm bore × 0.65 m stroke; 45 mm OD hollow center needle stem [G20].",
    "Piston mass: NOT specified in the design (assumed 20 kg / 45 kg in Gemini's lift working [G22 §1]).",
    "PROPOSED: stepped differential-area piston — step dimensions not specified [G22 §2B].",
    "PROPOSED: hollow center needle as internal shuttle / poppet valve [G22 §2B].",
    "PROPOSED: dual U-cup seals + wiper ring + ceramic/hard-chrome needle sleeve [G22 §2D].",
  ],
  scuppers: [
    "Envelope A: 4 slots, 52 × 40 mm (8,320 mm² total) [M20 §3].",
    "Envelope B: 4 slots, 150 × 70 mm (420 cm² total) [G20].",
    "Diagram shows open top grilles — valving is missing for Ray to true [G22 §4].",
    "PROPOSED: one-way flapper / reed ring at the top scuppers [G22 §2A].",
  ],
  accelerator: [
    "Tapered throat; ΔP = P_in − P_throat in pascals — the working number, logged every trial [MDR §1.2].",
    "Envelope B throat: 220 mm → 110 mm [G20]. Envelope A does not dimension the throat.",
  ],
  taps: [
    "P_in at the wide mouth, P_throat at the narrow; differential sensor in Pa [MDR §1.2].",
  ],
  turbine: [
    "Envelope A: 400 mm rotor, 10 blades, 35° pitch, 1,800 rpm nominal [M20 §3].",
    "Envelope B: 280 mm rotor OD, 95 mm hub, 8 hydrofoil blades (28°–34° pitch), ~650–950 RPM pulse [G20].",
    "Hybrid motor/generator — harvests as a generator, spends banked charge as a motor [MDR §1.2].",
    "Turbine RPM is driven by discharge, not by waves [G20].",
  ],
  coils: [
    "Envelope A: 48 turns/phase, 2.5 mm² copper, 0.50 T, 30 Hz; E ≈ 63.9 V peak/phase [M20 §3].",
    "Envelope B: 6 copper bobbins + 3 Litz rings (~120 turns, 10 AWG eq.), N52 0.95–1.1 T; frequency not stated, so EMF cannot be computed [G20].",
    "PROPOSED: EM repulsion coil stator + Halbach ring on the piston — see EM risks [G22 §3].",
  ],
  venturi: [
    "Envelope A: throat 12.8 mm Ø each (510 mm² total); mouth 38 mm; 3:1 taper assumed [M20 §3].",
    "Envelope B: 4 ports, 65 mm → 35 mm [G20].",
    "PROPOSED: anti-siphon foot valve between the chamber and the ports [G22 §2A].",
  ],
  core: [
    "Fibonacci helical core — vortex winds down the helix, each turn in golden proportion [MDR §1.2].",
    "Copper induction coils around the core harvest the crossing field [MDR §1.2].",
  ],
  halbach: [
    "Halbach array focuses its field inward and cancels it outside [MDR §1.2].",
    "Envelope A: 0.50 T inward (assumption) [M20]. Envelope B: N52, 0.95–1.1 T; cage 290 mm ID × 360 mm OD × 220 mm stack [G20].",
    "'24 blocks' is illustrative from the bucket sheet — not specified for this buoy [M20 §3].",
    "Demagnetization risk from EM repulsion coils above coercivity / 60–80 °C [G22 §3C].",
  ],
  scrub: [
    "Graphene-ion scrub electrodes draw ions and debris out of the stream [MDR §1.2].",
    "Water leaves cleaner than it came in — TDS in vs out is logged [MDR §1.7].",
  ],
  supercaps: [
    "Envelope B: 165 F @ 48 V (~190 kJ usable) [G20].",
    "Envelope A: bank NOT sized — load only (48 V / 41.67 A) [M20].",
    "Mode A Harvest stores; Mode B Boost spends the bank in one pulse [MDR §1.4].",
  ],
  routerbase: [
    "Smart-switch router + capacitor base; ballasts the buoy upright [MDR §1.5].",
    "Envelope B: Schottky bridge ≥120 A cont. / 200 A surge; MOSFET router [G20].",
    "PROPOSED: four-quadrant bi-directional H-bridge inverter/converter for EM motoring mode [G22 §3D].",
  ],
  solar: [
    "Solar Crown panels top up the bank and keep the router, sensors, and beacon alive through flat calms [MDR §1.2].",
    "PROPOSED: snifter / solar top-up valve replenishes seal leakage in the accumulator loop [G22 §2C].",
  ],
  mooring: [
    "Envelope A: 2,500 kg wet total, assumed 4 × 625 kg [M20 §3].",
    "Envelope B: ≥1,800 kg ballast + seafloor anchor deadweight [G20].",
    "Not a sea-floor holding design — wave height, current, depth, seabed, chain size, and factor of safety are unspecified [M20 §5].",
  ],
  "center-needle": [
    "FEATURED — Air Plunger — Center Needle [G20].",
    "Visible labeled needle running the whole stack (x=0, z=0).",
    "Envelope B: 45 mm OD hollow center needle stem [G20].",
    "Envelope A: needle length 2.40 m overall (assumed to span the hull) [M20 §3].",
    "PROPOSED: the hollow needle as an internal shuttle / poppet valve — unseats at the bottom of the stroke, reseats at the top via the level/cam trigger [G22 §2B].",
    "PROPOSED: low-friction ceramic or hard-chrome needle sleeve to prevent cocking and binding [G22 §2D].",
    "Material/dimensions otherwise 'not specified in the design' [G20].",
  ],
};

export function PartDetailModal({ selection, onClose }: PartDetailModalProps) {
  if (selection === null) return null;

  const part =
    selection === "center-needle"
      ? {
          num: 2,
          key: "center-needle",
          name: "Air Plunger — Center Needle (featured)",
          detail:
            "The hollow center needle running the whole stack — featured 3D & spec detail view.",
        }
      : PARTS.find((p) => p.key === selection);

  if (!part) return null;

  const specs = PART_SPECS[part.key] ?? ["No spec lines recorded for this part."];
  const additions = PROPOSED_ADDITIONS.filter((a) =>
    a.attachesTo.toLowerCase().includes(part.name.split(" ")[0].toLowerCase()),
  );

  return (
    <div role="dialog" aria-label={`Part detail: ${part.name}`}>
      <button type="button" onClick={onClose} aria-label="Close part detail">
        Close
      </button>
      <p>
        Part {part.num} of 15 · {part.key}
      </p>
      <h3>{part.name}</h3>
      <p>{part.detail}</p>
      <ul>
        {specs.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      {additions.length > 0 ? (
        <div>
          <h4>Proposed additions on this part</h4>
          <ul>
            {additions.map((a) => (
              <li key={a.key}>
                <strong>{a.name}</strong> — {a.whatItDoes}{" "}
                <em>
                  {a.source} · {a.status}
                </em>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <p>
        SIMULATION READOUTS — NOT MEASURED DATA · TARGET: 2,000 W — NOT
        MEASURED
      </p>
    </div>
  );
}
