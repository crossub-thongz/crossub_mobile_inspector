'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { AuthLoadingScreen } from '@/components/auth/auth-loading-screen';
import { useAuth } from '@/components/providers/auth-provider';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  INSPECTOR_LICENCE_TYPES,
  INSPECTOR_SERVICE_REGIONS,
} from '@/constants/inspector-registration';
import { INSPECTOR_HOURLY_RATE_AUD } from '@/constants/inspection';
import { ROUTES } from '@/constants/routes';
import type { InspectorRegistration } from '@/lib/types';

const schema = z.object({
  mobile: z.string().min(8, 'Mobile required'),
  dateOfBirth: z.string().min(1, 'Date of birth required'),
  residentialAddress: z.string().min(5, 'Address required'),
  abn: z.string().optional(),
  licenceNumber: z.string().optional(),
  licenceType: z.string().min(1, 'Select licence type'),
  licenceExpiry: z.string().optional(),
  serviceRegions: z.array(z.string()).min(1, 'Select at least one region'),
  tribunalQualified: z.boolean().optional(),
  bankAccountName: z.string().min(2, 'Account name required'),
  bankBsb: z.string().min(6, 'BSB required'),
  bankAccountNumber: z.string().min(6, 'Account number required'),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const { user, status } = useAuth();
  const { saveRegistration, registrationComplete, registrationResolved } =
    useInspectorData();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      serviceRegions: [],
      tribunalQualified: false,
    },
  });

  const selectedRegions = watch('serviceRegions') ?? [];

  useEffect(() => {
    if (status === 'guest') {
      window.location.replace(ROUTES.LOGIN);
    }
  }, [status]);

  useEffect(() => {
    if (!user?.firstName || !user?.lastName) return;
    setValue('bankAccountName', `${user.firstName} ${user.lastName}`.trim(), {
      shouldValidate: false,
    });
  }, [user?.firstName, user?.lastName, setValue]);

  const toggleRegion = (region: string) => {
    const next = selectedRegions.includes(region)
      ? selectedRegions.filter((r) => r !== region)
      : [...selectedRegions, region];
    setValue('serviceRegions', next, { shouldValidate: true });
  };

  const onSubmit = async (values: FormValues) => {
    if (!user?.email) {
      toast.error('Account details missing — sign in again.');
      window.location.replace(ROUTES.LOGIN);
      return;
    }

    const firstName = user.firstName?.trim() || 'Inspector';
    const lastName = user.lastName?.trim() || 'User';

    const payload: InspectorRegistration = {
      ...values,
      firstName,
      lastName,
      email: user.email,
      registrationStatus: 'pending_review',
      submittedAt: new Date().toISOString(),
    };
    try {
      await saveRegistration(payload);
      toast.success('Profile saved — you will not be asked again');
      window.location.assign(ROUTES.DASHBOARD);
    } catch {
      // saveRegistration already toasts on server failure.
    }
  };

  if (status === 'loading' || status === 'guest') {
    return <AuthLoadingScreen message={status === 'guest' ? 'Redirecting to sign in…' : undefined} />;
  }

  if (!user) {
    return <AuthLoadingScreen message="Loading your account…" />;
  }

  if (!registrationResolved) {
    return <AuthLoadingScreen message="Checking your profile…" />;
  }

  if (registrationComplete) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col px-4 py-8">
        <h1 className="text-xl font-semibold">Profile already completed</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Your inspector details are saved for this account. Update them on your profile
          page any time.
        </p>
        <div className="mt-6 flex gap-2">
          <Link href={ROUTES.PROFILE} className="flex-1">
            <Button className="w-full">View profile</Button>
          </Link>
          <Link href={ROUTES.DASHBOARD} className="flex-1">
            <Button variant="outline" className="w-full">
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background px-4 py-8 pb-16">
      <div className="mb-6 space-y-2">
        <h1 className="text-xl font-semibold">Inspector profile</h1>
        <p className="text-sm text-muted-foreground">
          Complete your professional details. Your sign-in info is already on file.
        </p>
        <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
          <p className="font-medium">
            {[user.firstName, user.lastName].filter(Boolean).join(' ') || 'Your account'}
          </p>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <p className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-primary">
          Pay: ${INSPECTOR_HOURLY_RATE_AUD}/hour on-site. Inspection duration set by
          property type.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Contact details</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile</Label>
              <Input id="mobile" autoComplete="tel" {...register('mobile')} />
              {errors.mobile && (
                <p className="text-xs text-destructive">{errors.mobile.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of birth</Label>
              <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} />
              {errors.dateOfBirth && (
                <p className="text-xs text-destructive">{errors.dateOfBirth.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="residentialAddress">Residential address</Label>
            <Input id="residentialAddress" {...register('residentialAddress')} />
            {errors.residentialAddress && (
              <p className="text-xs text-destructive">
                {errors.residentialAddress.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="abn">ABN (optional)</Label>
            <Input id="abn" placeholder="12 345 678 901" {...register('abn')} />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Licence (optional fields)</h2>
          <div className="space-y-2">
            <Label htmlFor="licenceType">Licence type</Label>
            <select
              id="licenceType"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              {...register('licenceType')}
            >
              <option value="">Select...</option>
              {INSPECTOR_LICENCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {errors.licenceType && (
              <p className="text-xs text-destructive">{errors.licenceType.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="licenceNumber">Licence number (optional)</Label>
              <Input id="licenceNumber" {...register('licenceNumber')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenceExpiry">Licence expiry (optional)</Label>
              <Input id="licenceExpiry" type="date" {...register('licenceExpiry')} />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Service areas</h2>
          <div className="flex flex-wrap gap-2">
            {INSPECTOR_SERVICE_REGIONS.map((region) => {
              const active = selectedRegions.includes(region);
              return (
                <button
                  key={region}
                  type="button"
                  onClick={() => toggleRegion(region)}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    active
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {region}
                </button>
              );
            })}
          </div>
          {errors.serviceRegions && (
            <p className="text-xs text-destructive">{errors.serviceRegions.message}</p>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Tribunal qualification (optional)</h2>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('tribunalQualified')} />
            I am qualified to accept tribunal assignments
          </label>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Bank details (payroll)</h2>
          <div className="space-y-2">
            <Label htmlFor="bankAccountName">Account name</Label>
            <Input id="bankAccountName" {...register('bankAccountName')} />
            {errors.bankAccountName && (
              <p className="text-xs text-destructive">{errors.bankAccountName.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="bankBsb">BSB</Label>
              <Input id="bankBsb" placeholder="062-000" {...register('bankBsb')} />
              {errors.bankBsb && (
                <p className="text-xs text-destructive">{errors.bankBsb.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankAccountNumber">Account number</Label>
              <Input id="bankAccountNumber" {...register('bankAccountNumber')} />
              {errors.bankAccountNumber && (
                <p className="text-xs text-destructive">
                  {errors.bankAccountNumber.message}
                </p>
              )}
            </div>
          </div>
        </section>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          Save profile & continue
        </Button>
      </form>
    </div>
  );
}
