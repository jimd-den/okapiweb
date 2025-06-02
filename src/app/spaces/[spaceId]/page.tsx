
// src/app/spaces/[spaceId]/page.tsx
"use client";

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Settings, Sun, Moon, Loader2 } from 'lucide-react';
import { useTheme } from "next-themes";
import { cn } from '@/lib/utils';

// Dialog Imports (Only SpaceSettingsDialog remains here directly, others are in widgets)
import { SpaceSettingsDialog } from '@/components/dialogs/space-settings-dialog';

// Widget Imports
import { SpaceMetricsDisplay } from '@/components/space-metrics-display';
import { QuickActionsWidget } from '@/components/widgets/QuickActionsWidget';
import { TodoSummaryWidget } from '@/components/widgets/TodoSummaryWidget';
import { ProblemSummaryWidget } from '@/components/widgets/ProblemSummaryWidget';
import { DataLogSummaryWidget } from '@/components/widgets/DataLogSummaryWidget';
import { TimelineSummaryWidget } from '@/components/widgets/TimelineSummaryWidget';


// Component Imports
import { ClockWidget } from '@/components/clock-widget';
import { Skeleton } from '@/components/ui/skeleton';

// Context Provider
import { SpaceDataProvider, useSpaceContext } from '@/contexts/SpaceDataProvider';

// Repositories (for use cases instantiated here)
import {
  IndexedDBActionDefinitionRepository,
  IndexedDBActionLogRepository,
  IndexedDBTodoRepository,
  IndexedDBProblemRepository,
  IndexedDBClockEventRepository,
  IndexedDBDataEntryLogRepository,
  IndexedDBSpaceRepository,
} from '@/infrastructure/persistence/indexeddb';

// Use Cases (Core use cases instantiated here)
import {
  UpdateSpaceUseCase, type UpdateSpaceUseCaseInputDTO,
  DeleteSpaceUseCase,
  GetTimelineItemsBySpaceUseCase,
  CreateTodoUseCase,
  GetTodosBySpaceUseCase,
  UpdateTodoUseCase,
  DeleteTodoUseCase,
  CreateProblemUseCase,
  GetProblemsBySpaceUseCase,
  UpdateProblemUseCase,
  DeleteProblemUseCase,
  GetDataEntriesBySpaceUseCase,
  GetActionLogsBySpaceUseCase,
  GetClockEventsBySpaceUseCase,
  GetLastClockEventUseCase,
  SaveClockEventUseCase,
  // type LogActionResult, // Not directly used here anymore
  // type LogDataEntryResult, // Not directly used here anymore
} from '@/application/use-cases';

// Hooks for data management (instantiated here)
import { useSpaceActionsData } from '@/hooks/data/use-space-actions-data';
import { useSpaceActionLogger } from '@/hooks/actions/use-space-action-logger';
import { useTimelineData } from '@/hooks/data/use-timeline-data';
import { useSpaceClockEvents } from '@/hooks/data/use-space-clock-events';
import { useSpaceMetrics } from '@/hooks/data/use-space-metrics';
import { useSpaceDialogs } from '@/hooks/use-space-dialogs';
import { useSpaceTodos } from '@/hooks/data/use-space-todos';

import type { Todo } from '@/domain/entities/todo.entity';


// Wrapper component to handle useParams and provide spaceId to the provider
export default function SpaceDashboardPageWrapper() {
  const params = useParams();
  const spaceIdFromParams = params.spaceId as string;

  if (!spaceIdFromParams) {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Loading Space Information...</p>
        <p className="text-sm text-muted-foreground">Space ID is missing or invalid.</p>
      </div>
    );
  }

  return (
    <SpaceDataProvider spaceId={spaceIdFromParams}>
      <SpaceDashboardPageContent />
    </SpaceDataProvider>
  );
}


function SpaceDashboardPageContent() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { space, isLoadingSpace, errorLoadingSpace, refreshSpace, spaceId } = useSpaceContext();
  const dialogs = useSpaceDialogs(); // Central dialog state management

  const [currentSessionDisplayMs, setCurrentSessionDisplayMs] = useState(0);

  // --- Repositories (memoized for use cases) ---
  const actionDefinitionRepository = useMemo(() => new IndexedDBActionDefinitionRepository(), []);
  const actionLogRepository = useMemo(() => new IndexedDBActionLogRepository(), []);
  const todoRepository = useMemo(() => new IndexedDBTodoRepository(), []);
  const problemRepository = useMemo(() => new IndexedDBProblemRepository(), []);
  const clockEventRepository = useMemo(() => new IndexedDBClockEventRepository(), []);
  const dataEntryLogRepository = useMemo(() => new IndexedDBDataEntryLogRepository(), []);
  const spaceRepositoryForUpdates = useMemo(() => new IndexedDBSpaceRepository(), []);

  // --- Core Use Cases (memoized) ---
  const updateSpaceUseCase = useMemo(() => new UpdateSpaceUseCase(spaceRepositoryForUpdates), [spaceRepositoryForUpdates]);
  const deleteSpaceUseCase = useMemo(() => new DeleteSpaceUseCase(spaceRepositoryForUpdates, actionDefinitionRepository, actionLogRepository, todoRepository, problemRepository, clockEventRepository, dataEntryLogRepository), [spaceRepositoryForUpdates, actionDefinitionRepository, actionLogRepository, todoRepository, problemRepository, clockEventRepository, dataEntryLogRepository]);
  const getTimelineItemsBySpaceUseCase = useMemo(() => new GetTimelineItemsBySpaceUseCase(actionLogRepository, actionDefinitionRepository, problemRepository, todoRepository, dataEntryLogRepository), [actionLogRepository, actionDefinitionRepository, problemRepository, todoRepository, dataEntryLogRepository]);
  const createTodoUseCase = useMemo(() => new CreateTodoUseCase(todoRepository), [todoRepository]);
  const getTodosBySpaceUseCase = useMemo(() => new GetTodosBySpaceUseCase(todoRepository), [todoRepository]);
  const updateTodoUseCase = useMemo(() => new UpdateTodoUseCase(todoRepository), [todoRepository]);
  const deleteTodoUseCase = useMemo(() => new DeleteTodoUseCase(todoRepository), [todoRepository]);
  const createProblemUseCase = useMemo(() => new CreateProblemUseCase(problemRepository), [problemRepository]);
  const getProblemsBySpaceUseCase = useMemo(() => new GetProblemsBySpaceUseCase(problemRepository), [problemRepository]);
  const updateProblemUseCase = useMemo(() => new UpdateProblemUseCase(problemRepository), [problemRepository]);
  const deleteProblemUseCase = useMemo(() => new DeleteProblemUseCase(problemRepository), [problemRepository]);
  const getDataEntriesBySpaceUseCase = useMemo(() => new GetDataEntriesBySpaceUseCase(dataEntryLogRepository), [dataEntryLogRepository]);
  const getActionLogsBySpaceUseCase = useMemo(() => new GetActionLogsBySpaceUseCase(actionLogRepository), [actionLogRepository]);
  const getClockEventsBySpaceUseCase = useMemo(() => new GetClockEventsBySpaceUseCase(clockEventRepository), [clockEventRepository]);
  const getLastClockEventUseCase = useMemo(() => new GetLastClockEventUseCase(clockEventRepository), [clockEventRepository]);
  const saveClockEventUseCase = useMemo(() => new SaveClockEventUseCase(clockEventRepository), [clockEventRepository]);

  // --- Data Fetching & Management Hooks ---
  const actionsDataHook = useSpaceActionsData({ // Renamed to avoid conflict
    spaceId, actionDefinitionRepository, actionLogRepository, dataEntryLogRepository
  });

  const clockEventsHook = useSpaceClockEvents({ // Renamed
    spaceId, saveClockEventUseCase, getLastClockEventUseCase, getClockEventsBySpaceUseCase,
  });

  const timelineDataHook = useTimelineData(spaceId, getTimelineItemsBySpaceUseCase); // Renamed

  const metricsHook = useSpaceMetrics({ // Renamed
    spaceId, getActionLogsBySpaceUseCase, getDataEntriesBySpaceUseCase, getProblemsBySpaceUseCase, clockEventsForSpace: clockEventsHook.clockEventsForSpace,
  });
  
  const todosHook = useSpaceTodos({ // Renamed
    spaceId, createTodoUseCase, updateTodoUseCase, deleteTodoUseCase, getTodosBySpaceUseCase,
    onTodosChanged: (updatedTodos: Todo[]) => {
      metricsHook.setTodosForMetrics(updatedTodos);
      timelineDataHook.refreshTimeline();
    },
  });

  const spaceActionLoggerHook = useSpaceActionLogger({ // Renamed
    spaceId, actionLogRepository, dataEntryLogRepository, actionDefinitionRepository,
    onActionLogged: (result) => {
      if (result.loggedAction) metricsHook.addOptimisticActionLog(result.loggedAction);
      timelineDataHook.refreshTimeline();
    },
    onDataEntryLogged: (result) => {
      if (result.loggedDataEntry) metricsHook.addOptimisticDataEntryLog(result.loggedDataEntry);
      timelineDataHook.refreshTimeline();
    },
  });
  
  const refreshProblemsAndTimeline = useCallback(async () => {
    if (!spaceId || !getProblemsBySpaceUseCase || !metricsHook.setProblemsForMetrics) return;
    try {
      const problemsData = await getProblemsBySpaceUseCase.execute(spaceId);
      metricsHook.setProblemsForMetrics(problemsData);
      timelineDataHook.refreshTimeline();
    } catch (err) {
      console.error("Error refreshing problems:", err);
    }
  }, [spaceId, getProblemsBySpaceUseCase, metricsHook.setProblemsForMetrics, timelineDataHook.refreshTimeline]);

  const handleSaveSpaceSettings = useCallback(async (data: UpdateSpaceUseCaseInputDTO) => {
    if (!space) return Promise.reject(new Error("Space not found"));
    try {
      await updateSpaceUseCase.execute({ id: space.id, ...data });
      refreshSpace(); // From useSpaceContext
      dialogs.closeSettingsDialog();
    } catch (error: any) {
      console.error("Error saving space settings:", error);
      throw error;
    }
  }, [space, updateSpaceUseCase, refreshSpace, dialogs.closeSettingsDialog]);

  const handleDeleteSpace = useCallback(async () => {
    if (!space) return Promise.reject(new Error("Space not found"));
    try {
      await deleteSpaceUseCase.execute(space.id);
      router.push('/');
    } catch (error: any) {
      console.error("Error deleting space:", error);
      throw error;
    }
  }, [space, deleteSpaceUseCase, router]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' || theme === 'system' ? 'dark' : 'light');
  }, [theme, setTheme]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (metricsHook.isCurrentlyClockedIn && metricsHook.currentSessionStart) {
      const updateDisplay = () => {
        setCurrentSessionDisplayMs(Date.now() - metricsHook.currentSessionStart!.getTime());
      };
      updateDisplay();
      intervalId = setInterval(updateDisplay, 1000);
    } else {
      setCurrentSessionDisplayMs(0);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [metricsHook.isCurrentlyClockedIn, metricsHook.currentSessionStart]);
  
  const pageLoading = isLoadingSpace || clockEventsHook.initialClockState.isLoading || (actionsDataHook.isLoadingActionDefinitions && !actionsDataHook.actionDefinitions?.length) || (metricsHook.isLoadingMetricsData && !metricsHook.totalActionPoints && !metricsHook.totalClockedInMs) || todosHook.isLoadingTodos;

  if (pageLoading) {
    return (
      <div className="flex flex-col h-screen">
        <div className="shrink-0 px-3 sm:px-4 pt-2 pb-1 border-b bg-background flex justify-between items-center h-12">
            <Skeleton className="h-6 w-32" />
            <div className="flex items-center gap-1 sm:gap-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
            </div>
        </div>
        <div className="flex-grow flex flex-col items-center justify-center p-4">
          <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
          <p className="text-xl text-muted-foreground">Loading Space Details...</p>
        </div>
      </div>
    );
  }

  if (errorLoadingSpace || !space || todosHook.todosError) {
    return (
      <div className="flex flex-col h-screen">
         <div className="shrink-0 px-3 sm:px-4 pt-2 pb-1 border-b bg-background flex justify-start items-center h-12">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="h-8 w-8 sm:h-9 sm:w-9 mr-2">
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <h1 className="text-lg sm:text-xl font-semibold">Error Loading Space</h1>
        </div>
        <div className="text-center flex-grow flex flex-col items-center justify-center p-4">
          <h2 className="text-2xl font-semibold mb-2">Oops! Something went wrong.</h2>
          <p className="text-muted-foreground mb-4">
            {errorLoadingSpace || todosHook.todosError || `The space you are looking for (ID: ${spaceId}) does not exist or could not be loaded.`}
          </p>
          <Button onClick={() => router.push('/')} className="mt-4">Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
        <div className="flex h-12 items-center justify-between px-2 sm:px-3 gap-1">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to Spaces</span>
            </Button>
            <h1 className="text-md sm:text-lg font-semibold truncate" title={space.name}>{space.name}</h1>
          </div>
          <div className="flex items-center gap-1">
            <ClockWidget
              spaceId={space.id}
              initialIsClockedIn={clockEventsHook.initialClockState.isClockedIn}
              initialStartTime={clockEventsHook.initialClockState.startTime}
              isSubmittingClockEvent={clockEventsHook.isSubmittingClockEvent}
              clockEventError={clockEventsHook.clockEventError}
              onSaveClockEvent={async (type) => {
                await clockEventsHook.handleSaveClockEvent(type);
                clockEventsHook.refreshClockEvents(); // This now calls fetchInitial which re-fetches all
                metricsHook.refreshAllMetricsData(); // Ensure metrics are re-fetched
              }}
            />
            {mounted && (
              <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="h-8 w-8">
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={dialogs.openSettingsDialog} className="h-8 w-8">
              <Settings className="h-4 w-4" />
              <span className="sr-only">Space Settings</span>
            </Button>
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          <section aria-labelledby="metrics-heading" className="shrink-0">
            <SpaceMetricsDisplay
              totalActionPoints={metricsHook.totalActionPoints}
              totalClockedInMs={metricsHook.totalClockedInMs}
              isCurrentlyClockedIn={metricsHook.isCurrentlyClockedIn}
              currentSessionDisplayMs={currentSessionDisplayMs}
              currentSessionStart={metricsHook.currentSessionStart}
            />
          </section>

          <section aria-labelledby="quick-actions-heading" className="shrink-0">
             <QuickActionsWidget
                spaceId={spaceId}
                actionDefinitions={actionsDataHook.actionDefinitions}
                isLoadingActionDefinitions={actionsDataHook.isLoadingActionDefinitions}
                onLogAction={spaceActionLoggerHook.handleLogAction}
                onLogDataEntry={spaceActionLoggerHook.handleLogDataEntry}
                isLoggingActionOrDataEntry={spaceActionLoggerHook.isLogging}
                dialogs={dialogs}
                actionsDataHook={{
                  createActionDefinitionUseCase: actionsDataHook.createActionDefinitionUseCase,
                  updateActionDefinitionUseCase: actionsDataHook.updateActionDefinitionUseCase,
                  deleteActionDefinitionUseCase: actionsDataHook.deleteActionDefinitionUseCase,
                  addActionDefinitionInState: actionsDataHook.addActionDefinitionInState,
                  updateActionDefinitionInState: actionsDataHook.updateActionDefinitionInState,
                  removeActionDefinitionFromState: actionsDataHook.removeActionDefinitionFromState,
                  refreshActionDefinitions: actionsDataHook.refreshActionDefinitions,
                }}
             />
          </section>

          <section aria-labelledby="other-tools-heading" className="shrink-0">
            <h3 id="other-tools-heading" className="text-sm sm:text-md font-semibold mb-1.5 sm:mb-2 text-muted-foreground">Other Tools</h3>
            <div className="space-y-2 sm:space-y-3"> {/* Wrapper for new widgets */}
                <TodoSummaryWidget
                    spaceId={spaceId}
                    metrics={metricsHook}
                    dialogs={dialogs}
                    todosHook={todosHook}
                    createTodoUseCase={createTodoUseCase}
                />
                <ProblemSummaryWidget
                    spaceId={spaceId}
                    metrics={metricsHook}
                    dialogs={dialogs}
                    createProblemUseCase={createProblemUseCase}
                    updateProblemUseCase={updateProblemUseCase}
                    deleteProblemUseCase={deleteProblemUseCase}
                    getProblemsBySpaceUseCase={getProblemsBySpaceUseCase}
                    onProblemsChanged={refreshProblemsAndTimeline}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <DataLogSummaryWidget
                        spaceId={spaceId}
                        metrics={metricsHook}
                        dialogs={dialogs}
                        getDataEntriesBySpaceUseCase={getDataEntriesBySpaceUseCase}
                        actionDefinitions={actionsDataHook.actionDefinitions}
                    />
                    <TimelineSummaryWidget
                        dialogs={dialogs}
                        timelineItems={timelineDataHook.timelineItems}
                        isLoadingTimeline={timelineDataHook.isLoadingTimeline}
                    />
                </div>
            </div>
          </section>
        </div>
      </ScrollArea>

      {/* Only SpaceSettingsDialog remains rendered directly by the page */}
      {space && (
        <SpaceSettingsDialog 
            isOpen={dialogs.isSettingsDialogOpen} 
            onClose={dialogs.closeSettingsDialog} 
            space={space} 
            onSave={handleSaveSpaceSettings} 
            onDelete={handleDeleteSpace} 
        />
      )}
      {/* Other dialogs are now rendered within their respective widgets */}
    </div>
  );
}

    