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
  GetTodosBySpaceUseCase, 
  GetProblemsBySpaceUseCase,
  GetDataEntriesBySpaceUseCase
} from '@/application/use-cases'; // Assuming barrel export

interface UseSpaceMetricsProps {
  spaceId: string;
  getActionLogsBySpaceUseCase: GetActionLogsBySpaceUseCase;
  getDataEntriesBySpaceUseCase: GetDataEntriesBySpaceUseCase;
  getTodosBySpaceUseCase: GetTodosBySpaceUseCase;
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
  isLoadingMetricsData: boolean;
  metricsError: string | null;
  refreshAllMetricsData: () => Promise<void>;
  addOptimisticActionLog: (log: ActionLog) => void;
  addOptimisticDataEntryLog: (log: DataEntryLog) => void;
  setTodosForMetrics: (todos: Todo[]) => void; // For optimistic todo updates
  setProblemsForMetrics: (problems: Problem[]) => void; // For optimistic problem updates
}

export function useSpaceMetrics({
  spaceId,
  getActionLogsBySpaceUseCase,
  getDataEntriesBySpaceUseCase,
  getTodosBySpaceUseCase,
  getProblemsBySpaceUseCase,
  clockEventsForSpace,
}: UseSpaceMetricsProps): UseSpaceMetricsReturn {
  const [actionLogsForSpace, setActionLogsForSpace] = useState<ActionLog[]>([]);
  const [dataEntriesForSpace, setDataEntriesForSpace] = useState<DataEntryLog[]>([]);
  const [allTodosForSpace, setAllTodosForSpace] = useState<Todo[]>([]);
  const [problemsForSpace, setProblemsForSpace] = useState<Problem[]>([]);
  
  const [isLoadingMetricsData, setIsLoadingMetricsData] = useState(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  const fetchAllMetricsRelatedData = useCallback(async () => {
    if (!spaceId) return;
    setIsLoadingMetricsData(true);
    setMetricsError(null);
    try {
      const [actions, dataEntries, todosData, problemsData] = await Promise.all([
        getActionLogsBySpaceUseCase.execute(spaceId),
        getDataEntriesBySpaceUseCase.execute(spaceId),
        getTodosBySpaceUseCase.execute(spaceId),
        getProblemsBySpaceUseCase.execute(spaceId),
      ]);
      setActionLogsForSpace(actions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setDataEntriesForSpace(dataEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setAllTodosForSpace(todosData.sort((a,b) => (a.order || 0) - (b.order || 0) || new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()));
      setProblemsForSpace(problemsData.sort((a,b) => (a.resolved === b.resolved) ? (new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) : a.resolved ? 1 : -1));
    } catch (err: any) {
      console.error("Error refreshing metrics related data:", err);
      setMetricsError(err.message || String(err));
    } finally {
      setIsLoadingMetricsData(false);
    }
  }, [spaceId, getActionLogsBySpaceUseCase, getDataEntriesBySpaceUseCase, getTodosBySpaceUseCase, getProblemsBySpaceUseCase]);

  useEffect(() => {
    if (spaceId) {
      fetchAllMetricsRelatedData();
    }
  }, [spaceId, fetchAllMetricsRelatedData]);

  const calculatedMetrics = useMemo(() => {
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

  const addOptimisticActionLog = useCallback((log: ActionLog) => {
    setActionLogsForSpace(prev => [log, ...prev].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  }, []);

  const addOptimisticDataEntryLog = useCallback((log: DataEntryLog) => {
    setDataEntriesForSpace(prev => [log, ...prev].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  }, []);
  
  const setTodosForMetrics = useCallback((todos: Todo[]) => {
    setAllTodosForSpace(todos.sort((a,b) => (a.order || 0) - (b.order || 0) || new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()));
  }, []);

  const setProblemsForMetrics = useCallback((problems: Problem[]) => {
    setProblemsForSpace(problems.sort((a,b) => (a.resolved === b.resolved) ? (new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) : a.resolved ? 1 : -1));
  }, []);

  return {
    ...calculatedMetrics,
    isLoadingMetricsData,
    metricsError,
    refreshAllMetricsData: fetchAllMetricsRelatedData,
    addOptimisticActionLog,
    addOptimisticDataEntryLog,
    setTodosForMetrics,
    setProblemsForMetrics,
  };
}
