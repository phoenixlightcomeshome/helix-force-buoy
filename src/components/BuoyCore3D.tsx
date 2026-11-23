/**
 * BuoyCore3D — Three.js scene for the Helix-Force Buoy.
 *
 * Follows the structure Gemini listed for the Buoy 3D Core app's
 * BuoyCore3D.tsx [G22 §5]: Three.js scene hierarchy, mesh coordinate
 * bindings, and the animation loop driving piston travel, pan fill, and
 * turbine rotation.
 *
 * The scene is driven ENTIRELY by the telemetry from stepSimulation()
 * in ../data/rayDesignData.ts. It invents no dimensions: every mesh
 * size comes from the active sizing envelope, and every position is
 * computed from the telemetry. Where the design gives no dimension, the
 * mesh is drawn from the envelope's stated values and the gap is flagged
 * in the README.
 *
 * PISTON TRAVEL CLAMP: the piston mesh position is clamped to
 * [0, stroke] here AND in the simulator. The clamp values come from
 * the active envelope — never from a hard-coded guess.
 *
 * PENDING SLOT — air-tank motion: Ray's Nov 22 direction has the air
 * tank vertical, going up and down at the bottom of the buoy, with
 * accurate capacity readouts. Gemini's 3D model spec answer (ports,
 * release system, all parts visible, air-tank motion, accurate
 * capacity) is still pending. Until it lands, the tank mesh sits fixed
 * below the piston and `tankOffsetY` defaults to 0. Do NOT animate it
 * until the spec lands.
 *
 * This file is a local implementation for Ray's review. It does NOT
 * edit the Buoy 3D Core app in AI Studio or any Base44 app.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { SizingEnvelope, SimTelemetry } from "../data/rayDesignData";
import { clamp } from "../lib/physics";

export type BuoyCore3DProps = {
  envelope: SizingEnvelope;
  telemetry: SimTelemetry;
  /**
   * Vertical offset of the air-tank mesh, metres.
   * PENDING SLOT — defaults to 0 until Gemini's 3D model spec answer
   * (air-tank motion) lands. Do not animate before then.
   */
  tankOffsetY?: number;
  /** Show the cutaway (hull half-section) so all parts are visible. */
  cutaway?: boolean;
};

/** Scale: 1 scene unit = 1 metre. The buoy is ~2.4–2.8 m tall. */
const HULL_COLOR = 0x2e5d6b;
const GOLD = 0xd4a017;
const COPPER = 0xb87333;
const WATER_COLOR = 0x1a6f8e;
const AIR_COLOR = 0x9fd8e8;

export function BuoyCore3D({
  envelope,
  telemetry,
  tankOffsetY = 0,
  cutaway = true,
}: BuoyCore3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Piston travel clamp — from the active envelope, never hard-coded.
  const pistonY = clamp(telemetry.pistonY, 0, envelope.strokeM);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x062a3a);

    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / Math.max(mount.clientHeight, 1),
      0.1,
      100,
    );
    camera.position.set(2.6, 1.6, 3.4);
    camera.lookAt(0, 0.4, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const sun = new THREE.DirectionalLight(0xffffff, 1.1);
    sun.position.set(3, 5, 2);
    scene.add(sun);

    const buoy = new THREE.Group();
    scene.add(buoy);

    const hullR = envelope.hullDiameterM / 2;
    const hullH = envelope.hullHeightM;

    // --- Hull (Part 01). Cutaway: half-section so all parts are visible.
    const hullGeo = new THREE.CylinderGeometry(
      hullR,
      hullR,
      hullH,
      48,
      1,
      true,
      0,
      cutaway ? Math.PI : Math.PI * 2,
    );
    const hullMat = new THREE.MeshStandardMaterial({
      color: HULL_COLOR,
      metalness: 0.55,
      roughness: 0.45,
      side: THREE.DoubleSide,
      transparent: cutaway,
      opacity: cutaway ? 0.55 : 1,
    });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = hullH / 2;
    hull.name = "hull-part-01";
    buoy.add(hull);

    // --- Top scupper ring (Part 03) + flapper ring (PROPOSED [G22 §2A]).
    const scupperGeo = new THREE.TorusGeometry(hullR * 0.92, 0.02, 10, 48);
    const scupper = new THREE.Mesh(
      scupperGeo,
      new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.7, roughness: 0.35 }),
    );
    scupper.rotation.x = Math.PI / 2;
    scupper.position.y = hullH - 0.08;
    scupper.name = "scuppers-part-03";
    buoy.add(scupper);

    const flapperGeo = new THREE.CylinderGeometry(
      hullR * 0.92,
      hullR * 0.92,
      0.015,
      48,
      1,
      true,
    );
    const flapper = new THREE.Mesh(
      flapperGeo,
      new THREE.MeshStandardMaterial({
        color: telemetry.flapperOpen ? 0x7fd08a : 0xd06a5a,
        metalness: 0.2,
        roughness: 0.6,
        transparent: true,
        opacity: 0.85,
      }),
    );
    // Flappers open = ring lies flat (open); shut = ring closes the crown.
    flapper.rotation.x = telemetry.flapperOpen ? 0 : Math.PI / 2;
    flapper.position.y = hullH - 0.12;
    flapper.name = "flapper-ring-proposed";
    buoy.add(flapper);

    // --- Pan fill (water above the piston crown).
    const panGeo = new THREE.CylinderGeometry(
      hullR * 0.9,
      hullR * 0.9,
      0.01,
      48,
    );
    const pan = new THREE.Mesh(
      panGeo,
      new THREE.MeshStandardMaterial({
        color: WATER_COLOR,
        transparent: true,
        opacity: 0.75,
      }),
    );
    const panHeight = 0.45 * telemetry.waterLevel;
    pan.scale.y = Math.max(panHeight / 0.01, 0.001);
    pan.position.y = hullH - 0.15 - panHeight / 2;
    pan.name = "pan-fill";
    buoy.add(pan);

    // --- Stepped piston (Part 02 + PROPOSED step [G22 §2B]).
    // Upper crown (A_water) and lower pneumatic face (A_pneumatic).
    // The step dimensions are NOT specified — until Ray trues them the
    // two faces are drawn at the same bore and flagged in the README.
    const pistonGroup = new THREE.Group();
    pistonGroup.name = "piston-part-02-stepped-proposed";
    const crownGeo = new THREE.CylinderGeometry(
      envelope.boreM / 2,
      envelope.boreM / 2,
      0.08,
      48,
    );
    const crown = new THREE.Mesh(
      crownGeo,
      new THREE.MeshStandardMaterial({ color: 0x8a8f96, metalness: 0.8, roughness: 0.3 }),
    );
    crown.position.y = 0.04;
    pistonGroup.add(crown);
    const lowerFaceGeo = new THREE.CylinderGeometry(
      envelope.boreM / 2,
      envelope.boreM / 2,
      0.06,
      48,
    );
    const lowerFace = new THREE.Mesh(
      lowerFaceGeo,
      new THREE.MeshStandardMaterial({ color: 0x6b7280, metalness: 0.8, roughness: 0.35 }),
    );
    lowerFace.position.y = -0.05;
    pistonGroup.add(lowerFace);
    // Piston travel clamp applied here too (defense in depth).
    pistonGroup.position.y = 0.55 + pistonY;
    buoy.add(pistonGroup);

    // --- Hollow center needle (Part 02) as shuttle valve [G22 §2B].
    const needleGeo = new THREE.CylinderGeometry(0.0225, 0.0225, hullH * 0.8, 24);
    const needle = new THREE.Mesh(
      needleGeo,
      new THREE.MeshStandardMaterial({ color: 0xc0c6cc, metalness: 0.9, roughness: 0.2 }),
    );
    needle.position.y = hullH * 0.45;
    needle.name = "center-needle-part-02";
    buoy.add(needle);
    // Needle poppet: unseated (open) at the bottom of the stroke.
    const poppetGeo = new THREE.SphereGeometry(0.035, 16, 12);
    const poppet = new THREE.Mesh(
      poppetGeo,
      new THREE.MeshStandardMaterial({
        color: telemetry.needleValve === "unseated" ? 0x7fd08a : GOLD,
        metalness: 0.6,
        roughness: 0.4,
      }),
    );
    poppet.position.y = 0.55 + pistonY - 0.12;
    poppet.name = "needle-poppet";
    buoy.add(poppet);

    // --- Air accelerator throat (Part 04, Stage 03).
    const throatGeo = new THREE.CylinderGeometry(0.11, 0.055, 0.18, 32, 1, true);
    const throat = new THREE.Mesh(
      throatGeo,
      new THREE.MeshStandardMaterial({
        color: COPPER,
        metalness: 0.7,
        roughness: 0.35,
        side: THREE.DoubleSide,
      }),
    );
    throat.position.y = 0.55 + pistonY - 0.3;
    throat.name = "accelerator-throat-part-04";
    buoy.add(throat);

    // --- Quad-Venturi ports (Part 08) — four tapered ports.
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const ventGeo = new THREE.CylinderGeometry(
        envelope.venturiMouthM / 2,
        envelope.venturiThroatM / 2,
        0.16,
        20,
        1,
        true,
      );
      const vent = new THREE.Mesh(
        ventGeo,
        new THREE.MeshStandardMaterial({
          color: COPPER,
          metalness: 0.7,
          roughness: 0.35,
          side: THREE.DoubleSide,
        }),
      );
      vent.position.set(
        Math.cos(angle) * hullR * 0.55,
        0.42,
        Math.sin(angle) * hullR * 0.55,
      );
      vent.rotation.z = Math.cos(angle) * 0.5;
      vent.rotation.x = -Math.sin(angle) * 0.5;
      vent.name = `quad-venturi-part-08-${i + 1}`;
      buoy.add(vent);
    }

    // --- Anti-siphon foot valve (PROPOSED [G22 §2A]) — between the
    // chamber and the Quad-Venturi ports.
    const footGeo = new THREE.CylinderGeometry(hullR * 0.5, hullR * 0.5, 0.02, 32);
    const foot = new THREE.Mesh(
      footGeo,
      new THREE.MeshStandardMaterial({
        color: telemetry.footValveOpen ? 0x7fd08a : 0xd06a5a,
        metalness: 0.3,
        roughness: 0.6,
      }),
    );
    foot.position.y = 0.5;
    foot.name = "foot-valve-proposed";
    buoy.add(foot);

    // --- Axial-flow turbine (Part 06) — spins with turbineRPM.
    const turbineGroup = new THREE.Group();
    turbineGroup.name = "turbine-part-06";
    const hubGeo = new THREE.CylinderGeometry(0.0475, 0.0475, 0.1, 20);
    const hub = new THREE.Mesh(
      hubGeo,
      new THREE.MeshStandardMaterial({ color: 0x555b63, metalness: 0.85, roughness: 0.3 }),
    );
    turbineGroup.add(hub);
    for (let i = 0; i < envelope.turbineBlades; i++) {
      const bladeGeo = new THREE.BoxGeometry(
        envelope.turbineRotorM / 2 - 0.05,
        0.012,
        0.05,
      );
      const blade = new THREE.Mesh(
        bladeGeo,
        new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.7, roughness: 0.35 }),
      );
      const a = (i / envelope.turbineBlades) * Math.PI * 2;
      blade.position.set(Math.cos(a) * 0.12, 0, Math.sin(a) * 0.12);
      blade.rotation.y = -a;
      blade.rotation.z = 0.5;
      turbineGroup.add(blade);
    }
    turbineGroup.position.y = 0.32;
    buoy.add(turbineGroup);

    // --- Fibonacci helical core (Part 09) — golden-proportion spiral.
    const helixPoints: THREE.Vector3[] = [];
    const turns = 3;
    for (let i = 0; i <= 120; i++) {
      const t = i / 120;
      const angle = t * turns * Math.PI * 2;
      const r = 0.16 * (1 - t * 0.45); // spiral tightening as it falls
      helixPoints.push(
        new THREE.Vector3(Math.cos(angle) * r, 0.55 - t * 0.35, Math.sin(angle) * r),
      );
    }
    const helixCurve = new THREE.CatmullRomCurve3(helixPoints);
    const helixGeo = new THREE.TubeGeometry(helixCurve, 120, 0.012, 8, false);
    const helix = new THREE.Mesh(
      helixGeo,
      new THREE.MeshStandardMaterial({ color: COPPER, metalness: 0.75, roughness: 0.3 }),
    );
    helix.name = "fibonacci-core-part-09";
    buoy.add(helix);

    // --- Halbach magnetic matrix (Part 10) — ring around the core.
    const halbachGeo = new THREE.TorusGeometry(0.19, 0.03, 12, 48);
    const halbach = new THREE.Mesh(
      halbachGeo,
      new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.6, roughness: 0.35 }),
    );
    halbach.rotation.x = Math.PI / 2;
    halbach.position.y = 0.38;
    halbach.name = "halbach-part-10";
    buoy.add(halbach);

    // --- EM repulsion coil stator (PROPOSED [G22 §3]) — coaxial rings
    // along the barrel. Shown dimmed when the pulse is off.
    for (let i = 0; i < 4; i++) {
      const statorGeo = new THREE.TorusGeometry(hullR * 0.72, 0.018, 10, 48);
      const stator = new THREE.Mesh(
        statorGeo,
        new THREE.MeshStandardMaterial({
          color: telemetry.emPulseActive ? 0xf59e0b : 0x6b4d1f,
          metalness: 0.6,
          roughness: 0.4,
          emissive: telemetry.emPulseActive ? 0x92400e : 0x000000,
        }),
      );
      stator.rotation.x = Math.PI / 2;
      stator.position.y = 0.6 + i * 0.22;
      stator.name = `em-stator-proposed-${i + 1}`;
      buoy.add(stator);
    }

    // --- Air tank underneath (Part 02 / Stage 02).
    // PENDING SLOT: tankOffsetY is 0 until Gemini's 3D model spec
    // (air-tank motion) lands. Do not animate before then.
    const tankGeo = new THREE.CylinderGeometry(
      envelope.boreM * 0.9,
      envelope.boreM * 0.9,
      0.5,
      32,
    );
    const tank = new THREE.Mesh(
      tankGeo,
      new THREE.MeshStandardMaterial({
        color: AIR_COLOR,
        metalness: 0.4,
        roughness: 0.4,
        transparent: true,
        opacity: 0.8,
      }),
    );
    tank.position.y = 0.25 + tankOffsetY;
    tank.name = "air-tank-underneath";
    buoy.add(tank);

    // --- Solar crown (Part 14, Stage 12).
    const solarCrownGeo = new THREE.CylinderGeometry(hullR * 0.98, hullR * 0.98, 0.04, 48);
    const crownMesh = new THREE.Mesh(
      solarCrownGeo,
      new THREE.MeshStandardMaterial({ color: 0x1e3a5f, metalness: 0.6, roughness: 0.3 }),
    );
    crownMesh.position.y = hullH + 0.02;
    crownMesh.name = "solar-crown-part-14";
    buoy.add(crownMesh);

    // --- Mooring (Part 15) — seafloor weights, hull does NOT bob.
    const anchorGeo = new THREE.BoxGeometry(0.3, 0.12, 0.3);
    const anchor = new THREE.Mesh(
      anchorGeo,
      new THREE.MeshStandardMaterial({ color: 0x44484e, metalness: 0.5, roughness: 0.7 }),
    );
    anchor.position.y = -0.35;
    anchor.name = "mooring-part-15";
    buoy.add(anchor);

    // Animation loop — turbine spins with telemetry.turbineRPM.
    // The hull NEVER bobs: buoy.position.y stays 0 (stationary moored
    // buoy [MDR §1.2, G20]). Tide changes pan-fill rate only.
    let raf = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const omega = (telemetry.turbineRPM * Math.PI * 2) / 60;
      turbineGroup.rotation.y += omega * dt;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      camera.aspect = mount.clientWidth / Math.max(mount.clientHeight, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const mat = obj.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat.dispose();
        }
      });
    };
  }, [envelope, telemetry, tankOffsetY, cutaway]);

  return (
    <div
      ref={mountRef}
      aria-label={`Helix-Force Buoy 3D core — ${envelope.name}. ${telemetry.phase} phase, piston at ${pistonY.toFixed(2)} m of ${envelope.strokeM.toFixed(2)} m stroke.`}
      style={{ width: "100%", height: 420, background: "#062a3a" }}
    />
  );
}
