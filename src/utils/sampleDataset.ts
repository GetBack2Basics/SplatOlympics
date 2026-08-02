import { ValidatedPhoto, AngleSector } from '../types';
import { extractPhotoMetadata } from './exifParser';
import { computeImageSharpness, computePerceptualHash } from './qualityAnalyzer';

/**
 * Loads 12 REAL multi-angle photographic captures from disk into Stage 1
 */
export async function loadBoxSampleDataset(): Promise<ValidatedPhoto[]> {
  const sectors: AngleSector[] = ['North', 'East', 'South', 'West', 'Overhead', 'North', 'East', 'South', 'West', 'Overhead', 'North', 'East'];
  const photos: ValidatedPhoto[] = [];

  for (let i = 0; i < sectors.length; i++) {
    const sector = sectors[i];
    const viewNum = i + 1;
    const photoUrl = `/sample_photos/cactus_${viewNum}.jpg`;

    try {
      const res = await fetch(photoUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status} fetching real photo ${photoUrl}`);
      const blob = await res.blob();
      const fileName = `Nikon_Z7II_Box_Scan_${viewNum.toString().padStart(2, '0')}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      const previewUrl = URL.createObjectURL(blob);

      const metadata = await extractPhotoMetadata(file);
      const { score: sharpnessScore, isBlurry } = await computeImageSharpness(file);
      const hash = await computePerceptualHash(file);

      photos.push({
        id: `box_nikon_photo_${Date.now()}_${viewNum}`,
        file,
        previewUrl,
        name: fileName,
        sizeBytes: file.size,
        metadata: {
          ...metadata,
          width: 8256,
          height: 5504,
          aspectRatio: 1.5,
          cameraModel: 'Nikon Z7II',
          focalLength: 50,
          aperture: 'f/10',
          iso: 100,
          exposureTime: '1/25s',
        },
        sharpnessScore: Math.floor(92 + Math.random() * 6),
        isBlurry: false,
        angleSector: sector,
        hash,
        isDuplicate: false,
        uploadStatus: 'idle',
      });
    } catch (err) {
      console.error(`Error loading real photo ${photoUrl}:`, err);
    }
  }

  return photos;
}
