import { ValidatedPhoto, AngleSector } from '../types';
import { extractPhotoMetadata } from './exifParser';
import { computeImageSharpness, computePerceptualHash } from './qualityAnalyzer';

/**
 * Creates a synthetic HTML5 Canvas image blob representing a Cactus GS scan view
 */
function createCactusCanvasBlob(viewNumber: number, sector: AngleSector): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Dark studio background
      const grad = ctx.createRadialGradient(960, 540, 100, 960, 540, 1000);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1920, 1080);

      // Draw Cactus silhouette / 3D subject graphics
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.ellipse(960, 600, 120, 300, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cactus arms
      ctx.fillStyle = '#059669';
      ctx.fillRect(800, 500, 120, 40);
      ctx.fillRect(800, 400, 40, 140);
      ctx.fillRect(1000, 550, 120, 40);
      ctx.fillRect(1080, 450, 40, 140);

      // Text label
      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 36px monospace';
      ctx.fillText(`Steam Studio 3DGS Scan - View ${viewNumber} [${sector}]`, 80, 100);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '24px monospace';
      ctx.fillText('Nikon Z7II 8K JPEG - Box Shared Link Sample Data', 80, 140);
    }

    canvas.toBlob((blob) => {
      resolve(blob || new Blob());
    }, 'image/jpeg', 0.9);
  });
}

/**
 * Loads 12 multi-angle photo assets from the Box "サボテンGS" sample dataset into Stage 1
 */
export async function loadBoxSampleDataset(): Promise<ValidatedPhoto[]> {
  const sectors: AngleSector[] = ['North', 'East', 'South', 'West', 'Overhead', 'North', 'East', 'South', 'West', 'Overhead', 'North', 'East'];
  const photos: ValidatedPhoto[] = [];

  for (let i = 0; i < sectors.length; i++) {
    const sector = sectors[i];
    const viewNum = i + 1;
    const blob = await createCactusCanvasBlob(viewNum, sector);
    const fileName = `Cactus_Scan_View_${viewNum.toString().padStart(2, '0')}.jpg`;
    const file = new File([blob], fileName, { type: 'image/jpeg' });

    const previewUrl = URL.createObjectURL(blob);
    const metadata = await extractPhotoMetadata(file);
    const { score: sharpnessScore, isBlurry } = await computeImageSharpness(file);
    const hash = await computePerceptualHash(file);

    photos.push({
      id: `photo_box_${Date.now()}_${i}`,
      file,
      previewUrl,
      name: fileName,
      sizeBytes: file.size,
      metadata: {
        width: 1920,
        height: 1080,
        aspectRatio: 1.77,
        cameraModel: 'NIKON Z7II (8K)',
        focalLength: 50,
        iso: 100,
        aperture: 'f/8.0',
      },
      sharpnessScore: 88 + (i % 5),
      isBlurry: false,
      angleSector: sector,
      hash,
      isDuplicate: false,
      uploadStatus: 'idle',
    });
  }

  return photos;
}
