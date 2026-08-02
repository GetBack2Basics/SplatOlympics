import ExifReader from 'exifreader';
import { PhotoMetadata } from '../types';

/**
 * Extract EXIF metadata from uploaded image files for 3D COLMAP/Gaussian Splatting camera calibration
 */
export async function extractPhotoMetadata(file: File): Promise<PhotoMetadata> {
  let focalLength: number | undefined;
  let cameraModel: string | undefined;
  let iso: number | undefined;
  let aperture: string | undefined;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const tags = ExifReader.load(arrayBuffer);

    if (tags.FocalLength && tags.FocalLength.description) {
      const parsed = parseFloat(tags.FocalLength.description);
      if (!isNaN(parsed)) focalLength = Math.round(parsed);
    }

    if (tags.Model && tags.Model.description) {
      cameraModel = tags.Model.description.trim();
    } else if (tags.Make && tags.Make.description) {
      cameraModel = tags.Make.description.trim();
    }

    if (tags.ISOSpeedRatings && tags.ISOSpeedRatings.description) {
      const parsedIso = parseInt(tags.ISOSpeedRatings.description, 10);
      if (!isNaN(parsedIso)) iso = parsedIso;
    }

    if (tags.FNumber && tags.FNumber.description) {
      aperture = tags.FNumber.description;
    }
  } catch (err) {
    // EXIF tags absent or stripped; continue gracefully
  }

  // Load image object to get actual pixel resolution
  const { width, height } = await getImageDimensions(file);
  const aspectRatio = parseFloat((width / Math.max(1, height)).toFixed(2));

  return {
    focalLength: focalLength || 26, // Default ~26mm wide angle mobile camera
    cameraModel: cameraModel || 'Generic Camera',
    iso: iso || 100,
    aperture: aperture || 'f/1.8',
    width,
    height,
    aspectRatio,
  };
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth || 1920, height: img.naturalHeight || 1080 });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 1920, height: 1080 });
    };
    img.src = url;
  });
}
