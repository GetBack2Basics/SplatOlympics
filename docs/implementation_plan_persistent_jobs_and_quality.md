# Implementation Plan: Persistent Job DB, Quality Control Presets & Direct PLY Loader

## Executive Summary
This plan addresses the persistence of user reconstruction jobs across page reloads/restarts (preventing unnecessary credit burn and re-runs), introduces adjustable reconstruction quality presets (from 142k Draft up to 2.0M Ultra Splats), enables direct loading of local `.ply` files into Stage 3, and removes all occurrences of the word "Real" across the codebase.

---

## 🔍 Required Changes & Architecture

### 1. Persistent Server & Client Job Storage ([`server/jobQueue.ts`](file:///c:/Projects/FunGIS/SpatialOlympics/server/jobQueue.ts) & [`src/App.tsx`](file:///c:/Projects/FunGIS/SpatialOlympics/src/App.tsx))
- **Server Disk Persistence**: Save and restore all processing jobs to `uploads/jobs_db.json`. When the server restarts or deploys, previously completed and running jobs are preserved on disk.
- **Safe Client Schema Migration**: Remove destructive `localStorage.clear()` calls in `src/App.tsx`. Migrate local state while preserving existing jobs, dataset photos, and selected model URLs.

### 2. Multi-Level Quality Presets ([`src/types.ts`](file:///c:/Projects/FunGIS/SpatialOlympics/src/types.ts), [`src/components/DatasetHealthSummary.tsx`](file:///c:/Projects/FunGIS/SpatialOlympics/src/components/DatasetHealthSummary.tsx), [`server/gaussianProcessor.ts`](file:///c:/Projects/FunGIS/SpatialOlympics/server/real3DProcessor.ts))
- **Quality Presets**:
  - **Draft**: 10,000 steps, ~142,000 splats (Fastest verification).
  - **Standard**: 30,000 steps, ~464,000 splats.
  - **High**: 30,000 steps, ~719,000 splats.
  - **Ultra 8K**: 30,000+ steps, 1.5M – 2.0M splats (Maximum photorealistic detail matching 445 MB Box scans).
- **Stage 1 UI Quality Controls**: Add a Quality Selector widget before submitting datasets so users can tune reconstruction density prior to pipeline execution.

### 3. Direct Local PLY File Loader ([`src/components/SplatViewport3D.tsx`](file:///c:/Projects/FunGIS/SpatialOlympics/src/components/SplatViewport3D.tsx))
- Add a **"Load Local .PLY File"** dropzone & file picker button in Stage 3: 3D Inspector.
- Allows users to drag and drop or select any local `.ply` file from disk (e.g. `cactus_splat3_25kSteps_2M_splats.ply`) to inspect directly without needing to re-run pipeline jobs.

### 4. Remove Terminology "Real" Across Codebase
- Rename `server/real3DProcessor.ts` to `server/gaussianProcessor.ts` (`GaussianProcessor` class).
- Replace all occurrences of "Real" in UI labels, notification messages, logs, and progress steps with clear engineering terminology (`3D Reconstruction`, `Gaussian Splatting`, `PLY Model Asset`).

---

## 📂 Affected Files & Components

### [MODIFY] [jobQueue.ts](file:///c:/Projects/FunGIS/SpatialOlympics/server/jobQueue.ts)
- Add disk read/write serialization to `uploads/jobs_db.json`.

### [NEW] [gaussianProcessor.ts](file:///c:/Projects/FunGIS/SpatialOlympics/server/gaussianProcessor.ts) (Renamed from `real3DProcessor.ts`)
- Implement `QualityPreset` handling to scale vertex generation up to 2.0M splats. Remove "Real" references.

### [MODIFY] [App.tsx](file:///c:/Projects/FunGIS/SpatialOlympics/src/App.tsx)
- Remove `localStorage.clear()` calls to preserve job history. Pass quality settings to job creation.

### [MODIFY] [DatasetHealthSummary.tsx](file:///c:/Projects/FunGIS/SpatialOlympics/src/components/DatasetHealthSummary.tsx)
- Add Quality Selector UI (Draft, Standard, High, Ultra 8K).

### [MODIFY] [SplatViewport3D.tsx](file:///c:/Projects/FunGIS/SpatialOlympics/src/components/SplatViewport3D.tsx)
- Add "Load Local PLY File" button and FileReader handler for `.ply` buffers.

---

## 🧪 Verification Plan

### Automated Tests
1. `npx tsc --noEmit`: Ensure 0 TypeScript errors across server and client.
2. `npm run build`: Verify clean production build.

### Manual Verification
1. **Job Persistence**: Create a job, refresh the browser, verify the job remains in Stage 2 with its output PLY file URL intact.
2. **Quality Selector**: Select "Ultra 8K (2.0M Splats)", submit pipeline job, verify total Gaussians count reaches 2.0M.
3. **Local PLY Loader**: Open Stage 3, click "Load Local PLY File", pick a `.ply` file from disk, verify it renders cleanly.
