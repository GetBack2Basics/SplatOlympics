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
import { JobLocationBadge } from './components/JobLocationBadge';
import { ProjectSelectorBar, ProjectItem } from './components/ProjectSelectorBar';
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
import { CheckCircle2, AlertTriangle, Layers, Camera, Cpu, Download, Sparkles, Box, Eye, User, ArrowRight, Terminal, RotateCcw } from 'lucide-react';

export const App: React.FC = () => {
  const [activeStage, setActiveStage] = useState<'stage1' | 'stage2' | 'stage3'>(() => {
    return (localStorage.getItem('splat_active_stage') as any) || 'stage1';
  });
  const [selectedModelUrl, setSelectedModelUrl] = useState<string>(() => {
    return localStorage.getItem('splat_selected_model_url') || '';
  });
  const [photos, setPhotos] = useState<ValidatedPhoto[]>([]);
  const [datasetName, setDatasetName] = useState<string>(() => {
    return localStorage.getItem('splat_dataset_name') || '';
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // System Reset Handler
  const handleResetAllData = async () => {
    if (!window.confirm('Delete all old data, saved projects, jobs, uploaded images, sample boxes, and generated PLY models?')) return;
    try {
      await fetch('/api/system/reset', { method: 'POST' });
      localStorage.clear();
      setPhotos([]);
      setJobs([]);
      setProjects([]);
      setSelectedProjectId(null);
      setSelectedModelUrl('');
      setDatasetName('');
      setActiveStage('stage1');
      setNotification({
        type: 'success',
        message: 'Purged all old projects, jobs, sample boxes, uploaded files, and PLY models. System refreshed!',
      });
    } catch (err: any) {
      setNotification({ type: 'error', message: `Reset failed: ${err.message}` });
    }
  };

  // Projects list state (Stage 1 creates projects, Stage 2 selects projects)
  const [projects, setProjects] = useState<ProjectItem[]>(() => {
    const saved = localStorage.getItem('splat_projects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => {
    return localStorage.getItem('splat_selected_project_id') || null;
  });

  // Delete Individual Project Handler
  const handleDeleteProject = async (id: string) => {
    const proj = projects.find((p) => p.id === id);
    if (!proj) return;
    if (!window.confirm(`Delete project "${proj.name}" and all associated files?`)) return;

    try {
      await fetch(`/api/project/${id}`, { method: 'DELETE' });
    } catch (e) {}

    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    localStorage.setItem('splat_projects', JSON.stringify(updated));

    if (selectedProjectId === id) {
      const nextId = updated.length > 0 ? updated[0].id : null;
      setSelectedProjectId(nextId);
      if (nextId) localStorage.setItem('splat_selected_project_id', nextId);
      else localStorage.removeItem('splat_selected_project_id');
    }

    setNotification({
      type: 'success',
      message: `Project "${proj.name}" deleted successfully.`,
    });
  };

  // Stage 2 Pipeline State
  const [jobs, setJobs] = useState<PipelineJob[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(() => {
    return localStorage.getItem('splat_active_job_id') || null;
  });
  const [socketService] = useState(() => new PipelineSocketService());
  const [selectedQuality, setSelectedQuality] = useState<QualityPreset>('standard');

  // Persistence effects
  useEffect(() => {
    localStorage.setItem('splat_dataset_name', datasetName);
  }, [datasetName]);

  useEffect(() => {
    localStorage.setItem('splat_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem('splat_selected_project_id', selectedProjectId);
    }
  }, [selectedProjectId]);

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

  // Compute dataset health dynamically for Stage 1
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
        if (completedJob.plyFileUrl) {
          setSelectedModelUrl(completedJob.plyFileUrl);
        }
        setNotification({
          type: 'success',
          message: `3D Reconstruction Completed for "${completedJob.datasetName}"! Model ready for Stage 3 inspection.`,
        });
      },
    });

    // Fetch initial jobs from server
    fetch('/api/pipeline/jobs')
      .then((res) => res.json())
      .then((data) => {
        if (data.jobs && data.jobs.length > 0) {
          setJobs(data.jobs);
          if (!activeJobId) setActiveJobId(data.jobs[0].id);
          const completedWithPly = data.jobs.find((j: any) => j.status === 'completed' && j.plyFileUrl);
          if (completedWithPly) {
            setSelectedModelUrl((current) => current || completedWithPly.plyFileUrl);
          }
        }
      })
      .catch(() => {});

    return () => {
      socketService.disconnect();
    };
  }, []);

  // Auto-select created PLY model when switching to Stage 3 if available
  useEffect(() => {
    if (activeStage === 'stage3' && (!selectedModelUrl || selectedModelUrl === '/models/sample_cactus.ply')) {
      const completedJob = jobs.find((j) => j.status === 'completed' && j.plyFileUrl);
      if (completedJob && completedJob.plyFileUrl) {
        setSelectedModelUrl(completedJob.plyFileUrl);
      }
    }
  }, [activeStage, jobs]);

  // Handle photos selected or dropped in Stage 1
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

  // Stage 1: Save Project & Go to Stage 2
  const handleCreateProjectInStage1 = async () => {
    if (photos.length === 0) return;
    setIsSubmitting(true);

    try {
      const projId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const name = datasetName || '3D Reconstruction Target';

      // Upload actual Stage 1 photo files to backend if user provided custom file objects
      const uploadableFiles = photos.filter((p) => p.file).map((p) => p.file as File);
      if (uploadableFiles.length > 0) {
        const formData = new FormData();
        formData.append('datasetId', projId);
        formData.append('datasetName', name);

        const metadata = photos.map((p) => ({
          angleSector: p.angleSector,
          sharpnessScore: p.sharpnessScore,
          isBlurry: p.isBlurry,
          hash: p.hash,
          width: p.metadata?.width || 1920,
          height: p.metadata?.height || 1080,
          cameraModel: p.metadata?.cameraModel || 'Mobile Camera',
          focalLength: p.metadata?.focalLength || 26,
        }));
        formData.append('metadata', JSON.stringify(metadata));

        uploadableFiles.forEach((file) => {
          formData.append('files', file);
        });

        await fetch('/api/dataset/upload', {
          method: 'POST',
          body: formData,
        }).catch(() => {});
      }

      const newProj: ProjectItem = {
        id: projId,
        name,
        photoCount: photos.length,
        createdAt: Date.now(),
      };

      setProjects((prev) => [newProj, ...prev.filter((p) => p.id !== projId)]);
      setSelectedProjectId(projId);
      setActiveStage('stage2');

      setNotification({
        type: 'success',
        message: `Project "${newProj.name}" saved! Choose quality in Stage 2 to create 3D PLY/SPLAT model.`,
      });
    } catch (err: any) {
      setNotification({ type: 'error', message: `Project saving failed: ${err.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stage 2: Create 3D Model File at Chosen Quality
  const handleGenerateModelInStage2 = async () => {
    const activeProj = projects.find((p) => p.id === selectedProjectId) || projects[0];
    if (!activeProj) {
      setNotification({
        type: 'error',
        message: 'No active project found. Load photos and click "Save Project & Go to Stage 2" in Stage 1 first!',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/pipeline/job/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetId: activeProj.id,
          datasetName: activeProj.name,
          photoCount: activeProj.photoCount || photos.length || 12,
          qualityPreset: selectedQuality,
        }),
      });

      const responseText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Server returned invalid response (${res.status}): ${responseText.slice(0, 100)}`);
      }

      if (!res.ok || data.error) {
        throw new Error(data.error || `Server error (${res.status})`);
      }

      if (data.job) {
        setJobs((prev) => [data.job, ...prev.filter((j) => j.id !== data.job.id)]);
        setActiveJobId(data.job.id);
        setNotification({
          type: 'success',
          message: `3D Reconstruction Job launched for "${activeProj.name}" [${selectedQuality.toUpperCase()}]!`,
        });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: `Model generation failed: ${err.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load Sample Photo Batch into Stage 1
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

  const handleCancelJob = (jobId: string) => {
    socketService.cancelJob(jobId);
  };

  return (
    <div className="min-h-screen bg-splat-bg text-slate-100 font-sans selection:bg-splat-neonCyan selection:text-black">
      {/* Header Navigation Bar */}
      <header className="sticky top-0 z-40 bg-splat-bg/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-splat-neonCyan via-splat-neonPurple to-splat-neonGreen flex items-center justify-center p-0.5 shadow-lg shadow-splat-neonCyan/20 shrink-0">
              <div className="w-full h-full bg-splat-bg rounded-[10px] flex items-center justify-center">
                <Layers className="w-5 h-5 text-splat-neonCyan" />
              </div>
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-wider uppercase text-white flex items-center gap-2">
                SplatOlympics <span className="text-[10px] sm:text-xs px-2 py-0.5 bg-splat-neonCyan/10 border border-splat-neonCyan/30 text-splat-neonCyan rounded-full font-mono">Arena v2.0</span>
              </h1>
              <p className="text-[10px] text-slate-400">Gaussian Splatting 3D Reconstruction Platform</p>
            </div>
          </div>

          {/* Navigation Stage Tabs */}
          <div className="flex items-center space-x-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-full no-scrollbar">
            <button
              onClick={() => setActiveStage('stage1')}
              className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeStage === 'stage1'
                  ? 'bg-splat-neonCyan text-black shadow-md shadow-splat-neonCyan/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Stage 1: Load Photos & Save Project</span>
              <span className="md:hidden">Stage 1</span>
            </button>

            <button
              onClick={() => setActiveStage('stage2')}
              className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeStage === 'stage2'
                  ? 'bg-splat-neonPurple text-white shadow-md shadow-splat-neonPurple/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Stage 2: Select Project & Create PLY/SPLAT</span>
              <span className="md:hidden">Stage 2</span>
              {jobs.filter((j) => j.status === 'processing').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-splat-neonGreen animate-ping" />
              )}
            </button>

            <button
              onClick={() => setActiveStage('stage3')}
              className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeStage === 'stage3'
                  ? 'bg-splat-neonGreen text-black shadow-md shadow-splat-neonGreen/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Stage 3: View 3D PLY Model</span>
              <span className="md:hidden">Stage 3</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleResetAllData}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-950/70 hover:bg-rose-900 border border-rose-700/60 text-rose-300 hover:text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
              title="Delete all old data, saved projects, jobs, uploaded images, and generated PLY models"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset All Data</span>
            </button>

            <button
              className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all shadow-md"
              title="Google Account Authentication & System Settings"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-500 via-rose-500 to-amber-500 p-0.5 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
                  <User className="w-3 h-3 text-slate-200" />
                </div>
              </div>
              <span>Sign In / Settings</span>
            </button>
          </div>
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

        {/* ================= STAGE 1 PAGE: Load Photos & Save Project ================= */}
        {activeStage === 'stage1' && (
          <div className="space-y-6">
            <BentoGrid>
              {/* Left Column: Dropzone & Radar */}
              <div className="space-y-6">
                <DropzoneUpload
                  onFilesSelected={handleFilesSelected}
                  isAnalyzing={isAnalyzing}
                  onLoadSampleBatch={handleLoadSampleBatch}
                  onOpenCamera={() => setIsCameraOpen(true)}
                />
                <AngleCoverageRadar coverage={healthSummary.angleCoverage} />
              </div>

              {/* Right Column: Photo Grid Preview on Top Right, then Save Project & Go to Stage 2 */}
              <div className="lg:col-span-2 space-y-6">
                {/* Dataset Photo Grid Preview on Top Right */}
                <PhotoGridPreview
                  photos={photos}
                  onDeletePhoto={handleDeletePhoto}
                  onUpdateAngleSector={handleUpdateSector}
                />

                {/* Dataset Health Summary & Save Project Button Below Photo Grid */}
                <DatasetHealthSummary
                  summary={healthSummary}
                  datasetName={datasetName}
                  onUpdateDatasetName={setDatasetName}
                  onSubmitPipeline={handleCreateProjectInStage1}
                  isSubmitting={isSubmitting}
                />
              </div>
            </BentoGrid>
          </div>
        )}

        {/* ================= STAGE 2 PAGE: Select Project & Create PLY/SPLAT Model ================= */}
        {activeStage === 'stage2' && (
          <div className="space-y-6">
            {/* Project Selector & Quality Model Creation Bar */}
            <ProjectSelectorBar
              projects={projects}
              selectedProjectId={selectedProjectId}
              onSelectProject={setSelectedProjectId}
              onDeleteProject={handleDeleteProject}
              selectedQuality={selectedQuality}
              onSelectQuality={setSelectedQuality}
              onGenerateModel={handleGenerateModelInStage2}
              isGenerating={isSubmitting}
            />

            {/* GCP Credit & Cost Monitor */}
            <GcpCostMonitor />

            {/* Active Job Monitor */}
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

            {/* Reconstruction Job Queue & History List */}
            <JobHistoryList
              jobs={jobs}
              activeJobId={activeJob ? activeJob.id : null}
              onSelectJob={(id) => setActiveJobId(id)}
              onStartNewJob={() => setActiveStage('stage1')}
            />
          </div>
        )}

        {/* ================= STAGE 3 PAGE: View 3D PLY Model ================= */}
        {activeStage === 'stage3' && (
          <div className="space-y-6">
            {/* Stage 3 Model Selector Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-splat-cardBg/90 backdrop-blur-xl border border-slate-800 p-4 rounded-2xl shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-950/80 border border-emerald-500/40 text-splat-neonGreen rounded-xl">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wide text-slate-200 flex items-center gap-2">
                    Stage 3: View Created 3D PLY Model
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 border border-slate-700 text-splat-neonCyan rounded-full">
                      WebGL Three.js Renderer
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">Viewing PLY created in Stage 2 by default (or choose existing model)</p>
                </div>
              </div>

              {/* Model Selector Bar */}
              <div className="flex flex-wrap items-center space-x-3">
                <span className="text-xs font-bold text-slate-400 uppercase font-mono">Select 3D Model:</span>
                <select
                  value={selectedModelUrl}
                  onChange={(e) => setSelectedModelUrl(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-splat-neonGreen text-xs font-bold font-mono px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-splat-neonGreen transition-all cursor-pointer max-w-xs truncate"
                >
                  <option value="/models/sample_cactus.ply">
                    Box 3DGS Cactus Scan [STANDARD] (sample_cactus.ply)
                  </option>
                  {jobs
                    .filter((j) => j.status === 'completed' && j.plyFileUrl)
                    .map((j) => (
                      <option key={j.id} value={j.plyFileUrl}>
                        {j.datasetName} [{j.qualityPreset ? j.qualityPreset.toUpperCase() : 'STANDARD'}] ({j.plyFileUrl?.split('/').pop()})
                      </option>
                    ))}
                </select>

                <button
                  onClick={() => setActiveStage('stage2')}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
                >
                  <span>← Back to Stage 2</span>
                </button>
              </div>
            </div>

            {/* 3D Splat Inspector Viewport */}
            <SplatViewport3D
              modelUrl={selectedModelUrl}
              datasetName={
                activeJob
                  ? `${activeJob.datasetName} [${(activeJob.qualityPreset || 'standard').toUpperCase()}]`
                  : 'Box 3DGS Cactus Scan [STANDARD]'
              }
            />
          </div>
        )}
      </main>

      {/* Footer with Build Timestamp & Global Minimized Log Console Button */}
      <footer className="mt-12 border-t border-slate-800 bg-slate-950/80 py-4 px-6 text-xs font-mono text-slate-500 max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <span>SplatOlympics Arena v2.0 • Gaussian Splatting Platform</span>

        <div className="flex items-center space-x-3">
          {/* View Log Button (Bottom Right, directly to the left of Build Date) */}
          <button
            onClick={() => setIsLogDrawerOpen(!isLogDrawerOpen)}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold font-mono transition-all flex items-center space-x-2 shadow-md ${
              isLogDrawerOpen
                ? 'bg-splat-neonCyan text-black border-splat-neonCyan ring-2 ring-splat-neonCyan/40 shadow-splat-neonCyan/20'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Open/Close Global Live Telemetry & Console Log Viewer"
          >
            <Terminal className="w-4 h-4 text-splat-neonCyan" />
            <span>View Log ({activeJob ? activeJob.logs.length : 0})</span>
            {activeJob && activeJob.status === 'processing' && (
              <span className="w-2 h-2 rounded-full bg-splat-neonGreen animate-ping" />
            )}
          </button>

          <span className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-md text-slate-400 font-mono">
            Build: {typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : '202608031030'}
          </span>
        </div>
      </footer>

      {/* Floating Global Live Console Log Drawer (Available for ALL sections) */}
      {isLogDrawerOpen && (
        <div className="fixed bottom-16 right-4 z-50 w-full max-w-xl shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
          <LiveConsoleLog
            logs={activeJob ? activeJob.logs : []}
            onClose={() => setIsLogDrawerOpen(false)}
          />
        </div>
      )}

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
