import React, { useState, useMemo, useEffect } from 'react';
import { BentoGrid } from './components/BentoGrid';
import { DropzoneUpload } from './components/DropzoneUpload';
import { AngleCoverageRadar } from './components/AngleCoverageRadar';
import { PhotoGridPreview } from './components/PhotoGridPreview';
import { DatasetHealthSummary } from './components/DatasetHealthSummary';
import { CameraCaptureModal } from './components/CameraCaptureModal';
import { PipelineJobMonitor } from './components/PipelineJobMonitor';
import { LiveConsoleLog } from './components/LiveConsoleLog';
import { JobHistoryList } from './components/JobHistoryList';
import { GcpCostMonitor } from './components/GcpCostMonitor';
import { SplatViewport3D } from './components/SplatViewport3D';
import { PipelineSocketService } from './services/pipelineSocket';
import { ValidatedPhoto, AngleSector, PipelineJob, QualityPreset } from './types';
import { extractPhotoMetadata } from './utils/exifParser';
import {
  computeImageSharpness,
  computePerceptualHash,
  estimateAngleSector,
  calculateDatasetHealth,
} from './utils/qualityAnalyzer';
import { loadBoxSampleDataset } from './utils/sampleDataset';
import { CheckCircle2, AlertTriangle, Layers, Camera, Cpu, Download, Sparkles, Box, Eye, User } from 'lucide-react';

export const App: React.FC = () => {
  const [activeStage, setActiveStage] = useState<'stage1' | 'stage2' | 'stage3'>(() => {
    return (localStorage.getItem('splat_active_stage') as any) || 'stage1';
  });
  const [selectedModelUrl, setSelectedModelUrl] = useState<string>(() => {
    return localStorage.getItem('splat_selected_model_url') || '/models/sample_cactus.ply';
  });
  const [photos, setPhotos] = useState<ValidatedPhoto[]>([]);
  const [datasetId] = useState(`ds_${Math.random().toString(36).substr(2, 6)}`);
  const [datasetName] = useState(`3D Target Session ${new Date().toLocaleDateString()}`);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Stage 2 Pipeline State
  const [jobs, setJobs] = useState<PipelineJob[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(() => {
    return localStorage.getItem('splat_active_job_id') || null;
  });
  const [socketService] = useState(() => new PipelineSocketService());

  const [selectedQuality, setSelectedQuality] = useState<QualityPreset>('standard');

  // Safe schema version check without wiping user jobs or localStorage
  useEffect(() => {
    const SCHEMA_VERSION = 'v5.0_persistent_jobs_quality_presets';
    const currentVer = localStorage.getItem('splat_schema_version');
    if (currentVer !== SCHEMA_VERSION) {
      console.log('[SplatOlympics] Updating schema version to:', SCHEMA_VERSION);
      localStorage.setItem('splat_schema_version', SCHEMA_VERSION);
    }
  }, []);

  // Save state to localStorage whenever changed
  useEffect(() => {
    localStorage.setItem('splat_active_stage', activeStage);
  }, [activeStage]);

  useEffect(() => {
    if (selectedModelUrl) {
      localStorage.setItem('splat_selected_model_url', selectedModelUrl);
    }
  }, [selectedModelUrl]);

  useEffect(() => {
    if (activeJobId) {
      localStorage.setItem('splat_active_job_id', activeJobId);
    }
  }, [activeJobId]);

  // Active Job selector
  const activeJob = useMemo(() => {
    return jobs.find((j) => j.id === activeJobId) || jobs[0] || null;
  }, [jobs, activeJobId]);

  // Compute dataset health dynamically
  const healthSummary = useMemo(() => calculateDatasetHealth(photos), [photos]);

  // Initialize WebSocket stream and load existing jobs
  useEffect(() => {
    socketService.connect({
      onJobCreated: (job) => {
        setJobs((prev) => [job, ...prev.filter((j) => j.id !== job.id)]);
        setActiveJobId(job.id);
      },
      onJobProgress: (updatedJob) => {
        setJobs((prev) => prev.map((j) => (j.id === updatedJob.id ? updatedJob : j)));
      },
      onJobLog: (jobId, log) => {
        setJobs((prev) =>
          prev.map((j) => {
            if (j.id === jobId) {
              return { ...j, logs: [...j.logs, log] };
            }
            return j;
          })
        );
      },
      onJobStatusChange: (updatedJob) => {
        setJobs((prev) => prev.map((j) => (j.id === updatedJob.id ? updatedJob : j)));
      },
      onJobCompleted: (completedJob) => {
        setJobs((prev) => prev.map((j) => (j.id === completedJob.id ? completedJob : j)));
        setNotification({
          type: 'success',
          message: `3D Reconstruction Completed! Final PSNR: ${completedJob.telemetry.psnr} dB. PLY/SPLAT models ready.`,
        });
      },
    });

    // Fetch initial jobs from server
    fetch('/api/pipeline/jobs')
      .then((res) => res.json())
      .then((data) => {
        if (data.jobs && data.jobs.length > 0) {
          setJobs(data.jobs);
          setActiveJobId(data.jobs[0].id);
        }
      })
      .catch(() => {});

    return () => {
      socketService.disconnect();
    };
  }, []);

  // Handle new photos selected or dropped
  const handleFilesSelected = async (files: File[]) => {
    setIsAnalyzing(true);
    try {
      const newValidated: ValidatedPhoto[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const previewUrl = URL.createObjectURL(file);
        const metadata = await extractPhotoMetadata(file);
        const { score: sharpnessScore, isBlurry } = await computeImageSharpness(file);
        const hash = await computePerceptualHash(file);
        const angleSector = estimateAngleSector(photos.length + i, file.name);

        newValidated.push({
          id: `photo_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`,
          file,
          previewUrl,
          name: file.name,
          sizeBytes: file.size,
          metadata,
          sharpnessScore,
          isBlurry,
          angleSector,
          hash,
          isDuplicate: false,
          uploadStatus: 'idle',
        });
      }

      // Check duplicates against all photos
      const updatedPhotos = [...photos, ...newValidated];
      const hashCounts = new Map<string, number>();
      updatedPhotos.forEach((p) => {
        hashCounts.set(p.hash, (hashCounts.get(p.hash) || 0) + 1);
      });

      const finalPhotos = updatedPhotos.map((p) => ({
        ...p,
        isDuplicate: (hashCounts.get(p.hash) || 0) > 1,
      }));

      setPhotos(finalPhotos);
      setNotification({
        type: 'success',
        message: `Processed & validated ${files.length} multi-angle photo(s).`,
      });
    } catch (err: any) {
      setNotification({ type: 'error', message: `Analysis failed: ${err.message}` });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCameraSnapshot = (file: File, sector: AngleSector) => {
    handleFilesSelected([file]);
  };

  const handleUpdateSector = (photoId: string, sector: AngleSector) => {
    setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, angleSector: sector } : p)));
  };

  const handleDeletePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  // Submit Dataset to Stage 2 Pipeline Queue
  const handleSubmitDataset = async () => {
    if (photos.length === 0) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/pipeline/job/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetId,
          datasetName,
          photoCount: photos.length,
          qualityPreset: selectedQuality,
        }),
      });

      const data = await res.json();
      if (data.job) {
        setJobs((prev) => [data.job, ...prev.filter((j) => j.id !== data.job.id)]);
        setActiveJobId(data.job.id);
        setActiveStage('stage2');
        setNotification({
          type: 'success',
          message: 'Job submitted! Switching to Stage 2: Web Pipeline Processing Queue...',
        });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: `Submission failed: ${err.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load Sample Photo Batch from Box Cactus GS dataset into Stage 1
  const handleLoadSampleBatch = async () => {
    setIsAnalyzing(true);
    try {
      const samplePhotos = await loadBoxSampleDataset();
      setPhotos(samplePhotos);
      setNotification({
        type: 'success',
        message: 'Loaded 12 multi-angle photo assets from Box "サボテンGS" sample dataset into Stage 1!',
      });
    } catch (err: any) {
      setNotification({ type: 'error', message: `Failed to load sample dataset: ${err.message}` });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Load Steam Studio Cactus GS PLY Sample Dataset (Triggers pipeline & generates server model assets)
  const handleLoadSteamStudioSample = async () => {
    setIsAnalyzing(true);
    try {
      const samplePhotos = await loadBoxSampleDataset();
      setPhotos(samplePhotos);
      setActiveStage('stage1');
      setNotification({
        type: 'success',
        message: 'Loaded Box "サボテンGS" raw images into Stage 1! Click "Submit Dataset for 3D Splatting" to run pipeline.',
      });
    } catch (err: any) {
      setNotification({ type: 'error', message: `Sample dataset loading failed: ${err.message}` });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCancelJob = (jobId: string) => {
    socketService.cancelJob(jobId);
  };

  return (
    <div className="min-h-screen bg-splat-bg text-slate-100 font-sans selection:bg-splat-neonCyan selection:text-black">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-splat-bg/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-splat-neonCyan via-splat-neonPurple to-splat-neonGreen flex items-center justify-center p-0.5 shadow-lg shadow-splat-neonCyan/20">
              <div className="w-full h-full bg-splat-bg rounded-[10px] flex items-center justify-center">
                <Layers className="w-5 h-5 text-splat-neonCyan" />
              </div>
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-wider uppercase text-white flex items-center gap-2">
                SplatOlympics <span className="text-xs px-2 py-0.5 bg-splat-neonCyan/10 border border-splat-neonCyan/30 text-splat-neonCyan rounded-full font-mono">Arena v2.0</span>
              </h1>
              <p className="text-[10px] text-slate-400">Gaussian Splatting 3D Reconstruction Platform</p>
            </div>
          </div>

          {/* Navigation Stage Tabs */}
          <div className="flex items-center space-x-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveStage('stage1')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeStage === 'stage1'
                  ? 'bg-splat-neonCyan text-black shadow-md shadow-splat-neonCyan/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Stage 1: Photo Collector</span>
            </button>

            <button
              onClick={() => setActiveStage('stage2')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeStage === 'stage2'
                  ? 'bg-splat-neonPurple text-white shadow-md shadow-splat-neonPurple/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Stage 2: Job Queue</span>
              {jobs.filter((j) => j.status === 'processing').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-splat-neonGreen animate-ping" />
              )}
            </button>

            <button
              onClick={() => setActiveStage('stage3')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeStage === 'stage3'
                  ? 'bg-splat-neonGreen text-black shadow-md shadow-splat-neonGreen/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Stage 3: 3D Inspector</span>
            </button>
          </div>

          {/* Google Account Sign-In / Settings Modal Placeholder */}
          <button
            className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all shadow-md"
            title="Google Account Authentication & System Settings (Coming Soon)"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-500 via-rose-500 to-amber-500 p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
                <User className="w-3 h-3 text-slate-200" />
              </div>
            </div>
            <span>Sign In / Settings</span>
          </button>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Notification Toast */}
        {notification && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between shadow-lg backdrop-blur-md transition-all ${
              notification.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
            }`}
          >
            <div className="flex items-center space-x-3 text-xs font-semibold">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-xs opacity-60 hover:opacity-100 font-mono ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* STAGE 1 VIEW: Multi-Angle Photo Ingestion */}
        {activeStage === 'stage1' && (
          <div className="space-y-6">
            <BentoGrid>
              <div className="space-y-6">
                <DropzoneUpload
                  onFilesSelected={handleFilesSelected}
                  isAnalyzing={isAnalyzing}
                  onLoadSampleBatch={handleLoadSampleBatch}
                  onOpenCamera={() => setIsCameraOpen(true)}
                />
                <AngleCoverageRadar coverage={healthSummary.angleCoverage} />
              </div>

              <div className="lg:col-span-2 space-y-6">
                <DatasetHealthSummary
                  summary={healthSummary}
                  selectedQuality={selectedQuality}
                  onSelectQuality={setSelectedQuality}
                  onSubmitPipeline={handleSubmitDataset}
                  isSubmitting={isSubmitting}
                />
                <PhotoGridPreview
                  photos={photos}
                  onDeletePhoto={handleDeletePhoto}
                  onUpdateAngleSector={handleUpdateSector}
                />
              </div>
            </BentoGrid>
          </div>
        )}

        {/* STAGE 2 VIEW: Job Queue Interface & Live Telemetry */}
        {activeStage === 'stage2' && (
          <div className="space-y-6">
            {/* GCP Credit & Cost Monitor */}
            <GcpCostMonitor />

            {/* Top Grid: Job Monitor & Live Console Log */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PipelineJobMonitor
                job={activeJob}
                onCancelJob={handleCancelJob}
                onInspectModel={(jobToInspect) => {
                  if (jobToInspect.plyFileUrl) {
                    setSelectedModelUrl(jobToInspect.plyFileUrl);
                  }
                  setActiveStage('stage3');
                }}
              />
              <LiveConsoleLog logs={activeJob ? activeJob.logs : []} />
            </div>

            {/* Bottom Grid: Job Queue Management History */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <JobHistoryList
                  jobs={jobs}
                  activeJobId={activeJob ? activeJob.id : null}
                  onSelectJob={(id) => setActiveJobId(id)}
                  onStartNewJob={() => setActiveStage('stage1')}
                />
              </div>

              {/* Box Sample Data Reference Card */}
              <div className="bg-splat-cardBg/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-slate-800">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-bold text-slate-200 uppercase">3DGS Test Dataset (Box)</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Sample 3D Gaussian Splatting dataset hosted on Box provided by Steam Studio / 3D Scan Studio Iris:
                  </p>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs space-y-2 mb-4">
                    <div className="flex justify-between font-mono text-slate-300">
                      <span>Dataset:</span>
                      <span className="font-bold text-splat-neonCyan">サボテンGS</span>
                    </div>
                    <div className="flex justify-between font-mono text-slate-300">
                      <span>Camera:</span>
                      <span>NIKON Z7II 8K</span>
                    </div>
                    <div className="flex justify-between font-mono text-slate-300">
                      <span>Size:</span>
                      <span>1.45 GB (.ZIP)</span>
                    </div>
                    <div className="flex justify-between font-mono text-slate-300">
                      <span>License:</span>
                      <span className="text-emerald-400 font-bold">CC0 Public Domain</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleLoadSteamStudioSample}
                    className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-amber-400/20"
                  >
                    <Download className="w-4 h-4" />
                    <span>Load Box Sample Dataset</span>
                  </button>

                  <a
                    href="https://app.box.com/s/itozvq23jh4av2a5hg08d7qevdbi93ii"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center space-x-2 transition-all"
                  >
                    <span>Open Box Shared Link</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STAGE 3 VIEW: Interactive 3D Viewport & WebGL Splat Inspector */}
        {activeStage === 'stage3' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-splat-cardBg/90 backdrop-blur-xl border border-slate-800 p-4 rounded-2xl shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-950/80 border border-emerald-500/40 text-splat-neonGreen rounded-xl">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wide text-slate-200 flex items-center gap-2">
                    Stage 3: Interactive 3D Splat Inspector
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 border border-slate-700 text-splat-neonCyan rounded-full">
                      WebGL Three.js Renderer
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">Orbit controls, camera frustums & density inspection</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setActiveStage('stage2')}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
                >
                  ← Back to Job Queue
                </button>
              </div>
            </div>

            {/* 3D Splat Inspector Canvas */}
            <SplatViewport3D
              modelUrl={selectedModelUrl}
              datasetName={activeJob ? activeJob.datasetName : '3D Reconstruction Target'}
            />
          </div>
        )}
      </main>

      {/* Footer with Build Timestamp */}
      <footer className="mt-12 border-t border-slate-800 bg-slate-950/80 py-4 px-6 text-center text-xs font-mono text-slate-500 flex flex-wrap items-center justify-between gap-2 max-w-7xl mx-auto">
        <span>SplatOlympics Arena v2.0 • Gaussian Splatting Platform</span>
        <span className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-md text-slate-400">
          Build: {typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : '202608031030'}
        </span>
      </footer>

      {/* Live WebRTC Camera Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onPhotoCaptured={handleCameraSnapshot}
      />
    </div>
  );
};

export default App;
