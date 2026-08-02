# SplatOlympics Master Implementation Plan

## Executive Architecture
SplatOlympics is built as a single-repository full-stack web application combining a Vite + React + TailwindCSS frontend with an Express + WebSocket + Node.js backend deployed to Google Cloud Run.

---

## 🏗️ System Components

1. **Frontend (`src/`)**:
   - `src/App.tsx`: Main tab navigation, global state, and stage routing.
   - `src/components/DropzoneUpload.tsx`: Multi-angle photo drag-and-drop & Box sample dataset button.
   - `src/components/DatasetHealthSummary.tsx`: Quality summary and submission CTA.
   - `src/components/PipelineJobMonitor.tsx`: Asynchronous job progress stepper & model downloads.
   - `src/components/GcpCostMonitor.tsx`: Collapsible Cloud Run credit usage widget.
   - `src/components/SplatViewport3D.tsx`: Three.js WebGL 3D Gaussian Splatting inspector.
   - `src/utils/plyParser.ts`: High-speed binary PLY buffer parser.

2. **Backend (`server/`)**:
   - `server/index.ts`: Express REST API routes and WebSocket gateway.
   - `server/jobQueue.ts`: Persistent job queue manager with JSON disk database (`uploads/jobs_db.json`).
   - `server/real3DProcessor.ts`: Real 3D Gaussian Splatting & binary PLY/SPLAT model file generator.
   - `server/costMonitor.ts`: Cloud Run & 3D compute credit usage manager.

3. **Cloud Infrastructure**:
   - Google Cloud Run Sydney (`australia-southeast1`) on project `spatialolympics`.
   - Live URL: `https://splatolympics-143392201813.australia-southeast1.run.app`
