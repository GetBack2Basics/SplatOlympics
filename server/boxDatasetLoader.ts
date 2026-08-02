import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';

export interface SampleImageData {
  id: string;
  name: string;
  url: string;
  angleSector: 'North' | 'South' | 'East' | 'West' | 'Overhead';
  sizeBytes: number;
}

export class BoxDatasetLoader {
  private cacheDir: string;

  constructor() {
    this.cacheDir = path.join(process.cwd(), 'uploads', 'sample_dataset');
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Returns a list of sample images representing the "サボテンGS" cactus multi-angle photo capture set
   */
  public getSampleImageSet(): SampleImageData[] {
    const sectors: ('North' | 'South' | 'East' | 'West' | 'Overhead')[] = [
      'North', 'North', 'East', 'East', 'South', 'South', 'West', 'West', 'Overhead', 'Overhead',
      'North', 'East', 'South', 'West', 'Overhead'
    ];

    return Array.from({ length: 15 }).map((_, i) => ({
      id: `cactus_img_${i + 1}`,
      name: `Cactus_Scan_View_${(i + 1).toString().padStart(2, '0')}.jpg`,
      url: `/uploads/sample_dataset/cactus_${i + 1}.jpg`,
      angleSector: sectors[i % sectors.length],
      sizeBytes: 3450000 + (i * 125000),
    }));
  }
}
