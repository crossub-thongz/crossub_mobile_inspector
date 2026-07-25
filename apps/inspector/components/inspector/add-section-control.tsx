'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  normalizeSectionName,
  validateNewSectionName,
} from '@/lib/inspection-section-utils';

type AddSectionControlProps = {
  optionalSections: readonly string[];
  activeSections: readonly string[];
  busy?: boolean;
  onAddSection: (section: string) => void;
};

export function AddSectionControl({
  optionalSections,
  activeSections,
  busy = false,
  onAddSection,
}: AddSectionControlProps) {
  const [sectionName, setSectionName] = useState('');
  const [pick, setPick] = useState('');
  const [error, setError] = useState<string | null>(null);

  const availableOptional = optionalSections.filter(
    (section) => !activeSections.includes(section),
  );

  const commitSection = (raw: string) => {
    const validationError = validateNewSectionName(raw, activeSections);
    if (validationError) {
      setError(validationError);
      return;
    }
    onAddSection(normalizeSectionName(raw));
    setSectionName('');
    setPick('');
    setError(null);
  };

  return (
    <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
      <Label htmlFor="section-name">Add section</Label>
      <p className="text-muted-foreground text-xs">
        Name the section, then snap or upload photos on the card above before moving
        to the next area.
      </p>
      <div className="flex gap-2">
        <Input
          id="section-name"
          value={sectionName}
          placeholder="e.g. Built-in wardrobe, Pantry shelf"
          disabled={busy}
          onChange={(event) => {
            setSectionName(event.target.value);
            setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commitSection(sectionName);
            }
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="shrink-0"
          disabled={busy || !sectionName.trim()}
          onClick={() => commitSection(sectionName)}
        >
          <Plus className="size-4" />
          Add
        </Button>
      </div>
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
      {availableOptional.length > 0 ? (
        <div className="flex gap-2 pt-1">
          <select
            className="border-input bg-background h-9 min-w-0 flex-1 rounded-md border px-3 text-sm"
            value={pick}
            disabled={busy}
            onChange={(event) => {
              const value = event.target.value;
              setPick(value);
              if (value) {
                setSectionName(value);
                setError(null);
              }
            }}
          >
            <option value="">Or pick a common section…</option>
            {availableOptional.map((section) => (
              <option key={section} value={section}>
                {section}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </div>
  );
}
