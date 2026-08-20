'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';

import { compressCanvasToDataUrl } from '@/lib/compress-image';
import { cn } from '@/lib/utils';

export function KeyCameraCapture({
  open,
  onClose,
  onCapture,
  onBurstComplete,
  captureMode = 'single',
  nativeInputId,
}: {
  open: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
  /** Burst mode: inspector snaps several shots, then confirms the set. */
  onBurstComplete?: (dataUrls: string[]) => void;
  captureMode?: 'single' | 'burst';
  /** Linked file input for native camera when getUserMedia is blocked */
  nativeInputId?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [burstShots, setBurstShots] = useState<string[]>([]);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setReady(false);
  }, []);

  const attachStream = useCallback(async (stream: MediaStream) => {
    const video = videoRef.current;
    if (!video) return false;
    video.srcObject = stream;
    try {
      await video.play();
      setReady(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!open) {
      stopStream();
      setError(null);
      setBurstShots([]);
      return;
    }

    let cancelled = false;

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera not available here. Use Upload to pick a photo.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (!(await attachStream(stream))) {
          window.requestAnimationFrame(() => {
            if (!cancelled) void attachStream(stream);
          });
        }
      } catch {
        setError(
          'Could not open the camera. Allow camera access in browser settings, or use Upload.',
        );
      }
    };

    void start();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [attachStream, open, stopStream]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const canvas = document.createElement('canvas');
    const maxEdge = 1280;
    const longest = Math.max(video.videoWidth, video.videoHeight);
    const scale = longest > maxEdge ? maxEdge / longest : 1;
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = compressCanvasToDataUrl(canvas);
    if (captureMode === 'burst') {
      setBurstShots((prev) => [...prev, dataUrl]);
      return;
    }
    onCapture(dataUrl);
    onClose();
  };

  const finishBurst = () => {
    if (burstShots.length === 0) return;
    onBurstComplete?.(burstShots);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex h-[100dvh] flex-col bg-black">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-30 flex size-14 items-center justify-center rounded-full bg-black/45 text-white shadow-lg backdrop-blur-sm"
        aria-label="Close camera"
      >
        <X className="size-8" strokeWidth={2.25} />
      </button>

      <div className="relative min-h-0 flex-1 overflow-hidden pt-14">
        {error ? (
          <div className="flex h-full flex-col items-center justify-center space-y-4 px-6 text-center">
            <p className="text-sm text-white/80">{error}</p>
            {nativeInputId && (
              <label
                htmlFor={nativeInputId}
                onClick={onClose}
                className="inline-flex cursor-pointer items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Open device camera
              </label>
            )}
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedData={() => setReady(true)}
            className="h-full w-full object-contain"
          />
        )}
      </div>

      {!error ? (
        <div className="relative z-20 shrink-0 bg-gradient-to-t from-black via-black/90 to-transparent px-4 pt-4 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
          {captureMode === 'burst' && burstShots.length > 0 ? (
            <ul className="mb-3 flex gap-2 overflow-x-auto">
              {burstShots.map((url, index) => (
                <li
                  key={`${url.slice(-12)}-${index}`}
                  className="relative size-14 shrink-0 overflow-hidden rounded-md border border-white/40"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Shot ${index + 1}`} className="size-full object-cover" />
                </li>
              ))}
            </ul>
          ) : null}
          <div className="flex items-center justify-center gap-6">
            {captureMode === 'burst' ? (
              <button
                type="button"
                disabled={burstShots.length === 0}
                onClick={finishBurst}
                className="flex min-w-20 flex-col items-center gap-1 text-white disabled:opacity-40"
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-white/15">
                  <Check className="size-6" />
                </span>
                <span className="text-xs">
                  {burstShots.length === 0
                    ? 'Use photos'
                    : `Use ${burstShots.length} photo${burstShots.length === 1 ? '' : 's'}`}
                </span>
              </button>
            ) : null}
            <button
              type="button"
              disabled={!ready}
              onClick={capture}
              aria-label="Capture photo"
              className={cn(
                'mb-2 flex size-[4.75rem] items-center justify-center rounded-full border-4 border-white/95 bg-[#00d4a4] shadow-[0_4px_24px_rgba(0,212,164,0.5)] transition-transform active:scale-95',
                !ready && 'opacity-70',
              )}
            >
              <span className="size-[3.25rem] rounded-full bg-[#00d4a4] ring-2 ring-white/50" />
            </button>
            {captureMode === 'burst' ? <span className="min-w-20" /> : null}
          </div>
          {captureMode === 'burst' ? (
            <p className="mt-2 text-center text-xs text-white/70">
              Snap as many as you need, then use photos to attach them.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
