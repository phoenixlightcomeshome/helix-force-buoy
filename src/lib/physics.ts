/**
 * Helix-Force Buoy — pure physics helpers.
 *
 * Every function here is arithmetic on values taken from the design
 * documents. Nothing in this file is a measured result, and nothing here
 * claims the machine can achieve Ray's 2,000 W target.
 *
 * Sources (see README.md for the full source map):
 *  - [G22] GEMINI-BUOY-ANSWERS-20261122.md — Gemini's Nov 22 redesign +
 *    lift calculations (both envelopes) + sizing paradox + EM risks.
 *  - [G20] gemini-buoy-air-plunger-sizing-20261120.md — Gemini's Nov 20
 *    air-plunger sizing (450 mm envelope).
 *  - [M20] BUOY-2KW-SIZING-SPEC-20261120.md — Marlow's Nov 20 2 kW sizing
 *    spec (180 mm envelope).
 *  - [MDR] GENERATOR-SYSTEM-DESIGN-20261120.md — the master design record
 *    (Ray's design as drawn; 12 stages, 15 parts, moored, does not bob).
 *
 * All pressures are pascals internally unless a name says "Bar".
 * All powers are watts. All energies are joules.
 * TARGET: 2,000 W — NOT MEASURED.
 */

/** Seawater density used by Gemini [G22] and Marlow [M20]. */
export const SEAWATER_RHO_KG_M3 = 1025;
/** Fresh-water density used in Marlow's hull arithmetic [M20 §1]. */
export const FRESHWATER_RHO_KG_M3 = 1000;
/** Standard gravity. */
export const G_M_S2 = 9.81;
/** Standard atmospheric pressure, Pa. */
export const P_ATM_PA = 101325;
/** Pascals per bar. */
export const PA_PER_BAR = 100000;

/** Bar → Pa. */
export function barToPa(bar: number): number {
  return bar * PA_PER_BAR;
}

/** Pa → bar. */
export function paToBar(pa: number): number {
  return pa / PA_PER_BAR;
}

/**
 * Piston face area from bore diameter. A = π/4 · D².
 * [M20 §3]: 180 mm → 0.02545 m². [G20]: 450 mm → 0.1590 m².
 */
export function pistonFaceAreaM2(boreDiameterM: number): number {
  return (Math.PI / 4) * boreDiameterM * boreDiameterM;
}

/**
 * Swept volume of one full stroke. V = A · stroke.
 * [M20 §3]: 0.02545 m² × 1.00 m = 0.02545 m³ (25.45 L).
 * [G20]: 0.1590 m² × 0.65 m = 0.103 m³ (103 L).
 */
export function sweptVolumeM3(faceAreaM2: number, strokeM: number): number {
  return faceAreaM2 * strokeM;
}

/**
 * Hydrostatic pressure of a water column. P = ρ·g·h.
 * [G22 §1]: 1.8 m immersion → 0.181 bar; 2.2 m draft → 0.221 bar.
 */
export function hydrostaticHeadPa(
  rhoKgM3: number,
  heightM: number,
  g = G_M_S2,
): number {
  return rhoKgM3 * g * heightM;
}

/**
 * Minimum gauge pressure under the piston for positive lift.
 * ΔP_lift ≥ (m_piston·g + m_water·g + F_friction) / A_lift
 * [G22 §1]. A_lift is the pneumatic face area. For the pre-redesign
 * single-bore piston A_lift = the bore area. For Gemini's stepped
 * differential-area piston [G22 §2B] A_lift = A_pneumatic (the smaller
 * lower face) — a smaller A_lift needs a HIGHER ΔP_lift for the same
 * load, which is why the step dimensions matter and are flagged missing.
 *
 * @param pistonMassKg dead weight of the piston assembly (kg).
 *   NOT specified in any document — Gemini assumes 20 kg (180 mm) /
 *   45 kg (450 mm) [G22 §1, §4]. Pass the assumption explicitly; never
 *   hide it inside this function.
 * @param waterMassKg mass of the water column resting on the piston.
 * @param frictionN seal friction (N). NOT specified — Gemini assumes
 *   100 N (180 mm) / 250 N (450 mm) [G22 §1, §4]. Pass explicitly.
 * @param liftAreaM2 pneumatic face area the air pushes on.
 * @returns required gauge pressure in Pa.
 */
export function liftPressureGaugePa(
  pistonMassKg: number,
  waterMassKg: number,
  frictionN: number,
  liftAreaM2: number,
  g = G_M_S2,
): number {
  const fDown = pistonMassKg * g + waterMassKg * g + frictionN;
  return fDown / liftAreaM2;
}

/**
 * Total downward force on the piston: water + piston weight + friction.
 * [G22 §1]: Case A 547.6 N; Case B 1,727.2 N (with her assumed masses).
 */
export function downwardForceN(
  pistonMassKg: number,
  waterMassKg: number,
  frictionN: number,
  g = G_M_S2,
): number {
  return pistonMassKg * g + waterMassKg * g + frictionN;
}

/**
 * Upward thrust from a pressure acting on an area. F = P · A.
 * [G22 §1 sizing paradox]: 4.0 bar on 180 mm → 10,180 N;
 * 4.0 bar on 450 mm → 63,600 N.
 */
export function thrustAtPressureN(pressurePa: number, areaM2: number): number {
  return pressurePa * areaM2;
}

/**
 * Hydraulic power of a flow at a pressure drop. P = ΔP · Q.
 * [M20 §2]: 400 kPa × 0.0125 m³/s = 5,000 W.
 * [G20]: 160 kPa × 0.0625 m³/s = 10,000 W during the pulse.
 */
export function hydraulicPowerW(deltaPPa: number, flowM3PerS: number): number {
  return deltaPPa * flowM3PerS;
}

/**
 * The two-stage power chain. P_shaft = P_hyd · η_turbine;
 * P_elec = P_shaft · η_elec.
 * [M20 §2]: 5,000 W × 55% = 2,750 W shaft; × 72.73% = 2,000 W.
 * [G20]: 10,000 W pulse × 40% duty = 4,000 W avg hydraulic;
 * × 50% total water-to-wire = 2,000 W average.
 * This chain is ARITHMETIC ONLY. It does not verify Bernoulli losses,
 * pressure decay, sealing, cavitation, turbine stall, coil impedance,
 * or real output [M20 §2, §7].
 */
export function powerChainW(
  hydraulicW: number,
  etaTurbine: number,
  etaElec: number,
): { shaftW: number; electricalW: number } {
  const shaftW = hydraulicW * etaTurbine;
  return { shaftW, electricalW: shaftW * etaElec };
}

/**
 * Mean flow from a shot volume and a cycle rate. Q = V · f.
 * [M20 §2]: 0.025 m³ × 0.50 Hz = 0.0125 m³/s (12.5 L/s).
 */
export function meanFlowM3PerS(shotVolumeM3: number, cycleHz: number): number {
  return shotVolumeM3 * cycleHz;
}

/**
 * Pulse flow from a swept volume discharged over a pulse duration.
 * Q_pulse = V_swept / t_pulse.
 * [G20]: 0.100 m³ over 1.6 s = 62.5 L/s.
 */
export function pulseFlowM3PerS(
  sweptVolumeM3: number,
  pulseSeconds: number,
): number {
  return sweptVolumeM3 / pulseSeconds;
}

/**
 * Coil EMF estimate. E ≈ 4.44 · f · N · B · A (peak volts per phase).
 * [M20 §3]: 48 turns × 4.44 × 30 Hz × 0.50 T × 0.020 m² = 63.936 V.
 * The 0.50 T field, 30 Hz, and 0.020 m² active area are Marlow's
 * calculation assumptions, not design facts [M20 §1, §7].
 */
export function coilEmfPeakV(
  frequencyHz: number,
  turnsPerPhase: number,
  fieldTesla: number,
  activeAreaM2: number,
): number {
  return 4.44 * frequencyHz * turnsPerPhase * fieldTesla * activeAreaM2;
}

/**
 * Pressure–volume energy of one charged shot. E = P · V.
 * [M20 §4]: 400 kPa × 0.025 m³ = 10 kJ per 25 L cycle at 4 bar.
 */
export function shotEnergyJ(pressurePa: number, volumeM3: number): number {
  return pressurePa * volumeM3;
}

/**
 * Isothermal (Boyle) pressure change when a gas volume is compressed
 * or expanded: P₂ = P₁ · V₁ / V₂. Used ONLY as the accumulator-plenum
 * approximation in the simulator — labelled as such there. Real
 * compression is adiabatic-ish, temperature, leakage and hysteresis
 * are NOT specified in any document [M20 §4, §7].
 */
export function boylePressurePa(
  p1Pa: number,
  v1M3: number,
  v2M3: number,
): number {
  return (p1Pa * v1M3) / v2M3;
}

/**
 * Clamp a value into [min, max]. Used for the piston travel clamp:
 * piston position is always clamped to [0, stroke] — the clamp values
 * come from the active sizing envelope, never from a hard-coded guess.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
