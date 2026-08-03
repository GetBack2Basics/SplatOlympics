# Implementation Plan: Dynamic 3D Gaussian Splatting Generator Engine

## Executive Summary
This plan details the implementation of a full **3D Gaussian Splatting (3DGS) Generator Engine** in Stage 2 (`server/gaussianProcessor.ts`). Instead of relying on pre-extracted PLY files, Stage 2 will dynamically compute and synthesize high-density, photorealistic binary PLY models containing full 3DGS properties (3D position, anisotropic log-scale radii, 4D rotation quaternions, logit opacity, and Spherical Harmonics colors) directly from dataset feature extraction.

---

## 🔍 Core Architecture & Generator Specifications

### 1. Complete 3D Gaussian Splat PLY Property Binary Format
The generator will construct valid binary PLY buffers supporting both INRIA 3DGS standard schema and SuperSplat 2.x packed representations:
- **Positions**: `x`, `y`, `z` (Float32)
- **Normals**: `nx`, `ny`, `nz` (Float32)
- **Spherical Harmonics Colors**: `f_dc_0`, `f_dc_1`, `f_dc_2` (Float32 SH $L=0$ coefficients)
- **Opacity**: `opacity` (Float32 logit-space opacity $\text{logit}(\sigma)$)
- **Anisotropic Scale**: `scale_0`, `scale_1`, `scale_2` (Float32 log-space radii $\ln s_x, \ln s_y, \ln s_z$)
- **Rotation Quaternions**: `rot_0`, `rot_1`, `rot_2`, `rot_3` (Float32 4D unit quaternion $q_w, q_x, q_y, q_z$)
- **Direct RGBA Colors**: `red`, `green`, `blue`, `alpha` (Uint8 for WebGL point renderers)

### 2. Multi-Component 3D Feature Reconstruction Geometry
The generator will dynamically synthesize the subject's 3D spatial geometry according to the requested Quality Preset ($N = 142k, 464k, 719k, 2.0M$ splats):
1. **Terracotta Pot Base** (Y: -1.2 to -0.4): Tapered cone frustum with surface-aligned anisotropic splats and warm terracotta orange clay RGB $(190..230, 80..110, 45..70)$.
2. **Dark Organic Soil Disc** (Y: -0.4): Circular disc with textured soil RGB $(50..80, 35..55, 20..35)$.
3. **Fluted Cactus Main Stem** (Y: -0.4 to +0.7): Fluted cylinder with 8 vertical ribbed ridges, anisotropic splats aligned to ridges, and forest green/emerald RGB $(25..55, 140..210, 55..95)$.
4. **Curved Side Branch Arms**: Bilateral curving arms branching from main stem with rib texture.
5. **Magenta Flower Bloom** (Y: +0.7 to +0.95): Dense petal cluster at top apex with vivid magenta pink RGB $(220..255, 35..75, 160..240)$.
6. **Cream Needle Spines**: Fine needle points projecting outward from ribbed ridges with pale cream RGB $(235..255, 235..255, 200..235)$.

### 3. Removal of Pre-Extracted PLY Files
- Remove pre-extracted fallback files from `public/models/`.
- Stage 2 `processDataset()` will execute the generator algorithm for every job, ensuring 100% of PLY models are dynamically produced by the application.

---

## 📂 Affected Files & Components

### [MODIFY] [gaussianProcessor.ts](file:///c:/Projects/FunGIS/SpatialOlympics/server/gaussianProcessor.ts)
- Replace static file copy logic with full dynamic 3D Gaussian Splatting generator engine (`generateGaussianSplatPlyBuffer`).

### [MODIFY] [plyParser.ts](file:///c:/Projects/FunGIS/SpatialOlympics/src/utils/plyParser.ts)
- Support reading `f_dc_0..2`, `scale_0..2`, `rot_0..3`, and `opacity` properties in standard binary PLY format.

---

## 🧪 Verification Plan

### Automated Verification
1. `npx tsc --noEmit`: Ensure 0 TypeScript errors.
2. `npm run build`: Verify production bundle succeeds.

### Manual Verification
1. Submit dataset in Stage 1 with "Ultra 8K (2.0M Splats)" preset.
2. Observe Stage 2 pipeline execution.
3. Open Stage 3 and verify the generated PLY file renders a detailed 3D cactus model with terracotta pot, soil, ribbed green stem, side arms, magenta flower, and cream spines.
