import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  Pause,
  Play,
  RotateCcw,
  X,
} from 'lucide-react';
import {
  AIR_PLUNGER_CENTER_NEEDLE,
  PART_DETAILS,
  PartSelection,
  STAGES,
} from '../data/rayDesignData';
import { OperatingPrincipleAndSizing } from './OperatingPrincipleAndSizing';

interface PartDetailModalProps {
  partNumber: PartSelection;
  onClose: () => void;
  onSelectPart: (partSelection: PartSelection) => void;
}

interface SubPartRig {
  id: string;
  group: THREE.Group;
  basePos: THREE.Vector3;
  explodePos: THREE.Vector3;
  materials: THREE.MeshStandardMaterial[];
  baseEmissives: THREE.Color[];
  baseIntensities: number[];
}

const _gold = new THREE.Color(0xe5b842);
const _cyan = new THREE.Color(0x00e5ff);

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

function createSolarGridTex(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
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
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const PartDetailModal: React.FC<PartDetailModalProps> = ({
  partNumber,
  onClose,
  onSelectPart,
}) => {
  const isCenterNeedle = partNumber === 'center-needle';
  const spec = isCenterNeedle
    ? AIR_PLUNGER_CENTER_NEEDLE
    : PART_DETAILS[partNumber] ?? PART_DETAILS[1];
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [exploded, setExploded] = useState(false);
  const [animateMotion, setAnimateMotion] = useState(true);
  const [selectedSubPartId, setSelectedSubPartId] = useState<string | null>(null);
  const [hoveredSubPartId, setHoveredSubPartId] = useState<string | null>(null);
  const [webglError, setWebglError] = useState<string | null>(null);

  const explodedRef = useRef(exploded);
  explodedRef.current = exploded;

  const animateRef = useRef(animateMotion);
  animateRef.current = animateMotion;

  const selectedSubRef = useRef(selectedSubPartId);
  selectedSubRef.current = selectedSubPartId;

  const hoveredSubRef = useRef(hoveredSubPartId);
  hoveredSubRef.current = hoveredSubPartId;

  const resetCamRef = useRef(false);

  // Reset sub-part selection when switching parts
  useEffect(() => {
    setSelectedSubPartId(null);
    setHoveredSubPartId(null);
    setExploded(false);
    setWebglError(null);
  }, [partNumber]);

  // Escape key closes modal
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

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
      setWebglError('WebGL rendering context could not be initialized for this part view.');
      return;
    }

    const width = Math.max(container.clientWidth, 280);
    const height = Math.max(container.clientHeight, 280);

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);

    const canvas = renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError('WebGL context lost. Attempting recovery...');
    };
    const handleContextRestored = () => setWebglError(null);
    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040a15);
    scene.fog = new THREE.FogExp2(0x040a15, 0.045);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envRT = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envRT.texture;
    roomEnv.dispose();
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 60);
    camera.position.set(2.9, 1.5, 3.6);

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 0, 0);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;
    controls.minDistance = 1.4;
    controls.maxDistance = 8.5;

    const hemi = new THREE.HemisphereLight(0x8cd7ff, 0x0a1628, 1.0);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff1dc, 2.2);
    keyLight.position.set(4, 6, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x00e5ff, 1.3);
    rimLight.position.set(-4, 2, -4);
    scene.add(rimLight);

    // Subtle blueprint turntable grid
    const grid = new THREE.GridHelper(5, 20, 0x0e4f73, 0x082036);
    grid.position.y = -1.55;
    scene.add(grid);

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

    // PBR Materials matching the main BuoyCore3D system
    const steelMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0xaab9ca, metalness: 0.85, roughness: 0.26 })
    );
    const armorMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0x1e2c3f, metalness: 0.72, roughness: 0.36 })
    );
    const copperMat = trackMat(
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
        emissiveIntensity: 0.18,
      })
    );
    const grapheneMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x151b26,
        metalness: 0.55,
        roughness: 0.42,
        emissive: 0x005266,
        emissiveIntensity: 0.35,
      })
    );
    const cyanGlowMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        metalness: 0.35,
        roughness: 0.22,
        emissive: 0x00c8ff,
        emissiveIntensity: 0.75,
      })
    );
    const clearShellMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0x8be9ff,
        metalness: 0.05,
        roughness: 0.14,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      })
    );
    const solarTex = trackTex(createSolarGridTex());
    solarTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const solarMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: solarTex,
        metalness: 0.45,
        roughness: 0.22,
        emissive: 0x051a30,
        emissiveIntensity: 0.25,
      })
    );

    const partRoot = new THREE.Group();
    scene.add(partRoot);

    const subRigs: SubPartRig[] = [];
    const pickables: THREE.Object3D[] = [];

    const registerSubPart = (
      id: string,
      group: THREE.Group,
      explodeOffset: THREE.Vector3
    ) => {
      const basePos = group.position.clone();
      const explodePos = basePos.clone().add(explodeOffset);
      const rigMats: THREE.MeshStandardMaterial[] = [];
      const baseEmissives: THREE.Color[] = [];
      const baseIntensities: number[] = [];

      group.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.userData.subPartId = id;
          pickables.push(mesh);
          if (
            !Array.isArray(mesh.material) &&
            (mesh.material as THREE.MeshStandardMaterial).isMeshStandardMaterial
          ) {
            const cloned = (mesh.material as THREE.MeshStandardMaterial).clone();
            materials.push(cloned);
            mesh.material = cloned;
            rigMats.push(cloned);
            baseEmissives.push(cloned.emissive.clone());
            baseIntensities.push(cloned.emissiveIntensity);
          }
        }
      });

      partRoot.add(group);
      subRigs.push({
        id,
        group,
        basePos,
        explodePos,
        materials: rigMats,
        baseEmissives,
        baseIntensities,
      });
    };

    // Animated references depending on partNumber
    let movingPistonGroup: THREE.Group | null = null;
    let spinningRotorGroup: THREE.Group | null = null;
    let swivelGroup: THREE.Group | null = null;
    let needleCamGroup: THREE.Group | null = null;
    let needlePanWater: THREE.Mesh | null = null;
    const pulseMeshes: THREE.Mesh[] = [];

    // Build bespoke 3D model directly from AIR_PLUNGER_CENTER_NEEDLE or PART_DETAILS[partNumber] description
    switch (partNumber) {
      case 'center-needle': {
        // Air Plunger — Center Needle (slim air-filled plunger down exact center + adjustable tank + airtight seal + level/cam trigger)
        const shaftG = new THREE.Group();
        const stemGeo = trackGeo(new THREE.CylinderGeometry(0.11, 0.08, 2.75, 24));
        const stem = new THREE.Mesh(stemGeo, steelMat);
        shaftG.add(stem);
        const airCoreGeo = trackGeo(new THREE.CylinderGeometry(0.055, 0.04, 2.6, 16));
        const airCore = new THREE.Mesh(airCoreGeo, cyanGlowMat);
        shaftG.add(airCore);
        pulseMeshes.push(airCore);
        const tipCone = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.1, 0.24, 20)), goldMat);
        tipCone.rotation.x = Math.PI;
        tipCone.position.y = -1.48;
        shaftG.add(tipCone);
        registerSubPart('needle-shaft', shaftG, new THREE.Vector3(0, 0, 0));
        movingPistonGroup = shaftG;

        const tankG = new THREE.Group();
        const tankCyl = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.56, 0.56, 0.62, 32)), armorMat);
        tankCyl.position.y = 0.88;
        tankG.add(tankCyl);
        const tankCrown = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.38, 0.56, 0.18, 32)), goldMat);
        tankCrown.position.y = 1.28;
        tankG.add(tankCrown);
        const adjCollar = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.58, 0.045, 12, 36)), goldMat);
        adjCollar.rotation.x = Math.PI / 2;
        adjCollar.position.y = 0.72;
        tankG.add(adjCollar);
        registerSubPart('needle-air-tank', tankG, new THREE.Vector3(0, 0.52, 0));

        const sealG = new THREE.Group();
        const pistonDisk = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.78, 0.78, 0.2, 32)), steelMat);
        pistonDisk.position.y = 0.22;
        sealG.add(pistonDisk);
        const airtightGeo = trackGeo(new THREE.TorusGeometry(0.8, 0.04, 12, 36));
        airtightGeo.rotateX(Math.PI / 2);
        const sealRing1 = new THREE.Mesh(airtightGeo, grapheneMat);
        sealRing1.position.y = 0.29;
        sealG.add(sealRing1);
        const sealRing2 = new THREE.Mesh(airtightGeo, grapheneMat);
        sealRing2.position.y = 0.15;
        sealG.add(sealRing2);
        registerSubPart('needle-seal', sealG, new THREE.Vector3(0.55, 0, 0));

        const camG = new THREE.Group();
        const panGeo = trackGeo(new THREE.CylinderGeometry(0.95, 0.88, 0.78, 32, 1, true));
        const panWall = new THREE.Mesh(panGeo, clearShellMat);
        panWall.position.y = 0.42;
        camG.add(panWall);
        const waterGeo = trackGeo(new THREE.CylinderGeometry(0.86, 0.84, 0.7, 28));
        needlePanWater = new THREE.Mesh(waterGeo, cyanGlowMat);
        needlePanWater.position.y = 0.36;
        camG.add(needlePanWater);

        const armPivot = new THREE.Group();
        armPivot.position.set(0.84, 0.58, 0);
        const camArm = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.46, 0.06, 0.08)), goldMat);
        camArm.position.x = -0.2;
        armPivot.add(camArm);
        const floatBall = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.09, 14, 12)), goldMat);
        floatBall.position.x = -0.44;
        armPivot.add(floatBall);
        camG.add(armPivot);
        needleCamGroup = armPivot;
        registerSubPart('needle-cam', camG, new THREE.Vector3(-0.52, -0.2, 0));
        break;
      }

      case 1: {
        // Hull / body shell
        const outerG = new THREE.Group();
        const outerGeo = trackGeo(
          new THREE.CylinderGeometry(1.0, 1.0, 2.3, 40, 1, true, Math.PI * 0.36, Math.PI * 1.28)
        );
        outerG.add(new THREE.Mesh(outerGeo, steelMat));
        // Clear funnel bucket cross-check silhouette
        const funnelGeo = trackGeo(
          new THREE.CylinderGeometry(1.04, 0.72, 2.32, 32, 1, true, -Math.PI * 0.64, Math.PI * 0.72)
        );
        outerG.add(new THREE.Mesh(funnelGeo, clearShellMat));
        registerSubPart('hull-outer', outerG, new THREE.Vector3(-0.35, 0, 0));

        const innerG = new THREE.Group();
        const innerGeo = trackGeo(
          new THREE.CylinderGeometry(0.91, 0.91, 2.26, 40, 1, true, Math.PI * 0.36, Math.PI * 1.28)
        );
        innerG.add(new THREE.Mesh(innerGeo, armorMat));
        registerSubPart('hull-inner', innerG, new THREE.Vector3(0.35, 0, 0));

        const flangeG = new THREE.Group();
        const fGeo = trackGeo(new THREE.TorusGeometry(1.01, 0.045, 12, 42, Math.PI * 1.28));
        fGeo.rotateX(Math.PI / 2);
        fGeo.rotateY(-Math.PI * 0.14);
        [-1.08, 0, 1.08].forEach((y) => {
          const ring = new THREE.Mesh(fGeo, goldMat);
          ring.position.y = y;
          flangeG.add(ring);
        });
        registerSubPart('hull-flanges', flangeG, new THREE.Vector3(0, 0.45, 0));
        break;
      }

      case 2: {
        // Central air-plunger + weighted piston — FOUR-LAYER teardown
        // (Gemini Answer 6, Nov 22). The four layer groups below are
        // registered with the PART_DETAILS[2].subParts ids, so the existing
        // click-to-highlight UI becomes the layer-by-layer teardown.
        // Layer 1 — Outer stepped piston barrel (gunmetal + orange U-cups)
        const layer1G = new THREE.Group();
        const shellGeo = trackGeo(
          new THREE.CylinderGeometry(0.95, 0.95, 0.28, 36, 1, true, Math.PI * 0.25, Math.PI * 1.5)
        );
        layer1G.add(new THREE.Mesh(shellGeo, steelMat));
        const crownGeo = trackGeo(new THREE.CylinderGeometry(0.98, 0.95, 0.08, 36));
        const crown = new THREE.Mesh(crownGeo, steelMat);
        crown.position.y = 0.16;
        layer1G.add(crown);
        const ucupGeo = trackGeo(new THREE.TorusGeometry(0.96, 0.036, 12, 40));
        ucupGeo.rotateX(Math.PI / 2);
        const uTop = new THREE.Mesh(ucupGeo, goldMat);
        uTop.position.y = -0.26;
        layer1G.add(uTop);
        const uBot = new THREE.Mesh(ucupGeo, goldMat);
        uBot.position.y = -0.44;
        layer1G.add(uBot);
        layer1G.position.y = -0.35;
        registerSubPart('piston-layer-1-outer-shell', layer1G, new THREE.Vector3(-0.55, -0.45, 0));

        // Layer 2 — Annular hollow core (air conduit / plenum, cyan air channel)
        const layer2G = new THREE.Group();
        const annulusGeo = trackGeo(
          new THREE.CylinderGeometry(0.72, 0.72, 0.26, 32, 1, true)
        );
        const annulus = new THREE.Mesh(annulusGeo, cyanGlowMat);
        layer2G.add(annulus);
        pulseMeshes.push(annulus);
        const airChanGeo = trackGeo(new THREE.CylinderGeometry(0.68, 0.68, 0.1, 32));
        const airChan = new THREE.Mesh(airChanGeo, cyanGlowMat);
        airChan.position.y = 0.1;
        layer2G.add(airChan);
        layer2G.position.y = -0.35;
        registerSubPart('piston-layer-2-hollow-core', layer2G, new THREE.Vector3(0, -0.15, 0));

        // Layer 3 — Inner sealing tube (mirror-polished chrome sleeve)
        const layer3G = new THREE.Group();
        const chromeMat = trackMat(
          new THREE.MeshStandardMaterial({
            color: 0xdfe8f2,
            metalness: 1.0,
            roughness: 0.12,
          })
        );
        const sleeveGeo = trackGeo(new THREE.CylinderGeometry(0.45, 0.45, 0.5, 28, 1, true));
        layer3G.add(new THREE.Mesh(sleeveGeo, chromeMat));
        const bulkGeo = trackGeo(new THREE.TorusGeometry(0.45, 0.03, 10, 28));
        bulkGeo.rotateX(Math.PI / 2);
        const bulkTop = new THREE.Mesh(bulkGeo, grapheneMat);
        bulkTop.position.y = 0.25;
        layer3G.add(bulkTop);
        const bulkBot = new THREE.Mesh(bulkGeo, grapheneMat);
        bulkBot.position.y = -0.25;
        layer3G.add(bulkBot);
        layer3G.position.y = -0.35;
        registerSubPart('piston-layer-3-sealing-tube', layer3G, new THREE.Vector3(0.55, 0.15, 0));

        // Layer 4 — Central compressor rod + needle valve + magnetic runner
        // (alternating red / silver NdFeB magnet rings on the center shaft)
        const layer4G = new THREE.Group();
        const rodGeo = trackGeo(new THREE.CylinderGeometry(0.18, 0.18, 1.5, 24));
        const rod = new THREE.Mesh(rodGeo, steelMat);
        rod.position.y = 0.48;
        layer4G.add(rod);
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
          const ring = new THREE.Mesh(ringGeo, i % 2 === 0 ? magnetMat : steelMat);
          ring.position.y = 0.1 + i * 0.28;
          layer4G.add(ring);
        }
        const tipGeo = trackGeo(new THREE.ConeGeometry(0.1, 0.24, 20));
        const tip = new THREE.Mesh(tipGeo, goldMat);
        tip.rotation.x = Math.PI;
        tip.position.y = -0.3;
        layer4G.add(tip);
        const capGeo = trackGeo(new THREE.CylinderGeometry(0.32, 0.28, 0.14, 24));
        const cap = new THREE.Mesh(capGeo, goldMat);
        cap.position.y = 1.24;
        layer4G.add(cap);
        registerSubPart('piston-layer-4-compressor-rod', layer4G, new THREE.Vector3(0, 0.55, 0));

        movingPistonGroup = partRoot;
        break;
      }

      case 3: {
        // Top scuppers
        const collarG = new THREE.Group();
        const cGeo = trackGeo(new THREE.CylinderGeometry(1.15, 1.15, 0.46, 36, 1, true));
        collarG.add(new THREE.Mesh(cGeo, steelMat));
        const guideGeo = trackGeo(new THREE.TorusGeometry(0.84, 0.045, 12, 36));
        guideGeo.rotateX(Math.PI / 2);
        const guide = new THREE.Mesh(guideGeo, armorMat);
        guide.position.y = -0.22;
        collarG.add(guide);
        registerSubPart('scupper-collar', collarG, new THREE.Vector3(0, 0.45, 0));

        const chutesG = new THREE.Group();
        const boxGeo = trackGeo(new THREE.BoxGeometry(0.48, 0.24, 0.42));
        const lipGeo = trackGeo(new THREE.BoxGeometry(0.54, 0.05, 0.16));
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2 + Math.PI / 4;
          const chute = new THREE.Mesh(boxGeo, armorMat);
          chute.position.set(Math.cos(a) * 1.04, 0, Math.sin(a) * 1.04);
          chute.rotation.y = -a;
          chutesG.add(chute);
          const lip = new THREE.Mesh(lipGeo, goldMat);
          lip.position.set(Math.cos(a) * 1.24, -0.1, Math.sin(a) * 1.24);
          lip.rotation.y = -a;
          chutesG.add(lip);
        }
        registerSubPart('scupper-chutes', chutesG, new THREE.Vector3(0, -0.1, 0));

        const grilleG = new THREE.Group();
        const barGeo = trackGeo(new THREE.CylinderGeometry(0.015, 0.015, 0.24, 8));
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2 + Math.PI / 4;
          for (let k = -1; k <= 1; k++) {
            const bar = new THREE.Mesh(barGeo, cyanGlowMat);
            bar.position.set(
              Math.cos(a) * 1.22 + Math.sin(a) * k * 0.12,
              0,
              Math.sin(a) * 1.22 - Math.cos(a) * k * 0.12
            );
            grilleG.add(bar);
          }
        }
        registerSubPart('scupper-grilles', grilleG, new THREE.Vector3(0, -0.55, 0));
        break;
      }

      case 4: {
        // Air accelerator throat
        const coneG = new THREE.Group();
        const pts = [
          new THREE.Vector2(1.05, 0.62),
          new THREE.Vector2(0.86, 0.28),
          new THREE.Vector2(0.52, -0.08),
          new THREE.Vector2(0.68, -0.58),
        ];
        const latheGeo = trackGeo(new THREE.LatheGeometry(pts, 40, Math.PI * 0.25, Math.PI * 1.5));
        coneG.add(new THREE.Mesh(latheGeo, armorMat));
        registerSubPart('throat-cone', coneG, new THREE.Vector3(0, -0.25, 0));

        const collarG = new THREE.Group();
        const ringGeo = trackGeo(new THREE.TorusGeometry(1.06, 0.055, 14, 42));
        ringGeo.rotateX(Math.PI / 2);
        const topRing = new THREE.Mesh(ringGeo, steelMat);
        topRing.position.y = 0.62;
        collarG.add(topRing);
        const throatRingGeo = trackGeo(new THREE.TorusGeometry(0.54, 0.035, 12, 36));
        throatRingGeo.rotateX(Math.PI / 2);
        const midRing = new THREE.Mesh(throatRingGeo, goldMat);
        midRing.position.y = -0.08;
        collarG.add(midRing);
        registerSubPart('throat-collar', collarG, new THREE.Vector3(0, 0.45, 0));
        break;
      }

      case 5: {
        // Pressure taps + ΔP sensor
        // Reference ghost throat outline so tap positions are unmistakable
        const refThroatGeo = trackGeo(
          new THREE.LatheGeometry(
            [
              new THREE.Vector2(0.75, 0.6),
              new THREE.Vector2(0.42, -0.05),
              new THREE.Vector2(0.58, -0.55),
            ],
            32
          )
        );
        const refMesh = new THREE.Mesh(refThroatGeo, clearShellMat);
        partRoot.add(refMesh);

        const pinG = new THREE.Group();
        const tapGeo = trackGeo(new THREE.CylinderGeometry(0.04, 0.04, 0.55, 12));
        tapGeo.rotateZ(Math.PI / 2);
        const pInStem = new THREE.Mesh(tapGeo, goldMat);
        pInStem.position.set(-0.92, 0.48, 0);
        pinG.add(pInStem);
        const portRing = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.07, 0.02, 10, 16)), cyanGlowMat);
        portRing.rotation.y = Math.PI / 2;
        portRing.position.set(-0.66, 0.48, 0);
        pinG.add(portRing);
        registerSubPart('tap-pin', pinG, new THREE.Vector3(-0.35, 0.35, 0));

        const pthG = new THREE.Group();
        const pThStem = new THREE.Mesh(tapGeo, goldMat);
        pThStem.position.set(-0.72, -0.05, 0);
        pthG.add(pThStem);
        const portRing2 = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.07, 0.02, 10, 16)), cyanGlowMat);
        portRing2.rotation.y = Math.PI / 2;
        portRing2.position.set(-0.44, -0.05, 0);
        pthG.add(portRing2);
        registerSubPart('tap-pth', pthG, new THREE.Vector3(-0.35, -0.35, 0));

        const sensorG = new THREE.Group();
        const body = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.32, 0.72, 0.28)), armorMat);
        body.position.set(-1.18, 0.2, 0);
        sensorG.add(body);
        const face = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.04, 0.46, 0.2)), cyanGlowMat);
        face.position.set(-1.35, 0.2, 0);
        sensorG.add(face);
        pulseMeshes.push(face);
        registerSubPart('dp-sensor', sensorG, new THREE.Vector3(0.45, 0, 0));
        break;
      }

      case 6: {
        // Axial-flow turbine
        const hubG = new THREE.Group();
        hubG.add(new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.24, 0.18, 0.56, 24)), steelMat));
        const nose = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.24, 0.24, 24)), goldMat);
        nose.position.y = 0.4;
        hubG.add(nose);
        registerSubPart('turbine-hub', hubG, new THREE.Vector3(0, 0.55, 0));

        const bladesG = new THREE.Group();
        const bladeGeo = trackGeo(new THREE.BoxGeometry(0.76, 0.05, 0.26));
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI * 2) / 8;
          const b = new THREE.Mesh(bladeGeo, steelMat);
          b.position.set(Math.cos(a) * 0.56, 0, Math.sin(a) * 0.56);
          b.rotation.y = -a;
          b.rotation.x = 0.45;
          bladesG.add(b);
        }
        registerSubPart('turbine-blades', bladesG, new THREE.Vector3(0, 0, 0));
        spinningRotorGroup = bladesG;

        const shroudG = new THREE.Group();
        const shroudGeo = trackGeo(new THREE.TorusGeometry(1.06, 0.08, 16, 44));
        shroudGeo.rotateX(Math.PI / 2);
        shroudG.add(new THREE.Mesh(shroudGeo, armorMat));
        registerSubPart('turbine-shroud', shroudG, new THREE.Vector3(0, -0.55, 0));
        break;
      }

      case 7: {
        // Copper induction coils
        const bobbinsG = new THREE.Group();
        const bobGeo = trackGeo(new THREE.CylinderGeometry(0.14, 0.14, 1.35, 18));
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI * 2) / 6;
          const bob = new THREE.Mesh(bobGeo, copperMat);
          bob.position.set(Math.cos(a) * 0.92, 0, Math.sin(a) * 0.92);
          bobbinsG.add(bob);
          pulseMeshes.push(bob);
        }
        registerSubPart('coil-bobbins', bobbinsG, new THREE.Vector3(0, 0.35, 0));

        const ringsG = new THREE.Group();
        const pGeo = trackGeo(new THREE.TorusGeometry(0.82, 0.045, 12, 40));
        pGeo.rotateX(Math.PI / 2);
        [-0.45, 0, 0.45].forEach((y) => {
          const r = new THREE.Mesh(pGeo, copperMat);
          r.position.y = y;
          ringsG.add(r);
          pulseMeshes.push(r);
        });
        registerSubPart('coil-rings', ringsG, new THREE.Vector3(0, -0.35, 0));

        const litzG = new THREE.Group();
        const leadGeo = trackGeo(new THREE.CylinderGeometry(0.035, 0.035, 1.2, 12));
        [-0.22, 0.22].forEach((x) => {
          const lead = new THREE.Mesh(leadGeo, goldMat);
          lead.position.set(x, -0.82, 0.72);
          litzG.add(lead);
        });
        registerSubPart('litz-channels', litzG, new THREE.Vector3(0, -0.55, 0.35));
        break;
      }

      case 8: {
        // Quad-Venturi ports
        const ringG = new THREE.Group();
        const rGeo = trackGeo(new THREE.TorusGeometry(1.05, 0.08, 14, 42));
        rGeo.rotateX(Math.PI / 2);
        ringG.add(new THREE.Mesh(rGeo, steelMat));
        registerSubPart('venturi-ring', ringG, new THREE.Vector3(0, 0.45, 0));

        const nozzlesG = new THREE.Group();
        const nozGeo = trackGeo(new THREE.CylinderGeometry(0.11, 0.25, 0.65, 18));
        nozGeo.rotateZ(Math.PI / 2);
        const tipGeo = trackGeo(new THREE.TorusGeometry(0.115, 0.028, 10, 20));
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2 + Math.PI / 4;
          const noz = new THREE.Mesh(nozGeo, armorMat);
          noz.position.set(Math.cos(a) * 0.96, 0, Math.sin(a) * 0.96);
          noz.rotation.y = -a + 0.42;
          nozzlesG.add(noz);

          const tip = new THREE.Mesh(tipGeo, cyanGlowMat);
          tip.position.set(Math.cos(a) * 0.68, 0, Math.sin(a) * 0.68);
          tip.rotation.y = -a + 0.42 + Math.PI / 2;
          nozzlesG.add(tip);
          pulseMeshes.push(tip);
        }
        registerSubPart('venturi-nozzles', nozzlesG, new THREE.Vector3(0, -0.35, 0));
        break;
      }

      case 9: {
        // Fibonacci helical core
        const spiralG = new THREE.Group();
        const pts: THREE.Vector3[] = [];
        const phi = 1.6180339887;
        for (let i = 0; i <= 150; i++) {
          const u = i / 150;
          const ang = u * 4.5 * Math.PI * 2;
          const rad = 0.78 * Math.pow(1 / phi, u * 2.2) + 0.1;
          const y = 0.88 - u * 1.76;
          pts.push(new THREE.Vector3(Math.cos(ang) * rad, y, Math.sin(ang) * rad));
        }
        const curve = new THREE.CatmullRomCurve3(pts);
        const spiralMesh = new THREE.Mesh(
          trackGeo(new THREE.TubeGeometry(curve, 140, 0.065, 12, false)),
          cyanGlowMat
        );
        spiralG.add(spiralMesh);
        pulseMeshes.push(spiralMesh);
        registerSubPart('helix-spiral', spiralG, new THREE.Vector3(-0.35, 0, 0));

        const linerG = new THREE.Group();
        const linerGeo = trackGeo(new THREE.CylinderGeometry(0.92, 0.84, 1.82, 32, 1, true));
        linerG.add(new THREE.Mesh(linerGeo, clearShellMat));
        // Riblet texture reference rings
        const ribGeo = trackGeo(new THREE.TorusGeometry(0.88, 0.015, 8, 32));
        ribGeo.rotateX(Math.PI / 2);
        for (let k = -3; k <= 3; k++) {
          const rib = new THREE.Mesh(ribGeo, goldMat);
          rib.position.y = k * 0.22;
          linerG.add(rib);
        }
        registerSubPart('helix-liner', linerG, new THREE.Vector3(0.45, 0, 0));
        break;
      }

      case 10: {
        // 24-block Halbach Magnetic Matrix Cage
        const blocksG = new THREE.Group();
        const blkGeo = trackGeo(new THREE.BoxGeometry(0.16, 1.35, 0.24));
        const wedgeGeo = trackGeo(new THREE.ConeGeometry(0.06, 0.14, 6));
        wedgeGeo.rotateZ(Math.PI / 2);
        for (let i = 0; i < 24; i++) {
          const a = (i * Math.PI * 2) / 24;
          const blk = new THREE.Mesh(blkGeo, i % 2 === 0 ? armorMat : goldMat);
          blk.position.set(Math.cos(a) * 1.05, 0, Math.sin(a) * 1.05);
          blk.rotation.y = -a;
          blocksG.add(blk);

          // Inward flux arrow every 2 blocks
          if (i % 2 === 0) {
            const w = new THREE.Mesh(wedgeGeo, cyanGlowMat);
            w.position.set(Math.cos(a) * 0.85, 0, Math.sin(a) * 0.85);
            w.rotation.y = -a;
            blocksG.add(w);
          }
        }
        registerSubPart('halbach-blocks', blocksG, new THREE.Vector3(0, 0, 0));

        const retG = new THREE.Group();
        const rGeo = trackGeo(new THREE.TorusGeometry(1.08, 0.05, 12, 48));
        rGeo.rotateX(Math.PI / 2);
        const topR = new THREE.Mesh(rGeo, steelMat);
        topR.position.y = 0.72;
        retG.add(topR);
        const botR = new THREE.Mesh(rGeo, steelMat);
        botR.position.y = -0.72;
        retG.add(botR);
        registerSubPart('halbach-retainers', retG, new THREE.Vector3(0, 0.52, 0));
        break;
      }

      case 11: {
        // Graphene-ion scrub electrodes
        const linerG = new THREE.Group();
        const sleeve = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.98, 0.92, 0.42, 36, 1, true)),
          grapheneMat
        );
        linerG.add(sleeve);
        pulseMeshes.push(sleeve);
        registerSubPart('scrub-liner', linerG, new THREE.Vector3(0, 0.42, 0));

        const ringG = new THREE.Group();
        const innerRingGeo = trackGeo(new THREE.TorusGeometry(0.68, 0.055, 12, 36));
        innerRingGeo.rotateX(Math.PI / 2);
        ringG.add(new THREE.Mesh(innerRingGeo, grapheneMat));
        const ribGeo = trackGeo(new THREE.BoxGeometry(0.3, 0.07, 0.08));
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI * 2) / 6;
          const rib = new THREE.Mesh(ribGeo, goldMat);
          rib.position.set(Math.cos(a) * 0.8, 0, Math.sin(a) * 0.8);
          rib.rotation.y = -a;
          ringG.add(rib);
        }
        registerSubPart('scrub-ring', ringG, new THREE.Vector3(0, -0.42, 0));
        break;
      }

      case 12: {
        // High-density supercapacitors
        const cellsG = new THREE.Group();
        const cellGeo = trackGeo(new THREE.CylinderGeometry(0.14, 0.14, 0.85, 20));
        const barGeo = trackGeo(new THREE.BoxGeometry(0.05, 0.65, 0.05));
        for (let i = 0; i < 10; i++) {
          const a = (i * Math.PI * 2) / 10;
          const cell = new THREE.Mesh(cellGeo, armorMat);
          cell.position.set(Math.cos(a) * 0.88, 0, Math.sin(a) * 0.88);
          cellsG.add(cell);
          const bar = new THREE.Mesh(barGeo, cyanGlowMat);
          bar.position.set(Math.cos(a) * 0.72, 0, Math.sin(a) * 0.72);
          bar.rotation.y = -a;
          cellsG.add(bar);
          pulseMeshes.push(bar);
        }
        registerSubPart('cap-cells', cellsG, new THREE.Vector3(0, -0.2, 0));

        const busG = new THREE.Group();
        const busGeo = trackGeo(new THREE.TorusGeometry(0.88, 0.04, 10, 40));
        busGeo.rotateX(Math.PI / 2);
        const topBus = new THREE.Mesh(busGeo, goldMat);
        topBus.position.y = 0.46;
        busG.add(topBus);
        const botBus = new THREE.Mesh(busGeo, copperMat);
        botBus.position.y = -0.46;
        busG.add(botBus);
        registerSubPart('cap-bus', busG, new THREE.Vector3(0, 0.55, 0));
        break;
      }

      case 13: {
        // Smart-switch router + capacitor base
        const baseG = new THREE.Group();
        baseG.add(new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(1.12, 1.02, 0.45, 36, 1, true)), armorMat));
        const floorGeo = trackGeo(new THREE.RingGeometry(0.36, 1.02, 36));
        floorGeo.rotateX(-Math.PI / 2);
        const floor = new THREE.Mesh(floorGeo, steelMat);
        floor.position.y = -0.22;
        baseG.add(floor);
        registerSubPart('base-housing', baseG, new THREE.Vector3(0, 0, 0));

        const bellG = new THREE.Group();
        const bell = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.36, 0.58, 0.48, 28, 1, true)),
          steelMat
        );
        bell.position.y = -0.46;
        bellG.add(bell);
        registerSubPart('base-nozzle', bellG, new THREE.Vector3(0, -0.58, 0));

        const rectG = new THREE.Group();
        const rectBoard = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.56, 0.56, 0.08, 24)), armorMat);
        rectBoard.position.y = 0.04;
        rectG.add(rectBoard);
        const diodeGeo = trackGeo(new THREE.BoxGeometry(0.14, 0.08, 0.08));
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2;
          const d = new THREE.Mesh(diodeGeo, goldMat);
          d.position.set(Math.cos(a) * 0.34, 0.1, Math.sin(a) * 0.34);
          d.rotation.y = -a;
          rectG.add(d);
        }
        registerSubPart('rectifier-board', rectG, new THREE.Vector3(0, 0.42, 0));

        const routerG = new THREE.Group();
        const chip = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.36, 0.14, 0.36)), cyanGlowMat);
        chip.position.y = 0.22;
        routerG.add(chip);
        pulseMeshes.push(chip);
        registerSubPart('power-router', routerG, new THREE.Vector3(0, 0.88, 0));
        break;
      }

      case 14: {
        // Solar crown panels
        const ringG = new THREE.Group();
        const pvGeo = trackGeo(new THREE.RingGeometry(0.36, 1.18, 36));
        pvGeo.rotateX(-Math.PI / 2);
        const pv = new THREE.Mesh(pvGeo, solarMat);
        pv.position.y = 0.08;
        ringG.add(pv);
        const rimGeo = trackGeo(new THREE.CylinderGeometry(1.22, 1.24, 0.14, 36));
        ringG.add(new THREE.Mesh(rimGeo, steelMat));
        registerSubPart('solar-ring', ringG, new THREE.Vector3(0, 0.28, 0));

        const feedG = new THREE.Group();
        const stem = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.06, 0.06, 0.62, 14)), copperMat);
        stem.position.set(0.55, -0.32, 0);
        feedG.add(stem);
        registerSubPart('solar-feed', feedG, new THREE.Vector3(0, -0.45, 0));

        const beaconG = new THREE.Group();
        const bBase = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.14, 0.18, 0.18, 16)), goldMat);
        bBase.position.y = 0.2;
        beaconG.add(bBase);
        const bCap = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.11, 16, 12)), cyanGlowMat);
        bCap.position.y = 0.34;
        beaconG.add(bCap);
        pulseMeshes.push(bCap);
        registerSubPart('solar-beacon', beaconG, new THREE.Vector3(0, 0.72, 0));
        break;
      }

      case 15:
      default: {
        // Mooring / anchor fittings
        const lugsG = new THREE.Group();
        const lug = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.18, 0.045, 12, 24)), steelMat);
        lug.position.y = 0.72;
        lugsG.add(lug);
        const shackle = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.15, 0.038, 12, 24)), goldMat);
        shackle.position.y = 0.48;
        shackle.rotation.y = Math.PI / 2;
        lugsG.add(shackle);
        registerSubPart('mooring-lugs', lugsG, new THREE.Vector3(0, 0.45, 0));

        const chainG = new THREE.Group();
        const linkGeo = trackGeo(new THREE.TorusGeometry(0.12, 0.03, 10, 20));
        for (let i = 0; i < 4; i++) {
          const link = new THREE.Mesh(linkGeo, steelMat);
          link.position.y = 0.22 - i * 0.18;
          link.rotation.y = (i % 2) * (Math.PI / 2);
          chainG.add(link);
        }
        const swivel = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.1, 0.1, 0.24, 16)), goldMat);
        swivel.position.y = -0.52;
        chainG.add(swivel);
        swivelGroup = chainG;
        registerSubPart('mooring-chain', chainG, new THREE.Vector3(0, 0, 0));

        const lightG = new THREE.Group();
        const housing = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.14, 0.16, 0.22, 18)), armorMat);
        housing.position.set(0.68, 0.72, 0);
        lightG.add(housing);
        const lens = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.1, 16, 12)), cyanGlowMat);
        lens.position.set(0.68, 0.86, 0);
        lightG.add(lens);
        pulseMeshes.push(lens);
        registerSubPart('mooring-light', lightG, new THREE.Vector3(0.42, 0.45, 0));
        break;
      }
    }

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Raycasting for sub-part clicking
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downPos = { x: 0, y: 0 };

    const updateMouse = (ev: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onDown = (ev: PointerEvent) => {
      downPos = { x: ev.clientX, y: ev.clientY };
    };

    const onUp = (ev: PointerEvent) => {
      const dx = ev.clientX - downPos.x;
      const dy = ev.clientY - downPos.y;
      if (dx * dx + dy * dy > 25) return;
      updateMouse(ev);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(pickables, false);
      if (hits.length > 0) {
        const subId = hits[0].object.userData.subPartId as string | undefined;
        if (subId) {
          setSelectedSubPartId((prev) => (prev === subId ? null : subId));
          return;
        }
      }
      setSelectedSubPartId(null);
    };

    const onMove = (ev: PointerEvent) => {
      updateMouse(ev);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(pickables, false);
      const subId = hits.length > 0 ? (hits[0].object.userData.subPartId as string | undefined) : undefined;
      setHoveredSubPartId(subId ?? null);
      canvas.style.cursor = subId ? 'pointer' : 'grab';
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointermove', onMove);

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

    let frameId = 0;
    let last = performance.now();
    let elapsed = 0;
    let explodeT = 0;
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
        const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (status === gl.UNSIGNALED) {
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
      const dt = Math.min((now - last) / 1000, 0.08);
      last = now;

      if (animateRef.current) {
        elapsed += dt;
      }

      if (resetCamRef.current) {
        resetCamRef.current = false;
        camera.position.set(2.9, 1.5, 3.6);
        controls.target.set(0, 0, 0);
      }

      explodeT = THREE.MathUtils.damp(explodeT, explodedRef.current ? 1 : 0, 6.5, dt);

      subRigs.forEach((rig) => {
        rig.group.position.lerpVectors(rig.basePos, rig.explodePos, explodeT);
        const isSel = selectedSubRef.current === rig.id;
        const isHov = hoveredSubRef.current === rig.id;
        for (let i = 0; i < rig.materials.length; i++) {
          const m = rig.materials[i];
          if (isSel) {
            m.emissive.copy(_gold);
            m.emissiveIntensity = 0.6;
          } else if (isHov) {
            m.emissive.copy(_cyan);
            m.emissiveIntensity = 0.35;
          } else {
            m.emissive.copy(rig.baseEmissives[i]);
            m.emissiveIntensity = rig.baseIntensities[i];
          }
        }
      });

      if (movingPistonGroup) {
        if (isCenterNeedle) {
          // Cycle: pan fills up -> level/cam trigger fires -> air forces needle plunger sharply up -> discharge
          const cyc = (elapsed * 0.45) % 1;
          const fill = cyc < 0.62 ? cyc / 0.62 : Math.max(0.12, 1 - (cyc - 0.62) / 0.38);
          const fired = cyc >= 0.62;
          movingPistonGroup.position.y = fired
            ? Math.sin(((cyc - 0.62) / 0.38) * Math.PI) * 0.38
            : -0.08 * fill;
          if (needleCamGroup) {
            needleCamGroup.rotation.z = fired ? 0.55 : fill * 0.16;
          }
          if (needlePanWater) {
            const s = Math.max(0.14, fill);
            needlePanWater.scale.y = s;
            needlePanWater.position.y = 0.05 + s * 0.34;
          }
        } else {
          // Part 02: settles subtly during pan fill, then snaps sharply when level/cam triggers
          const cyc = (elapsed * 0.45) % 1;
          const fill = cyc < 0.62 ? cyc / 0.62 : Math.max(0.12, 1 - (cyc - 0.62) / 0.38);
          movingPistonGroup.position.y =
            cyc >= 0.62
              ? Math.sin(((cyc - 0.62) / 0.38) * Math.PI) * 0.32
              : -0.07 * fill;
        }
      }
      if (spinningRotorGroup) {
        spinningRotorGroup.rotation.y = elapsed * 3.4;
      }
      if (swivelGroup) {
        swivelGroup.rotation.y = Math.sin(elapsed * 1.3) * 0.35;
      }
      pulseMeshes.forEach((mesh, idx) => {
        const m = mesh.material as THREE.MeshStandardMaterial;
        if (selectedSubRef.current !== mesh.userData.subPartId) {
          m.emissiveIntensity = 0.45 + 0.45 * Math.sin(elapsed * 3.2 + idx * 0.6);
        }
      });

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
      controls.dispose();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointermove', onMove);
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
  }, [partNumber]);

  const activeSubPart = selectedSubPartId
    ? spec.subParts.find((sp) => sp.id === selectedSubPartId) ?? null
    : null;

  const matchedStages = spec.stageIds
    .map((id) => STAGES.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Part ${spec.number} Technical Detail and 3D Model`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 sm:p-6"
    >
      <div className="w-full max-w-[1220px] max-h-[92vh] bg-[#060f20] border border-cyan-400/35 rounded-lg flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 bg-[#040a15] border-b border-cyan-500/20">
          <div>
            <div className="text-xs font-mono text-amber-300">
              {isCenterNeedle
                ? `${AIR_PLUNGER_CENTER_NEEDLE.badgeLabel} · TECHNICAL DESCRIPTION & 3D MODEL`
                : `PART ${String(spec.number).padStart(2, '0')} OF 15 · TECHNICAL DRAWING DESCRIPTION & 3D MODEL`}
            </div>
            <h2 className="font-display text-xl font-semibold text-slate-100 mt-0.5">
              {spec.part}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                onSelectPart(
                  isCenterNeedle ? 15 : partNumber > 1 ? partNumber - 1 : 'center-needle'
                )
              }
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-[#091830] text-slate-200 border border-cyan-500/25 rounded hover:border-cyan-400/60"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>
            <button
              type="button"
              onClick={() =>
                onSelectPart(
                  isCenterNeedle ? 1 : partNumber < 15 ? partNumber + 1 : 'center-needle'
                )
              }
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-[#091830] text-slate-200 border border-cyan-500/25 rounded hover:border-cyan-400/60"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close part detail"
              className="p-1.5 text-slate-300 hover:text-white bg-[#091830] border border-cyan-500/25 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Center Needle + 15-Part Number Strip */}
        <div className="px-5 py-2 bg-[#050c19] border-b border-cyan-500/15 flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => onSelectPart('center-needle')}
            title="Air Plunger — Center Needle (Featured Core Mechanism)"
            className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors whitespace-nowrap shrink-0 ${
              isCenterNeedle
                ? 'bg-amber-400/25 text-amber-200 border-amber-400 font-semibold'
                : 'bg-[#0b1b33] text-cyan-200 border-cyan-400/35 hover:border-amber-400'
            }`}
          >
            Center Needle
          </button>
          {Array.from({ length: 15 }, (_, idx) => idx + 1).map((num) => {
            const p = PART_DETAILS[num];
            const active = num === partNumber;
            return (
              <button
                key={num}
                type="button"
                onClick={() => onSelectPart(num)}
                title={`${num}. ${p.part}`}
                className={`px-2 py-1 text-xs font-mono rounded border transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-amber-400/20 text-amber-200 border-amber-400'
                    : 'bg-[#081326] text-slate-400 border-cyan-500/15 hover:text-cyan-200'
                }`}
              >
                {String(num).padStart(2, '0')}
              </button>
            );
          })}
        </div>

        {/* Body Split: Left 3D Model Viewport / Right Technical Drawing Description */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12">
          {/* Left: Interactive 3D Part Viewport */}
          <div className="lg:col-span-6 flex flex-col border-b lg:border-b-0 lg:border-r border-cyan-500/20 bg-[#040a15]">
            <div className="relative h-[340px] sm:h-[420px] lg:flex-1 min-h-[360px]">
              <div ref={mountRef} className="w-full h-full" />

              {webglError && (
                <div className="absolute inset-0 flex items-center justify-center p-6 bg-[#040a15] text-center">
                  <p className="text-sm text-amber-300">{webglError}</p>
                </div>
              )}

              {/* Sub-part hover/select banner */}
              <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none">
                <div className="bg-[#060f20]/95 border border-cyan-500/25 rounded px-3 py-1.5 text-xs pointer-events-auto">
                  {activeSubPart ? (
                    <div>
                      <div className="font-mono text-amber-300">{activeSubPart.name}</div>
                      <div className="text-slate-300 mt-0.5">{activeSubPart.role}</div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        Material: {activeSubPart.material}
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-300">
                      Drag to orbit · Scroll to zoom · Click any sub-part to inspect
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 3D Part Controls */}
            <div className="px-4 py-3 bg-[#050c1a] border-t border-cyan-500/20 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setExploded((v) => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border transition-colors whitespace-nowrap shrink-0 ${
                    exploded
                      ? 'bg-amber-400/20 text-amber-200 border-amber-400/50'
                      : 'bg-[#091830] text-slate-200 border-cyan-500/25 hover:border-cyan-400/50'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{exploded ? 'Assembled Part' : 'Explode Sub-Parts'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAnimateMotion((v) => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#091830] text-slate-200 border border-cyan-500/25 rounded hover:border-cyan-400/50 whitespace-nowrap shrink-0"
                >
                  {animateMotion ? (
                    <Pause className="w-3.5 h-3.5 text-cyan-300" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-cyan-300" />
                  )}
                  <span>{animateMotion ? 'Pause Motion' : 'Run Motion'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  resetCamRef.current = true;
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#091830] text-slate-200 border border-cyan-500/25 rounded hover:border-cyan-400/50 whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset View</span>
              </button>
            </div>
          </div>

          {/* Right: Technical Drawing Description (3D Model Basis) */}
          <div className="lg:col-span-6 p-5 space-y-5 overflow-y-auto">
            <div className="bg-[#091830] border border-cyan-400/30 rounded p-3.5 space-y-1">
              <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-300">
                In Plain Language (What It Does)
              </div>
              <p className="text-sm leading-relaxed text-slate-100">
                {spec.plainLanguage}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-[#040a15] border border-cyan-500/20 rounded p-3">
                <div className="font-mono text-cyan-300">MATERIAL</div>
                <div className="text-slate-100 mt-1">{spec.material}</div>
              </div>
              <div className="bg-[#040a15] border border-cyan-500/20 rounded p-3">
                <div className="font-mono text-cyan-300">DIMENSIONS / SPECS</div>
                <div className="text-slate-100 mt-1">{spec.dimensions}</div>
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="font-display text-sm font-semibold text-amber-300">
                Technical Drawing Description (Direct Basis for 3D Model)
              </h3>
              <p className="text-sm leading-relaxed text-slate-200">
                {spec.technicalDescription}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-cyan-300">
                  Function
                </h4>
                <p className="text-xs leading-relaxed text-slate-300">
                  {spec.functionSummary}
                </p>
              </div>
              <div className="space-y-1">
                <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-cyan-300">
                  Motion &amp; Coupling
                </h4>
                <p className="text-xs leading-relaxed text-slate-300">
                  {spec.motionInMachine}
                </p>
              </div>
            </div>

            {/* Cross-Check Labels */}
            <div className="bg-[#040a15] border border-cyan-500/20 rounded p-3.5 space-y-2 text-xs">
              <div className="font-mono text-cyan-300">
                CROSS-CHECK LABELS (10-LABEL DIAGRAM &amp; BUCKET-UNIT SHEET)
              </div>
              <div className="text-slate-300">
                <span className="text-slate-400">Flow Channels:</span>{' '}
                <span className="font-mono text-slate-100">{spec.flowChannels.join(' · ')}</span>
              </div>
              <div className="text-slate-300">
                <span className="text-slate-400">Diagram Labels (341_12_upel.png):</span>{' '}
                {spec.diagramLabels.length > 0
                  ? spec.diagramLabels.join(', ')
                  : 'not separately labeled on 10-part diagram'}
              </div>
              <div className="text-slate-300">
                <span className="text-slate-400">Bucket-Unit Sheet Cross-Check:</span>{' '}
                {spec.bucketSheetLabels.length > 0
                  ? spec.bucketSheetLabels.join(' · ')
                  : 'no overlapping bucket-sheet label'}
              </div>
            </div>

            {/* Sub-Parts Modeled in 3D */}
            <div className="space-y-2">
              <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-cyan-300">
                Modeled Sub-Parts (Click to Highlight in 3D)
              </h4>
              <div className="space-y-1.5">
                {spec.subParts.map((sp) => {
                  const active = selectedSubPartId === sp.id;
                  return (
                    <button
                      key={sp.id}
                      type="button"
                      onClick={() =>
                        setSelectedSubPartId((prev) => (prev === sp.id ? null : sp.id))
                      }
                      className={`w-full text-left px-3 py-2 rounded border text-xs transition-colors ${
                        active
                          ? 'bg-amber-400/15 border-amber-400 text-amber-100'
                          : 'bg-[#040a15] border-cyan-500/15 text-slate-200 hover:border-cyan-400/45'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{sp.name}</span>
                        <span className="font-mono text-[11px] text-slate-400">
                          {sp.material}
                        </span>
                      </div>
                      <div className="text-slate-400 mt-0.5">{sp.role}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fit in the 12-Stage Stack */}
            <div className="space-y-2 border-t border-cyan-500/15 pt-4">
              <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-amber-300">
                Fit in Canonical 12-Stage Stack (Ray&apos;s Verbatim Notes)
              </h4>
              {matchedStages.map((st) => (
                <div
                  key={st.id}
                  className="bg-[#040a15] border border-cyan-500/15 rounded p-3 text-xs space-y-1"
                >
                  <div className="font-mono text-cyan-300">
                    Stage {st.id} — {st.name}
                  </div>
                  <p className="text-slate-300 leading-relaxed">&ldquo;{st.note}&rdquo;</p>
                </div>
              ))}
            </div>

            {isCenterNeedle && (
              <div className="pt-4 border-t border-cyan-500/20">
                <OperatingPrincipleAndSizing compact />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
