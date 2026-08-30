import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import { AuthProvider } from '@/components/providers/auth-provider';
import { StripEmojisGuard } from '@/components/providers/strip-emojis-guard';
import { InspectorDataProvider } from '@/components/providers/inspector-data-provider';
import { ProviderErrorBoundary } from '@/components/providers/provider-error-boundary';
import { RegistrationGate } from '@/components/inspector/registration-gate';
import { PoolUrgentAlerts } from '@/components/inspector/pool-urgent-alerts';
import { SystemAccessAgreementGate } from '@/components/auth/system-access-agreement-gate';
import { MustChangePasswordGate } from '@/components/auth/must-change-password-gate';
import { Toaster } from '@/components/ui/sonner';

import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'CROSSUB Inspector',
  description:
    'Field operations platform for property inspectors — accept jobs, inspect, collect evidence, attend tribunal hearings.',
  applicationName: 'CROSSUB Inspector',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CROSSUB Inspector',
  },
};

export const viewport: Viewport = {
  themeColor: '#00d4a4',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-background">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <StripEmojisGuard />
          <ProviderErrorBoundary>
            <InspectorDataProvider>
              <SystemAccessAgreementGate>
                <MustChangePasswordGate>
                  <RegistrationGate>
                    <PoolUrgentAlerts />
                    {children}
                  </RegistrationGate>
                </MustChangePasswordGate>
              </SystemAccessAgreementGate>
            </InspectorDataProvider>
          </ProviderErrorBoundary>
        </AuthProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
