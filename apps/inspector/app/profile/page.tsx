'use client';

import Link from 'next/link';
import {
  Award,
  CreditCard,
  FileText,
  MapPin,
  Shield,
  Star,
  User,
} from 'lucide-react';

import { InspectorShell } from '@/components/layout/inspector-shell';
import { useAuth } from '@/components/providers/auth-provider';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { REGISTRATION_STATUS_LABEL } from '@/constants/inspector-registration';
import { INSPECTOR_HOURLY_RATE_AUD } from '@/constants/inspection';
import { ROUTES } from '@/constants/routes';
import { displayName, formatCurrency, formatDate } from '@/lib/utils';

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { profile, registration } = useInspectorData();
  const reg = registration;

  return (
    <InspectorShell title="Inspector Information">
      <div className="space-y-4">
        {!reg ? (
          <Card>
            <CardContent className="space-y-4 py-6 text-center">
              <p className="text-sm">Registration not completed.</p>
              <Link href={ROUTES.REGISTER}>
                <Button>Complete registration</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="size-4" />
                  Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-lg font-semibold">
                  {user ? displayName(user) : profile.name}
                </p>
                <InfoRow label="Status" value={REGISTRATION_STATUS_LABEL[reg.registrationStatus]} />
                <InfoRow label="Email" value={reg.email} />
                <InfoRow label="Mobile" value={reg.mobile} />
                <InfoRow label="DOB" value={formatDate(reg.dateOfBirth)} />
                <InfoRow label="Address" value={reg.residentialAddress} />
                <InfoRow label="ABN" value={reg.abn} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="size-4" />
                  Licence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <InfoRow label="Licence type" value={reg.licenceType} />
                <InfoRow label="Licence no." value={reg.licenceNumber} />
                <InfoRow label="Licence expiry" value={reg.licenceExpiry ? formatDate(reg.licenceExpiry) : undefined} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="size-4" />
                  Service regions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {reg.serviceRegions.map((r) => (
                    <span
                      key={r}
                      className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-primary"
                    >
                      {r}
                    </span>
                  ))}
                </div>
                {reg.tribunalQualified && (
                  <p className="mt-3 flex items-center gap-2 text-sm">
                    <Award className="size-4 text-primary" />
                    Tribunal qualified
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="size-4 fill-warning text-warning" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {profile.rating != null ? (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold tabular-nums">
                      {profile.rating.toFixed(1)}
                    </span>
                    <span className="text-muted-foreground text-sm">/ 5.0 average rating</span>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {profile.totalCompleted > 0
                      ? 'Rating building — complete more inspections for a score.'
                      : 'New inspector — no rating yet.'}
                  </p>
                )}
                <InfoRow
                  label="Completed inspections"
                  value={String(profile.totalCompleted)}
                />
                <InfoRow
                  label="Late arrivals"
                  value={String(profile.lateArrivals)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="size-4" />
                  Payroll (Accounting)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <InfoRow label="Account name" value={reg.bankAccountName} />
                <InfoRow label="BSB" value={reg.bankBsb} />
                <InfoRow label="Account" value={`••••${reg.bankAccountNumber.slice(-4)}`} />
                <InfoRow
                  label="Labour rate"
                  value={`$${INSPECTOR_HOURLY_RATE_AUD}/hour`}
                />
                <p className="text-muted-foreground pt-1 text-xs">
                  Weekly earnings: {formatCurrency(profile.weeklyEarnings)}
                </p>
              </CardContent>
            </Card>

            {reg.submittedAt && (
              <p className="text-muted-foreground flex items-center gap-2 text-xs">
                <FileText className="size-3.5" />
                Submitted {formatDate(reg.submittedAt)}
                {reg.reviewedAt && ` · Reviewed ${formatDate(reg.reviewedAt)}`}
              </p>
            )}
          </>
        )}

        <Link href={ROUTES.REGISTER}>
          <Button variant="outline" className="w-full">
            {reg ? 'Update registration' : 'Start registration'}
          </Button>
        </Link>
      </div>
    </InspectorShell>
  );
}
