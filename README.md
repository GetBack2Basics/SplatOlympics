# SplatOlympics: 3D Gaussian Splatting Arena Platform

[![Google Cloud Run](https://img.shields.io/badge/GCP-Cloud%20Run-blue?logo=googlecloud)](https://splatolympics-143392201813.australia-southeast1.run.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple?logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Status](https://img.shields.io/badge/Status-Demo%20Mode%20Active-emerald)](https://splatolympics-143392201813.australia-southeast1.run.app)

**SplatOlympics** is a modern, interactive 3-stage web platform for capturing multi-angle photograph datasets, reconstructing 3D Gaussian Splatting (3DGS) models across multiple quality tiers, inspecting point clouds in WebGL, loading projects and `.PLY`/`.SPLAT` model files from local disk, and monitoring Google Cloud compute credits.

---

## 🚀 Live Cloud Run Service & Current Status

- **Live Service URL**: [https://splatolympics-143392201813.australia-southeast1.run.app](https://splatolympics-143392201813.australia-southeast1.run.app)
- **Deployment Status**: **Demo Mode Active** *(Locked at code level to protect cloud GPU credits while giving visitors 100% full interactive access to all 3 stages, pre-rendered 3D models across 4 quality tiers, and custom PLY/SPLAT disk loading).*
- **GCP Region**: Sydney (`australia-southeast1`)
- **GCP Project**: `spatialolympics`

---

## 🌟 3-Stage Pipeline Features

### 📸 Stage 1: Photo Collector & Dataset Ingestion
- **EXIF Metadata Extractor**: Parses focal length, camera model, ISO, aperture, and sensor resolution.
- **Client-Side Quality Engine**: Computes Laplacian gradient variance sharpness scoring (0–100) and perceptual dHash duplicate image detection.
- **360° Angle Coverage Radar**: Visualizes photo distribution across North, South, East, West, and Overhead cardinal sectors.
- **WebRTC Viewfinder**: Mobile-ready camera switcher and snapshot engine.
- **Save & Export Project**: Save projects directly to server disk storage (`uploads/projects_db.json`) or download project `.json` configuration files to local disk.

### ⚡ Stage 2: Quality Tier Selection & Telemetry Pipeline
- **Load Project from Disk**: Import saved `.json` or `.splatproj` files from local disk into Stage 2.
- **4 Quality Reconstruction Tiers**:
  - 🟢 **Draft**: 142K Splats (10k iterations)
  - 🔵 **Standard**: 464K Splats (30k iterations)
  - 🟣 **High**: 719K Splats (30k iterations)
  - 🟡 **Ultra 8K**: 2.0M Splats (Maximum density)
- **Live WebSocket Iteration Telemetry**: Streams COLMAP keypoint matching events, PSNR quality metrics (dB), loss decay rates, and active Gaussian density over `ws://.../ws`.
- **Demo Mode Simulation**: In Demo Mode, creating a model instantly simulates the pipeline telemetry and outputs authentic pre-rendered SuperSplat PLY model assets for Stage 3 inspection.

### 🧊 Stage 3: Interactive 3D Viewport & Disk PLY/SPLAT Loader
- **In-Browser WebGL Inspector**: Three.js 3D Gaussian Splatting viewport with 360° `OrbitControls` orbiting, panning, and zoom.
- **Load PLY/SPLAT from Local Disk**: Load custom `.ply` or `.splat` files directly from disk via file picker or drag-and-drop onto the 3D canvas viewport.
- **Pre-Rendered Quality Tier Suite**: Switch between pre-loaded Draft (142K), Standard (464K), High (719K), and Ultra 8K (2.0M) Splat models.
- **NYT R&D & SuperSplat Suite**:
  - 🌐 360° Skybox Panorama environment toggle.
  - ✂️ SuperSplat Floater Crop tool for pruning floating point artifacts.
  - 📏 1:1 Rubik's Cube real-world scale calibration.
  - 📷 Camera frustum pyramid overlays showing exact capture positions.
  - ✨ Quantized PLY compression metrics (~95% file size reduction).

### 💰 GCP Credit & Cost Monitor
- **Real-Time Cost Tracking**: Calculates resource usage costs for Cloud Run vCPU/RAM, Gemini AI API requests, and 3DGS compute execution.
- **Daily & Weekly Budget Deduction**: Deducts usage costs from configurable daily ($10.00/day default) and weekly ($50.00/week default) credit limits.

---

## 🛠️ Local Development

### Prerequisites
- Node.js 20+
- npm

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/GetBack2Basics/SplatOlympics.git
cd SplatOlympics

# Install dependencies
npm install

# Run development server (Express Backend API + Vite Frontend)
npm start
```

- **Frontend App**: `http://localhost:5176` (or next free port)
- **Backend API**: `http://localhost:3000`

### Production Build

```bash
# Typecheck & Compile Vite bundle
npm run build

# Start Express server locally
npm start
```

---

## 📄 License

MIT License. Sample Cactus 3DGS dataset provided by Steam Studio / 3D Scan Studio Iris released under CC0 Public Domain.
