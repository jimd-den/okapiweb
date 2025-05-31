
// src/hooks/data/use-space-metrics.ts
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ActionLog } from '@/domain/entities/action-log.entity';
import type { DataEntryLog } from '@/domain/entities/data-entry-log.entity';
import type { Todo } from '@/domain/entities/todo.entity';
import type { Problem } from '@/domain/entities/problem.entity';
import type { ClockEvent } from '@/domain/entities/clock-event.entity';
import type {
  GetActionLogsBySpaceUseCase,
  GetProblemsBySpaceUseCase,
  GetDataEntriesBySpaceUseCase
} from '@/application/use-cases'; // Assuming barrel export

interface UseSpaceMetricsProps {
  spaceId: string;
  getActionLogsBySpaceUseCase: GetActionLogsBySpaceUseCase;
  getDataEntriesBySpaceUseCase: GetDataEntriesBySpaceUseCase;
  getProblemsBySpaceUseCase: GetProblemsBySpaceUseCase;
  clockEventsForSpace: ClockEvent[]; // Passed from useSpaceClockEventsData
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

export interface UseSpaceMetricsReturn extends SpaceMetrics {
  problemsForSpace: Problem[];
  dataEntriesForSpace: DataEntryLog[]; // Added this
  isLoadingMetricsData: boolean;
  metricsError: string | null;
  refreshAllMetricsData: () => Promise<void>;
  addOptimisticActionLog: (log: ActionLog) => void;
  addOptimisticDataEntryLog: (log: DataEntryLog) => void;
  setTodosForMetrics: (todos: Todo[]) => void;
  setProblemsForMetrics: (problems: Problem[]) => void;
}

export function useSpaceMetrics({
  spaceId,
  getActionLogsBySpaceUseCase,
  getDataEntriesBySpaceUseCase,
  getProblemsBySpaceUseCase,
  clockEventsForSpace,
}: UseSpaceMetricsProps): UseSpaceMetricsReturn {
  const [actionLogsForSpace, setActionLogsForSpace] = useState<ActionLog[]>([]);
  const [dataEntriesForSpace, setDataEntriesForSpace] = useState<DataEntryLog[]>([]);
  const [_allTodosForSpace, _setAllTodosForSpace] = useState<Todo[]>([]);
  const [_problemsForSpace, _setProblemsForSpace] = useState<Problem[]>([]);

  const [isLoadingMetricsData, setIsLoadingMetricsData] = useState(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  const fetchAllMetricsRelatedData = useCallback(async () => {
    if (!spaceId) return;
    setIsLoadingMetricsData(true);
    setMetricsError(null);
    try {
      const [actions, dataEntries, problemsData] = await Promise.all([
        getActionLogsBySpaceUseCase.execute(spaceId),
        getDataEntriesBySpaceUseCase.execute(spaceId),
        getProblemsBySpaceUseCase.execute(spaceId),
      ]);
      setActionLogsForSpace(actions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setDataEntriesForSpace(dataEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      _setProblemsForSpace(problemsData.sort((a,b) => (a.resolved === b.resolved) ? (new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) : a.resolved ? 1 : -1));
    } catch (err: any) {
      console.error("Error refreshing metrics related data (excluding todos):", err);
      setMetricsError(err.message || String(err));
    } finally {
      setIsLoadingMetricsData(false);
    }
  }, [spaceId, getActionLogsBySpaceUseCase, getDataEntriesBySpaceUseCase, getProblemsBySpaceUseCase]);

  useEffect(() => {
    if (spaceId) {
      fetchAllMetricsRelatedData();
    }
  }, [spaceId, fetchAllMetricsRelatedData]);

  const calculatedMetrics = useMemo(() => {
    const totalActionPoints =
      (actionLogsForSpace || []).reduce((sum, log) => sum + log.pointsAwarded, 0) +
      (dataEntriesForSpace || []).reduce((sum, entry) => sum + entry.pointsAwarded, 0);

    const todoStatusItems = (_allTodosForSpace || []).filter(t => t.status === 'todo');
    const doingStatusItems = (_allTodosForSpace || []).filter(t => t.status === 'doing');
    const doneStatusItems = (_allTodosForSpace || []).filter(t => t.status === 'done');

    const unresolvedProblemsCount = (_problemsForSpace || []).filter(p => !p.resolved).length;
    const resolvedProblemsCount = (_problemsForSpace || []).filter(p => p.resolved).length;

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
  }, [actionLogsForSpace, dataEntriesForSpace, _allTodosForSpace, _problemsForSpace, clockEventsForSpace]);

  const addOptimisticActionLog = useCallback((log: ActionLog) => {
    setActionLogsForSpace(prev => [log, ...prev].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  }, []);

  const addOptimisticDataEntryLog = useCallback((log: DataEntryLog) => {
    setDataEntriesForSpace(prev => [log, ...prev].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  }, []);

  const setTodosForMetrics = useCallback((todos: Todo[]) => {
    _setAllTodosForSpace(todos.sort((a,b) => (a.order || 0) - (b.order || 0) || new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()));
  }, []);

  const setProblemsForMetrics = useCallback((problems: Problem[]) => {
    _setProblemsForSpace(problems.sort((a,b) => (a.resolved === b.resolved) ? (new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) : a.resolved ? 1 : -1));
  }, []);

  return {
    ...calculatedMetrics,
    problemsForSpace: _problemsForSpace,
    dataEntriesForSpace, // Exporting this state
    isLoadingMetricsData,
    metricsError,
    refreshAllMetricsData: fetchAllMetricsRelatedData,
    addOptimisticActionLog,
    addOptimisticDataEntryLog,
    setTodosForMetrics,
    setProblemsForMetrics,
  };
}
