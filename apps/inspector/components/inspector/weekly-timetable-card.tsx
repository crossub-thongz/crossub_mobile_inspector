'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarClock, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
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
  DEFAULT_END_MINUTE,
  DEFAULT_START_MINUTE,
  daysInMonth,
  entriesToMap,
  formatSelectedDateLabel,
  isPastDateKey,
  mapToEntries,
  minuteToTimeInput,
  monthRange,
  monthStartWeekday,
  sydneyTodayParts,
  timeInputToMinute,
  WEEKDAY_HEADERS,
  type InspectorDateAvailabilityEntry,
} from '@/lib/inspector-timetable';
import { cn } from '@/lib/utils';

export function InspectorWeeklyTimetableCard() {
  const today = sydneyTodayParts();
  const [year, setYear] = useState(today.year);
  const [month, setMonth] = useState(today.month);
  const [entriesByDate, setEntriesByDate] = useState<
    Map<string, InspectorDateAvailabilityEntry>
  >(new Map());
  const [unavailableDates, setUnavailableDates] = useState<Set<string>>(new Set());
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [startMinute, setStartMinute] = useState(DEFAULT_START_MINUTE);
  const [endMinute, setEndMinute] = useState(DEFAULT_END_MINUTE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const range = useMemo(() => monthRange(year, month), [year, month]);
  const monthLabel = useMemo(
    () =>
      new Date(Date.UTC(year, month - 1, 1, 12)).toLocaleDateString('en-AU', {
        month: 'long',
        year: 'numeric',
        timeZone: 'Australia/Sydney',
      }),
    [year, month],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const timetable = await fetchInspectorTimetable(range.from, range.to);
      setEntriesByDate(entriesToMap(timetable.entries));
      setDirty(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load availability');
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => {
    void load();
  }, [load]);

  const shiftMonth = (delta: number) => {
    const next = new Date(Date.UTC(year, month - 1 + delta, 1));
    setYear(next.getUTCFullYear());
    setMonth(next.getUTCMonth() + 1);
    setSelectedDates(new Set());
    setUnavailableDates(new Set());
  };

  const dateKeyForDay = (day: number) =>
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const toggleSelected = (dateKey: string) => {
    setSelectedDates((current) => {
      const next = new Set(current);
      if (next.has(dateKey)) next.delete(dateKey);
      else next.add(dateKey);
      return next;
    });

    const entry = entriesByDate.get(dateKey);
    if (entry) {
      setStartMinute(entry.startMinute);
      setEndMinute(entry.endMinute);
    }
  };

  const markSelectedAvailable = () => {
    if (selectedDates.size === 0) {
      toast.error('Select one or more dates on the calendar');
      return;
    }
    if (endMinute <= startMinute) {
      toast.error('End time must be after start time');
      return;
    }
    setEntriesByDate((current) => {
      const next = new Map(current);
      for (const dateKey of selectedDates) {
        next.set(dateKey, { date: dateKey, startMinute, endMinute });
      }
      return next;
    });
    setUnavailableDates((current) => {
      const next = new Set(current);
      for (const dateKey of selectedDates) next.delete(dateKey);
      return next;
    });
    setDirty(true);
  };

  const markSelectedUnavailable = () => {
    if (selectedDates.size === 0) {
      toast.error('Select one or more dates on the calendar');
      return;
    }
    setEntriesByDate((current) => {
      const next = new Map(current);
      for (const dateKey of selectedDates) {
        next.delete(dateKey);
      }
      return next;
    });
    setUnavailableDates((current) => {
      const next = new Set(current);
      for (const dateKey of selectedDates) next.add(dateKey);
      return next;
    });
    setDirty(true);
  };

  const applyTimeToSelectedAvailable = (nextStart: number, nextEnd: number) => {
    if (selectedDates.size === 0) return;
    setEntriesByDate((current) => {
      const next = new Map(current);
      for (const dateKey of selectedDates) {
        if (!next.has(dateKey)) continue;
        next.set(dateKey, { date: dateKey, startMinute: nextStart, endMinute: nextEnd });
      }
      return next;
    });
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const entries = mapToEntries(entriesByDate).filter(
        (entry) => entry.date >= range.from && entry.date <= range.to,
      );
      const timetable = await saveInspectorTimetable(range.from, range.to, entries);
      const savedEntries = entriesToMap(timetable.entries);
      setEntriesByDate(savedEntries);
      setUnavailableDates((current) => {
        const next = new Set<string>();
        for (const dateKey of current) {
          if (dateKey >= range.from && dateKey <= range.to && !savedEntries.has(dateKey)) {
            next.add(dateKey);
          }
        }
        return next;
      });
      setDirty(false);
      toast.success('Availability saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save availability');
    } finally {
      setSaving(false);
    }
  };

  const startPad = monthStartWeekday(year, month);
  const totalDays = daysInMonth(year, month);
  const cells: Array<{ day: number; dateKey: string } | null> = [
    ...Array.from({ length: startPad }, () => null),
    ...Array.from({ length: totalDays }, (_, index) => {
      const day = index + 1;
      return { day, dateKey: dateKeyForDay(day) };
    }),
  ];

  const selectedList = [...selectedDates].sort();
  const selectedAvailableCount = selectedList.filter((key) => entriesByDate.has(key)).length;
  const anySelectedAvailable = selectedAvailableCount > 0;
  const showAvailableActive =
    selectedList.length > 0 && selectedList.every((key) => entriesByDate.has(key));
  const showUnavailableActive =
    selectedList.length > 0 &&
    selectedList.every((key) => unavailableDates.has(key) && !entriesByDate.has(key));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="size-4" />
          Availability calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-xs leading-relaxed">
          Select one or more dates (yellow), mark <strong>Available</strong> (green) or{' '}
          <strong>Not available</strong> (red), then save.
        </p>

        <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded border border-amber-400 bg-amber-400/30" />
            Selected
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded border border-emerald-500/50 bg-emerald-500/20" />
            Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded border border-red-500/50 bg-red-500/20" />
            Not available
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="size-8"
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <p className="text-sm font-semibold">{monthLabel}</p>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="size-8"
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        {loading ? (
          <div className="text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Loading calendar…
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {WEEKDAY_HEADERS.map((label) => (
                <div key={label} className="py-1">
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((cell, index) => {
                if (!cell) {
                  return <div key={`pad-${index}`} className="aspect-square" />;
                }

                const entry = entriesByDate.get(cell.dateKey);
                const isAvailable = Boolean(entry);
                const isUnavailable =
                  unavailableDates.has(cell.dateKey) && !isAvailable;
                const isSelected = selectedDates.has(cell.dateKey);
                const isPast = isPastDateKey(cell.dateKey);
                const isToday =
                  cell.dateKey ===
                  `${today.year}-${String(today.month).padStart(2, '0')}-${String(today.day).padStart(2, '0')}`;

                return (
                  <button
                    key={cell.dateKey}
                    type="button"
                    disabled={isPast}
                    onClick={() => toggleSelected(cell.dateKey)}
                    className={cn(
                      'relative flex aspect-square flex-col items-center justify-center rounded-lg border text-sm transition',
                      isPast && 'cursor-not-allowed opacity-40',
                      !isPast && 'hover:border-primary/40',
                      isSelected &&
                        'z-[1] border-amber-400 bg-amber-400/30 font-semibold text-amber-950 ring-2 ring-amber-400/60 dark:text-amber-50',
                      !isSelected &&
                        isAvailable &&
                        !isPast &&
                        'border-emerald-500/60 bg-emerald-500/20 font-semibold text-emerald-800 dark:text-emerald-200',
                      !isSelected &&
                        isUnavailable &&
                        !isPast &&
                        'border-red-500/60 bg-red-500/20 font-semibold text-red-800 dark:text-red-200',
                      !isSelected &&
                        !isAvailable &&
                        !isUnavailable &&
                        !isPast &&
                        'hover:bg-secondary/40',
                      isToday && !isSelected && 'border-primary/30',
                    )}
                  >
                    <span>{cell.day}</span>
                    {!isSelected && isAvailable ? (
                      <span className="absolute bottom-1 size-1.5 rounded-full bg-emerald-500" />
                    ) : null}
                    {!isSelected && isUnavailable ? (
                      <span className="absolute bottom-1 size-1.5 rounded-full bg-red-500" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {selectedList.length > 0 ? (
          <div className="space-y-3 rounded-xl border bg-background/40 p-3">
            <div>
              <p className="text-sm font-medium">
                {selectedList.length} date{selectedList.length === 1 ? '' : 's'} selected
              </p>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                {selectedList.map(formatSelectedDateLabel).join(' · ')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                size="sm"
                variant={showAvailableActive ? 'default' : 'outline'}
                className={cn(
                  'h-9',
                  showAvailableActive && 'bg-emerald-600 text-white hover:bg-emerald-700',
                )}
                onClick={markSelectedAvailable}
              >
                Available
              </Button>
              <Button
                type="button"
                size="sm"
                variant={showUnavailableActive ? 'default' : 'outline'}
                className={cn(
                  'h-9',
                  showUnavailableActive && 'bg-red-600 text-white hover:bg-red-700',
                )}
                onClick={markSelectedUnavailable}
              >
                Not available
              </Button>
            </div>

            {!showUnavailableActive ? (
              <>
                <div className="grid grid-cols-2 gap-3 border-t border-border/60 pt-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wide">From</Label>
                    <Input
                      type="time"
                      value={minuteToTimeInput(startMinute)}
                      onChange={(e) => {
                        const next = timeInputToMinute(e.target.value);
                        setStartMinute(next);
                        if (anySelectedAvailable) applyTimeToSelectedAvailable(next, endMinute);
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wide">To</Label>
                    <Input
                      type="time"
                      value={minuteToTimeInput(endMinute)}
                      onChange={(e) => {
                        const next = timeInputToMinute(e.target.value);
                        setEndMinute(next);
                        if (anySelectedAvailable) applyTimeToSelectedAvailable(startMinute, next);
                      }}
                    />
                  </div>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  {anySelectedAvailable
                    ? 'Time applies to all selected available dates. Tap Available to apply this window to newly selected dates.'
                    : 'Set your hours, then tap Available to mark the selected dates.'}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground border-t border-border/60 pt-3 text-[11px] leading-relaxed">
                Selected dates are marked unavailable — no time window is required.
              </p>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-center text-xs">
            Select one or more dates on the calendar.
          </p>
        )}

        <Button
          type="button"
          className="w-full"
          disabled={loading || saving || !dirty}
          onClick={() => void save()}
        >
          {saving ? (
            <>
              <Loader2 className="mr-1.5 size-4 animate-spin" />
              Saving…
            </>
          ) : (
            'Save month'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
