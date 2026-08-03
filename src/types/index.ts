/**
 * Core Data Models & Types for Gaussian Splatting Dataset Ingestion Pipeline
 */

export type AngleSector = 'North' | 'South' | 'East' | 'West' | 'Overhead';

export interface PhotoMetadata {
  focalLength?: number;
  cameraModel?: string;
  iso?: number;
  aperture?: string;
  exposureTime?: string;
  width: number;
  height: number;
  aspectRatio: number;
  orientation?: number;
}

export interface ValidatedPhoto {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  sizeBytes: number;
  metadata: PhotoMetadata;
  sharpnessScore: number; // 0 - 100
  isBlurry: boolean;
  angleSector: AngleSector;
  hash: string;
  isDuplicate?: boolean;
  uploadStatus: 'idle' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

export interface AngleCoverage {
  North: number;
  South: number;
  East: number;
  West: number;
  Overhead: number;
}

export interface DatasetHealthSummary {
  totalPhotos: number;
  healthScore: number; // 0 - 100
  isReadyForSplatting: boolean;
  blurryCount: number;
  duplicateCount: number;
  angleCoverage: AngleCoverage;
  recommendations: string[];
}

export type JobStage = 'QUEUED' | 'COLMAP_MATCHING' | 'POINT_CLOUD_INIT' | 'SPLAT_TRAINING' | 'COMPLETE' | 'FAILED';

export interface IterationTelemetry {
  iteration: number;
  totalIterations: number;
  psnr: number;
  loss: number;
  activeGaussians: number;
  learningRate: number;
  timeRemainingSeconds: number;
}

export interface LogMessage {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  stage: JobStage;
  message: string;
}

export type QualityPreset = 'draft' | 'standard' | 'high' | 'ultra';

export interface QualityPresetOption {
  id: QualityPreset;
  label: string;
  splatCountText: string;
  iterations: number;
  description: string;
  estimatedTimeSec: number;
}

export interface PipelineJob {
  id: string;
  datasetId: string;
  datasetName: string;
  photoCount: number;
  qualityPreset?: QualityPreset;
  status: 'queued' | 'processing' | 'paused' | 'completed' | 'failed';
  currentStage: JobStage;
  progressPercent: number;
  telemetry: IterationTelemetry;
  logs: LogMessage[];
  plyFileUrl?: string;
  splatFileUrl?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}
