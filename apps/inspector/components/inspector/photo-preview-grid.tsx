'use client';

type PhotoPreviewGridProps = {
  urls: string[];
  emptyLabel?: string;
};

export function PhotoPreviewGrid({
  urls,
  emptyLabel = 'No photos yet.',
}: PhotoPreviewGridProps) {
  if (urls.length === 0) {
    return <p className="text-muted-foreground text-xs">{emptyLabel}</p>;
  }

  return (
    <ul className="grid grid-cols-3 gap-2">
      {urls.map((url, index) => (
        <li
          key={`${url.slice(0, 32)}-${index}`}
          className="relative aspect-square overflow-hidden rounded-lg border border-border bg-secondary/30"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={`Photo ${index + 1}`}
            className="size-full object-cover"
          />
        </li>
      ))}
    </ul>
  );
}
