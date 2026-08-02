import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { parsePlyBuffer, ParsedPlyData } from '../utils/plyParser';
import {
  Maximize2,
  Minimize2,
  Eye,
  Camera,
  Layers,
  Sliders,
  RotateCcw,
  RefreshCw,
  Box,
  Flame,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface SplatViewport3DProps {
  modelUrl?: string;
  datasetName?: string;
}

/**
 * Creates a soft radial Gaussian 2D alpha texture (cakewalk/splat technique)
 */
function createGaussianTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const imgData = ctx.createImageData(64, 64);
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        const nx = (x - 31.5) / 31.5;
        const ny = (y - 31.5) / 31.5;
        const distSq = nx * nx + ny * ny;
        const alpha = distSq > 1.0 ? 0 : Math.exp(-3.5 * distSq);
        const idx = (y * 64 + x) * 4;

        imgData.data[idx] = 255;     // R
        imgData.data[idx + 1] = 255; // G
        imgData.data[idx + 2] = 255; // B
        imgData.data[idx + 3] = Math.floor(alpha * 255); // Alpha
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export const SplatViewport3D: React.FC<SplatViewport3DProps> = ({
  modelUrl = '/uploads/models/sample_cactus.ply',
  datasetName = '3D Reconstruction Model',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedPlyData | null>(null);
  const [renderMode, setRenderMode] = useState<'SPLATS' | 'POINT_CLOUD' | 'HYBRID'>('SPLATS');
  const [showFrustums, setShowFrustums] = useState(true);
  const [densityPercent, setDensityPercent] = useState(100);
  const [particleScale, setParticleScale] = useState(1.8);
  const [fps, setFps] = useState(60);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const pointsMeshRef = useRef<THREE.Points | null>(null);
  const frustumsGroupRef = useRef<THREE.Group | null>(null);

  // Fetch and parse real PLY binary model file
  useEffect(() => {
    setIsLoading(true);
    setErrorMessage(null);

    fetch(modelUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status} - Could not fetch PLY file at ${modelUrl}`);
        return res.arrayBuffer();
      })
      .then((buffer) => {
        const data = parsePlyBuffer(buffer);
        setParsedData(data);
      })
      .catch((err) => {
        console.error('[SplatViewport3D] Error parsing real PLY model:', err);
        setErrorMessage(`Could not load 3D model asset (${err.message}). Please verify job model in Stage 2.`);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [modelUrl]);

  // Initialize Three.js WebGL Scene with cakewalk/splat Depth Sorting & Radial Shaders
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current || !parsedData) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 520;

    // 1. Calculate Bounding Sphere & Center Model at Origin
    const vertexCount = parsedData.vertexCount;
    const rawPos = parsedData.positions;
    const rawCol = parsedData.colors;

    let sumX = 0, sumY = 0, sumZ = 0;
    for (let i = 0; i < vertexCount; i++) {
      sumX += rawPos[i * 3];
      sumY += rawPos[i * 3 + 1];
      sumZ += rawPos[i * 3 + 2];
    }

    const centerX = sumX / vertexCount;
    const centerY = sumY / vertexCount;
    const centerZ = sumZ / vertexCount;

    const centeredPositions = new Float32Array(vertexCount * 3);
    let maxDistSq = 0;

    for (let i = 0; i < vertexCount; i++) {
      const cx = rawPos[i * 3] - centerX;
      const cy = rawPos[i * 3 + 1] - centerY;
      const cz = rawPos[i * 3 + 2] - centerZ;

      centeredPositions[i * 3] = cx;
      centeredPositions[i * 3 + 1] = cy;
      centeredPositions[i * 3 + 2] = cz;

      const distSq = cx * cx + cy * cy + cz * cz;
      if (distSq > maxDistSq) maxDistSq = distSq;
    }

    const modelRadius = Math.sqrt(maxDistSq) || 1.5;

    // 2. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#020617'); // Dark slate canvas
    sceneRef.current = scene;

    // 3. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.05, 100);
    camera.position.set(0, modelRadius * 0.6, modelRadius * 2.2);
    cameraRef.current = camera;

    // 4. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // 5. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0);
    controls.maxDistance = modelRadius * 10;
    controls.minDistance = modelRadius * 0.2;
    controlsRef.current = controls;

    // 6. Lights & Grid Floor
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x06b6d4, 1.8);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const gridHelper = new THREE.GridHelper(modelRadius * 4, 20, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -modelRadius * 0.8;
    scene.add(gridHelper);

    // 7. Build 3D Gaussian Splat Buffer Geometry with Radial Gaussian Texture
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(centeredPositions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(rawCol, 3));

    // Create Initial Index Array for Depth Sorting
    const indexArray = new Uint32Array(vertexCount);
    for (let i = 0; i < vertexCount; i++) indexArray[i] = i;
    const indexAttribute = new THREE.BufferAttribute(indexArray, 1);
    geometry.setIndex(indexAttribute);

    const gaussianTexture = createGaussianTexture();

    const pointsMaterial = new THREE.PointsMaterial({
      size: particleScale * (modelRadius * 0.025),
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      map: gaussianTexture,
      alphaTest: 0.01,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    const points = new THREE.Points(geometry, pointsMaterial);
    pointsMeshRef.current = points;
    scene.add(points);

    // 8. Add Camera Frustum Overlays
    const frustumsGroup = createCameraFrustumsGroup(modelRadius);
    frustumsGroupRef.current = frustumsGroup;
    scene.add(frustumsGroup);

    // 9. Back-to-Front Depth Sorting Engine (cakewalk/splat Technique)
    const viewVector = new THREE.Vector3();
    const distances = new Float32Array(vertexCount);
    let lastSortTime = 0;

    const sortGaussiansBackToFront = () => {
      camera.getWorldDirection(viewVector);

      for (let i = 0; i < vertexCount; i++) {
        const x = centeredPositions[i * 3];
        const y = centeredPositions[i * 3 + 1];
        const z = centeredPositions[i * 3 + 2];
        distances[i] = x * viewVector.x + y * viewVector.y + z * viewVector.z;
      }

      // Sort indices in back-to-front order (farthest first)
      const sortedIndices = Array.from(indexArray);
      sortedIndices.sort((a, b) => distances[b] - distances[a]);

      for (let i = 0; i < vertexCount; i++) {
        indexArray[i] = sortedIndices[i];
      }

      geometry.index!.needsUpdate = true;
    };

    // Run initial depth sort
    sortGaussiansBackToFront();

    // 10. Animation & Render Loop
    let frameCount = 0;
    let lastFpsTime = performance.now();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();

      // Periodically trigger depth sorting on camera movement (every 100ms)
      const now = performance.now();
      if (now - lastSortTime > 120) {
        sortGaussiansBackToFront();
        lastSortTime = now;
      }

      // FPS Counter
      frameCount++;
      if (now - lastFpsTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastFpsTime)));
        frameCount = 0;
        lastFpsTime = now;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize listener
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight || 520;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
    };
  }, [parsedData]);

  // Dynamic sliders update
  useEffect(() => {
    if (pointsMeshRef.current) {
      const mat = pointsMeshRef.current.material as THREE.PointsMaterial;
      mat.size = particleScale * 0.035;
      mat.needsUpdate = true;
    }

    if (frustumsGroupRef.current) {
      frustumsGroupRef.current.visible = showFrustums || renderMode === 'HYBRID';
    }
  }, [particleScale, densityPercent, renderMode, showFrustums]);

  // Creates 3D Camera Frustum Wireframes around the scene
  const createCameraFrustumsGroup = (radius: number): THREE.Group => {
    const group = new THREE.Group();
    const dist = radius * 1.8;

    const cameraAngles = [
      { pos: [0, 0.3 * radius, dist], rot: [0, 0, 0], color: 0x06b6d4, label: 'North' },
      { pos: [dist, 0.3 * radius, 0], rot: [0, Math.PI / 2, 0], color: 0xa855f7, label: 'East' },
      { pos: [0, 0.3 * radius, -dist], rot: [0, Math.PI, 0], color: 0x10b981, label: 'South' },
      { pos: [-dist, 0.3 * radius, 0], rot: [0, -Math.PI / 2, 0], color: 0xf59e0b, label: 'West' },
      { pos: [0, dist, 0], rot: [-Math.PI / 2, 0, 0], color: 0x3b82f6, label: 'Overhead' },
    ];

    cameraAngles.forEach((cam) => {
      const frustumHelper = createSingleFrustumWireframe(cam.color, radius * 0.25);
      frustumHelper.position.set(cam.pos[0], cam.pos[1], cam.pos[2]);
      frustumHelper.rotation.set(cam.rot[0], cam.rot[1], cam.rot[2]);
      group.add(frustumHelper);
    });

    return group;
  };

  const createSingleFrustumWireframe = (colorHex: number, scale: number): THREE.LineSegments => {
    const geometry = new THREE.BufferGeometry();
    const w = scale;
    const h = scale * 0.75;
    const d = scale * 1.5;

    const vertices = new Float32Array([
      0, 0, 0,  -w,  h, -d,
      0, 0, 0,   w,  h, -d,
      0, 0, 0,   w, -h, -d,
      0, 0, 0,  -w, -h, -d,
      -w, h, -d,  w, h, -d,
       w, h, -d,  w, -h, -d,
       w, -h, -d, -w, -h, -d,
      -w, -h, -d, -w, h, -d,
    ]);

    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    const material = new THREE.LineBasicMaterial({ color: colorHex, linewidth: 2 });
    return new THREE.LineSegments(geometry, material);
  };

  const handleResetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 1.2, 3.5);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'min-h-[520px]'
      }`}
    >
      {/* Three.js Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6">
          <RefreshCw className="w-10 h-10 text-splat-neonCyan animate-spin mb-3" />
          <h3 className="text-sm font-bold text-slate-200">Parsing Real 3D Gaussian PLY Buffer...</h3>
          <p className="text-xs text-slate-400 mt-1">Applying cakewalk/splat Depth Sorting & Radial Gaussian Shaders</p>
        </div>
      )}

      {/* Error Alert Overlay */}
      {errorMessage && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6">
          <AlertCircle className="w-10 h-10 text-rose-400 mb-3" />
          <h3 className="text-sm font-bold text-slate-200">{errorMessage}</h3>
          <p className="text-xs text-slate-400 mt-1">Submit a dataset in Stage 1 to generate a new 3D model asset.</p>
        </div>
      )}

      {/* Top HUD Bar */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left Badge: Model Title & FPS */}
        <div className="flex items-center space-x-2.5 bg-slate-900/90 backdrop-blur-xl border border-slate-800 px-3.5 py-2 rounded-xl pointer-events-auto shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-splat-neonGreen animate-pulse" />
          <div>
            <h3 className="text-xs font-bold text-slate-200 truncate max-w-[200px] sm:max-w-[280px]">
              {datasetName}
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              {parsedData ? `${parsedData.vertexCount.toLocaleString()} Gaussians` : '0 Gaussians'} • {fps} FPS
            </span>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          {/* Render Mode Switcher */}
          <div className="flex items-center space-x-1 bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-1 rounded-xl shadow-lg">
            <button
              onClick={() => setRenderMode('SPLATS')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all ${
                renderMode === 'SPLATS'
                  ? 'bg-splat-neonCyan text-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Splats
            </button>
            <button
              onClick={() => setRenderMode('POINT_CLOUD')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all ${
                renderMode === 'POINT_CLOUD'
                  ? 'bg-splat-neonPurple text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Points
            </button>
            <button
              onClick={() => setRenderMode('HYBRID')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all ${
                renderMode === 'HYBRID'
                  ? 'bg-splat-neonGreen text-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Hybrid
            </button>
          </div>

          {/* Frustum Toggle */}
          <button
            onClick={() => setShowFrustums(!showFrustums)}
            className={`p-2 rounded-xl border text-xs font-bold transition-all shadow-lg ${
              showFrustums
                ? 'bg-splat-neonCyan/20 border-splat-neonCyan/50 text-splat-neonCyan'
                : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle camera frustums"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Recenter Camera */}
          <button
            onClick={handleResetCamera}
            className="p-2 bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all shadow-lg"
            title="Reset Orbit Camera"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all shadow-lg"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Bottom Floating Sliders HUD */}
      <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-3 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Particle Scale Slider */}
        <div className="flex items-center space-x-3 min-w-[200px]">
          <span className="font-mono text-[11px] text-slate-400 font-bold uppercase shrink-0">Scale: {particleScale}x</span>
          <input
            type="range"
            min="0.5"
            max="4.0"
            step="0.1"
            value={particleScale}
            onChange={(e) => setParticleScale(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-splat-neonCyan"
          />
        </div>

        {/* Density Subsampling Slider */}
        <div className="flex items-center space-x-3 min-w-[200px]">
          <span className="font-mono text-[11px] text-slate-400 font-bold uppercase shrink-0">Density: {densityPercent}%</span>
          <input
            type="range"
            min="10"
            max="100"
            step="10"
            value={densityPercent}
            onChange={(e) => setDensityPercent(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-splat-neonGreen"
          />
        </div>

        {/* Info Legend */}
        <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400 shrink-0">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-splat-neonCyan animate-pulse" />
            <span>cakewalk/splat Shader</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-splat-neonPurple" />
            <span>Depth Sorted (Back-to-Front)</span>
          </span>
        </div>
      </div>
    </div>
  );
};
