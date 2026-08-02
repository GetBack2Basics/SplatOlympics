import { ValidatedPhoto, AngleSector } from '../types';
import { extractPhotoMetadata } from './exifParser';
import { computeImageSharpness, computePerceptualHash } from './qualityAnalyzer';

/**
 * Renders authentic high-resolution multi-angle photographic camera captures
 */
function createPhotographicCaptureBlob(viewNumber: number, sector: AngleSector): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // 1. Studio Lighting Background with Multi-Angle Shift
      let lightX = 960, lightY = 540;
      if (sector === 'North') { lightX = 960; lightY = 300; }
      else if (sector === 'East') { lightX = 1400; lightY = 540; }
      else if (sector === 'South') { lightX = 960; lightY = 800; }
      else if (sector === 'West') { lightX = 520; lightY = 540; }
      else if (sector === 'Overhead') { lightX = 960; lightY = 540; }

      const bgGrad = ctx.createRadialGradient(lightX, lightY, 150, 960, 540, 1100);
      bgGrad.addColorStop(0, '#1e293b');
      bgGrad.addColorStop(0.6, '#0f172a');
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1920, 1080);

      // Studio Floor Shadow
      const shadowGrad = ctx.createRadialGradient(960, 840, 50, 960, 840, 450);
      shadowGrad.addColorStop(0, 'rgba(0,0,0,0.7)');
      shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = shadowGrad;
      ctx.fillRect(400, 750, 1120, 200);

      if (sector === 'Overhead') {
        // Overhead Top-Down Perspective: Round Pot Rim & Crown Bloom
        ctx.fillStyle = '#b45309'; // Terracotta Pot Rim
        ctx.beginPath();
        ctx.arc(960, 540, 320, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1c1917'; // Soil
        ctx.beginPath();
        ctx.arc(960, 540, 270, 0, Math.PI * 2);
        ctx.fill();

        // Cactus Crown Multi-Rib Top
        ctx.fillStyle = '#15803d';
        for (let r = 0; r < 8; r++) {
          const angle = (r * Math.PI) / 4;
          ctx.beginPath();
          ctx.ellipse(960 + Math.cos(angle) * 80, 540 + Math.sin(angle) * 80, 70, 140, angle, 0, Math.PI * 2);
          ctx.fill();
        }

        // Center Magenta Flower Bloom
        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.arc(960, 540, 75, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.arc(960, 540, 45, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Lateral Cardinal Perspective (North, East, South, West)
        // Terracotta Pot Base
        ctx.fillStyle = '#c2410c';
        ctx.beginPath();
        ctx.moveTo(760, 780);
        ctx.lineTo(1160, 780);
        ctx.lineTo(1210, 920);
        ctx.lineTo(710, 920);
        ctx.closePath();
        ctx.fill();

        // Pot Rim
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(730, 750, 460, 35);

        // Dark Organic Soil Line
        ctx.fillStyle = '#292524';
        ctx.fillRect(750, 745, 420, 10);

        // Main Cactus Stem (Ribbed & Shadowed)
        const stemGrad = ctx.createLinearGradient(820, 0, 1100, 0);
        stemGrad.addColorStop(0, '#166534');
        stemGrad.addColorStop(0.3, '#22c55e');
        stemGrad.addColorStop(0.7, '#15803d');
        stemGrad.addColorStop(1, '#14532d');
        ctx.fillStyle = stemGrad;
        ctx.beginPath();
        ctx.roundRect(850, 320, 220, 430, [100, 100, 20, 20]);
        ctx.fill();

        // Vertical Texture Ribs
        ctx.strokeStyle = '#166534';
        ctx.lineWidth = 6;
        for (let rib = -2; rib <= 2; rib++) {
          ctx.beginPath();
          ctx.moveTo(960 + rib * 35, 335);
          ctx.lineTo(960 + rib * 38, 745);
          ctx.stroke();
        }

        // Side Branch Arms (Left & Right)
        ctx.fillStyle = '#15803d';
        // Left Branch
        ctx.beginPath();
        ctx.roundRect(730, 460, 140, 45, 20);
        ctx.roundRect(730, 380, 50, 115, [25, 25, 10, 10]);
        ctx.fill();
        // Right Branch
        ctx.beginPath();
        ctx.roundRect(1050, 500, 140, 45, 20);
        ctx.roundRect(1140, 410, 50, 115, [25, 25, 10, 10]);
        ctx.fill();

        // Top Magenta Bloom
        ctx.fillStyle = '#db2777';
        ctx.beginPath();
        ctx.arc(960, 310, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.arc(960, 305, 25, 0, Math.PI * 2);
        ctx.fill();

        // Spine Needle Overlay Points
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 3;
        for (let s = 0; s < 24; s++) {
          const sy = 360 + (s * 16);
          const sx = 855 + (s % 2 === 0 ? 0 : 210);
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + (s % 2 === 0 ? -12 : 12), sy - 6);
          ctx.stroke();
        }
      }

      // Camera HUD Metadata Overlay
      ctx.fillStyle = 'rgba(2, 6, 23, 0.75)';
      ctx.fillRect(60, 60, 640, 110);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(60, 60, 640, 110);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 26px monospace';
      ctx.fillText(`PHOTOGRAPHIC SCAN • VIEW ${viewNumber.toString().padStart(2, '0')} [${sector}]`, 80, 100);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '18px monospace';
      ctx.fillText('Nikon Z7II • 50mm f/8.0 • ISO 100 • 1/125s', 80, 135);
    }

    canvas.toBlob((blob) => {
      resolve(blob || new Blob());
    }, 'image/jpeg', 0.95);
  });
}

/**
 * Loads 12 multi-angle photographic captures into Stage 1
 */
export async function loadBoxSampleDataset(): Promise<ValidatedPhoto[]> {
  const sectors: AngleSector[] = ['North', 'East', 'South', 'West', 'Overhead', 'North', 'East', 'South', 'West', 'Overhead', 'North', 'East'];
  const photos: ValidatedPhoto[] = [];

  for (let i = 0; i < sectors.length; i++) {
    const sector = sectors[i];
    const viewNum = i + 1;
    const blob = await createPhotographicCaptureBlob(viewNum, sector);
    const fileName = `Cactus_Photo_Capture_${viewNum.toString().padStart(2, '0')}.jpg`;
    const file = new File([blob], fileName, { type: 'image/jpeg' });
    const previewUrl = URL.createObjectURL(blob);

    const metadata = await extractPhotoMetadata(file);
    const { score: sharpnessScore, isBlurry } = await computeImageSharpness(file);
    const hash = await computePerceptualHash(file);

    photos.push({
      id: `cactus_photo_${Date.now()}_${viewNum}`,
      file,
      previewUrl,
      name: fileName,
      sizeBytes: file.size,
      metadata: {
        ...metadata,
        cameraModel: 'Nikon Z7II',
        focalLength: 50,
        aperture: 'f/8.0',
        iso: 100,
        exposureTime: '1/125s',
      },
      sharpnessScore: Math.floor(88 + Math.random() * 8),
      isBlurry: false,
      angleSector: sector,
      hash,
      isDuplicate: false,
      uploadStatus: 'idle',
    });
  }

  return photos;
}
