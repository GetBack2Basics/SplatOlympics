# Integration & Code Usage Report: External 3DGS Projects

This report details how backend data structures, binary parsing engines, camera pose estimators, and WebGL rendering shaders in **SplatOlympics** leverage standards, algorithms, and specifications established by primary 3D Gaussian Splatting repositories:

1. **[graphdeco-inria/gaussian-splatting](https://github.com/graphdeco-inria/gaussian-splatting)** (Official INRIA C++/CUDA & PyTorch 3DGS implementation by Kerbl et al.)
2. **[MrNeRF/awesome-3D-gaussian-splatting](https://github.com/MrNeRF/awesome-3D-gaussian-splatting)** (Curated directory of 3DGS viewers, binary PLY/SPLAT converters, and WebGL rasterizers)

---

## 📐 Map of External Code & Specifications Used

| Component in SplatOlympics | Source Project / Standard | Purpose & Implementation Details |
| :--- | :--- | :--- |
| **Binary PLY Format Parser** (`src/utils/plyParser.ts`) | `graphdeco-inria/gaussian-splatting` (`scene/dataset_readers.py`) | Parses 3D Gaussian vertex headers (`element vertex N`), Float32 coordinates ($x, y, z$), surface normal vectors ($n_x, n_y, n_z$), and RGB color channels (`red, green, blue, alpha`). |
| **Compressed `.SPLAT` Binary Buffer** (`server/real3DProcessor.ts`) | `antimatter15/splat` & `awesome-3D-gaussian-splatting` | Implements 32-bytes-per-Gaussian packed binary layout: Float32 position $(x, y, z)$, Float32 scale $(s_x, s_y, s_z)$, Uint8 RGBA colors, and unit quaternion rotation $(q_r, q_i, q_j, q_k)$. |
| **COLMAP Camera Pose & SfM Estimator** (`server/real3DProcessor.ts`) | `graphdeco-inria/gaussian-splatting` (`convert.py`) | Simulates SIFT feature extraction, pinhole camera intrinsics matrix $K = \begin{bmatrix} f_x & 0 & c_x \\ 0 & f_y & c_y \\ 0 & 0 & 1 \end{bmatrix}$, and extrinsic camera poses $[R \mid T]$. |
| **Spherical Harmonics (L=3)** (`server/jobQueue.ts` & `SplatViewport3D.tsx`) | `graphdeco-inria/gaussian-splatting` (`utils/sh_utils.py`) | Implements direction-dependent view color variations up to degree $L=3$ (16 coefficients per color channel). |
| **Back-to-Front View-Space Depth Sorting** (`src/components/SplatViewport3D.tsx`) | `cakewalk/splat` (`huggingface.co/spaces/cakewalk/splat` & `antimatter15/splat`) | Sorts 3D Gaussian indices along camera view vector $V_{\text{cam}}$ on every camera rotation so semi-transparent alpha splats composite in correct back-to-front order without opacity artifacts. |
| **Radial Gaussian Alpha Texture Shader** (`src/components/SplatViewport3D.tsx`) | `cakewalk/splat` | Generates 64x64 soft 2D radial Gaussian alpha map $A(u,v) = \exp(-3.5(u^2+v^2))$ converting point pixels into photographic 3D Gaussian Splats. |
| **Camera Frustum Wireframes** (`src/components/SplatViewport3D.tsx`) | `graphdeco-inria/gaussian-splatting` (Visualizer UI) | Calculates pyramid frustum wireframes matching COLMAP camera viewpoints around the subject (North, East, South, West, Overhead). |

---

## 💾 Project State & Model Asset Persistence Architecture

To prevent re-running 3D reconstruction jobs on code rebuilds or server restarts:

1. **Backend Disk Database (`uploads/jobs_db.json`)**:
   - Automatically serializes all job states, COLMAP telemetry, and `.ply`/`.splat` URLs.
   - Restores existing completed models upon server boot.

2. **Default Public Project ("Box 3DGS PLY Dataset")**:
   - Seeded with ID `job_box_sample_001` pointing to Steam Studio's **"サボテンGS"** 3DGS scan set.
   - Contains pre-generated `sample_cactus.ply` and `sample_cactus.splat` files ready for instant 3D viewport inspection without re-running the pipeline.

3. **Frontend LocalStorage Cache**:
   - Saves active dataset photos and selected job ID (`splat_active_job_id`) so page refreshes maintain exact viewport state.

4. **Authentication Roadmap**:
   - Formatted interface for upcoming Google Accounts OAuth2 authentication and user-specific GCP API keys.
