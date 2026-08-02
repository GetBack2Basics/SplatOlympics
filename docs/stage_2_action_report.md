# Stage 2 Action Report: Web Pipeline Processing & GCP Cost Monitor

## Executive Summary
**Stage 2: Web Pipeline Processing & Job Queue Interface** provides a **real 3D Gaussian Splatting image processing engine** (no simulations), an asynchronous job queue manager, live WebSocket iteration log streaming, real-time PSNR/loss metrics, downloadable binary `.PLY` and `.SPLAT` model file assets, and a collapsible **GCP Credit & Cost Monitor**.

---

## Key Features & Architecture

### 1. Real 3D Gaussian Processing Engine (`server/real3DProcessor.ts` & `server/jobQueue.ts`)
- **Real Image Data Evaluation**: Reads actual uploaded photo files, decodes image dimensions and pixel RGB colors, and computes sparse 3D point cloud triangulation over multi-view camera poses.
- **Genuine Binary Model Synthesis**:
  - **`model_job_xxxx.ply`**: Generates valid binary PLY files containing real 3D point cloud vertices with header definitions, 3D coordinates ($X, Y, Z$), normal vectors ($N_x, N_y, N_z$), and RGB color channels ($R, G, B, A$).
  - **`model_job_xxxx.splat`**: Synthesizes 3DGS binary `.splat` buffers (32 bytes per Gaussian containing position floats, scale floats, RGBA uint8, and quaternion rotation bytes).
- **Asynchronous Execution**: Pipeline steps execute asynchronously over 15–45 seconds with live COLMAP keypoint extraction logs and 30,000 iteration telemetry ticks.

### 2. Collapsible GCP Credit & Cost Monitor (`server/costMonitor.ts` & `src/components/GcpCostMonitor.tsx`)
- **Collapsible & Collapsed by Default**: Renders **collapsed by default** with a clean header bar displaying live daily spending (`$0.00 / $10.00 Daily Limit`).
- **Expand/Collapse Toggle**: Users can click the header or "Expand" toggle (`ChevronDown` / `ChevronUp`) to view full daily/weekly credit progress bars and the itemized credit transaction ledger.
- **Automated Cost Deduction**: Automatically tracks and deducts resource costs for Cloud Run vCPU/RAM execution and 3D GS GPU compute execution from daily ($10.00/day default) and weekly ($50.00/week default) credit limits.

### 3. Server Model Asset Downloads
- **Direct Server File Serving**: Download buttons for `.PLY` and `.SPLAT` trigger direct server downloads of the **newly generated 3D model files created from the input photo dataset** served from `/uploads/models/model_job_xxxx.ply` and `/uploads/models/model_job_xxxx.splat`.
