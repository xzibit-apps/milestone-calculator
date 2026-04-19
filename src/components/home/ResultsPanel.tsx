// components/home/ResultsPanel.tsx
import { AlertTriangle, Info } from 'lucide-react';
import { formatDate, countWorkingDays } from '@/lib/calculator';
import { MESSAGES } from '@/lib/constants';
import type { CalculationResult, ProjectInput } from '@/lib/types';
import ExportButtons from './ExportButtons';

interface ResultsPanelProps {
  result: CalculationResult | null;
  input: ProjectInput;
}

type StatusTone = 'mint' | 'sky' | 'amber' | 'coral' | 'lilac';

const bucketPalette: Record<string, StatusTone> = {
  low: 'mint',
  medium: 'sky',
  high: 'coral',
  // Legacy buckets (kept for backward compatibility only)
  fast_track: 'mint',
  standard: 'sky',
  custom: 'amber',
  high_risk: 'coral',
};

function getBucketTone(bucket: string): StatusTone {
  return bucketPalette[bucket] ?? 'lilac';
}

function getBucketLabel(bucket: string): string {
  switch (bucket) {
    case 'low':
      return MESSAGES.BUCKET_LOW;
    case 'medium':
      return MESSAGES.BUCKET_MEDIUM;
    case 'high':
      return MESSAGES.BUCKET_HIGH;
    case 'fast_track':
      return MESSAGES.BUCKET_FAST_TRACK;
    case 'standard':
      return MESSAGES.BUCKET_STANDARD;
    case 'custom':
      return MESSAGES.BUCKET_CUSTOM;
    default:
      return bucket;
  }
}

function getCompletenessTone(fraction: number): 'is-good' | 'is-warn' | 'is-bad' {
  if (fraction === 1) return 'is-good';
  if (fraction >= 0.5) return 'is-warn';
  return 'is-bad';
}

export default function ResultsPanel({ result, input }: ResultsPanelProps) {
  const bucket = result?.bucket || result?.leadBucket || 'unknown';
  const bucketTone = getBucketTone(bucket);

  return (
    <div className="card">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--xz-s-4)',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div className="card-eyebrow">Results</div>
          <div className="card-title">{MESSAGES.CALCULATED_SPECS}</div>
        </div>
        {result && <ExportButtons input={input} result={result} />}
      </div>

      <div style={{ marginTop: 'var(--xz-s-5)' }}>
        {!result ? (
          <div className="empty">
            <span className="plus" aria-hidden="true">+</span>
            {MESSAGES.NO_RESULTS}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--xz-s-6)' }}>
            {/* Complexity index + bucket as a two-column stat row */}
            <div className="stat-row">
              <div className="stat sky">
                <div className="stripe" />
                <div className="label">{MESSAGES.COMPLEXITY_INDEX}</div>
                <div className="value">{result.ci}</div>
              </div>
              <div className={`stat ${bucketTone}`}>
                <div className="stripe" />
                <div className="label">{MESSAGES.COMPLEXITY_BUCKET}</div>
                <div className="value" style={{ fontSize: '20px' }}>
                  <span className={`pill pill--${bucketTone}`}>
                    <span className="dot" aria-hidden="true" />
                    {getBucketLabel(bucket)}
                  </span>
                </div>
              </div>
            </div>

            {/* Milestone schedule */}
            {result.tasks && result.tasks.length > 0 ? (
              <div>
                <h3 className="h3" style={{ marginBottom: 'var(--xz-s-3)' }}>
                  {MESSAGES.MILESTONES}
                </h3>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--xz-s-2)',
                    maxHeight: 700,
                    overflowY: 'auto',
                  }}
                >
                  {result.tasks.map((task, index) => {
                    const isTruckLeave = task.id === 'truck_leave_date';
                    const days =
                      task.duration ??
                      (task.startDate && task.endDate
                        ? countWorkingDays(task.startDate, task.endDate)
                        : 0);
                    const hasDates = task.startDate !== null && task.endDate !== null;
                    return (
                      <div
                        key={task.id}
                        className={`milestone-row ${isTruckLeave ? 'milestone-row--anchor' : ''}`.trim()}
                      >
                        <div className="index">{String(index + 1).padStart(2, '0')}.</div>
                        <div className="body">
                          <div className="name">{task.name}</div>
                          {task.successFactor && (
                            <p className="note">{task.successFactor}</p>
                          )}
                        </div>
                        <div className="schedule">
                          <div className="cell">
                            <span className="label">Start</span>
                            <span className="value">
                              {hasDates ? formatDate(task.startDate) : 'TBC'}
                            </span>
                          </div>
                          <div className="cell">
                            <span className="label">End</span>
                            <span className="value">
                              {hasDates ? formatDate(task.endDate) : 'TBC'}
                            </span>
                          </div>
                          <div className="days">
                            <span className="label">Days</span>
                            <span className="num">{days}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="alert alert--warn" role="status">
                <span className="alert-icon" aria-hidden="true">
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <div className="alert-body">
                  <div className="alert-title">
                    {MESSAGES.TRUCK_LEAVE_DATE_REQUIRED_TITLE}
                  </div>
                  <div className="alert-text">
                    Enter a truck leave date to generate milestone dates.
                  </div>
                </div>
              </div>
            )}

            {/* Durations-only informational note */}
            {result.tasks &&
              result.tasks.length > 0 &&
              result.tasks[0].startDate === null && (
                <div className="alert alert--info" role="status">
                  <span className="alert-icon" aria-hidden="true">
                    <Info className="h-4 w-4" />
                  </span>
                  <div className="alert-body">
                    <div className="alert-title">Durations calculated</div>
                    <div className="alert-text">
                      Enter a truck leave date to generate milestone dates.
                    </div>
                  </div>
                </div>
              )}

            {/* Project timeline summary */}
            {result.tasks &&
              result.tasks.length > 0 &&
              result.tasks[0].startDate !== null &&
              result.tasks[result.tasks.length - 1].endDate !== null &&
              (() => {
                const firstTask = result.tasks[0];
                const lastTask = result.tasks[result.tasks.length - 1];
                const startDate = firstTask.startDate;
                const endDate = lastTask.endDate;
                if (!startDate || !endDate) return null;

                const totalWorkingDays = countWorkingDays(startDate, endDate);

                const formatDateDisplay = (date: Date) => {
                  const day = date.getDate();
                  const month = date.toLocaleDateString('en-US', { month: 'short' });
                  const year = date.getFullYear();
                  return { day, month, year };
                };

                const startFormatted = formatDateDisplay(startDate);
                const endFormatted = formatDateDisplay(endDate);

                return (
                  <div>
                    <h3 className="h3" style={{ marginBottom: 'var(--xz-s-3)' }}>
                      Project timeline
                    </h3>
                    <div className="stat-row">
                      <div className="stat sky">
                        <div className="stripe" />
                        <div className="label">Start date</div>
                        <div className="value" style={{ fontSize: '18px' }}>
                          {startFormatted.day} {startFormatted.month}{' '}
                          {startFormatted.year}
                        </div>
                      </div>
                      <div className="stat mint">
                        <div className="stripe" />
                        <div className="label">End date</div>
                        <div className="value" style={{ fontSize: '18px' }}>
                          {endFormatted.day} {endFormatted.month}{' '}
                          {endFormatted.year}
                        </div>
                      </div>
                      <div className="stat lilac">
                        <div className="stripe" />
                        <div className="label">Duration</div>
                        <div className="value">{totalWorkingDays}</div>
                        <div className="delta" style={{ marginTop: 4 }}>
                          working days
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

            {/* Information completeness */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--xz-s-2)',
                }}
              >
                <span className="meta">{MESSAGES.INFORMATION_COMPLETENESS}</span>
                <span className="h3">{Math.round(result.infoCompleteness * 100)}%</span>
              </div>
              <div className="progress">
                <div
                  className={`bar ${getCompletenessTone(result.infoCompleteness)}`}
                  style={{ width: `${result.infoCompleteness * 100}%` }}
                />
              </div>
              <p className="meta" style={{ marginTop: 'var(--xz-s-2)' }}>
                {Object.values(input.infoGates).filter(Boolean).length} /{' '}
                {Object.keys(input.infoGates).length} gates complete
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
