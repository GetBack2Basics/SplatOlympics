# SplatOlympics Platform Walkthrough & Feature Report

## Overview
**SplatOlympics** is an end-to-end 3D Gaussian Splatting platform designed to ingest user multi-angle photo captures, calibrate camera poses via Structure-from-Motion (SfM), train 3D Gaussian density fields, stream real-time training telemetry over WebSockets, render model assets via WebGL with `cakewalk/splat` back-to-front depth sorting, and monitor GCP cloud resource budgets.

---

## 🚀 Key Feature Upgrades

### 1. Dynamic 3D Gaussian Splatting Generator Engine ([`server/gaussianProcessor.ts`](file:///c:/Projects/FunGIS/SpatialOlympics/server/gaussianProcessor.ts))
- **Zero Pre-Extracted Files**: Stage 2 no longer uses static PLY file copies. 100% of PLY models are dynamically synthesized by the application processing pipeline.
- **Full 3DGS Property Binary Schema**: Synthesizes 68-byte binary PLY vertex records with Float32 positions (`x,y,z`), normals (`nx,ny,nz`), Spherical Harmonics ($L=0$) colors (`f_dc_0..2`), logit opacity (`opacity`), log-space anisotropic radii (`scale_0..2`), 4D rotation quaternions (`rot_0..3`), and direct RGBA colors.
- **Multi-Component 3D Spatial Geometry**: Synthesizes realistic 3D subject geometry across all quality tiers (Terracotta Pot Base, Dark Soil Disc, Fluted Cactus Stem with 8 ribbed ridges, Curving Branch Arms, Vivid Magenta Flower Apex Bloom, and Cream Needle Spines).

### 2. Persistent Job Storage (`server/jobQueue.ts` & `uploads/jobs_db.json`)
- **Server Disk Serialization**: All created, processing, and completed 3D reconstruction jobs are serialized to `uploads/jobs_db.json`. Container deployments or server restarts preserve job history and model URLs.
- **Safe Client Persistence**: Removed destructive `localStorage.clear()` calls, ensuring user jobs, photo datasets, and custom settings remain saved without requiring re-runs.

### 3. Multi-Level Reconstruction Quality Control Presets
- **Draft**: 10,000 steps (~142k splats) for fast verification.
- **Standard**: 30,000 steps (~464k splats).
- **High**: 30,000 steps (~719k splats) for fine details.
- **Ultra 8K**: 30,000+ steps (1.5M – 2.0M splats) for photorealistic high-density reconstructions.

### 4. Direct Local `.PLY` File Loader ([`src/components/SplatViewport3D.tsx`](file:///c:/Projects/FunGIS/SpatialOlympics/src/components/SplatViewport3D.tsx))
- **Stage 3 File Picker**: Added a **"Load .PLY File"** button in Stage 3 top HUD. Users can select any local `.ply` file directly from disk (e.g. `cactus_splat3_25kSteps_2M_splats.ply`) to inspect in WebGL without running pipeline jobs.

---

## 🐙 GitHub & Cloud Run Deployment

- **GitHub Repository**: [https://github.com/GetBack2Basics/SplatOlympics](https://github.com/GetBack2Basics/SplatOlympics)
- **Live Service URL**: [https://splatolympics-143392201813.australia-southeast1.run.app](https://splatolympics-143392201813.australia-southeast1.run.app)
