import fs from 'fs';
import path from 'path';
import { WebSocket } from 'ws';
import { GcpCostMonitorManager } from './costMonitor.js';
import { Real3DProcessor } from './real3DProcessor.js';

export type JobStage = 'QUEUED' | 'COLMAP_MATCHING' | 'POINT_CLOUD_INIT' | 'SPLAT_TRAINING' | 'COMPLETE' | 'FAILED';

export interface IterationTelemetry {
  iteration: number;
  totalIterations: number;
  psnr: number; // dB
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

export interface PipelineJob {
  id: string;
  datasetId: string;
  datasetName: string;
  photoCount: number;
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

export class SplatJobQueueManager {
  private jobs: Map<string, PipelineJob> = new Map();
  private activeTimer: NodeJS.Timeout | null = null;
  private currentProcessingJobId: string | null = null;
  private wsClients: Set<WebSocket> = new Set();
  private costMonitor: GcpCostMonitorManager;
  private storageDir: string;
  private dbFilePath: string;

  constructor() {
    this.costMonitor = new GcpCostMonitorManager();
    this.storageDir = path.join(process.cwd(), 'uploads', 'models');
    this.dbFilePath = path.join(process.cwd(), 'uploads', 'jobs_db.json');
    
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }

    this.loadJobsFromDisk();
  }

  private loadJobsFromDisk() {
    try {
      if (fs.existsSync(this.dbFilePath)) {
        const raw = fs.readFileSync(this.dbFilePath, 'utf-8');
        const list: PipelineJob[] = JSON.parse(raw);
        list.forEach((j) => this.jobs.set(j.id, j));
      }
    } catch (err) {
      console.warn('[SplatJobQueueManager] Could not read jobs_db.json, starting fresh:', err);
    }

    // Seed default public project if no jobs exist
    if (this.jobs.size === 0) {
      const defaultJob: PipelineJob = {
        id: 'job_box_sample_001',
        datasetId: 'ds_box_cactus_001',
        datasetName: 'Box 3DGS PLY Dataset (サボテンGS)',
        photoCount: 12,
        status: 'completed',
        currentStage: 'COMPLETE',
        progressPercent: 100,
        telemetry: {
          iteration: 30000,
          totalIterations: 30000,
          psnr: 34.12,
          loss: 0.0051,
          activeGaussians: 30000,
          learningRate: 0.0001,
          timeRemainingSeconds: 0,
        },
        logs: [
          { id: 'log_01', timestamp: '12:00:00 AM', level: 'info', stage: 'COLMAP_MATCHING', message: 'COLMAP SIFT feature matching completed on Box サボテンGS dataset.' },
          { id: 'log_02', timestamp: '12:00:05 AM', level: 'success', stage: 'COMPLETE', message: '3D Gaussian Splatting optimization completed! Final PSNR: 34.12 dB.' }
        ],
        plyFileUrl: '/uploads/models/sample_cactus.ply',
        splatFileUrl: '/uploads/models/sample_cactus.splat',
        createdAt: Date.now() - 86400000,
        completedAt: Date.now() - 86350000,
      };
      this.jobs.set(defaultJob.id, defaultJob);
      this.saveJobsToDisk();
    }
  }

  private saveJobsToDisk() {
    try {
      const list = Array.from(this.jobs.values());
      fs.writeFileSync(this.dbFilePath, JSON.stringify(list, null, 2));
    } catch (err) {
      console.error('[SplatJobQueueManager] Failed to save jobs_db.json:', err);
    }
  }

  public registerWsClient(ws: WebSocket) {
    this.wsClients.add(ws);
    ws.on('close', () => {
      this.wsClients.delete(ws);
    });
  }

  private broadcast(data: any) {
    const payload = JSON.stringify(data);
    this.wsClients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    });
  }

  public createJob(datasetId: string, datasetName: string, photoCount: number): PipelineJob {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const job: PipelineJob = {
      id: jobId,
      datasetId,
      datasetName: datasetName || '3D Reconstruction Target',
      photoCount: photoCount || 15,
      status: 'queued',
      currentStage: 'QUEUED',
      progressPercent: 0,
      telemetry: {
        iteration: 0,
        totalIterations: 30000,
        psnr: 0,
        loss: 1.0,
        activeGaussians: 0,
        learningRate: 0.001,
        timeRemainingSeconds: 120,
      },
      logs: [],
      createdAt: Date.now(),
    };

    this.addLog(job, 'info', 'QUEUED', `Job queued for dataset "${datasetName}" (${photoCount} photos).`);
    this.jobs.set(jobId, job);
    this.saveJobsToDisk();
    this.broadcast({ type: 'JOB_CREATED', job });

    this.processNextInQueue();
    return job;
  }

  private addLog(job: PipelineJob, level: 'info' | 'warn' | 'error' | 'success', stage: JobStage, message: string) {
    const timeStr = new Date().toLocaleTimeString();
    const log: LogMessage = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: timeStr,
      level,
      stage,
      message,
    };
    job.logs.push(log);
    this.broadcast({ type: 'JOB_LOG', jobId: job.id, log });
  }

  private processNextInQueue() {
    if (this.currentProcessingJobId) return; // Busy

    const nextJob = Array.from(this.jobs.values()).find((j) => j.status === 'queued');
    if (!nextJob) return;

    this.currentProcessingJobId = nextJob.id;
    nextJob.status = 'processing';
    nextJob.startedAt = Date.now();
    this.saveJobsToDisk();
    this.broadcast({ type: 'JOB_STATUS_CHANGE', job: nextJob });

    this.executeRealProcessing(nextJob);
  }

  private async executeRealProcessing(job: PipelineJob) {
    const processor = new Real3DProcessor();
    this.addLog(job, 'info', 'COLMAP_MATCHING', `Starting real 3D Gaussian Splatting processing for "${job.datasetName}" (${job.photoCount} views)...`);

    try {
      const result = await processor.processDataset(
        job.id,
        job.photoCount,
        job.datasetName,
        (stage, progressPercent, message, telemetry) => {
          job.currentStage = stage;
          job.progressPercent = progressPercent;
          this.addLog(job, stage === 'COMPLETE' ? 'success' : 'info', stage, message);

          if (telemetry) {
            job.telemetry = { ...job.telemetry, ...telemetry };
          }
          this.broadcast({ type: 'JOB_PROGRESS', job });
        }
      );

      job.currentStage = 'COMPLETE';
      job.progressPercent = 100;
      job.status = 'completed';
      job.completedAt = Date.now();
      job.plyFileUrl = result.plyUrl;
      job.splatFileUrl = result.splatUrl;

      // Automatically deduct cost & record usage against GCP credit limits
      this.costMonitor.recordJobCost(job.id, job.photoCount, 30000);
      this.addLog(job, 'info', 'COMPLETE', `Recorded GCP credit usage & deducted compute costs for job ${job.id}.`);

      this.currentProcessingJobId = null;
      this.saveJobsToDisk();
      this.broadcast({ type: 'JOB_COMPLETED', job });
      this.processNextInQueue();
    } catch (err: any) {
      job.status = 'failed';
      job.currentStage = 'FAILED';
      this.addLog(job, 'error', 'FAILED', `Processing error: ${err.message}`);
      this.currentProcessingJobId = null;
      this.saveJobsToDisk();
      this.broadcast({ type: 'JOB_STATUS_CHANGE', job });
      this.processNextInQueue();
    }
  }

  public getJob(id: string): PipelineJob | undefined {
    return this.jobs.get(id);
  }

  public getAllJobs(): PipelineJob[] {
    return Array.from(this.jobs.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  public cancelJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;

    if (this.currentProcessingJobId === id && this.activeTimer) {
      clearInterval(this.activeTimer);
      this.activeTimer = null;
      this.currentProcessingJobId = null;
    }

    job.status = 'failed';
    job.currentStage = 'FAILED';
    this.addLog(job, 'error', 'FAILED', 'Pipeline execution canceled by user.');
    this.broadcast({ type: 'JOB_STATUS_CHANGE', job });
    this.processNextInQueue();
    return true;
  }
}
