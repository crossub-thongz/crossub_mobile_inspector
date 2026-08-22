'use client';

import type { ReactNode } from 'react';

export function InspectionInspectChrome({
  nav,
  footer,
  children,
}: {
  nav: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <div
        className="sticky z-30 -mx-4 border-b border-border bg-background px-4 py-3"
        style={{
          top: 'calc(var(--inspector-header-height, 3.5rem) + 3.6rem)',
        }}
      >
        {nav}
      </div>
      <div className="space-y-5 pb-4 pt-4">{children}</div>
      <div
        className="fixed left-1/2 z-50 w-full max-w-lg -translate-x-1/2 border-t border-border bg-background px-4 py-3"
        style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {footer}
      </div>
    </>
  );
}
