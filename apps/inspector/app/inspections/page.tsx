import { Suspense } from 'react';

import InspectionsPageClient from './inspections-client';

export default function InspectionsPage() {
  return (
    <Suspense fallback={null}>
      <InspectionsPageClient />
    </Suspense>
  );
}
