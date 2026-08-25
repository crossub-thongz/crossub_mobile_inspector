'use client';

import Link from 'next/link';
import {
  CalendarClock,
  CreditCard,
  FileText,
  Lock,
  MapPin,
  Shield,
  User,
} from 'lucide-react';

import { TribunalQualifiedTag } from '@/components/inspector/tribunal-qualified-tag';

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
  const { profile, registration, registrationComplete } = useInspectorData();
  const reg = registration;
  const needsRegistration = !registrationComplete;

  return (
    <InspectorShell title="Inspector Information">
      <div className="space-y-4">
        {needsRegistration ? (
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
                <InfoRow
                  label="Status"
                  value={
                    reg
                      ? REGISTRATION_STATUS_LABEL[reg.registrationStatus]
                      : REGISTRATION_STATUS_LABEL.approved
                  }
                />
                <InfoRow label="Email" value={reg?.email ?? profile.email} />
                <InfoRow label="Mobile" value={reg?.mobile ?? profile.phone} />
                <InfoRow
                  label="DOB"
                  value={reg?.dateOfBirth ? formatDate(reg.dateOfBirth) : undefined}
                />
                <InfoRow label="Address" value={reg?.residentialAddress} />
                <InfoRow label="ABN" value={reg?.abn} />
                <InfoRow label="Access level" value={`Level ${profile.accessLevel}`} />
              </CardContent>
            </Card>

            {reg ? (
              <>
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
                    <InfoRow
                      label="Licence expiry"
                      value={reg.licenceExpiry ? formatDate(reg.licenceExpiry) : undefined}
                    />
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
                    <div className="mt-3">
                      <TribunalQualifiedTag
                        certified={Boolean(reg.tribunalQualified)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="size-4" />
                    Access
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <TribunalQualifiedTag certified={profile.tribunalQualified} />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarClock className="size-4" />
                  Time Availability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  Select the days and hours you can take inspection jobs.
                </p>
                <Link href={ROUTES.WEEKLY_AVAILABILITY}>
                  <Button variant="outline" className="w-full">
                    Set available times
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {reg ? (
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
                  <InfoRow
                    label="Account"
                    value={
                      reg.bankAccountNumber
                        ? `••••${reg.bankAccountNumber.slice(-4)}`
                        : undefined
                    }
                  />
                  <InfoRow
                    label="Labour rate"
                    value={`$${INSPECTOR_HOURLY_RATE_AUD}/hour`}
                  />
                  <p className="text-muted-foreground pt-1 text-xs">
                    Weekly earnings: {formatCurrency(profile.weeklyEarnings)}
                  </p>
                </CardContent>
              </Card>
            ) : null}

            {reg?.submittedAt ? (
              <p className="text-muted-foreground flex items-center gap-2 text-xs">
                <FileText className="size-3.5" />
                Submitted {formatDate(reg.submittedAt)}
                {reg.reviewedAt && ` · Reviewed ${formatDate(reg.reviewedAt)}`}
              </p>
            ) : null}
          </>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="size-4" />
              Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Change the password you use to sign in to the Inspector app.
            </p>
            <Link href={`${ROUTES.CHANGE_PASSWORD}?from=profile`}>
              <Button variant="outline" className="w-full">
                Change password
              </Button>
            </Link>
          </CardContent>
        </Card>

        {needsRegistration ? (
          <Link href={ROUTES.REGISTER}>
            <Button variant="outline" className="w-full">
              Start registration
            </Button>
          </Link>
        ) : reg ? (
          <Link href={ROUTES.REGISTER}>
            <Button variant="outline" className="w-full">
              Update registration
            </Button>
          </Link>
        ) : null}
      </div>
    </InspectorShell>
  );
}
