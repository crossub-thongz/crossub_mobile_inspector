'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  CalendarClock,
  Check,
  Clock,
  MapPin,
  Route,
  TriangleAlert,
} from 'lucide-react';

import { EmptyState } from '@/components/inspector/empty-state';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  OPEN_BATCH_EMPTY,
  OPEN_BATCH_STATE,
  OPEN_BATCH_STATE_TONE,
  OPEN_ROUTE_BASIS_NOTE,
  OPEN_TIME_PENDING_LABEL,
} from '@/constants/open-batch';
import {
  confirmOpenBatch,
  fetchOpenBatch,
  fetchOpenBatchPlan,
  releaseOpenBatch,
  selectOpenBatch,
  type OpenBatchOverview,
  type OpenBatchPlan,
  type OpenBatchTimeOverride,
} from '@/lib/crossub-api/inspector-client';
import {
  formatDuration,
  formatOpenDate,
  formatOpenDeadline,
  formatOpenTime,
  formatPlanWindow,
  fromSydneyInputValue,
  stopsMissingAgentPreference,
  toSydneyInputValue,
} from '@/lib/open-batch';
import { cn } from '@/lib/utils';

/**
 * OPEN TASK POOL — the inspector's half of the weekly open flow.
 *
 * Two panes on one screen because they are two halves of one decision:
 *
 *   1. Pick the properties (step 3). Multi-select, submitted together — the route, and
 *      therefore every suggested time, is a property of the whole set. Picking them one
 *      at a time would suggest the same 9:00am start for all of them.
 *   2. Check the routed day and confirm, or nudge a time and confirm (steps 5–6). The
 *      moment that lands, the agent is emailed the time; nothing before it tells them
 *      anything, so this screen is the last place a mistake is cheap.
 *
 * Selection is closed until Wednesday noon (note 2). The list is still SHOWN in that
 * window — an inspector who can see Saturday filling up plans their week around it, and a
 * disabled button with no explanation reads as a broken app.
 */
export default function OpenBatchPage() {
  const { receivingJobs } = useInspectorData();
  const [overview, setOverview] = useState<OpenBatchOverview | null>(null);
  const [plan, setPlan] = useState<OpenBatchPlan | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [batch, current] = await Promise.all([
        fetchOpenBatch(),
        fetchOpenBatchPlan(),
      ]);
      setOverview(batch);
      setPlan(current);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the open pool.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const togglePick = (inspectionId: string) => {
    setPicked((prior) => {
      const next = new Set(prior);
      if (next.has(inspectionId)) next.delete(inspectionId);
      else next.add(inspectionId);
      return next;
    });
  };

  const submitSelection = async () => {
    if (picked.size === 0 || !overview) return;
    setBusy(true);
    try {
      const routed = await selectOpenBatch([...picked]);
      setPlan(routed);
      setPicked(new Set());
      // Overflow is the one outcome that must never pass silently: those properties were
      // handed back to the pool and nobody is covering them on Saturday.
      if (routed.overflow.length > 0) {
        toast.warning(
          `${routed.overflow.length} did not fit the day and went back to the pool`,
          {
            description: routed.overflow.map((o) => o.address).join(', '),
          },
        );
      } else {
        toast.success(`Routed ${routed.stops.length} opens — check the times below`);
      }
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not submit your picks.');
    } finally {
      setBusy(false);
    }
  };

  const submitConfirm = async () => {
    if (!plan) return;
    setBusy(true);
    try {
      const overrides: OpenBatchTimeOverride[] = [];
      for (const [inspectionId, value] of Object.entries(edits)) {
        const iso = fromSydneyInputValue(value);
        if (!iso) {
          toast.error('One of the edited times is not a valid time.');
          setBusy(false);
          return;
        }
        overrides.push({ inspectionId, startTime: iso });
      }
      const confirmed = await confirmOpenBatch(overrides);
      setPlan(confirmed);
      setEdits({});
      toast.success('Open times confirmed — the agents have been told');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not confirm.');
    } finally {
      setBusy(false);
    }
  };

  const dropStop = async (inspectionId: string) => {
    setBusy(true);
    try {
      const remaining = await releaseOpenBatch([inspectionId]);
      setPlan(remaining);
      toast.success('Returned to the pool');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not release it.');
    } finally {
      setBusy(false);
    }
  };

  const missedPreferences = useMemo(
    () => (plan ? stopsMissingAgentPreference(plan) : []),
    [plan],
  );

  const selectable = Boolean(overview?.selectable) && receivingJobs;
  const atLimit =
    overview !== null &&
    (plan?.stops.length ?? 0) + picked.size >= overview.maxSelectable;
  const allConfirmed = Boolean(plan?.confirmed);

  return (
    <InspectorShell title="Open Task Pool">
      <div className="space-y-4">
        {overview && (
          <div
            className={cn(
              'rounded-xl border px-4 py-3',
              OPEN_BATCH_STATE_TONE[overview.state],
            )}
          >
            <p className="text-xs font-semibold">{overview.stateLabel}</p>
            <div className="text-muted-foreground mt-2 space-y-0.5 text-[11px]">
              <p className="flex items-center gap-1.5">
                <CalendarClock className="size-3" />
                Opens run {formatOpenDate(overview.viewingDate)}
              </p>
              {overview.state === OPEN_BATCH_STATE.ACCUMULATING ? (
                <p>Selection opens {formatOpenDeadline(overview.selectionOpensAt)}</p>
              ) : (
                <p>Confirm by {formatOpenDeadline(overview.finalizeBy)}</p>
              )}
            </div>
          </div>
        )}

        {error ? (
          <EmptyState
            icon={TriangleAlert}
            title="Could not load the open pool"
            description={error}
          />
        ) : loading ? (
          <EmptyState
            icon={Route}
            title="Loading the batch…"
            description="Fetching this week's open properties."
          />
        ) : (
          <>
            {/* ---------------------------- The planned day ---------------------------- */}
            {plan && plan.stops.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-primary text-xs font-bold tracking-widest">
                    YOUR SATURDAY
                  </h2>
                  <span className="text-muted-foreground text-[10px] tabular-nums">
                    {formatPlanWindow(plan)}
                  </span>
                </div>

                <div className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 text-[10px] tabular-nums">
                  <span>{plan.stops.length} opens</span>
                  <span>{formatDuration(plan.totalTravelMinutes)} travel</span>
                  {/* Only shown when at least one leg was a real measurement — a distance
                      derived from suburb centroids would be a fabricated number. */}
                  {plan.totalDistanceKm !== null &&
                    plan.totalDistanceKm !== undefined && (
                      <span>{plan.totalDistanceKm} km</span>
                    )}
                </div>

                {missedPreferences.length > 0 && !allConfirmed && (
                  <div className="border-border bg-muted/40 text-muted-foreground rounded-lg border px-3 py-2 text-[11px]">
                    <span className="text-foreground font-medium">
                      {missedPreferences.length}{' '}
                      {missedPreferences.length === 1 ? 'agent' : 'agents'} asked for a
                      different time.
                    </span>{' '}
                    They will be told the confirmed time and that it moved. Nudge a slot
                    below if you can make theirs work.
                  </div>
                )}

                {plan.stops.map((stop) => {
                  const editing = edits[stop.inspectionId];
                  const basisNote = OPEN_ROUTE_BASIS_NOTE[stop.basis];
                  return (
                    <Card key={stop.inspectionId}>
                      <CardContent className="space-y-2 p-3">
                        <div className="flex items-start gap-3">
                          <div className="bg-secondary text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold tabular-nums">
                            {stop.sequence}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {stop.address}
                            </p>
                            <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
                              <span className="text-foreground font-semibold tabular-nums">
                                {formatOpenTime(stop.startTime)}
                              </span>
                              {stop.travelMinutesFromPrevious > 0 && (
                                <span className="flex items-center gap-1">
                                  <Clock className="size-3" />
                                  {formatDuration(stop.travelMinutesFromPrevious)} travel
                                </span>
                              )}
                              {stop.distanceKmFromPrevious !== null &&
                                stop.distanceKmFromPrevious !== undefined && (
                                  <span className="flex items-center gap-1 tabular-nums">
                                    <MapPin className="size-3" />
                                    {stop.distanceKmFromPrevious} km
                                  </span>
                                )}
                            </div>
                            {basisNote && (
                              <p className="text-muted-foreground mt-1 text-[10px] italic">
                                {basisNote}
                              </p>
                            )}
                            {stop.confirmedAt && (
                              <p className="text-primary mt-1 flex items-center gap-1 text-[10px] font-medium">
                                <Check className="size-3" />
                                Confirmed — agent notified
                              </p>
                            )}
                          </div>
                        </div>

                        {!stop.confirmedAt && (
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="datetime-local"
                              className="border-border bg-background h-8 flex-1 rounded-md border px-2 text-xs tabular-nums"
                              value={editing ?? toSydneyInputValue(stop.startTime)}
                              onChange={(e) =>
                                setEdits((prior) => ({
                                  ...prior,
                                  [stop.inspectionId]: e.target.value,
                                }))
                              }
                              aria-label={`Open time for ${stop.address}`}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={busy}
                              onClick={() => void dropStop(stop.inspectionId)}
                            >
                              Drop
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}

                {!allConfirmed && (
                  <Button
                    className="w-full"
                    disabled={busy}
                    onClick={() => void submitConfirm()}
                  >
                    {Object.keys(edits).length > 0
                      ? 'Save times and confirm'
                      : 'Confirm these times'}
                  </Button>
                )}
              </section>
            )}

            {/* ------------------------------ The pool ------------------------------ */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-primary text-xs font-bold tracking-widest">
                  WAITING TO BE OPENED
                </h2>
                {overview && (
                  <span className="text-muted-foreground text-[10px] tabular-nums">
                    {overview.available.length} available
                  </span>
                )}
              </div>

              {!receivingJobs ? (
                <EmptyState
                  icon={Route}
                  title={OPEN_BATCH_EMPTY.NOT_RECEIVING.title}
                  description={OPEN_BATCH_EMPTY.NOT_RECEIVING.description}
                />
              ) : overview && overview.available.length === 0 ? (
                <EmptyState
                  icon={Route}
                  title={
                    overview.takenByOthers > 0
                      ? OPEN_BATCH_EMPTY.ALL_TAKEN.title
                      : OPEN_BATCH_EMPTY.NO_PROPERTIES.title
                  }
                  description={
                    overview.takenByOthers > 0
                      ? OPEN_BATCH_EMPTY.ALL_TAKEN.description
                      : OPEN_BATCH_EMPTY.NO_PROPERTIES.description
                  }
                />
              ) : (
                overview?.available.map((item) => {
                  const chosen = picked.has(item.inspectionId);
                  return (
                    <button
                      key={item.inspectionId}
                      type="button"
                      disabled={!selectable || (atLimit && !chosen)}
                      onClick={() => togglePick(item.inspectionId)}
                      aria-pressed={chosen}
                      className={cn(
                        'border-border bg-card w-full rounded-xl border p-3 text-left transition-colors',
                        chosen && 'border-primary bg-primary/5',
                        (!selectable || (atLimit && !chosen)) &&
                          'cursor-not-allowed opacity-60',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border',
                            chosen
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border',
                          )}
                        >
                          {chosen && <Check className="size-3.5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{item.address}</p>
                          <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px]">
                            {/* Never render a provisional placeholder as an open time —
                                an agent who sees one will advertise it. */}
                            <span>
                              {item.timeProvisional
                                ? OPEN_TIME_PENDING_LABEL
                                : item.suggestedStart
                                  ? formatOpenTime(item.suggestedStart)
                                  : OPEN_TIME_PENDING_LABEL}
                            </span>
                            {item.agentPreferredStart && (
                              <span className="italic">
                                agent asked {formatOpenTime(item.agentPreferredStart)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}

              {picked.size > 0 && (
                <div className="bg-background/95 sticky bottom-20 space-y-2 pt-2 backdrop-blur">
                  <Button
                    className="w-full"
                    disabled={busy || !selectable}
                    onClick={() => void submitSelection()}
                  >
                    Submit {picked.size}{' '}
                    {picked.size === 1 ? 'property' : 'properties'} and plan my route
                  </Button>
                </div>
              )}

              {overview && !overview.selectable && receivingJobs && (
                <p className="text-muted-foreground text-center text-[11px]">
                  You can pick from {formatOpenDeadline(overview.selectionOpensAt)}.
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </InspectorShell>
  );
}
