'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

import type { LabeledPhoto } from '@/lib/job-history';

export function ProofPhotoGallery({
  photos,
  emptyLabel = 'No photos recorded',
}: {
  photos: LabeledPhoto[];
  emptyLabel?: string;
}) {
  const [preview, setPreview] = useState<LabeledPhoto | null>(null);

  if (photos.length === 0) {
    return (
      <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-4 text-center text-xs">
        {emptyLabel}
      </p>
    );
  }

  return (
    <>
      <ul className="grid grid-cols-3 gap-2">
        {photos.map((photo) => (
          <li key={`${photo.label}-${photo.url.slice(0, 24)}`}>
            <button
              type="button"
              onClick={() => setPreview(photo)}
              className="group w-full text-left"
            >
              <div className="aspect-square overflow-hidden rounded-lg border border-border bg-secondary/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.label}
                  className="size-full object-cover transition group-hover:opacity-90"
                />
              </div>
              <p className="text-muted-foreground mt-1 truncate text-[10px]">
                {photo.label}
              </p>
            </button>
          </li>
        ))}
      </ul>

      {preview && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={preview.label}
          onClick={() => setPreview(null)}
        >
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white"
            aria-label="Close preview"
          >
            <X className="size-5" />
          </button>
          <p className="mb-3 text-center text-sm font-medium text-white">
            {preview.label}
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview.url}
            alt={preview.label}
            className="max-h-[75vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
