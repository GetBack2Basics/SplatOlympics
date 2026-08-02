# Stage 3 Implementation Plan: Interactive 3D Viewport & WebGL Splat Inspector

Interactive WebGL/WebGPU 3D Splat Inspector allowing users to inspect reconstructed 3D Gaussian models, orbit around the 3D scene, toggle camera frustum overlays, adjust point cloud density, and inspect model assets in-browser without downloading external software.

---

## 🛠️ Components Built

### 1. High-Performance Binary PLY Parser (`src/utils/plyParser.ts`)
- Parses binary (`binary_little_endian 1.0`) and ASCII PLY point cloud data buffers directly in the browser.
- Extracts Float32 position arrays ($X, Y, Z$) and Uint8/Float32 RGB color channels ($R, G, B, A$).

### 2. Three.js WebGL 3D Splat Inspector Canvas (`src/components/SplatViewport3D.tsx`)
- **Orbit Controls**: Smooth 360° mouse orbiting, panning, and zoom with inertia damping (`OrbitControls`).
- **Custom WebGL Gaussian Shader Material**: Renders 3D Gaussian particles with soft alpha falloff and additive blending (`PointsMaterial`).
- **Camera Frustum Wireframe Overlays**: Renders 3D camera pyramid frustums positioned around the 3D subject corresponding to camera poses (North, East, South, West, Overhead).
- **Interactive Controls HUD**:
  - **Render Mode Toggle**: `Splats` (3D Gaussian Splatting) vs. `Points` (Sparse Point Cloud) vs. `Hybrid`.
  - **Frustum Visibility Toggle**: Show/Hide camera frustums.
  - **Particle Scale Slider**: Adjust particle size from 0.5x to 4.0x.
  - **Density Subsampling Slider**: Adjust point density from 10% to 100%.
  - **Reset Camera**: Recenter orbit camera.
  - **Fullscreen Toggle**: Expand viewport to full window.
  - **Live FPS & Gaussian Count Display**: Real-time rendering performance metrics.

### 3. Integrated Navigation & Pipeline Trigger (`src/App.tsx` & `PipelineJobMonitor.tsx`)
- **Stage 3 Tab**: Dedicated **"Stage 3: 3D Inspector"** tab in top navigation bar.
- **One-Click Viewport Trigger**: Clicking **"Inspect 3D Model in Viewport"** on any completed reconstruction job in Stage 2 seamlessly switches to Stage 3.
