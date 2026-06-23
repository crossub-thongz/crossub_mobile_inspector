'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

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
  firstName: z.string().min(2, 'First name required'),
  lastName: z.string().min(2, 'Last name required'),
  email: z.string().email('Valid email required'),
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
  const router = useRouter();
  const { user } = useAuth();
  const { saveRegistration, registrationComplete } = useInspectorData();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: user?.email ?? '',
      serviceRegions: [],
      tribunalQualified: false,
    },
  });

  const selectedRegions = watch('serviceRegions') ?? [];

  const toggleRegion = (region: string) => {
    const next = selectedRegions.includes(region)
      ? selectedRegions.filter((r) => r !== region)
      : [...selectedRegions, region];
    setValue('serviceRegions', next, { shouldValidate: true });
  };

  const onSubmit = async (values: FormValues) => {
    const payload: InspectorRegistration = {
      ...values,
      registrationStatus: 'pending_review',
      submittedAt: new Date().toISOString(),
    };
    saveRegistration(payload);
    toast.success('Registration submitted — Inspection Department will review');
    router.replace(ROUTES.DASHBOARD);
  };

  if (registrationComplete) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col px-4 py-8">
        <h1 className="text-xl font-semibold">Already registered</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Your inspector information is on file. Update details on your profile page.
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
        <h1 className="text-xl font-semibold">Inspector registration</h1>
        <p className="text-muted-foreground text-sm">
          One-time setup after sign-in. Login is email and password only — complete
          this form once before accepting jobs.
        </p>
        <p className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-primary">
          Pay: ${INSPECTOR_HOURLY_RATE_AUD}/hour on-site. Inspection duration set by
          property type.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Personal details</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" {...register('firstName')} />
              {errors.firstName && (
                <p className="text-xs text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" {...register('lastName')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile</Label>
              <Input id="mobile" {...register('mobile')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of birth</Label>
              <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="residentialAddress">Residential address</Label>
            <Input id="residentialAddress" {...register('residentialAddress')} />
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
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="bankBsb">BSB</Label>
              <Input id="bankBsb" placeholder="062-000" {...register('bankBsb')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankAccountNumber">Account number</Label>
              <Input id="bankAccountNumber" {...register('bankAccountNumber')} />
            </div>
          </div>
        </section>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          Submit registration
        </Button>
      </form>
    </div>
  );
}
