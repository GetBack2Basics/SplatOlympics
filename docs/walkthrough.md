# SplatOlympics Platform Walkthrough & Feature Report

## Overview
**SplatOlympics** is an end-to-end 3D Gaussian Splatting platform designed to ingest user multi-angle photo captures, calibrate camera poses via Structure-from-Motion (SfM), train 3D Gaussian density fields, stream real-time training telemetry over WebSockets, render model assets via WebGL with `cakewalk/splat` back-to-front depth sorting, and monitor GCP cloud resource budgets.

---

## 🚀 Key Feature Upgrades

### 1. Persistent Job Storage (`server/jobQueue.ts` & `uploads/jobs_db.json`)
- **Server Disk Serialization**: All created, processing, and completed 3D reconstruction jobs are serialized to `uploads/jobs_db.json`. Container deployments or server restarts preserve job history and model URLs.
- **Safe Client Persistence**: Removed destructive `localStorage.clear()` calls, ensuring user jobs, photo datasets, and custom settings remain saved without requiring re-runs.

### 2. Multi-Level Reconstruction Quality Control Presets
- **Draft**: 10,000 steps (~142k splats) for fast verification.
- **Standard**: 30,000 steps (~464k splats).
- **High**: 30,000 steps (~719k splats) for fine details.
- **Ultra 8K**: 30,000+ steps (1.5M – 2.0M splats) for photorealistic high-density reconstructions matching 445 MB Box scans.

### 3. Direct Local `.PLY` File Loader ([`src/components/SplatViewport3D.tsx`](file:///c:/Projects/FunGIS/SpatialOlympics/src/components/SplatViewport3D.tsx))
- **Stage 3 File Picker**: Added a **"Load .PLY File"** button in Stage 3 top HUD. Users can select any local `.ply` file directly from disk (e.g. `cactus_splat3_25kSteps_2M_splats.ply`) to inspect in WebGL without running pipeline jobs.

### 4. Interactive WebGL 3D Inspector Modes
- **`Splats` View**: Soft 3D Gaussian radial falloff textures with additive glowing particles.
- **`Points` View**: Crisp 3D SfM point cloud dots without radial falloff textures.
- **`Hybrid` View**: Combined 3D Gaussian Splats + camera frustum wireframes (North, East, South, West, Overhead).

---

## 🐙 GitHub & Cloud Run Deployment

- **GitHub Repository**: [https://github.com/GetBack2Basics/SplatOlympics](https://github.com/GetBack2Basics/SplatOlympics)
- **Live Service URL**: [https://splatolympics-143392201813.australia-southeast1.run.app](https://splatolympics-143392201813.australia-southeast1.run.app)
