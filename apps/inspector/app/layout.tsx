import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import { AuthProvider } from '@/components/providers/auth-provider';
import { InactivityLogoutProvider } from '@/components/providers/inactivity-logout-provider';
import { InspectorDataProvider } from '@/components/providers/inspector-data-provider';
import { ProviderErrorBoundary } from '@/components/providers/provider-error-boundary';
import { RegistrationGate } from '@/components/inspector/registration-gate';
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
  themeColor: '#0b0f10',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
          <ProviderErrorBoundary>
            <InspectorDataProvider>
              <InactivityLogoutProvider>
                <RegistrationGate>{children}</RegistrationGate>
              </InactivityLogoutProvider>
            </InspectorDataProvider>
          </ProviderErrorBoundary>
        </AuthProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
