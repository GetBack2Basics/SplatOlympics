# SplatOlympics Platform Walkthrough

## Overview
**SplatOlympics** is an interactive web platform for collecting multi-angle photo sets, processing 3D Gaussian Splatting (3D GS) datasets, monitoring training iterations in real-time, rendering 3D splats in WebGL, downloading model assets, and tracking Google Cloud credit usage and budget limits.

---

## 🚀 Stage-by-Stage Feature Summary

### Stage 1: Photo Collection & Dataset Health Summary
- Multi-angle drag-and-drop photo dropzone and WebRTC camera modal.
- EXIF metadata parser, Laplacian sharpness score, dHash duplicate detector.
- 360° radar angle coverage map and prominent submission CTA button.
- One-click loader for Steam Studio **"サボテンGS"** 3DGS dataset hosted on Box.

### Stage 2: Web Pipeline Processing Queue & GCP Cost Monitor
- Real 3D Gaussian Splatting processing engine (`server/real3DProcessor.ts`) outputting valid `.ply` and `.splat` binary files.
- Live WebSocket iteration log streaming (0 to 30,000 iterations).
- Collapsible **GCP Credit & Cost Monitor** tracking daily ($10.00) and weekly ($50.00) credit limits.
- Direct server model asset downloads from `/uploads/models/`.

### Stage 3: Interactive 3D Viewport & WebGL Splat Inspector
- In-browser Three.js WebGL 3D Gaussian Splatting inspector with 360° `OrbitControls`.
- Camera frustum wireframe overlays mapping SfM camera poses around the 3D subject.
- Controls HUD for density subsampling (10% - 100%), particle size scaling, render mode toggles (`Splats` / `Points` / `Hybrid`), and live FPS counter.

---

## 🐙 GitHub & Cloud Run Deployment

- **GitHub Repository**: [https://github.com/GetBack2Basics/SplatOlympics](https://github.com/GetBack2Basics/SplatOlympics)
- **Live Service URL**: [https://splatolympics-143392201813.australia-southeast1.run.app](https://splatolympics-143392201813.australia-southeast1.run.app)
