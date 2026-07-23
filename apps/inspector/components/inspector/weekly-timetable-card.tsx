'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  fetchInspectorTimetable,
  saveInspectorTimetable,
} from '@/lib/crossub-api/inspector-client';
import {
  INSPECTOR_WEEKDAY_LABELS,
  minuteToTimeInput,
  timeInputToMinute,
  type InspectorWeeklySlot,
} from '@/lib/inspector-timetable';

export function InspectorWeeklyTimetableCard() {
  const [slots, setSlots] = useState<InspectorWeeklySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const timetable = await fetchInspectorTimetable();
      setSlots(timetable.slots);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load timetable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateSlot = (dayOfWeek: number, patch: Partial<InspectorWeeklySlot>) => {
    setSlots((current) =>
      current.map((slot) =>
        slot.dayOfWeek === dayOfWeek ? { ...slot, ...patch } : slot,
      ),
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      const timetable = await saveInspectorTimetable(slots);
      setSlots(timetable.slots);
      toast.success('Weekly availability saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save timetable');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="size-4" />
          Weekly availability
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-xs leading-relaxed">
          Set the days and hours you can take pool jobs (routine, ingoing, outgoing). The task
          pool shows how many inspectors are available on each job&apos;s day. CROSSUB open
          inspections are Saturdays only.
        </p>

        {loading ? (
          <div className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Loading timetable…
          </div>
        ) : (
          <div className="space-y-3">
            {slots.map((slot) => (
              <div
                key={slot.dayOfWeek}
                className="rounded-xl border bg-background/40 px-3 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <Label className="text-sm font-medium">
                    {INSPECTOR_WEEKDAY_LABELS[slot.dayOfWeek]}
                  </Label>
                  <Button
                    type="button"
                    size="sm"
                    variant={slot.enabled ? 'default' : 'outline'}
                    className="h-8 text-xs"
                    onClick={() => updateSlot(slot.dayOfWeek, { enabled: !slot.enabled })}
                  >
                    {slot.enabled ? 'Available' : 'Off'}
                  </Button>
                </div>
                {slot.enabled ? (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase tracking-wide">From</Label>
                      <Input
                        type="time"
                        value={minuteToTimeInput(slot.startMinute)}
                        onChange={(e) =>
                          updateSlot(slot.dayOfWeek, {
                            startMinute: timeInputToMinute(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase tracking-wide">To</Label>
                      <Input
                        type="time"
                        value={minuteToTimeInput(slot.endMinute)}
                        onChange={(e) =>
                          updateSlot(slot.dayOfWeek, {
                            endMinute: timeInputToMinute(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}

        <Button
          type="button"
          className="w-full"
          disabled={loading || saving}
          onClick={() => void save()}
        >
          {saving ? (
            <>
              <Loader2 className="mr-1.5 size-4 animate-spin" />
              Saving…
            </>
          ) : (
            'Save availability'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
