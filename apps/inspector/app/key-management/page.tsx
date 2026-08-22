import { redirect } from 'next/navigation';

import { ROUTES } from '@/constants/routes';

/** Key collect/return still lives on the inspection job. This hub is retired. */
export default function KeyManagementPage() {
  redirect(ROUTES.DASHBOARD);
}
