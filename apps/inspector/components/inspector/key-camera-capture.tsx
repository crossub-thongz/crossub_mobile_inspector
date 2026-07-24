'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { compressCanvasToDataUrl } from '@/lib/compress-image';

export function KeyCameraCapture({
  open,
  onClose,
  onCapture,
  nativeInputId,
}: {
  open: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
  /** Linked file input for native camera when getUserMedia is blocked */
  nativeInputId?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setReady(false);
  }, []);

  useEffect(() => {
    if (!open) {
      stopStream();
      setError(null);
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
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setReady(true);
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
  }, [open, stopStream]);

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
    onCapture(compressCanvasToDataUrl(canvas));
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-sm font-medium text-white">Take photo</p>
        <button
          type="button"
          onClick={onClose}
          className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white"
          aria-label="Close camera"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black">
        {error ? (
          <div className="space-y-4 px-6 text-center">
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
            className="max-h-full max-w-full object-contain"
          />
        )}
      </div>

      <div className="flex justify-center gap-3 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" disabled={!ready || !!error} onClick={capture}>
          <Camera className="size-4" />
          Capture
        </Button>
      </div>
    </div>
  );
}
