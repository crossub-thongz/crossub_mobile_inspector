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
  DEFAULT_AVAILABILITY_END_MINUTE,
  DEFAULT_AVAILABILITY_START_MINUTE,
  INVALID_WINDOW_MESSAGE,
} from '@/constants/availability';
import {
  daysInMonth,
  entriesToMap,
  formatSelectedDateLabel,
  isPastDateKey,
  isValidWindow,
  mapToEntries,
  minuteToTimeInput,
  monthRange,
  monthStartWeekday,
  parseTimeInput,
  sydneyTodayParts,
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
  const [startMinute, setStartMinute] = useState(DEFAULT_AVAILABILITY_START_MINUTE);
  const [endMinute, setEndMinute] = useState(DEFAULT_AVAILABILITY_END_MINUTE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [timeError, setTimeError] = useState<string | null>(null);

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
      setSelectedDates(new Set());
      setUnavailableDates(new Set());
      setTimeError(null);
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
    // Changing month reloads from the server, which used to drop the month's edits on the
    // floor without saying so. Make the inspector resolve them first.
    if (dirty) {
      toast.error('Save this month first, or discard the changes.');
      return;
    }
    const next = new Date(Date.UTC(year, month - 1 + delta, 1));
    setYear(next.getUTCFullYear());
    setMonth(next.getUTCMonth() + 1);
    setSelectedDates(new Set());
    setUnavailableDates(new Set());
    setTimeError(null);
  };

  const dateKeyForDay = (day: number) =>
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const toggleSelected = (dateKey: string) => {
    const next = new Set(selectedDates);
    const selecting = !next.has(dateKey);
    if (selecting) next.add(dateKey);
    else next.delete(dateKey);
    setSelectedDates(next);

    // The time inputs are hidden with no selection, so a stale error would block the save
    // with nothing on screen to explain it.
    if (next.size === 0) setTimeError(null);

    const entry = entriesByDate.get(dateKey);
    if (selecting && entry) {
      setStartMinute(entry.startMinute);
      setEndMinute(entry.endMinute);
    }
  };

  const markSelectedAvailable = () => {
    if (selectedDates.size === 0) {
      toast.error('Select one or more dates on the calendar');
      return;
    }
    if (!isValidWindow(startMinute, endMinute)) {
      setTimeError(INVALID_WINDOW_MESSAGE);
      toast.error(INVALID_WINDOW_MESSAGE);
      return;
    }
    setTimeError(null);
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
    setTimeError(null);
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

  /**
   * Setting hours *is* declaring availability — the previous version only rewrote dates that
   * were already marked, so picking dates, typing a window and pressing Save did nothing:
   * `dirty` stayed false and the Save button stayed disabled. Dates explicitly marked "not
   * available" are left alone; everything else in the selection takes the window.
   */
  const applyWindowToSelected = (nextStart: number, nextEnd: number) => {
    if (selectedDates.size === 0) return;
    if (!isValidWindow(nextStart, nextEnd)) {
      setTimeError(INVALID_WINDOW_MESSAGE);
      return;
    }
    setTimeError(null);
    const targets = [...selectedDates].filter(
      (dateKey) => !unavailableDates.has(dateKey) || entriesByDate.has(dateKey),
    );
    if (targets.length === 0) return;
    setEntriesByDate((current) => {
      const next = new Map(current);
      for (const dateKey of targets) {
        next.set(dateKey, { date: dateKey, startMinute: nextStart, endMinute: nextEnd });
      }
      return next;
    });
    setDirty(true);
  };

  const save = async () => {
    const entries = mapToEntries(entriesByDate).filter(
      (entry) => entry.date >= range.from && entry.date <= range.to,
    );
    // One inverted window makes the API reject the entire month, so name the day rather
    // than let the save fail with the server's message for a date the inspector can't see.
    const invalid = entries.find((entry) => !isValidWindow(entry.startMinute, entry.endMinute));
    if (invalid) {
      setTimeError(INVALID_WINDOW_MESSAGE);
      toast.error(`${INVALID_WINDOW_MESSAGE} Fix ${formatSelectedDateLabel(invalid.date)}.`);
      return;
    }

    setSaving(true);
    try {
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
      // Clearing the selection is the confirmation: selected days render amber, so without
      // this the days just saved never turn green and the save reads as having done nothing.
      setSelectedDates(new Set());
      setTimeError(null);
      setDirty(false);
      toast.success(
        savedEntries.size > 0
          ? `Availability saved — ${savedEntries.size} day${savedEntries.size === 1 ? '' : 's'} in ${monthLabel}`
          : `Availability saved — no available days in ${monthLabel}`,
      );
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
          Tap one or more dates (yellow), set your hours or mark{' '}
          <strong>Not available</strong> (red), then <strong>Save</strong>. A green dot means
          the day is published as available.
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
                    {/* Kept visible while selected — the amber selection used to hide the
                        mark, so marking a day looked like it had done nothing. */}
                    {isAvailable ? (
                      <span className="absolute bottom-1 size-1.5 rounded-full bg-emerald-500" />
                    ) : null}
                    {isUnavailable ? (
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
                      aria-invalid={timeError !== null}
                      value={minuteToTimeInput(startMinute)}
                      onChange={(e) => {
                        const next = parseTimeInput(e.target.value);
                        if (next === null) return;
                        setStartMinute(next);
                        applyWindowToSelected(next, endMinute);
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wide">To</Label>
                    <Input
                      type="time"
                      aria-invalid={timeError !== null}
                      value={minuteToTimeInput(endMinute)}
                      onChange={(e) => {
                        const next = parseTimeInput(e.target.value);
                        if (next === null) return;
                        setEndMinute(next);
                        applyWindowToSelected(startMinute, next);
                      }}
                    />
                  </div>
                </div>
                {timeError ? (
                  <p className="text-destructive text-[11px] font-medium">{timeError}</p>
                ) : (
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    {anySelectedAvailable
                      ? 'These hours apply to every selected date. Save to publish them.'
                      : 'Set your hours — the selected dates are marked available. Then save.'}
                  </p>
                )}
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

        <div className="space-y-2">
          <Button
            type="button"
            className="w-full"
            disabled={loading || saving || !dirty || timeError !== null}
            onClick={() => void save()}
          >
            {saving ? (
              <>
                <Loader2 className="mr-1.5 size-4 animate-spin" />
                Saving…
              </>
            ) : (
              `Save ${monthLabel}`
            )}
          </Button>
          {dirty ? (
            <div className="flex items-center justify-between gap-2">
              <p className="text-amber-600 text-[11px] font-medium dark:text-amber-400">
                Unsaved changes
              </p>
              <button
                type="button"
                disabled={saving}
                onClick={() => void load()}
                className="text-muted-foreground hover:text-foreground text-[11px] underline disabled:opacity-50"
              >
                Discard changes
              </button>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
