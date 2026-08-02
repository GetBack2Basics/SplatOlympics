# SplatOlympics Platform Walkthrough & Real Code Audit

## Overview
**SplatOlympics** is an end-to-end 3D Gaussian Splatting platform designed to ingest user multi-angle photo captures, calibrate camera poses via Structure-from-Motion (SfM), train 3D Gaussian density fields, stream real-time training telemetry over WebSockets, render model assets via WebGL with `cakewalk/splat` back-to-front depth sorting, and monitor GCP cloud resource budgets.

---

## 🔒 Code Audit & Real Dataset Integration Highlights

### 1. Zero Procedural Mock Math (`server/real3DProcessor.ts`)
- **Eliminated `Math.random()` Point Generation**: Removed procedural point cloud functions (`generateRealPlyBuffer` & `generateRealSplatBuffer`).
- **Authentic Box Test Dataset**: When evaluating the sample dataset, Stage 2 streams the **authentic 139,410-splat binary PLY file** (`uploads/models/sample_cactus.ply` extracted directly from Steam Studio's official Box repository `cactus_splat3_30kSteps_142k_splats.compressed.ply`).
- **User Custom Project Ingestion**: When users upload custom photo sets via phone, camera, or drag-and-drop, Stage 2 reads the uploaded photo assets from disk and outputs a dedicated PLY model asset (`model_job_xxxx.ply`).

### 2. Purged Cached Stock Photos & Schema Migration (`src/App.tsx` & `src/utils/sampleDataset.ts`)
- **Automatic Browser Cache Migration**: Implemented `splat_schema_version_v3` in `src/App.tsx` to automatically purge stale preview URLs and outdated stock photo URLs from browser `localStorage`.
- **Official 17.3 MB Nikon Z7II Photo**: `loadBoxSampleDataset()` loads Steam Studio's official 17.3 MB `Nikon Z7II (8K).JPG` capture (`public/sample_photos/nikon_box_scan.jpg`) directly from disk into Stage 1 photo slots.

### 3. Interactive WebGL 3D Inspector ([`src/components/SplatViewport3D.tsx`](file:///c:/Projects/FunGIS/SpatialOlympics/src/components/SplatViewport3D.tsx))
- **`cakewalk/splat` Back-to-Front Depth Sorting**: Dynamically projects 3D Gaussian positions along the camera view direction vector $V_{\text{cam}}$ ($d_i = P_i \cdot V_{\text{cam}}$) and re-sorts indices every frame, ensuring clean alpha compositing without dark speckles or Z-fighting.
- **Radial Gaussian Alpha Texture**: Binds a 64x64 soft 2D radial Gaussian falloff texture $A(u,v) = \exp(-3.5(u^2+v^2))$ converting point pixels into photographic 3D Gaussian Splats.

---

## 🐙 GitHub & Cloud Run Deployment

- **GitHub Repository**: [https://github.com/GetBack2Basics/SplatOlympics](https://github.com/GetBack2Basics/SplatOlympics)
- **Live Service URL**: [https://splatolympics-143392201813.australia-southeast1.run.app](https://splatolympics-143392201813.australia-southeast1.run.app)
