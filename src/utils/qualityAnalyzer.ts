import { ValidatedPhoto, DatasetHealthSummary, AngleSector, AngleCoverage } from '../types';

/**
 * Perform client-side image sharpness detection using Canvas Laplacian edge variance analysis
 */
export async function computeImageSharpness(file: File): Promise<{ score: number; isBlurry: boolean }> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          return resolve({ score: 75, isBlurry: false });
        }

        // Downscale for fast pixel processing
        const sampleW = 200;
        const sampleH = Math.round((img.naturalHeight / img.naturalWidth) * sampleW) || 200;
        canvas.width = sampleW;
        canvas.height = sampleH;

        ctx.drawImage(img, 0, 0, sampleW, sampleH);
        const imgData = ctx.getImageData(0, 0, sampleW, sampleH);
        const data = imgData.data;

        // Compute Variance of Laplacian (Edge Intensity)
        let totalGradient = 0;
        let pixelCount = 0;

        for (let y = 1; y < sampleH - 1; y += 2) {
          for (let x = 1; x < sampleW - 1; x += 2) {
            const idx = (y * sampleW + x) * 4;
            // Grayscale luminance: 0.299R + 0.587G + 0.114B
            const centerLum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];

            const leftIdx = (y * sampleW + (x - 1)) * 4;
            const rightIdx = (y * sampleW + (x + 1)) * 4;
            const leftLum = 0.299 * data[leftIdx] + 0.587 * data[leftIdx + 1] + 0.114 * data[leftIdx + 2];
            const rightLum = 0.299 * data[rightIdx] + 0.587 * data[rightIdx + 1] + 0.114 * data[rightIdx + 2];

            const diff = Math.abs(2 * centerLum - leftLum - rightLum);
            totalGradient += diff;
            pixelCount++;
          }
        }

        const avgGradient = pixelCount > 0 ? totalGradient / pixelCount : 15;
        // Normalize sharpness to 0-100 scale
        const score = Math.min(100, Math.max(10, Math.round((avgGradient / 18) * 100)));
        const isBlurry = score < 38;

        resolve({ score, isBlurry });
      } catch (_) {
        resolve({ score: 75, isBlurry: false });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ score: 75, isBlurry: false });
    };

    img.src = url;
  });
}

/**
 * Generate perceptual image hash (dHash) for duplicate detection
 */
export async function computePerceptualHash(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(`${file.size}_${file.name}`);

        canvas.width = 9;
        canvas.height = 8;
        ctx.drawImage(img, 0, 0, 9, 8);

        const imgData = ctx.getImageData(0, 0, 9, 8).data;
        let hash = '';

        for (let y = 0; y < 8; y++) {
          for (let x = 0; x < 8; x++) {
            const leftIdx = (y * 9 + x) * 4;
            const rightIdx = (y * 9 + (x + 1)) * 4;

            const leftGray = imgData[leftIdx] * 0.3 + imgData[leftIdx + 1] * 0.59 + imgData[leftIdx + 2] * 0.11;
            const rightGray = imgData[rightIdx] * 0.3 + imgData[rightIdx + 1] * 0.59 + imgData[rightIdx + 2] * 0.11;

            hash += leftGray > rightGray ? '1' : '0';
          }
        }
        resolve(hash);
      } catch (_) {
        resolve(`${file.size}_${file.name}`);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(`${file.size}_${file.name}`);
    };

    img.src = url;
  });
}

/**
 * Estimate angle sector based on file index & name heuristics
 */
export function estimateAngleSector(index: number, fileName: string): AngleSector {
  const lowerName = fileName.toLowerCase();
  if (lowerName.includes('top') || lowerName.includes('overhead') || lowerName.includes('above')) {
    return 'Overhead';
  }
  if (lowerName.includes('north') || lowerName.includes('front')) return 'North';
  if (lowerName.includes('east') || lowerName.includes('right')) return 'East';
  if (lowerName.includes('south') || lowerName.includes('back')) return 'South';
  if (lowerName.includes('west') || lowerName.includes('left')) return 'West';

  const sectors: AngleSector[] = ['North', 'East', 'South', 'West', 'Overhead'];
  return sectors[index % sectors.length];
}

/**
 * Compute overall dataset health summary and 3D Gaussian Splatting readiness score
 */
export function calculateDatasetHealth(photos: ValidatedPhoto[]): DatasetHealthSummary {
  if (photos.length === 0) {
    return {
      totalPhotos: 0,
      healthScore: 0,
      isReadyForSplatting: false,
      blurryCount: 0,
      duplicateCount: 0,
      angleCoverage: { North: 0, South: 0, East: 0, West: 0, Overhead: 0 },
      recommendations: ['Upload at least 12 multi-angle photos of your target 3D subject.'],
    };
  }

  const angleCoverage: AngleCoverage = { North: 0, South: 0, East: 0, West: 0, Overhead: 0 };
  let blurryCount = 0;
  let duplicateCount = 0;
  let totalSharpness = 0;

  const seenHashes = new Set<string>();

  photos.forEach((p) => {
    if (angleCoverage[p.angleSector] !== undefined) {
      angleCoverage[p.angleSector]++;
    } else {
      angleCoverage.North++;
    }

    if (p.isBlurry) blurryCount++;
    totalSharpness += p.sharpnessScore;

    if (seenHashes.has(p.hash)) {
      duplicateCount++;
      p.isDuplicate = true;
    } else {
      seenHashes.add(p.hash);
      p.isDuplicate = false;
    }
  });

  // Calculate score breakdown
  const photoQuantityScore = Math.min(35, (photos.length / 24) * 35);
  const coveredSectors = Object.values(angleCoverage).filter((c) => c > 0).length;
  const coverageScore = (coveredSectors / 5) * 40;

  const avgSharpness = photos.length > 0 ? totalSharpness / photos.length : 0;
  const sharpnessScore = Math.min(25, (avgSharpness / 100) * 25);

  const blurPenalty = (blurryCount / photos.length) * 15;
  const duplicatePenalty = (duplicateCount / photos.length) * 10;

  const healthScore = Math.max(0, Math.min(100, Math.round(photoQuantityScore + coverageScore + sharpnessScore - blurPenalty - duplicatePenalty)));

  const recommendations: string[] = [];
  if (photos.length < 16) {
    recommendations.push(`Add ${16 - photos.length} more photos around the subject for dense point cloud reconstruction.`);
  }

  Object.entries(angleCoverage).forEach(([sector, count]) => {
    if (count === 0) {
      recommendations.push(`Missing ${sector} viewpoint. Capture 2-3 photos from the ${sector} angle.`);
    }
  });

  if (blurryCount > 0) {
    recommendations.push(`Remove or re-take ${blurryCount} blurry photo(s) to prevent floaters in 3D splats.`);
  }

  if (duplicateCount > 0) {
    recommendations.push(`Found ${duplicateCount} duplicate or near-identical image(s). Remove duplicates to speed up COLMAP.`);
  }

  return {
    totalPhotos: photos.length,
    healthScore,
    isReadyForSplatting: healthScore >= 75 && photos.length >= 12,
    blurryCount,
    duplicateCount,
    angleCoverage,
    recommendations,
  };
}
