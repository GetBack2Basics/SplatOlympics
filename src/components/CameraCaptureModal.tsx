import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCw, CheckCircle2, AlertCircle, Compass } from 'lucide-react';
import { AngleSector } from '../types';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (file: File, sector: AngleSector) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onPhotoCaptured,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [selectedSector, setSelectedSector] = useState<AngleSector>('North');
  const [snapCount, setSnapCount] = useState(0);
  const [flashEffect, setFlashEffect] = useState(false);

  const SECTORS: AngleSector[] = ['North', 'East', 'South', 'West', 'Overhead'];

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async (mode: 'environment' | 'user') => {
    setCameraError(null);
    stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('[Camera] Error accessing video stream:', err);
      setCameraError(
        'Unable to access device camera. Please grant camera permissions or ensure no other app is using the camera.'
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleTakeSnapshot = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1920;
    canvas.height = video.videoHeight || 1080;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Trigger visual shutter flash
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 200);

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const fileName = `camera_snap_${selectedSector}_${Date.now()}.jpg`;
        const capturedFile = new File([blob], fileName, { type: 'image/jpeg' });
        onPhotoCaptured(capturedFile, selectedSector);
        setSnapCount((prev) => prev + 1);

        // Auto-advance to next logical angle sector for efficient 360 capture
        const sectorIdx = SECTORS.indexOf(selectedSector);
        const nextSector = SECTORS[(sectorIdx + 1) % SECTORS.length];
        setSelectedSector(nextSector);
      }
    }, 'image/jpeg', 0.92);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-splat-cardBg border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-splat-neonCyan/10 rounded-xl border border-splat-neonCyan/20 text-splat-neonCyan">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-200">Live Camera Collector</h2>
              <p className="text-xs text-slate-400">Capture 360° Multi-Angle Dataset Photos</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-mono font-bold rounded-full">
              {snapCount} Snapped
            </span>
            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewfinder Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[320px] max-h-[500px] overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center text-rose-400 space-y-3">
              <AlertCircle className="w-10 h-10 mx-auto text-rose-500 animate-pulse" />
              <p className="text-xs font-semibold max-w-md">{cameraError}</p>
              <button
                onClick={() => startCamera(facingMode)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700"
              >
                Retry Camera Connection
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Shutter Flash Animation */}
              {flashEffect && <div className="absolute inset-0 bg-white opacity-80 z-20 animate-ping" />}

              {/* Viewfinder Target Reticle Grid */}
              <div className="absolute inset-0 border-2 border-splat-neonCyan/30 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 border border-dashed border-splat-neonCyan/50 rounded-2xl flex items-center justify-center">
                  <div className="w-3 h-3 bg-splat-neonCyan/80 rounded-full animate-ping" />
                </div>
              </div>

              {/* Camera Flip Switch */}
              <button
                onClick={toggleCameraFacing}
                className="absolute top-3 right-3 z-10 p-2.5 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-slate-700 text-slate-200 rounded-xl transition-all"
                title="Switch Camera (Front/Rear)"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {/* NYT R&D Three Donuts Pattern Prompt */}
              <div className="absolute bottom-3 left-3 right-3 z-10 p-2 bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-xl flex items-center justify-between text-[11px] text-slate-300">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-splat-neonCyan/20 text-splat-neonCyan font-mono font-bold rounded border border-splat-neonCyan/40">
                    NYT Pattern Guide
                  </span>
                  <span>
                    {selectedSector === 'Overhead'
                      ? 'Ring 1: Upper Donut (Tilted 45° Down)'
                      : selectedSector === 'North' || selectedSector === 'South'
                      ? 'Ring 2: Mid Donut (Chest Height)'
                      : 'Ring 3: Base Donut (Base Level Tilted Up)'}
                  </span>
                </div>
                <span className="font-mono text-emerald-400 font-bold hidden sm:inline">≥ 1/3 Overlap Required</span>
              </div>
            </>
          )}
        </div>

        {/* Viewpoint Sector Selector & Shutter Bar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
          {/* Target Sector Selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-300">
              <Compass className="w-4 h-4 text-splat-neonCyan" />
              <span>Target Viewpoint Angle:</span>
            </div>
            <div className="flex items-center space-x-1">
              {SECTORS.map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSelectedSector(sec)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                    selectedSector === sec
                      ? 'bg-splat-neonCyan text-black border-splat-neonCyan shadow-md shadow-splat-neonCyan/20'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>

          {/* Large Shutter Button */}
          <div className="flex items-center justify-center pt-1">
            <button
              onClick={handleTakeSnapshot}
              disabled={Boolean(cameraError)}
              className="w-16 h-16 rounded-full bg-gradient-to-tr from-splat-neonCyan via-splat-neonPurple to-splat-neonGreen p-1 shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-40"
            >
              <div className="w-full h-full rounded-full bg-white border-2 border-slate-900 flex items-center justify-center shadow-inner">
                <div className="w-10 h-10 rounded-full bg-splat-neonCyan/20 border border-splat-neonCyan" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
