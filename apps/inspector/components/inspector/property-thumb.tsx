'use client';

import { useState } from 'react';

import { NoImageDialog } from '@/components/inspector/no-image-dialog';
import { cn } from '@/lib/utils';

export function PropertyThumb({
  src,
  alt = 'Property',
  className,
  size = 'md',
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  size?: 'sm' | 'md';
}) {
  const [broken, setBroken] = useState(false);
  const [open, setOpen] = useState(false);
  const hasImage = Boolean(src) && !broken;

  const box = cn(
    'shrink-0 overflow-hidden rounded-lg border border-border bg-secondary/40',
    size === 'sm' ? 'size-14' : 'h-[4.5rem] w-[5.25rem]',
    className,
  );

  if (hasImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src ?? undefined}
        alt={alt}
        className={cn(box, 'object-cover')}
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <>
      <button
        type="button"
        className={cn(
          box,
          'flex flex-col items-center justify-center gap-0.5 px-1 text-center',
        )}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
        aria-label="NO IMAGE"
      >
        <span className="text-muted-foreground text-[9px] font-bold tracking-wide">
          NO IMAGE
        </span>
      </button>
      <NoImageDialog
        open={open}
        onClose={() => setOpen(false)}
        message="This property has no listing photo."
      />
    </>
  );
}
