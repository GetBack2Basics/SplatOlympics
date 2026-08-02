# SplatOlympics: 3D Gaussian Splatting Platform

[![Google Cloud Run](https://img.shields.io/badge/GCP-Cloud%20Run-blue?logo=googlecloud)](https://splatolympics-143392201813.australia-southeast1.run.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple?logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)

**SplatOlympics** is a modern interactive web platform for collecting multi-angle photograph datasets for 3D Gaussian Splatting (3DGS) reconstruction, processing 3D datasets, streaming real-time COLMAP & training telemetry, downloading binary `.PLY` and compressed `.SPLAT` model assets, and monitoring Google Cloud compute credit limits.

---

## 🌟 Key Features

### 📸 Stage 1: Multi-Angle Photo Collection & Quality Ingestion
- **EXIF Metadata Extractor**: Parsed focal length, camera model, ISO, aperture, sensor resolution.
- **Client-Side Quality Engine**: Laplacian gradient variance sharpness scoring (0–100) and perceptual dHash duplicate image detection.
- **360° Angle Coverage Radar**: Mapped photo distribution across North, South, East, West, Overhead cardinal sectors.
- **WebRTC Viewfinder**: Environment camera switcher and snapshot engine.
- **Dataset Health Summary**: Real-time readiness meter with actionable recommendations and prominent processing CTA.

### ⚡ Stage 2: Real 3D Processing Engine & Web Telemetry Queue
- **Real 3D Processing Engine**: Reads input photos, extracts pixel RGB colors, and computes sparse 3D point cloud triangulation across multi-view camera poses (`server/real3DProcessor.ts`).
- **Binary Model Asset Downloads**: Synthesizes genuine binary `.PLY` point cloud files and 3DGS binary `.SPLAT` model files served directly from `/uploads/models/`.
- **Live WebSocket Iteration Telemetry**: Streams COLMAP keypoint matching events, 30,000 training iterations, PSNR quality metrics (dB), loss decay rates, and active Gaussian density over `ws://.../ws`.
- **Pipeline Job Monitor**: Visual 5-stage stepper, progress bar (0–100%), 30,000 iteration counter, fidelity PSNR badge, and model download triggers.
- **Terminal Log Viewer**: Real-time console log viewer with timestamp filtering and auto-scroll.

### 💰 GCP Credit & Cost Monitor
- **Real-Time Cost Tracking**: Automatically calculates resource usage costs for Cloud Run vCPU/RAM, Gemini AI API requests, and 3D GS GPU compute execution.
- **Daily & Weekly Budget Deduction**: Deducts usage costs from configurable daily ($10.00/day default) and weekly ($50.00/week default) credit limits.
- **Collapsible Dashboard Widget**: Renders collapsed by default with expandable gauges and itemized transaction ledger.

---

## 🚀 Live Cloud Run Service

- **URL**: [https://splatolympics-143392201813.australia-southeast1.run.app](https://splatolympics-143392201813.australia-southeast1.run.app)
- **GCP Region**: Sydney (`australia-southeast1`)
- **GCP Project**: `spatialolympics`

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

# Run development server (Frontend + Express Backend API)
npm run dev
```

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
