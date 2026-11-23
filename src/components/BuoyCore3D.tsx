import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ChevronDown,
  ChevronUp,
  Eye,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Waves,
  Zap,
  ZoomIn,
  ZoomOut,
  X,
} from 'lucide-react';
import {
  BuoyStage,
  DIAGRAM_IMAGE_SRC,
  PART_DETAILS,
  SimTelemetry,
  STAGES,
  TARGET_OUTPUT_LABEL,
  TIDE_PRESETS,
  TideLevel,
} from '../data/rayDesignData';

interface BuoyCore3DProps {
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

interface StageRig {
  stage: BuoyStage;
  group: THREE.Group;
  materials: THREE.MeshStandardMaterial[];
  baseEmissives: THREE.Color[];
  baseEmissiveIntensities: number[];
}

interface ParticleState {
  t: number;
  speed: number;
  lane: number;
  radialJitter: number;
}

// Pre-allocated scratch helpers for zero GC inside animation loop
const _vec3 = new THREE.Vector3();
const _targetVec3 = new THREE.Vector3();
const _camGoalPos = new THREE.Vector3();
const _camGoalTarget = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _scaleVec = new THREE.Vector3();
const _upVec = new THREE.Vector3(0, 1, 0);
const _dirVec = new THREE.Vector3();
const _color = new THREE.Color();
const _cyanColor = new THREE.Color(0x00e5ff);
const _goldColor = new THREE.Color(0xe5b842);
const _whiteCyan = new THREE.Color(0xb8f6ff);

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function createSolarTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#071428';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#1e4a7a';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 256; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();
    }
    ctx.strokeStyle = '#e5b842';
    ctx.lineWidth = 1.5;
    for (let i = 16; i < 256; i += 64) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createWaterRingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 128);
    grad.addColorStop(0, 'rgba(0, 229, 255, 0.32)');
    grad.addColorStop(0.55, 'rgba(8, 72, 118, 0.16)');
    grad.addColorStop(1, 'rgba(5, 11, 22, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createUnderTankLabelTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 280;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'rgba(5, 13, 28, 0.94)';
    ctx.strokeStyle = '#e5b842';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(8, 8, 752, 264, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 31px "IBM Plex Mono", monospace';
    ctx.fillText('Air Tank — Underneath the Unit', 28, 62);

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 25px "IBM Plex Sans", sans-serif';
    ctx.fillText('"That\'s what drives the piston up."', 28, 114);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '24px "IBM Plex Sans", sans-serif';
    ctx.fillText('Return stroke — drives the piston up.', 28, 162);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '21px "IBM Plex Mono", monospace';
    ctx.fillText('Dimensions / pressure: not specified in the design', 28, 224);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const BuoyCore3D: React.FC<BuoyCore3DProps> = ({
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
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [exploded, setExploded] = useState(false);
  const [cutawayOpen, setCutawayOpen] = useState(true);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [webglError, setWebglError] = useState<string | null>(null);
  const [hoveredStageId, setHoveredStageId] = useState<string | null>(null);

  // Refs synced to latest React state so Three.js loop never goes stale or remounts
  const telemetryRef = useRef(telemetry);
  telemetryRef.current = telemetry;

  const tideRef = useRef(tide);
  tideRef.current = tide;

  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const plungerSettingRef = useRef(plungerSetting);
  plungerSettingRef.current = plungerSetting;

  const overEnergizeRef = useRef(overEnergize);
  overEnergizeRef.current = overEnergize;

  const explodedRef = useRef(exploded);
  explodedRef.current = exploded;

  const cutawayRef = useRef(cutawayOpen);
  cutawayRef.current = cutawayOpen;

  const selectedStageRef = useRef(selectedStageId);
  selectedStageRef.current = selectedStageId;

  const hoveredStageRef = useRef(hoveredStageId);
  hoveredStageRef.current = hoveredStageId;

  const onSelectStageRef = useRef(onSelectStage);
  onSelectStageRef.current = onSelectStage;

  const onOpenCenterNeedleRef = useRef(onOpenCenterNeedle);
  onOpenCenterNeedleRef.current = onOpenCenterNeedle;

  // Imperative camera action hooks
  const cameraCommandRef = useRef<{
    type: 'reset' | 'zoomIn' | 'zoomOut' | 'focusStage';
    stageId?: string;
  } | null>(null);

  const selectedStage = selectedStageId
    ? STAGES.find((s) => s.id === selectedStageId) ?? null
    : null;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: false,
      });
    } catch {
      setWebglError('WebGL rendering context could not be initialized on this device.');
      return;
    }

    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 320);

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const canvas = renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError('WebGL context was interrupted. Attempting recovery...');
    };
    const handleContextRestored = () => {
      setWebglError(null);
    };
    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050b16);
    scene.fog = new THREE.FogExp2(0x050b16, 0.032);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envRT = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envRT.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(6.8, 1.35, 10.4);

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, -0.9, 0);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 3.2;
    controls.maxDistance = 19;
    controls.maxPolarAngle = Math.PI * 0.85;
    controls.minPolarAngle = Math.PI * 0.08;

    let cameraTransitionActive = false;
    const handleControlsStart = () => {
      cameraTransitionActive = false;
    };
    controls.addEventListener('start', handleControlsStart);

    // 3-Point Studio + Marine Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x8cd7ff, 0x091629, 0.9);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1dc, 2.1);
    keyLight.position.set(6, 9, 6);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.camera.left = -5;
    keyLight.shadow.camera.right = 5;
    keyLight.shadow.camera.top = 5;
    keyLight.shadow.camera.bottom = -5;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x00e5ff, 1.35);
    rimLight.position.set(-6, 3, -5);
    scene.add(rimLight);

    const coreGlowLight = new THREE.PointLight(0x00e5ff, 2.6, 8, 1.6);
    coreGlowLight.position.set(0, -1.1, 0);
    scene.add(coreGlowLight);

    // Track disposable resources
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];

    const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
      geometries.push(g);
      return g;
    };
    const trackMat = <T extends THREE.Material>(m: T): T => {
      materials.push(m);
      return m;
    };
    const trackTex = <T extends THREE.Texture>(t: T): T => {
      textures.push(t);
      return t;
    };

    const solarTex = trackTex(createSolarTexture());
    solarTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const waterRingTex = trackTex(createWaterRingTexture());

    // Reusable PBR Materials
    const brushedSteelMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xaab9ca,
        metalness: 0.85,
        roughness: 0.28,
      })
    );
    const darkArmorMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x1e2c3f,
        metalness: 0.72,
        roughness: 0.36,
      })
    );
    const copperCoilMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xd97d3a,
        metalness: 0.9,
        roughness: 0.22,
        emissive: 0x004b66,
        emissiveIntensity: 0.25,
      })
    );
    const goldMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xe5b842,
        metalness: 0.88,
        roughness: 0.24,
        emissive: 0x261a00,
        emissiveIntensity: 0.2,
      })
    );
    const grapheneMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x151b26,
        metalness: 0.55,
        roughness: 0.45,
        emissive: 0x004d61,
        emissiveIntensity: 0.35,
      })
    );
    const helixCoreMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        metalness: 0.4,
        roughness: 0.22,
        emissive: 0x00c8ff,
        emissiveIntensity: 0.75,
      })
    );
    const capCellMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x0ea5e9,
        metalness: 0.6,
        roughness: 0.28,
        emissive: 0x006b8f,
        emissiveIntensity: 0.3,
      })
    );
    const capChargeBarMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x00e5ff,
        metalness: 0.2,
        roughness: 0.2,
        emissive: 0x00e5ff,
        emissiveIntensity: 0.95,
      })
    );
    const routerMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x0c4a6e,
        metalness: 0.5,
        roughness: 0.32,
        emissive: 0x00e5ff,
        emissiveIntensity: 0.65,
      })
    );
    const solarPanelMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: solarTex,
        metalness: 0.45,
        roughness: 0.22,
        emissive: 0x051a30,
        emissiveIntensity: 0.3,
      })
    );
    const glassChamberMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0x99e9ff,
        metalness: 0.05,
        roughness: 0.12,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
      })
    );
    const hullCutawayMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x6b7f96,
        metalness: 0.78,
        roughness: 0.34,
        side: THREE.DoubleSide,
      })
    );

    // Environment: Pier Pilings + Animated Water Plane + Seafloor Blueprint Grid
    const envGroup = new THREE.Group();
    scene.add(envGroup);

    const pilingMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x3b352d,
        metalness: 0.08,
        roughness: 0.88,
      })
    );
    const deckMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x4b4238,
        metalness: 0.05,
        roughness: 0.85,
      })
    );

    // Pier pilings & deck edge to anchor Ray's pier cutaway context
    const pilingGeo = trackGeo(new THREE.CylinderGeometry(0.18, 0.2, 7.7, 14));
    const pilingPositions: [number, number][] = [
      [-3.5, -1.6],
      [-3.5, 0.6],
      [-4.9, -1.6],
      [-4.9, 0.6],
    ];
    pilingPositions.forEach(([px, pz]) => {
      const p = new THREE.Mesh(pilingGeo, pilingMat);
      p.position.set(px, -0.35, pz);
      envGroup.add(p);
    });
    const pierDeckGeo = trackGeo(new THREE.BoxGeometry(2.4, 0.22, 3.6));
    const pierDeck = new THREE.Mesh(pierDeckGeo, deckMat);
    pierDeck.position.set(-4.2, 2.75, -0.5);
    envGroup.add(pierDeck);

    // Animated Water Surface Plane at y = 2.0
    const waterGeo = trackGeo(new THREE.PlaneGeometry(18, 18, 36, 36));
    waterGeo.rotateX(-Math.PI / 2);
    const waterBasePos = Float32Array.from(waterGeo.attributes.position.array);
    const waterMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x0b4f75,
        metalness: 0.35,
        roughness: 0.18,
        transparent: true,
        opacity: 0.42,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.y = 2.02;
    waterMesh.renderOrder = 2;
    envGroup.add(waterMesh);

    // Contact / Seafloor blueprint grid below buoy & underneath air tank
    const gridHelper = new THREE.GridHelper(16, 32, 0x0e4f73, 0x09243b);
    gridHelper.position.y = -4.75;
    envGroup.add(gridHelper);

    const floorShadowGeo = trackGeo(new THREE.PlaneGeometry(5.5, 5.5));
    floorShadowGeo.rotateX(-Math.PI / 2);
    const floorShadowMat = trackMat(
      new THREE.MeshBasicMaterial({
        map: waterRingTex,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
      })
    );
    const floorShadow = new THREE.Mesh(floorShadowGeo, floorShadowMat);
    floorShadow.position.y = -4.73;
    envGroup.add(floorShadow);

    // Stationary Moored Buoy Root (moored down by seafloor weights — NEVER bobs on waves)
    const buoyRoot = new THREE.Group();
    scene.add(buoyRoot);

    // Seafloor Mooring Weights & Anchor Tether Chains holding the buoy stationary
    const mooringWeightGeo = trackGeo(new THREE.BoxGeometry(0.68, 0.34, 0.68));
    const tetherGeo = trackGeo(new THREE.CylinderGeometry(0.032, 0.032, 2.35, 8));
    const mooringOffsets: [number, number][] = [
      [-1.45, -1.45],
      [1.45, -1.45],
      [-1.45, 1.45],
      [1.45, 1.45],
    ];
    mooringOffsets.forEach(([wx, wz]) => {
      const weight = new THREE.Mesh(mooringWeightGeo, darkArmorMat);
      weight.position.set(wx, -4.58, wz);
      envGroup.add(weight);

      const tether = new THREE.Mesh(tetherGeo, goldMat);
      tether.position.set(wx * 0.86, -3.48, wz * 0.86);
      tether.lookAt(wx * 0.72, -2.38, wz * 0.72);
      tether.rotateX(Math.PI / 2);
      envGroup.add(tether);
    });

    // Cutaway Outer Hull (240 deg arc so front interior stays visible like Ray's drawing)
    const hullGroup = new THREE.Group();
    const outerShellGeo = trackGeo(
      new THREE.CylinderGeometry(1.42, 1.42, 5.2, 42, 1, true, Math.PI * 0.38, Math.PI * 1.24)
    );
    const outerShell = new THREE.Mesh(outerShellGeo, hullCutawayMat);
    outerShell.position.y = 0.05;
    hullGroup.add(outerShell);

    const innerWallGeo = trackGeo(
      new THREE.CylinderGeometry(1.33, 1.33, 5.2, 42, 1, true, Math.PI * 0.38, Math.PI * 1.24)
    );
    const innerWall = new THREE.Mesh(innerWallGeo, darkArmorMat);
    innerWall.position.y = 0.05;
    hullGroup.add(innerWall);

    // Structural flange rings
    const flangeGeo = trackGeo(new THREE.TorusGeometry(1.42, 0.045, 12, 48, Math.PI * 1.24));
    flangeGeo.rotateX(Math.PI / 2);
    flangeGeo.rotateY(-Math.PI * 0.12);
    [-2.4, 0.25, 2.55].forEach((fy) => {
      const ring = new THREE.Mesh(flangeGeo, brushedSteelMat);
      ring.position.y = fy;
      hullGroup.add(ring);
    });
    buoyRoot.add(hullGroup);

    // Build all 12 stages in Ray's order
    const stageRigs: Map<string, StageRig> = new Map();
    const pickableMeshes: THREE.Object3D[] = [];

    // Air Plunger — Center Needle (full-length slim air-filled needle running vertically through center of stack)
    const centerNeedleGroup = new THREE.Group();
    const needleStemGeo = trackGeo(new THREE.CylinderGeometry(0.085, 0.055, 5.45, 20));
    const needleStem = new THREE.Mesh(needleStemGeo, brushedSteelMat);
    needleStem.position.y = 0.22;
    needleStem.userData.isCenterNeedle = true;
    centerNeedleGroup.add(needleStem);
    pickableMeshes.push(needleStem);

    const needleAirLumenMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        metalness: 0.2,
        roughness: 0.18,
        emissive: 0x00e5ff,
        emissiveIntensity: 0.85,
      })
    );
    const needleAirLumen = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.045, 0.028, 5.3, 14)),
      needleAirLumenMat
    );
    needleAirLumen.position.y = 0.22;
    needleAirLumen.userData.isCenterNeedle = true;
    centerNeedleGroup.add(needleAirLumen);
    pickableMeshes.push(needleAirLumen);

    const needleAdjustableCollar = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(0.18, 0.04, 12, 24)),
      goldMat
    );
    needleAdjustableCollar.rotation.x = Math.PI / 2;
    needleAdjustableCollar.position.y = 2.68;
    needleAdjustableCollar.userData.isCenterNeedle = true;
    centerNeedleGroup.add(needleAdjustableCollar);
    pickableMeshes.push(needleAdjustableCollar);

    const needleBottomTip = new THREE.Mesh(
      trackGeo(new THREE.ConeGeometry(0.09, 0.26, 16)),
      goldMat
    );
    needleBottomTip.rotation.x = Math.PI;
    needleBottomTip.position.y = -2.62;
    needleBottomTip.userData.isCenterNeedle = true;
    centerNeedleGroup.add(needleBottomTip);
    pickableMeshes.push(needleBottomTip);
    buoyRoot.add(centerNeedleGroup);

    // Air Tank — Underneath the Unit (below buoy base, above seafloor weights) + Riser Pipe up to Piston / Center Needle
    const underTankGroup = new THREE.Group();
    const underTankMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x1a3656,
        metalness: 0.78,
        roughness: 0.28,
        emissive: 0x005270,
        emissiveIntensity: 0.35,
      })
    );
    const underTankVesselGeo = trackGeo(new THREE.CapsuleGeometry(0.42, 0.82, 12, 24));
    underTankVesselGeo.rotateZ(Math.PI / 2);
    const underTankVessel = new THREE.Mesh(underTankVesselGeo, underTankMat);
    underTankVessel.position.set(0, -3.58, 0.14);
    underTankVessel.userData.isCenterNeedle = true;
    underTankGroup.add(underTankVessel);
    pickableMeshes.push(underTankVessel);

    // Twin cradle strap bands & mounting struts up to the lower base
    const tankBandGeo = trackGeo(new THREE.TorusGeometry(0.44, 0.032, 10, 28));
    tankBandGeo.rotateY(Math.PI / 2);
    [-0.32, 0.32].forEach((bx) => {
      const band = new THREE.Mesh(tankBandGeo, goldMat);
      band.position.set(bx, -3.58, 0.14);
      band.userData.isCenterNeedle = true;
      underTankGroup.add(band);

      const strut = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.032, 0.032, 1.15, 10)),
        brushedSteelMat
      );
      strut.position.set(bx, -2.98, 0.14);
      underTankGroup.add(strut);
    });

    // Riser pipe connecting underneath Air Tank directly up to the piston / Air Plunger — Center Needle
    const riserMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x8fb4d4,
        metalness: 0.85,
        roughness: 0.22,
        emissive: 0x0099cc,
        emissiveIntensity: 0.42,
      })
    );
    const riserPipe = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.048, 0.048, 5.15, 16)),
      riserMat
    );
    riserPipe.position.set(0.18, -0.62, 0.18);
    riserPipe.userData.isCenterNeedle = true;
    underTankGroup.add(riserPipe);
    pickableMeshes.push(riserPipe);

    const riserManifold = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.11, 0.13, 0.14, 16)),
      goldMat
    );
    riserManifold.position.set(0.18, -3.14, 0.18);
    riserManifold.userData.isCenterNeedle = true;
    underTankGroup.add(riserManifold);

    // Return-stroke air pulse ring climbing the riser pipe
    const riserPulseMat = trackMat(
      new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.9 })
    );
    const riserPulseRing = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(0.085, 0.022, 8, 20)),
      riserPulseMat
    );
    riserPulseRing.rotation.x = Math.PI / 2;
    riserPulseRing.position.set(0.18, -3.0, 0.18);
    underTankGroup.add(riserPulseRing);

    // Visible 3D Sprite Label & Pointer Leader Line (always readable in default orbit view)
    const underTankTex = trackTex(createUnderTankLabelTexture());
    const underTankLabelMat = trackMat(
      new THREE.SpriteMaterial({
        map: underTankTex,
        transparent: true,
        depthTest: false,
      })
    );
    const underTankLabelSprite = new THREE.Sprite(underTankLabelMat);
    underTankLabelSprite.position.set(2.2, -3.58, 0.72);
    underTankLabelSprite.scale.set(2.9, 1.06, 1);
    underTankLabelSprite.renderOrder = 10;
    underTankLabelSprite.userData.isCenterNeedle = true;
    underTankGroup.add(underTankLabelSprite);

    const leaderLineGeo = trackGeo(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0.75, -3.58, 0.25),
        new THREE.Vector3(1.15, -3.58, 0.52),
      ])
    );
    const leaderLineMat = trackMat(
      new THREE.LineBasicMaterial({ color: 0xe5b842 })
    );
    underTankGroup.add(new THREE.Line(leaderLineGeo, leaderLineMat));

    buoyRoot.add(underTankGroup);

    // Rising Pan Water Column & Level/Cam Trigger Arm in Upper Chamber
    const panWaterMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x00c8ff,
        metalness: 0.1,
        roughness: 0.15,
        transparent: true,
        opacity: 0.34,
        emissive: 0x006b99,
        emissiveIntensity: 0.45,
        depthWrite: false,
      })
    );
    const panWaterMesh = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(1.18, 1.12, 1.05, 32)),
      panWaterMat
    );
    panWaterMesh.position.y = 1.65;
    panWaterMesh.renderOrder = 1;
    buoyRoot.add(panWaterMesh);

    const camTriggerGroup = new THREE.Group();
    camTriggerGroup.position.set(1.08, 2.02, 0);
    const camArmMesh = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.45, 0.055, 0.08)), goldMat);
    camArmMesh.position.x = -0.2;
    camTriggerGroup.add(camArmMesh);
    const camFloatMesh = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.085, 14, 12)), goldMat);
    camFloatMesh.position.x = -0.42;
    camTriggerGroup.add(camFloatMesh);
    buoyRoot.add(camTriggerGroup);

    const registerStage = (stage: BuoyStage, group: THREE.Group) => {
      group.position.y = stage.baseY;
      buoyRoot.add(group);
      const stageMats: THREE.MeshStandardMaterial[] = [];
      const baseEmissives: THREE.Color[] = [];
      const baseIntensities: number[] = [];

      group.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.userData.stageId = stage.id;
          pickableMeshes.push(mesh);
          if (!Array.isArray(mesh.material) && (mesh.material as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
            // Clone per-stage material instance so highlighting one stage doesn't light up others
            const cloned = (mesh.material as THREE.MeshStandardMaterial).clone();
            materials.push(cloned);
            mesh.material = cloned;
            stageMats.push(cloned);
            baseEmissives.push(cloned.emissive.clone());
            baseIntensities.push(cloned.emissiveIntensity);
          }
        }
      });

      stageRigs.set(stage.id, {
        stage,
        group,
        materials: stageMats,
        baseEmissives,
        baseEmissiveIntensities: baseIntensities,
      });
    };

    const stageById = (id: string) => STAGES.find((s) => s.id === id)!;

    // 01 — Central Air-Plunger — Top Scupper Intake
    {
      const g = new THREE.Group();
      const collarGeo = trackGeo(new THREE.CylinderGeometry(1.36, 1.36, 0.42, 32, 1, true));
      const collar = new THREE.Mesh(collarGeo, brushedSteelMat);
      g.add(collar);

      // 4 radial scupper intake chutes
      const portGeo = trackGeo(new THREE.BoxGeometry(0.46, 0.24, 0.42));
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2 + Math.PI / 4;
        const port = new THREE.Mesh(portGeo, darkArmorMat);
        port.position.set(Math.cos(angle) * 1.18, 0, Math.sin(angle) * 1.18);
        port.rotation.y = -angle;
        g.add(port);

        const lipGeo = trackGeo(new THREE.BoxGeometry(0.5, 0.04, 0.14));
        const lip = new THREE.Mesh(lipGeo, goldMat);
        lip.position.set(Math.cos(angle) * 1.36, -0.1, Math.sin(angle) * 1.36);
        lip.rotation.y = -angle;
        g.add(lip);
      }

      const throatGuideGeo = trackGeo(new THREE.TorusGeometry(0.95, 0.045, 10, 36));
      throatGuideGeo.rotateX(Math.PI / 2);
      const guide = new THREE.Mesh(throatGuideGeo, brushedSteelMat);
      guide.position.y = -0.18;
      g.add(guide);
      registerStage(stageById('01'), g);
    }

    // 02 — Central Air-Plunger (Weighted Piston)
    let pistonInnerGroup: THREE.Group | null = null;
    // Four-layer piston air-arrow material (opacity animated in the tick).
    let pistonAirArrowMat: THREE.MeshBasicMaterial | null = null;
    {
      const g = new THREE.Group();
      pistonInnerGroup = new THREE.Group();
      g.add(pistonInnerGroup);

      // FOUR-LAYER HOLLOW-CORE PISTON (Gemini Answer 6, Nov 22) — 90-degree
      // radial section cutaway: the outer shell is a 270-degree shell so
      // the inner layers stay visible from the cutaway side.
      // Layer 1 — Outer stepped piston barrel, gunmetal gray, orange U-cup seals
      const shellGeo = trackGeo(
        new THREE.CylinderGeometry(0.88, 0.88, 0.24, 32, 1, true, Math.PI * 0.25, Math.PI * 1.5)
      );
      const shell = new THREE.Mesh(shellGeo, darkArmorMat);
      pistonInnerGroup.add(shell);
      const crownGeo = trackGeo(new THREE.CylinderGeometry(0.88, 0.88, 0.05, 32));
      const crown = new THREE.Mesh(crownGeo, darkArmorMat);
      crown.position.y = 0.12;
      pistonInnerGroup.add(crown);
      const ucupGeo = trackGeo(new THREE.TorusGeometry(0.89, 0.035, 10, 36));
      ucupGeo.rotateX(Math.PI / 2);
      const ucupTop = new THREE.Mesh(ucupGeo, goldMat);
      ucupTop.position.y = 0.07;
      pistonInnerGroup.add(ucupTop);
      const ucupBot = new THREE.Mesh(ucupGeo, goldMat);
      ucupBot.position.y = -0.07;
      pistonInnerGroup.add(ucupBot);

      // Layer 2 — Annular hollow core: air conduit carrying injection air,
      // with animated cyan air-velocity arrows (opacity driven in the tick).
      const coreGeo = trackGeo(new THREE.CylinderGeometry(0.62, 0.62, 0.22, 28, 1, true));
      const coreMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x00e5ff,
          transparent: true,
          opacity: 0.5,
          emissive: 0x00a5bb,
          emissiveIntensity: 0.5,
          side: THREE.DoubleSide,
        })
      );
      pistonInnerGroup.add(new THREE.Mesh(coreGeo, coreMat));
      pistonAirArrowMat = trackMat(
        new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.6 })
      );
      const arrowGeo = trackGeo(new THREE.ConeGeometry(0.05, 0.16, 10));
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2 + Math.PI / 4;
        const arrow = new THREE.Mesh(arrowGeo, pistonAirArrowMat);
        arrow.position.set(Math.cos(angle) * 0.62, 0, Math.sin(angle) * 0.62);
        pistonInnerGroup.add(arrow);
      }

      // Layer 3 — Inner sealing tube: mirror-polished chrome sleeve
      const sleeveGeo = trackGeo(new THREE.CylinderGeometry(0.38, 0.38, 0.5, 28, 1, true));
      const chromeMat = trackMat(
        new THREE.MeshStandardMaterial({ color: 0xdfe8f2, metalness: 1.0, roughness: 0.12 })
      );
      pistonInnerGroup.add(new THREE.Mesh(sleeveGeo, chromeMat));

      // Layer 4 — Central compressor rod + needle valve + magnetic runner:
      // alternating red / silver NdFeB magnet rings on the center shaft.
      const rodGeo = trackGeo(new THREE.CylinderGeometry(0.16, 0.16, 1.45, 20));
      const rod = new THREE.Mesh(rodGeo, brushedSteelMat);
      rod.position.y = 0.72;
      pistonInnerGroup.add(rod);
      const magnetMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xb02020,
          metalness: 0.85,
          roughness: 0.3,
          emissive: 0x300000,
          emissiveIntensity: 0.4,
        })
      );
      for (let i = 0; i < 4; i++) {
        const ringGeo = trackGeo(new THREE.TorusGeometry(0.2, 0.035, 10, 24));
        ringGeo.rotateX(Math.PI / 2);
        const ring = new THREE.Mesh(ringGeo, i % 2 === 0 ? magnetMat : brushedSteelMat);
        ring.position.y = 0.1 + i * 0.28;
        pistonInnerGroup.add(ring);
      }

      const capGeo = trackGeo(new THREE.CylinderGeometry(0.28, 0.26, 0.12, 24));
      const cap = new THREE.Mesh(capGeo, goldMat);
      cap.position.y = 1.44;
      pistonInnerGroup.add(cap);

      registerStage(stageById('02'), g);
    }

    // 03 — Air Accelerator Unit — Pascal ΔP (THE ENHANCEMENT)
    {
      const g = new THREE.Group();
      // Tapered throat profile via LatheGeometry
      const pts = [
        new THREE.Vector2(1.02, 0.28),
        new THREE.Vector2(0.86, 0.12),
        new THREE.Vector2(0.62, -0.04),
        new THREE.Vector2(0.74, -0.22),
      ];
      const throatGeo = trackGeo(new THREE.LatheGeometry(pts, 32, Math.PI * 0.28, Math.PI * 1.44));
      const throat = new THREE.Mesh(throatGeo, darkArmorMat);
      g.add(throat);

      // P_in and P_throat pressure tap probes
      const tapGeo = trackGeo(new THREE.CylinderGeometry(0.03, 0.03, 0.34, 10));
      tapGeo.rotateZ(Math.PI / 2);
      const pInTap = new THREE.Mesh(tapGeo, goldMat);
      pInTap.position.set(-1.05, 0.2, 0.15);
      g.add(pInTap);

      const pThroatTap = new THREE.Mesh(tapGeo, goldMat);
      pThroatTap.position.set(-0.78, -0.04, 0.15);
      g.add(pThroatTap);

      const sensorBoxGeo = trackGeo(new THREE.BoxGeometry(0.18, 0.32, 0.16));
      const sensorBox = new THREE.Mesh(sensorBoxGeo, routerMat);
      sensorBox.position.set(-1.18, 0.08, 0.15);
      g.add(sensorBox);

      registerStage(stageById('03'), g);
    }

    // 04 — Axial-Flow Turbine (Hybrid Motor/Generator)
    let turbineRotorGroup: THREE.Group | null = null;
    {
      const g = new THREE.Group();
      // Outer stator shroud
      const shroudGeo = trackGeo(new THREE.TorusGeometry(0.86, 0.05, 12, 36));
      shroudGeo.rotateX(Math.PI / 2);
      const shroud = new THREE.Mesh(shroudGeo, darkArmorMat);
      g.add(shroud);

      turbineRotorGroup = new THREE.Group();
      g.add(turbineRotorGroup);

      const hubGeo = trackGeo(new THREE.CylinderGeometry(0.18, 0.14, 0.34, 20));
      const hub = new THREE.Mesh(hubGeo, brushedSteelMat);
      turbineRotorGroup.add(hub);

      const bladeGeo = trackGeo(new THREE.BoxGeometry(0.62, 0.04, 0.2));
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8;
        const blade = new THREE.Mesh(bladeGeo, brushedSteelMat);
        blade.position.set(Math.cos(angle) * 0.44, 0, Math.sin(angle) * 0.44);
        blade.rotation.y = -angle;
        blade.rotation.x = 0.45;
        turbineRotorGroup.add(blade);
      }
      registerStage(stageById('04'), g);
    }

    // 05 — Quad-Venturi Acceleration Ports
    {
      const g = new THREE.Group();
      const ringGeo = trackGeo(new THREE.TorusGeometry(0.95, 0.06, 12, 36));
      ringGeo.rotateX(Math.PI / 2);
      const ring = new THREE.Mesh(ringGeo, brushedSteelMat);
      g.add(ring);

      // Gold Air Injection Ring Collar (Gemini Answer 1 File 3) + 4 micro-taps
      const injectionCollarGeo = trackGeo(new THREE.TorusGeometry(0.95, 0.03, 10, 36));
      injectionCollarGeo.rotateX(Math.PI / 2);
      const injectionCollar = new THREE.Mesh(injectionCollarGeo, goldMat);
      injectionCollar.position.y = 0.08;
      g.add(injectionCollar);
      const microTapGeo = trackGeo(new THREE.CylinderGeometry(0.02, 0.02, 0.14, 8));
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2 + Math.PI / 4;
        const tap = new THREE.Mesh(microTapGeo, goldMat);
        tap.position.set(Math.cos(angle) * 0.95, 0.02, Math.sin(angle) * 0.95);
        tap.rotation.z = Math.PI / 6;
        tap.rotation.y = -angle;
        g.add(tap);
      }

      // 4 tapered Venturi nozzles 90 degrees apart
      const nozzleGeo = trackGeo(new THREE.CylinderGeometry(0.08, 0.19, 0.48, 16));
      nozzleGeo.rotateZ(Math.PI / 2);
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2 + Math.PI / 4;
        const nozzle = new THREE.Mesh(nozzleGeo, darkArmorMat);
        nozzle.position.set(Math.cos(angle) * 0.88, 0, Math.sin(angle) * 0.88);
        nozzle.rotation.y = -angle + 0.38; // tangential swirl jet angle
        g.add(nozzle);

        const tipGeo = trackGeo(new THREE.TorusGeometry(0.085, 0.02, 8, 16));
        const tip = new THREE.Mesh(tipGeo, routerMat);
        tip.position.set(Math.cos(angle) * 0.68, 0, Math.sin(angle) * 0.68);
        tip.rotation.y = -angle + 0.38 + Math.PI / 2;
        g.add(tip);
      }
      registerStage(stageById('05'), g);
    }

    // 06 — Graphene-Ion Scrub Electrodes
    {
      const g = new THREE.Group();
      const outerPlateGeo = trackGeo(new THREE.CylinderGeometry(0.9, 0.85, 0.18, 28, 1, true));
      const outerPlate = new THREE.Mesh(outerPlateGeo, grapheneMat);
      g.add(outerPlate);

      const innerRingGeo = trackGeo(new THREE.TorusGeometry(0.68, 0.04, 12, 32));
      innerRingGeo.rotateX(Math.PI / 2);
      const innerRing = new THREE.Mesh(innerRingGeo, grapheneMat);
      g.add(innerRing);

      // Bus ribs
      const ribGeo = trackGeo(new THREE.BoxGeometry(0.24, 0.05, 0.06));
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6;
        const rib = new THREE.Mesh(ribGeo, goldMat);
        rib.position.set(Math.cos(angle) * 0.78, 0, Math.sin(angle) * 0.78);
        rib.rotation.y = -angle;
        g.add(rib);
      }
      registerStage(stageById('06'), g);
    }

    // 07 — Halbach Magnetic Matrix (24-block Halbach Matrix Cage, cutaway window open)
    {
      const g = new THREE.Group();
      const segGeo = trackGeo(new THREE.BoxGeometry(0.13, 1.05, 0.22));
      for (let i = 0; i < 24; i++) {
        const angle = (i * Math.PI * 2) / 24;
        // Leave front window open (cutaway) so Fibonacci core + copper coils stay visible
        if (Math.sin(angle) > 0.58 && Math.abs(Math.cos(angle)) < 0.72) continue;
        const seg = new THREE.Mesh(segGeo, i % 2 === 0 ? darkArmorMat : goldMat);
        seg.position.set(Math.cos(angle) * 1.08, 0, Math.sin(angle) * 1.08);
        seg.rotation.y = -angle;
        g.add(seg);
      }
      const retainerGeo = trackGeo(new THREE.TorusGeometry(1.12, 0.04, 10, 40));
      retainerGeo.rotateX(Math.PI / 2);
      const topRet = new THREE.Mesh(retainerGeo, brushedSteelMat);
      topRet.position.y = 0.54;
      g.add(topRet);
      const botRet = new THREE.Mesh(retainerGeo, brushedSteelMat);
      botRet.position.y = -0.54;
      g.add(botRet);

      registerStage(stageById('07'), g);
    }

    // 08 — Fibonacci Helical Core + Copper Induction Coils
    let fibonacciSpiralMesh: THREE.Mesh | null = null;
    const copperCoilMeshes: THREE.Mesh[] = [];
    {
      const g = new THREE.Group();
      // Transparent chamber glass sleeve
      const chamberGeo = trackGeo(new THREE.CylinderGeometry(0.84, 0.78, 1.12, 28, 1, true));
      const chamber = new THREE.Mesh(chamberGeo, glassChamberMat);
      g.add(chamber);

      // Fibonacci golden-proportion tightening helical core tube
      const helixPoints: THREE.Vector3[] = [];
      const turns = 4.2;
      const numPts = 140;
      const phi = 1.6180339887;
      for (let i = 0; i <= numPts; i++) {
        const u = i / numPts;
        const angle = u * turns * Math.PI * 2;
        // Golden tightening radius from 0.58 down to 0.14
        const r = 0.58 * Math.pow(1 / phi, u * 2.2) + 0.08;
        const y = 0.52 - u * 1.04;
        helixPoints.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
      }
      const helixCurve = new THREE.CatmullRomCurve3(helixPoints);
      const helixGeo = trackGeo(new THREE.TubeGeometry(helixCurve, 130, 0.045, 10, false));
      fibonacciSpiralMesh = new THREE.Mesh(helixGeo, helixCoreMat);
      g.add(fibonacciSpiralMesh);

      // Copper induction coils wrapped around the core chamber (6 vertical coil bobbins + winding rings)
      const bobbinGeo = trackGeo(new THREE.CylinderGeometry(0.11, 0.11, 0.92, 16));
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6;
        if (Math.sin(angle) > 0.62 && Math.abs(Math.cos(angle)) < 0.65) continue;
        const coil = new THREE.Mesh(bobbinGeo, copperCoilMat);
        coil.position.set(Math.cos(angle) * 0.88, 0, Math.sin(angle) * 0.88);
        g.add(coil);
        copperCoilMeshes.push(coil);
      }

      // Horizontal copper induction pickup rings
      const pickupGeo = trackGeo(new THREE.TorusGeometry(0.78, 0.032, 10, 36));
      pickupGeo.rotateX(Math.PI / 2);
      [-0.36, 0, 0.36].forEach((cy) => {
        const ring = new THREE.Mesh(pickupGeo, copperCoilMat);
        ring.position.y = cy;
        g.add(ring);
        copperCoilMeshes.push(ring);
      });

      registerStage(stageById('08'), g);
    }

    // 09 — High-Density Supercapacitors
    const capChargeBars: THREE.Mesh[] = [];
    {
      const g = new THREE.Group();
      const cellGeo = trackGeo(new THREE.CylinderGeometry(0.11, 0.11, 0.48, 16));
      const barGeo = trackGeo(new THREE.BoxGeometry(0.04, 0.36, 0.04));
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI * 2) / 10;
        if (Math.sin(angle) > 0.72 && Math.abs(Math.cos(angle)) < 0.5) continue;
        const cell = new THREE.Mesh(cellGeo, capCellMat);
        cell.position.set(Math.cos(angle) * 0.92, 0, Math.sin(angle) * 0.92);
        g.add(cell);

        const bar = new THREE.Mesh(barGeo, capChargeBarMat);
        bar.position.set(Math.cos(angle) * 0.79, 0, Math.sin(angle) * 0.79);
        bar.rotation.y = -angle;
        g.add(bar);
        capChargeBars.push(bar);
      }
      registerStage(stageById('09'), g);
    }

    // 10 — Smart-Switch Capacitor Base
    {
      const g = new THREE.Group();
      const baseRingGeo = trackGeo(new THREE.CylinderGeometry(1.36, 1.24, 0.36, 36, 1, true));
      const baseRing = new THREE.Mesh(baseRingGeo, darkArmorMat);
      g.add(baseRing);

      const floorDiskGeo = trackGeo(new THREE.RingGeometry(0.38, 1.24, 36));
      floorDiskGeo.rotateX(-Math.PI / 2);
      const floorDisk = new THREE.Mesh(floorDiskGeo, brushedSteelMat);
      floorDisk.position.y = -0.17;
      g.add(floorDisk);

      // Flared bottom discharge nozzle
      const bellGeo = trackGeo(new THREE.CylinderGeometry(0.36, 0.56, 0.38, 28, 1, true));
      const bell = new THREE.Mesh(bellGeo, brushedSteelMat);
      bell.position.y = -0.36;
      g.add(bell);

      registerStage(stageById('10'), g);
    }

    // 11 — Smart-Switch Power Router
    let routerCoreMesh: THREE.Mesh | null = null;
    {
      const g = new THREE.Group();
      const boardGeo = trackGeo(new THREE.CylinderGeometry(0.46, 0.46, 0.14, 24));
      const board = new THREE.Mesh(boardGeo, darkArmorMat);
      g.add(board);

      const chipGeo = trackGeo(new THREE.BoxGeometry(0.28, 0.1, 0.28));
      routerCoreMesh = new THREE.Mesh(chipGeo, routerMat);
      routerCoreMesh.position.y = 0.08;
      g.add(routerCoreMesh);

      registerStage(stageById('11'), g);
    }

    // 12 — Solar Crown
    {
      const g = new THREE.Group();
      const crownRingGeo = trackGeo(new THREE.CylinderGeometry(1.38, 1.42, 0.1, 36));
      const crownRing = new THREE.Mesh(crownRingGeo, brushedSteelMat);
      g.add(crownRing);

      const solarRingGeo = trackGeo(new THREE.RingGeometry(0.42, 1.32, 36));
      solarRingGeo.rotateX(-Math.PI / 2);
      const solarRing = new THREE.Mesh(solarRingGeo, solarPanelMat);
      solarRing.position.y = 0.055;
      g.add(solarRing);

      const beaconGeo = trackGeo(new THREE.CylinderGeometry(0.12, 0.16, 0.16, 16));
      const beacon = new THREE.Mesh(beaconGeo, goldMat);
      beacon.position.y = 0.12;
      g.add(beacon);

      registerStage(stageById('12'), g);
    }

    // MOVING CARRIAGE GROUP (Gemini corrected spec File 3, Nov 22 real-code
    // verification — the tank did NOT travel with the piston: underTankGroup
    // was attached directly to buoyRoot and only moved on exploded view).
    // The stepped piston, the hollow center needle, and the lower vertical
    // air tank share ONE parent so they stroke synchronously. Reparenting
    // via .add() lifts each group out of its old parent (buoyRoot / the
    // stage-02 rig group) without touching the rest of the scene.
    // DRIVE SIGNAL — CONFLICT FLAGGED, real file wins: the corrected spec
    // wires the tick as movingCarriageGroup.position.y = -sim.strokeDepth.
    // But strokeDepth in the real sim is a POSITIVE magnitude
    // (|pistonPosition| * 0.72 + ...), so -strokeDepth would sink the
    // carriage whenever the piston moves in EITHER direction — backwards
    // against the real sim, where air forces the plunger UP on trigger
    // (pistonPosition rises; the pistonOffset assignment in the tick
    // below). The carriage is therefore driven by the real file's own
    // pistonOffset (sim.pistonPosition * 0.65), preserving the exact
    // visible motion. The -strokeDepth formula is flagged for Gemini to
    // confirm or correct; the grouping itself (the verified-missing fix)
    // is delivered.
    const movingCarriageGroup = new THREE.Group();
    if (pistonInnerGroup) movingCarriageGroup.add(pistonInnerGroup);
    movingCarriageGroup.add(centerNeedleGroup, underTankGroup);
    buoyRoot.add(movingCarriageGroup);

    // Center Vent Exhaust Nozzle (Gemini Answer 1 File 3): exhausts down
    // the central axis at the keel bottom, below the air tank. Parented
    // to the carriage so it travels with the tank.
    const centerVentGroup = new THREE.Group();
    const ventThroatGeo = trackGeo(new THREE.CylinderGeometry(0.09, 0.16, 0.3, 16));
    centerVentGroup.add(new THREE.Mesh(ventThroatGeo, darkArmorMat));
    const ventTipGeo = trackGeo(new THREE.ConeGeometry(0.16, 0.22, 16));
    const ventTip = new THREE.Mesh(ventTipGeo, goldMat);
    ventTip.rotation.x = Math.PI;
    ventTip.position.y = -0.26;
    centerVentGroup.add(ventTip);
    centerVentGroup.position.set(0, -4.62, 0);
    movingCarriageGroup.add(centerVentGroup);

    // Flow Particle System (260 InstancedMesh droplets tracing the full 5-channel path)
    const PARTICLE_COUNT = 260;
    const dropletGeo = trackGeo(new THREE.CapsuleGeometry(0.032, 0.09, 4, 8));
    const dropletMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.92,
      })
    );
    const particleMesh = new THREE.InstancedMesh(dropletGeo, dropletMat, PARTICLE_COUNT);
    particleMesh.frustumCulled = false;
    buoyRoot.add(particleMesh);

    const particles: ParticleState[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        t: (i / PARTICLE_COUNT) % 1,
        speed: 0.22 + (i % 7) * 0.015,
        lane: i % 4,
        radialJitter: ((i * 17) % 100) / 100,
      });
    }

    // Air-injection bubble pulse system (Gemini Answer 1 File 3):
    // translucent white bubbles rising around the venturi ring + center
    // vent on discharge pulses. Visual only; positions are seeded, not
    // simulated physics.
    const BUBBLE_COUNT = 90;
    const bubbleGeo = trackGeo(new THREE.BufferGeometry());
    const bubblePositions = new Float32Array(BUBBLE_COUNT * 3);
    const bubbleSeeds: { angle: number; radius: number; y: number; speed: number }[] = [];
    for (let i = 0; i < BUBBLE_COUNT; i++) {
      bubbleSeeds.push({
        angle: Math.random() * Math.PI * 2,
        radius: 0.55 + Math.random() * 0.55,
        y: -4.4 + Math.random() * 3.4,
        speed: 0.25 + Math.random() * 0.5,
      });
    }
    bubbleGeo.setAttribute('position', new THREE.BufferAttribute(bubblePositions, 3));
    const bubbleMat = trackMat(
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.07,
        transparent: true,
        opacity: 0.1,
        depthWrite: false,
      })
    );
    const bubblePoints = new THREE.Points(bubbleGeo, bubbleMat);
    bubblePoints.frustumCulled = false;
    buoyRoot.add(bubblePoints);

    // Pre-warm shaders on GPU
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Raycasting for stage click/hover
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };
    let lastHoverCheck = 0;

    const updatePointer = (ev: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handlePointerDown = (ev: PointerEvent) => {
      pointerDownPos = { x: ev.clientX, y: ev.clientY };
    };

    const handlePointerUp = (ev: PointerEvent) => {
      const dx = ev.clientX - pointerDownPos.x;
      const dy = ev.clientY - pointerDownPos.y;
      if (dx * dx + dy * dy > 25) return; // drag orbit, not click
      updatePointer(ev);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(pickableMeshes, false);
      if (hits.length > 0) {
        if (hits[0].object.userData.isCenterNeedle) {
          onOpenCenterNeedleRef.current();
          return;
        }
        const hitStage = hits[0].object.userData.stageId as string | undefined;
        if (hitStage) {
          onSelectStageRef.current(
            selectedStageRef.current === hitStage ? null : hitStage
          );
          return;
        }
      }
      onSelectStageRef.current(null);
    };

    const handlePointerMove = (ev: PointerEvent) => {
      const now = performance.now();
      if (now - lastHoverCheck < 50) return;
      lastHoverCheck = now;
      updatePointer(ev);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(pickableMeshes, false);
      if (hits.length > 0) {
        if (hits[0].object.userData.isCenterNeedle) {
          setHoveredStageId(null);
          canvas.style.cursor = 'pointer';
          return;
        }
        const hitStage = hits[0].object.userData.stageId as string | undefined;
        setHoveredStageId(hitStage ?? null);
        canvas.style.cursor = hitStage ? 'pointer' : 'grab';
      } else {
        setHoveredStageId(null);
        canvas.style.cursor = 'grab';
      }
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointermove', handlePointerMove);

    // ResizeObserver for clean aspect & canvas updates
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(entry.contentRect.width, 200);
        const h = Math.max(entry.contentRect.height, 200);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    resizeObserver.observe(container);

    // Compute 3D position along the 5 Flow Channels for normalized t in [0, 1)
    const sampleFlowPath = (
      t: number,
      lane: number,
      jitter: number,
      explodeAmt: number,
      pistonOffset: number,
      outPos: THREE.Vector3
    ) => {
      const laneAngle = (lane * Math.PI) / 2 + Math.PI / 4;
      if (t < 0.16) {
        // Channel 1: THE POUR — entering top scuppers radially inward
        const u = t / 0.16;
        const r = THREE.MathUtils.lerp(1.42, 0.72, u);
        const y = 2.38 + explodeAmt * 0.4 - u * 0.35 + Math.sin(u * Math.PI) * 0.08;
        outPos.set(Math.cos(laneAngle) * r, y, Math.sin(laneAngle) * r);
      } else if (t < 0.34) {
        // Channel 2: THE PLUNGER CHANNEL — pushed down through Air Accelerator throat
        const u = (t - 0.16) / 0.18;
        const r = THREE.MathUtils.lerp(0.72, 0.56, u) + (jitter - 0.5) * 0.12;
        const y = THREE.MathUtils.lerp(1.95 + pistonOffset * 0.4, 0.92, u);
        outPos.set(
          Math.cos(laneAngle + u * 0.35) * r,
          y,
          Math.sin(laneAngle + u * 0.35) * r
        );
      } else if (t < 0.48) {
        // Channel 3: THE THROUGH-FLOW — spinning through Axial-Flow Turbine
        const u = (t - 0.34) / 0.14;
        const r = THREE.MathUtils.lerp(0.58, 0.84, u);
        const spin = laneAngle + 0.35 + u * 1.4;
        const y = THREE.MathUtils.lerp(0.88, 0.05, u);
        outPos.set(Math.cos(spin) * r, y, Math.sin(spin) * r);
      } else if (t < 0.82) {
        // Channel 4: THE VENTURI CHANNEL — Quad-Venturi -> Scrub Electrodes -> Fibonacci Helix
        const u = (t - 0.48) / 0.34;
        const phi = 1.6180339887;
        const r = 0.78 * Math.pow(1 / phi, u * 2.15) + 0.08;
        const spiralAngle = laneAngle + 1.75 + u * Math.PI * 6.2;
        const y = THREE.MathUtils.lerp(0.02, -1.78, u);
        outPos.set(Math.cos(spiralAngle) * r, y, Math.sin(spiralAngle) * r);
      } else {
        // Channel 5: THE RETURN — exiting downward through Capacitor Base nozzle back to sea
        const u = (t - 0.82) / 0.18;
        const r = THREE.MathUtils.lerp(0.22, 0.46, u) + (jitter - 0.5) * 0.08;
        const y = THREE.MathUtils.lerp(-1.82, -3.55 - explodeAmt * 0.7, u);
        const swirl = laneAngle + 7.95 + u * 0.6;
        outPos.set(Math.cos(swirl) * r, y, Math.sin(swirl) * r);
      }
    };

    // Main animation loop
    let frameId = 0;
    let lastTime = performance.now();
    let explodeCurrent = 0;
    let turbineAngle = 0;
    let disposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.08);
      lastTime = now;

      const sim = telemetryRef.current;
      const preset = TIDE_PRESETS[tideRef.current];
      const isPaused = pausedRef.current;
      const isBoost = sim.mode === 'Boost';

      // Process camera commands
      const cmd = cameraCommandRef.current;
      if (cmd) {
        cameraCommandRef.current = null;
        if (cmd.type === 'reset') {
          _camGoalPos.set(6.8, 1.35, 10.4);
          _camGoalTarget.set(0, -0.9, 0);
          cameraTransitionActive = true;
        } else if (cmd.type === 'zoomIn') {
          _dirVec.subVectors(camera.position, controls.target).multiplyScalar(0.76);
          if (_dirVec.length() >= controls.minDistance) {
            _camGoalPos.copy(controls.target).add(_dirVec);
            _camGoalTarget.copy(controls.target);
            cameraTransitionActive = true;
          }
        } else if (cmd.type === 'zoomOut') {
          _dirVec.subVectors(camera.position, controls.target).multiplyScalar(1.28);
          if (_dirVec.length() <= controls.maxDistance) {
            _camGoalPos.copy(controls.target).add(_dirVec);
            _camGoalTarget.copy(controls.target);
            cameraTransitionActive = true;
          }
        } else if (cmd.type === 'focusStage' && cmd.stageId) {
          const rig = stageRigs.get(cmd.stageId);
          if (rig) {
            const targetY = rig.group.position.y;
            _camGoalTarget.set(0, targetY, 0);
            _camGoalPos.set(3.8, targetY + 0.9, 4.6);
            cameraTransitionActive = true;
          }
        }
      }

      if (cameraTransitionActive) {
        const dampLambda = 6;
        camera.position.x = THREE.MathUtils.damp(camera.position.x, _camGoalPos.x, dampLambda, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _camGoalPos.y, dampLambda, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _camGoalPos.z, dampLambda, dt);
        controls.target.x = THREE.MathUtils.damp(controls.target.x, _camGoalTarget.x, dampLambda, dt);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, _camGoalTarget.y, dampLambda, dt);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, _camGoalTarget.z, dampLambda, dt);
        if (camera.position.distanceTo(_camGoalPos) < 0.03) {
          cameraTransitionActive = false;
        }
      }

      // Smooth Exploded-View Separation
      const explodeTarget = explodedRef.current ? 1 : 0;
      explodeCurrent = THREE.MathUtils.damp(explodeCurrent, explodeTarget, 6.5, dt);

      stageRigs.forEach((rig, id) => {
        const targetY = THREE.MathUtils.lerp(
          rig.stage.baseY,
          rig.stage.explodeOffset,
          explodeCurrent
        );
        rig.group.position.y = targetY;

        // Selection / hover emissive feedback
        const isSelected = selectedStageRef.current === id;
        const isHovered = hoveredStageRef.current === id;
        for (let i = 0; i < rig.materials.length; i++) {
          const m = rig.materials[i];
          if (isSelected) {
            m.emissive.copy(_goldColor);
            m.emissiveIntensity = 0.55;
          } else if (isHovered) {
            m.emissive.copy(_cyanColor);
            m.emissiveIntensity = 0.35;
          } else {
            m.emissive.copy(rig.baseEmissives[i]);
            m.emissiveIntensity = rig.baseEmissiveIntensities[i];
          }
        }
      });

      // Cutaway hull visibility
      hullGroup.visible = cutawayRef.current && explodeCurrent < 0.6;

      // Wave surface animation around the stationary moored hull
      const waveAmp = 0.06 + preset.intensity * 0.22;
      const posAttr = waterGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < posAttr.count; i++) {
        const bx = waterBasePos[i * 3];
        const bz = waterBasePos[i * 3 + 2];
        const dist = Math.sqrt(bx * bx + bz * bz);
        const wy =
          Math.sin(bx * 0.65 + sim.phase) * waveAmp * 0.65 +
          Math.cos(bz * 0.55 - sim.phase * 0.85) * waveAmp * 0.45 +
          Math.sin(dist * 1.4 - sim.phase * 1.3) * waveAmp * 0.22;
        posAttr.setY(i, wy);
      }
      posAttr.needsUpdate = true;
      waterGeo.computeVertexNormals();

      // Stationary moored hull: NEVER bobs or pitches on waves (sea/waves move around it)
      buoyRoot.position.y = 0;
      buoyRoot.rotation.z = 0;

      // Pan water fills from top slots -> triggers level/cam arm -> air forces Center Needle Plunger up
      const pistonOffset = sim.pistonPosition * 0.65;
      // Moving carriage (Gemini corrected spec File 3): piston + needle +
      // air tank stroke together on the one carriage. The tank keeps its
      // local explode offset (underTankGroup.position.y below); the needle
      // keeps its local assembly position. Drive = the real file's own
      // pistonOffset — NOT -sim.strokeDepth (see the carriage comment at
      // the scene setup; flagged for Gemini to confirm or correct).
      movingCarriageGroup.position.y = pistonOffset;
      if (pistonAirArrowMat) {
        pistonAirArrowMat.opacity = 0.25 + 0.55 * Math.min(1.25, sim.dischargePulse);
      }
      needleAdjustableCollar.position.y = 2.48 + (plungerSettingRef.current - 0.5) * 0.42;
      needleAirLumenMat.emissive.copy(overEnergizeRef.current || isBoost ? _goldColor : _cyanColor);
      needleAirLumenMat.emissiveIntensity = overEnergizeRef.current ? 1.55 : sim.triggerFired ? 1.25 : 0.65;

      const fillScale = Math.max(0.1, sim.waterLevel);
      panWaterMesh.scale.y = fillScale;
      panWaterMesh.position.y = 1.22 + fillScale * 0.52;
      panWaterMesh.visible = explodeCurrent < 0.55;
      camTriggerGroup.rotation.z = sim.camAngle * 0.65;

      // Air Tank — Underneath the Unit: slight explode offset + return-stroke pulse climbing riser pipe
      underTankGroup.position.y = THREE.MathUtils.lerp(0, -0.52, explodeCurrent);
      const pulsePhase = (sim.phase * 0.38) % 1;
      riserPulseRing.position.y = THREE.MathUtils.lerp(-3.0, 1.65, pulsePhase);
      riserPulseMat.color.copy(sim.triggerFired || isBoost ? _goldColor : _cyanColor);
      riserPulseMat.opacity = sim.triggerFired ? 0.95 : 0.45;

      // Axial-Flow Turbine spinning from triggered port/bottom discharge (reverse surge in Boost)
      if (!isPaused) {
        const rpmRad = (sim.turbineRpm / 60) * Math.PI * 2 * 0.55;
        turbineAngle += (isBoost ? -1.45 : 1) * rpmRad * dt;
      }
      if (turbineRotorGroup) {
        turbineRotorGroup.rotation.y = turbineAngle;
      }

      // Fibonacci Helical Core + Copper Coils harvest glow
      const coilGlow = Math.min(1.8, 0.25 + (sim.coilVolts / 15) * 1.2);
      if (fibonacciSpiralMesh && selectedStageRef.current !== '08') {
        const m = fibonacciSpiralMesh.material as THREE.MeshStandardMaterial;
        m.emissive.copy(isBoost ? _goldColor : _cyanColor);
        m.emissiveIntensity = coilGlow;
      }
      if (selectedStageRef.current !== '08') {
        copperCoilMeshes.forEach((c) => {
          const m = c.material as THREE.MeshStandardMaterial;
          m.emissive.copy(isBoost ? _goldColor : _cyanColor);
          m.emissiveIntensity = 0.14 + coilGlow * 0.48;
        });
      }
      coreGlowLight.color.copy(isBoost ? _goldColor : _cyanColor);
      coreGlowLight.intensity = 1.4 + coilGlow * 1.5;

      // Supercapacitor Charge Level Bars (fill in Harvest, dump in Boost)
      const chargeScale = Math.max(0.06, sim.charge / 100);
      capChargeBars.forEach((bar) => {
        bar.scale.y = chargeScale;
        bar.position.y = -0.18 + chargeScale * 0.18;
        if (selectedStageRef.current !== '09') {
          const m = bar.material as THREE.MeshStandardMaterial;
          m.emissive.copy(isBoost ? _goldColor : _cyanColor);
          m.emissiveIntensity = isBoost ? 1.35 : 0.35 + chargeScale * 0.85;
        }
      });

      // Router status glow
      if (routerCoreMesh && selectedStageRef.current !== '11') {
        const m = routerCoreMesh.material as THREE.MeshStandardMaterial;
        m.emissive.copy(isBoost ? _goldColor : _cyanColor);
        m.emissiveIntensity = isBoost ? 1.45 : 0.7;
      }

      // Update Flow Particles along the 5 channels driven by instantaneous flowRateNorm
      const speedMult = isPaused
        ? 0
        : 0.24 + sim.flowRateNorm * 1.15 + (isBoost ? 0.85 : 0);
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particles[i];
        // Accelerate faster inside Venturi & core spiral (0.34 < t < 0.85)
        const zoneBoost = p.t > 0.34 && p.t < 0.84 ? 1.42 : 1.0;
        p.t = (p.t + p.speed * speedMult * zoneBoost * dt) % 1;

        sampleFlowPath(p.t, p.lane, p.radialJitter, explodeCurrent, pistonOffset, _vec3);
        const nextT = (p.t + 0.012) % 1;
        sampleFlowPath(nextT, p.lane, p.radialJitter, explodeCurrent, pistonOffset, _targetVec3);

        _dirVec.subVectors(_targetVec3, _vec3);
        if (_dirVec.lengthSq() > 0.00001) {
          _dirVec.normalize();
          _quat.setFromUnitVectors(_upVec, _dirVec);
        }

        const scalePulse = isBoost ? 1.35 : 0.85 + preset.intensity * 0.35;
        _scaleVec.set(scalePulse, scalePulse * 1.3, scalePulse);
        _mat4.compose(_vec3, _quat, _scaleVec);
        particleMesh.setMatrixAt(i, _mat4);

        // Color transitions: cyan intake -> bright energized vortex -> gold pulse in Boost
        if (isBoost && p.t > 0.32) {
          _color.copy(_goldColor).lerp(_whiteCyan, 0.3);
        } else if (p.t > 0.48 && p.t < 0.82) {
          _color.copy(_cyanColor).lerp(_whiteCyan, 0.55);
        } else {
          _color.copy(_cyanColor);
        }
        particleMesh.setColorAt(i, _color);
      }
      particleMesh.instanceMatrix.needsUpdate = true;
      if (particleMesh.instanceColor) particleMesh.instanceColor.needsUpdate = true;

      // Air-injection bubbles: rise around the venturi ring + center vent,
      // bright on discharge pulses, faint while filling.
      bubbleMat.opacity = isPaused ? 0.05 : 0.08 + Math.min(0.7, sim.dischargePulse * 0.55);
      for (let i = 0; i < BUBBLE_COUNT; i++) {
        const b = bubbleSeeds[i];
        if (!isPaused) {
          b.y += dt * b.speed;
          if (b.y > -0.9) b.y = -4.4;
        }
        bubblePositions[i * 3] = Math.cos(b.angle) * b.radius;
        bubblePositions[i * 3 + 1] = b.y + pistonOffset * 0.4;
        bubblePositions[i * 3 + 2] = Math.sin(b.angle) * b.radius;
      }
      bubbleGeo.attributes.position.needsUpdate = true;

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      controls.removeEventListener('start', handleControlsStart);
      controls.dispose();
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);

      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      envRT.dispose();
      renderer.dispose();
      if (canvas.parentElement === container) {
        container.removeChild(canvas);
      }
    };
  }, []);

  const handleStageSelectAndFocus = (stageId: string) => {
    onSelectStage(stageId);
    cameraCommandRef.current = { type: 'focusStage', stageId };
  };

  return (
    <section
      aria-label="3D Core Interactive Simulation"
      className="relative w-full h-[calc(100vh-120px)] min-h-[600px] bg-[#050b16] overflow-hidden border-t border-cyan-500/15"
    >
      {/* Dedicated WebGL Mount Container */}
      <div ref={mountRef} className="w-full h-full" />

      {/* WebGL Fallback Card if WebGL is unavailable */}
      {webglError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#050b16]/95 p-6">
          <div className="max-w-xl w-full bg-[#0b162b] border border-cyan-400/25 rounded-lg p-6 text-slate-200 space-y-4">
            <h2 className="font-display text-lg font-semibold text-cyan-300">
              3D Viewport Fallback
            </h2>
            <p className="text-sm text-slate-300">{webglError}</p>
            <img
              src={DIAGRAM_IMAGE_SRC}
              alt="Helix-Force Buoy 10-part labeled design diagram"
              referrerPolicy="no-referrer"
              className="w-full rounded border border-cyan-500/20 object-contain"
            />
          </div>
        </div>
      )}

      {/* Top-Left Compact Live Simulation Telemetry Strip (No backdrop-blur over WebGL) */}
      <div className="absolute top-4 left-4 z-10 max-w-md bg-[#071122]/94 border border-cyan-400/25 rounded-lg p-3.5 pointer-events-auto">
        <div className="flex items-start justify-between gap-3 pb-2 border-b border-cyan-500/15">
          <div>
            <p className="text-[11px] font-mono tracking-wider text-amber-300">
              SIMULATION READOUTS — NOT MEASURED DATA
            </p>
            <p className="text-[11px] font-mono text-cyan-200 mt-0.5">
              {TARGET_OUTPUT_LABEL}
            </p>
            <h2 className="font-display text-sm font-semibold text-slate-100 mt-0.5">
              Stationary Moored Buoy · Center Needle Chain
            </h2>
          </div>
          <span
            className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border whitespace-nowrap ${
              telemetry.mode === 'Boost'
                ? 'text-amber-300 border-amber-400/40 bg-amber-500/15'
                : 'text-cyan-300 border-cyan-400/35 bg-cyan-500/10'
            }`}
          >
            {telemetry.mode === 'Boost' ? 'Mode B: Boost' : 'Mode A: Harvest'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-x-3 gap-y-2 pt-2.5">
          <div>
            <div className="text-[10px] text-slate-400">Displacement Diff</div>
            <div className="font-mono text-sm font-semibold text-amber-300">
              {telemetry.displacementBar.toFixed(2)}{' '}
              <span className="text-[10px] text-slate-400 font-normal">bar</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">Plunger Air</div>
            <div className="font-mono text-sm font-semibold text-cyan-300">
              {telemetry.plungerAirBar.toFixed(2)}{' '}
              <span className="text-[10px] text-slate-400 font-normal">bar</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">Pascal ΔP</div>
            <div className="font-mono text-sm font-semibold text-cyan-300">
              {telemetry.deltaP} <span className="text-[10px] text-slate-400 font-normal">Pa</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">Pan Fill / Trigger</div>
            <div className="font-mono text-xs font-semibold text-slate-100">
              {(telemetry.waterLevel * 100).toFixed(0)}%{' '}
              <span
                className={
                  telemetry.triggerFired ? 'text-amber-300' : 'text-cyan-300'
                }
              >
                {telemetry.triggerPhase}
              </span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">Turbine Fins</div>
            <div className="font-mono text-sm font-semibold text-slate-100">
              {telemetry.turbineRpm}{' '}
              <span className="text-[10px] text-slate-400 font-normal">RPM</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">Coils (Sim)</div>
            <div className="font-mono text-sm font-semibold text-amber-300">
              {telemetry.coilVolts.toFixed(1)}V · {telemetry.simPowerWatts}W
            </div>
          </div>
          <div className="col-span-3">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>Cap Bank Charge</span>
              <span className="font-mono text-cyan-300">{telemetry.charge.toFixed(0)}%</span>
            </div>
            <div className="h-2 w-full bg-[#0b1b33] rounded-sm overflow-hidden border border-cyan-500/20">
              <div
                className={`h-full transition-all duration-150 ${
                  telemetry.mode === 'Boost' ? 'bg-amber-400' : 'bg-cyan-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, telemetry.charge))}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onOpenCenterNeedle}
            className="w-full px-2.5 py-1.5 text-xs font-mono bg-[#0b1b33] text-amber-200 border border-amber-400/45 rounded hover:bg-amber-400/15 transition-colors text-center"
          >
            Air Plunger — Center Needle · 3D &amp; Spec
          </button>
        </div>

        {telemetry.boostMessage && (
          <p className="mt-2.5 text-xs text-amber-300 bg-amber-500/10 border border-amber-400/25 rounded px-2.5 py-1.5">
            {telemetry.boostMessage}
          </p>
        )}

        {/* Quick 12-stage tap strip */}
        <div className="mt-2.5 pt-2 border-t border-cyan-500/15">
          <div className="text-[11px] text-slate-400 mb-1.5">
            Tap center needle or stage 01–12 in 3D:
          </div>
          <div className="grid grid-cols-6 gap-1">
            {STAGES.map((stage) => {
              const active = selectedStageId === stage.id;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => handleStageSelectAndFocus(stage.id)}
                  title={`${stage.id} — ${stage.name}`}
                  className={`font-mono text-xs py-1 rounded border transition-colors ${
                    active
                      ? 'bg-amber-400/20 border-amber-400 text-amber-200 font-semibold'
                      : 'bg-[#0b182e] border-cyan-500/20 text-slate-300 hover:border-cyan-400/60 hover:text-cyan-200'
                  }`}
                >
                  {stage.id}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Stage Inspector Card (Top-Right, only rendered when a stage is clicked) */}
      {selectedStage && (
        <aside className="absolute top-4 right-4 z-10 w-80 max-w-[calc(100vw-2rem)] bg-[#071122]/95 border border-amber-400/35 rounded-lg p-4 pointer-events-auto">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xs font-mono text-amber-300">
                Stage {selectedStage.id} · {selectedStage.flowChannel}
              </div>
              <h3 className="font-display text-base font-semibold text-slate-100 mt-1">
                {selectedStage.name}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onSelectStage(null)}
              aria-label="Close stage details"
              className="p-1 text-slate-400 hover:text-slate-100 rounded border border-transparent hover:border-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {selectedStage.diagramLabel && (
            <div className="mt-2 text-xs text-cyan-300 font-mono">
              Diagram label: {selectedStage.diagramLabel}
            </div>
          )}

          <p className="mt-3 text-sm leading-relaxed text-slate-200">
            &ldquo;{selectedStage.note}&rdquo;
          </p>

          <div className="mt-3 pt-3 border-t border-cyan-500/15 flex flex-wrap gap-1.5">
            {Object.values(PART_DETAILS)
              .filter((p) => p.stageIds.includes(selectedStage.id))
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
        </aside>
      )}

      {/* Collapsible Unified Bottom Control Dock */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 z-10 w-[min(1080px,96vw)] transition-transform duration-200 pointer-events-auto ${
          dockCollapsed ? 'bottom-0 translate-y-[calc(100%-34px)]' : 'bottom-4'
        }`}
      >
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setDockCollapsed((v) => !v)}
            className="flex items-center gap-1.5 px-3.5 py-1 text-xs font-medium bg-[#071122] text-cyan-200 border border-b-0 border-cyan-500/25 rounded-t-md hover:text-white whitespace-nowrap shrink-0"
          >
            {dockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Show Controls</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Hide Controls</span>
              </>
            )}
          </button>
        </div>

        <div className="bg-[#071122]/95 border border-cyan-500/25 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2.5">
          {/* Tide / Wave Fill Rate Control */}
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 text-xs text-slate-300 whitespace-nowrap">
              <Waves className="w-3.5 h-3.5 text-cyan-300" />
              <span>Tide</span>
            </span>
            <div className="flex items-center gap-1 bg-[#0b182e] p-1 rounded border border-cyan-500/15">
              {(['Calm', 'Moderate', 'Swell', 'Heavy'] as TideLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => onChangeTide(level)}
                  className={`px-2 py-1 text-xs rounded transition-colors whitespace-nowrap shrink-0 ${
                    tide === level
                      ? 'bg-cyan-500/25 text-cyan-200 font-medium border border-cyan-400/40'
                      : 'text-slate-400 hover:text-slate-100 border border-transparent'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Air Tank Plunger — Adjustable & Over-Energize (Simulation Only) */}
          <div className="flex flex-wrap items-center gap-2 bg-[#0b182e] px-2.5 py-1 rounded border border-cyan-500/15">
            <label
              htmlFor="plunger-adj-slider"
              className="text-[11px] font-mono text-cyan-200 whitespace-nowrap"
            >
              Air Tank Plunger — Adjustable ({plungerSetting.toFixed(2)}×)
            </label>
            <input
              id="plunger-adj-slider"
              type="range"
              min={0.5}
              max={1.5}
              step={0.05}
              value={plungerSetting}
              onChange={(e) => onChangePlungerSetting(parseFloat(e.target.value))}
              className="w-24 accent-cyan-400 cursor-pointer"
            />
            <button
              type="button"
              onClick={onToggleOverEnergize}
              className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors whitespace-nowrap shrink-0 ${
                overEnergize
                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-semibold'
                  : 'bg-[#071225] text-amber-300 border-amber-400/40 hover:bg-amber-400/15'
              }`}
            >
              Over-Energize {overEnergize ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Mode A Harvest / Mode B Boost */}
          <div className="flex items-center gap-1 bg-[#0b182e] p-1 rounded border border-cyan-500/15">
            <button
              type="button"
              onClick={onSetHarvest}
              className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap shrink-0 ${
                telemetry.mode === 'Harvest'
                  ? 'bg-cyan-500/25 text-cyan-200 font-medium border border-cyan-400/40'
                  : 'text-slate-400 hover:text-slate-100 border border-transparent'
              }`}
            >
              Mode A: Harvest
            </button>
            <button
              type="button"
              onClick={onTriggerBoost}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap shrink-0 ${
                telemetry.mode === 'Boost'
                  ? 'bg-amber-400/25 text-amber-200 font-medium border border-amber-400/50'
                  : 'text-amber-300 hover:bg-amber-500/15 border border-transparent'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Mode B: Boost</span>
            </button>
          </div>

          {/* View & Pump Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onTogglePause}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-[#0b182e] text-slate-200 border border-cyan-500/20 rounded hover:border-cyan-400/50 whitespace-nowrap shrink-0"
            >
              {paused ? <Play className="w-3.5 h-3.5 text-cyan-300" /> : <Pause className="w-3.5 h-3.5 text-cyan-300" />}
              <span>{paused ? 'Resume' : 'Pause'}</span>
            </button>

            <button
              type="button"
              onClick={() => setExploded((v) => !v)}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded border transition-colors whitespace-nowrap shrink-0 ${
                exploded
                  ? 'bg-amber-400/20 text-amber-200 border-amber-400/50'
                  : 'bg-[#0b182e] text-slate-200 border-cyan-500/20 hover:border-cyan-400/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{exploded ? 'Assembled' : 'Explode Stack'}</span>
            </button>

            <button
              type="button"
              onClick={() => setCutawayOpen((v) => !v)}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded border transition-colors whitespace-nowrap shrink-0 ${
                !cutawayOpen
                  ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50'
                  : 'bg-[#0b182e] text-slate-200 border-cyan-500/20 hover:border-cyan-400/50'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{cutawayOpen ? 'Open Core' : 'Show Hull'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                cameraCommandRef.current = { type: 'zoomIn' };
              }}
              aria-label="Zoom In"
              title="Zoom In"
              className="p-1.5 bg-[#0b182e] text-slate-200 border border-cyan-500/20 rounded hover:border-cyan-400/50"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                cameraCommandRef.current = { type: 'zoomOut' };
              }}
              aria-label="Zoom Out"
              title="Zoom Out"
              className="p-1.5 bg-[#0b182e] text-slate-200 border border-cyan-500/20 rounded hover:border-cyan-400/50"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                cameraCommandRef.current = { type: 'reset' };
              }}
              aria-label="Reset Orbit View"
              title="Reset Orbit View"
              className="p-1.5 bg-[#0b182e] text-slate-200 border border-cyan-500/20 rounded hover:border-cyan-400/50"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
