'use client';

import { useState, type ReactNode } from 'react';
import {
  Building2,
  Camera,
  Check,
  ChevronRight,
  Mail,
  Minus,
  Phone,
  Plus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { JobPropertyHeader } from '@/components/inspector/job-property-header';
import { KeyPhasePhotoField } from '@/components/inspector/key-phase-photo-field';
import { NoImageDialog } from '@/components/inspector/no-image-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { stripEmojis } from '@/lib/strip-emojis';
import type {
  HandoverParty,
  KeyCondition,
  KeyPhaseRecord,
} from '@/lib/key-access-workflow';
import { formatHandoverNotes } from '@/lib/key-access-workflow';
import type { GeoPoint } from '@/lib/travel';
import type { InspectionJob } from '@/lib/types';
import { cn } from '@/lib/utils';

const NOTES_MAX = 200;

export type HandoverFormMode = 'collect' | 'return';

const COPY: Record<
  HandoverFormMode,
  {
    selectWho: string;
    tenantHint: string;
    agentHint: string;
    keysHeading: (party: 'tenant' | 'agent') => string;
    keySets: string;
  }
> = {
  collect: {
    selectWho: 'Select who you are receiving the keys from.',
    tenantHint: 'You have met the tenant and received the keys.',
    agentHint: 'You have received the keys from the agent.',
    keysHeading: (party) => `Keys received from ${party}`,
    keySets: 'Number of key sets received',
  },
  return: {
    selectWho: 'Select who you are handing the keys back to.',
    tenantHint: 'You have returned the keys to the tenant.',
    agentHint: 'You have returned the keys to the agent.',
    keysHeading: (party) => `Keys returned to ${party}`,
    keySets: 'Number of key sets returned',
  },
};

function ContactAction({
  href,
  accent,
  children,
}: {
  href: string;
  accent: 'tenant' | 'agent';
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-full',
        accent === 'tenant'
          ? 'bg-emerald-500/15 text-emerald-400'
          : 'bg-sky-500/15 text-sky-400',
      )}
    >
      {children}
    </a>
  );
}

export function HandoverCollectForm({
  job,
  mode = 'collect',
  inspectorName,
  deviceLocation,
  submitting,
  initial,
  onSubmit,
}: {
  job: InspectionJob;
  mode?: HandoverFormMode;
  inspectorName?: string | null;
  deviceLocation?: GeoPoint | null;
  submitting?: boolean;
  initial?: KeyPhaseRecord;
  onSubmit: (record: KeyPhaseRecord) => Promise<void>;
}) {
  const copy = COPY[mode];
  const defaultParty: HandoverParty =
    initial?.handoverParty ?? (job.type === 'open' ? 'agent' : 'tenant');
  const [party, setParty] = useState<HandoverParty>(defaultParty);
  const [contactName, setContactName] = useState(
    initial?.contactName ??
      (defaultParty === 'agent' ? job.agentName : job.tenantName) ??
      '',
  );
  const [agencyName, setAgencyName] = useState(
    initial?.agencyName ?? job.agentCompany ?? '',
  );
  const [phone, setPhone] = useState(
    initial?.contactPhone ??
      (party === 'agent' ? job.agentPhone : job.tenantPhone) ??
      '',
  );
  const [email, setEmail] = useState(
    initial?.contactEmail ??
      (party === 'agent' ? job.agentEmail : job.tenantEmail) ??
      '',
  );
  const [keySets, setKeySets] = useState(initial?.keySets ?? 1);
  const [condition, setCondition] = useState<KeyCondition>(
    initial?.keyCondition ?? 'good',
  );
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [photos, setPhotos] = useState<string[]>(initial?.photoUrls ?? []);
  const [noImageOpen, setNoImageOpen] = useState(false);

  const applyParty = (next: HandoverParty) => {
    setParty(next);
    if (next === 'tenant') {
      setContactName(job.tenantName ?? '');
      setPhone(job.tenantPhone ?? '');
      setEmail(job.tenantEmail ?? '');
      setAgencyName('');
    } else {
      setContactName(job.agentName ?? '');
      setPhone(job.agentPhone ?? '');
      setEmail(job.agentEmail ?? '');
      setAgencyName(job.agentCompany ?? '');
    }
  };

  const accent = party === 'agent' ? 'agent' : 'tenant';
  const accentBtn =
    party === 'agent'
      ? 'bg-sky-500 text-white hover:bg-sky-500/90'
      : 'bg-emerald-500 text-white hover:bg-emerald-500/90';

  const submit = async () => {
    if (!party) {
      toast.error('Select handover with tenant or with agent.');
      return;
    }
    if (photos.length === 0) {
      setNoImageOpen(true);
      return;
    }

    const record: KeyPhaseRecord = {
      completedAt: new Date().toISOString(),
      stepsConfirmed: true,
      photoConfirmed: true,
      photoUrls: photos,
      handoverParty: party,
      keySets,
      keyCondition: condition,
      contactName: contactName.trim(),
      contactPhone: phone.trim() || undefined,
      contactEmail: email.trim() || undefined,
      agencyName: party === 'agent' ? agencyName.trim() || undefined : undefined,
      notes: notes.trim() || undefined,
    };
    record.notes = formatHandoverNotes(record, mode);
    await onSubmit(record);
  };

  return (
    <div className="space-y-4">
      {job.keyAccess?.code ? (
        <p className="rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-3 text-center font-mono text-lg font-bold tracking-widest text-primary">
          {job.keyAccess.code}
        </p>
      ) : null}
      {job.keyAccess?.location ? (
        <p className="text-muted-foreground text-xs">{job.keyAccess.location}</p>
      ) : null}

      <p className="text-muted-foreground text-xs">{copy.selectWho}</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => applyParty('tenant')}
          className={cn(
            'relative rounded-xl border p-3 text-left transition',
            party === 'tenant'
              ? 'border-emerald-400 bg-emerald-500/10'
              : 'border-border bg-card',
          )}
        >
          {party === 'tenant' ? (
            <Check className="absolute top-2 right-2 size-4 text-emerald-400" />
          ) : null}
          <Users className="size-5 text-emerald-400" />
          <p className="mt-2 text-xs font-semibold">Handover with tenant</p>
          <p className="text-muted-foreground mt-1 text-[10px] leading-snug">
            {copy.tenantHint}
          </p>
        </button>
        <button
          type="button"
          onClick={() => applyParty('agent')}
          className={cn(
            'relative rounded-xl border p-3 text-left transition',
            party === 'agent'
              ? 'border-sky-400 bg-sky-500/10'
              : 'border-border bg-card',
          )}
        >
          {party === 'agent' ? (
            <Check className="absolute top-2 right-2 size-4 text-sky-400" />
          ) : null}
          <Building2 className="size-5 text-sky-400" />
          <p className="mt-2 text-xs font-semibold">Handover with agent</p>
          <p className="text-muted-foreground mt-1 text-[10px] leading-snug">
            {copy.agentHint}
          </p>
        </button>
      </div>

      <JobPropertyHeader
        job={job}
        inspectorName={inspectorName}
        origin={deviceLocation ?? undefined}
      />

      {party ? (
        <>
          <section className="space-y-3 rounded-xl border border-border bg-card p-3">
            <p className="flex items-center gap-2 text-xs font-semibold">
              {party === 'tenant' ? (
                <Users className="size-3.5 text-emerald-400" />
              ) : (
                <Building2 className="size-3.5 text-sky-400" />
              )}
              {party === 'tenant' ? 'Tenant details' : 'Agent details'}
            </p>

            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground text-xs">
                {party === 'tenant' ? 'Tenant name' : 'Agent name'}
              </span>
              <span className="text-foreground max-w-[60%] truncate text-right text-sm">
                {contactName.trim() || '—'}
              </span>
            </div>

            {party === 'agent' ? (
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-muted-foreground text-xs">Agency</span>
                <span className="text-foreground max-w-[60%] truncate text-right text-sm">
                  {agencyName.trim() || '—'}
                </span>
              </div>
            ) : null}

            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Phone</span>
              <div className="flex items-center gap-2">
                <span className="bg-secondary/60 text-foreground min-h-8 flex-1 rounded-md px-3 py-1.5 text-sm">
                  {phone.trim() || '—'}
                </span>
                {phone.trim() ? (
                  <ContactAction href={`tel:${phone}`} accent={accent}>
                    <Phone className="size-3.5" />
                  </ContactAction>
                ) : null}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Email</span>
              <div className="flex items-center gap-2">
                <span className="bg-secondary/60 text-foreground min-h-8 flex-1 truncate rounded-md px-3 py-1.5 text-sm">
                  {email.trim() || '—'}
                </span>
                {email.trim() ? (
                  <ContactAction href={`mailto:${email}`} accent={accent}>
                    <Mail className="size-3.5" />
                  </ContactAction>
                ) : null}
              </div>
            </div>
          </section>

          <section className="space-y-3 rounded-xl border border-border bg-card p-3">
            <p className="text-xs font-semibold">
              {copy.keysHeading(party)}
            </p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-xs">
                {copy.keySets}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="border-border flex size-8 items-center justify-center rounded-md border"
                  onClick={() => setKeySets((n) => Math.max(0, n - 1))}
                  aria-label="Decrease key sets"
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-semibold">{keySets}</span>
                <button
                  type="button"
                  className={cn(
                    'flex size-8 items-center justify-center rounded-md text-white',
                    party === 'agent' ? 'bg-sky-500' : 'bg-emerald-500',
                  )}
                  onClick={() => setKeySets((n) => Math.min(20, n + 1))}
                  aria-label="Increase key sets"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-muted-foreground text-xs">Condition of keys</p>
              <div className="grid grid-cols-2 gap-2">
                {(['good', 'damaged'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCondition(value)}
                    className={cn(
                      'rounded-lg px-3 py-2 text-xs font-semibold capitalize',
                      condition === value
                        ? party === 'agent'
                          ? 'bg-sky-500 text-white'
                          : 'bg-emerald-500 text-white'
                        : 'bg-secondary text-muted-foreground',
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-2 rounded-xl border border-border bg-card p-3">
            <Label htmlFor="handover-notes">Notes (optional)</Label>
            <textarea
              id="handover-notes"
              maxLength={NOTES_MAX}
              rows={3}
              placeholder="Add any notes about the handover..."
              value={notes}
              onChange={(e) => setNotes(stripEmojis(e.target.value).slice(0, NOTES_MAX))}
              className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            />
            <p className="text-muted-foreground text-right text-[10px]">
              {notes.length}/{NOTES_MAX}
            </p>
          </section>

          <section className="space-y-2 rounded-xl border border-border bg-card p-3">
            <p className="flex items-center justify-between text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5">
                <Camera className="size-3.5" />
                Handover photos
              </span>
              <span className="text-muted-foreground font-normal">
                {photos.length}/5
              </span>
            </p>
            <p className="text-muted-foreground text-[11px]">
              At least one photo is required to record the handover.
            </p>
            <KeyPhasePhotoField
              label=""
              photos={photos}
              onChange={setPhotos}
            />
          </section>

          <Button
            type="button"
            className={cn('w-full', accentBtn)}
            disabled={submitting}
            onClick={() => void submit()}
          >
            {submitting ? 'Uploading proof…' : 'Handover Completed'}
            <ChevronRight className="size-4" />
          </Button>
        </>
      ) : null}

      <NoImageDialog
        open={noImageOpen}
        onClose={() => setNoImageOpen(false)}
        message="Add at least one handover photo before completing this step."
      />
    </div>
  );
}
