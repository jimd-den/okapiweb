
// src/hooks/data/use-space-metrics.ts
"use client";

import { useMemo } from 'react';
import type { ActionLog } from '@/domain/entities/action-log.entity';
import type { DataEntryLog } from '@/domain/entities/data-entry-log.entity';
import type { Todo } from '@/domain/entities/todo.entity';
import type { Problem } from '@/domain/entities/problem.entity';
import type { ClockEvent } from '@/domain/entities/clock-event.entity';

interface UseSpaceMetricsProps {
  actionLogsForSpace: ActionLog[];
  dataEntriesForSpace: DataEntryLog[];
  allTodosForSpace: Todo[];
  problemsForSpace: Problem[];
  clockEventsForSpace: ClockEvent[];
}

export interface SpaceMetrics {
  totalActionPoints: number;
  todoStatusItems: Todo[];
  doingStatusItems: Todo[];
  doneStatusItems: Todo[];
  unresolvedProblemsCount: number;
  resolvedProblemsCount: number;
  totalClockedInMs: number;
  currentSessionStart: Date | null;
  isCurrentlyClockedIn: boolean;
}

export function useSpaceMetrics({
  actionLogsForSpace,
  dataEntriesForSpace,
  allTodosForSpace,
  problemsForSpace,
  clockEventsForSpace,
}: UseSpaceMetricsProps): SpaceMetrics {
  return useMemo(() => {
    const totalActionPoints =
      (actionLogsForSpace || []).reduce((sum, log) => sum + log.pointsAwarded, 0) +
      (dataEntriesForSpace || []).reduce((sum, entry) => sum + entry.pointsAwarded, 0);

    const todoStatusItems = (allTodosForSpace || []).filter(t => t.status === 'todo');
    const doingStatusItems = (allTodosForSpace || []).filter(t => t.status === 'doing');
    const doneStatusItems = (allTodosForSpace || []).filter(t => t.status === 'done');

    const unresolvedProblemsCount = (problemsForSpace || []).filter(p => !p.resolved).length;
    const resolvedProblemsCount = (problemsForSpace || []).filter(p => p.resolved).length;

    let totalClockedInMs = 0;
    let currentSessionStart: Date | null = null;
    let isCurrentlyClockedIn = false;

    const sortedClockEvents = [...(clockEventsForSpace || [])].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    let lastClockInTime: Date | null = null;

    sortedClockEvents.forEach(event => {
      if (event.type === 'clock-in') {
        lastClockInTime = new Date(event.timestamp);
      } else if (event.type === 'clock-out' && lastClockInTime) {
        totalClockedInMs += new Date(event.timestamp).getTime() - lastClockInTime.getTime();
        lastClockInTime = null;
      }
    });

    if (lastClockInTime) {
      isCurrentlyClockedIn = true;
      currentSessionStart = lastClockInTime;
    }

    return {
      totalActionPoints,
      todoStatusItems,
      doingStatusItems,
      doneStatusItems,
      unresolvedProblemsCount,
      resolvedProblemsCount,
      totalClockedInMs,
      currentSessionStart,
      isCurrentlyClockedIn,
    };
  }, [actionLogsForSpace, dataEntriesForSpace, allTodosForSpace, problemsForSpace, clockEventsForSpace]);
}
