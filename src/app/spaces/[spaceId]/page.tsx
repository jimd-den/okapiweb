
// src/app/spaces/[spaceId]/page.tsx
"use client";

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Settings, Sun, Moon, Loader2 } from 'lucide-react';
import { useTheme } from "next-themes";
import { cn } from '@/lib/utils';

// Widget Imports
import { SpaceMetricsDisplay } from '@/components/space-metrics-display';
import { 
  QuickActionsWidget, 
  TodoSummaryWidget, 
  ProblemSummaryWidget, 
  DataLogSummaryWidget, 
  TimelineSummaryWidget 
} from '@/components/widgets';

// Component Imports
import { ClockWidget } from '@/components/clock-widget';
import { Skeleton } from '@/components/ui/skeleton';
import ErrorBoundary from '@/components/ui/ErrorBoundary';


// Context Provider
import { SpaceDataProvider, useSpaceContext } from '@/contexts/SpaceDataProvider';

// Repositories (for use cases instantiated here)
import {
  IndexedDBActionDefinitionRepository,
  IndexedDBActionLogRepository,
  IndexedDBClockEventRepository,
  IndexedDBDataEntryLogRepository,
  IndexedDBSpaceRepository,
  IndexedDBTodoRepository, 
  IndexedDBProblemRepository, 
} from '@/infrastructure/persistence/indexeddb';

// Use Cases (Core use cases instantiated here)
import {
  UpdateSpaceUseCase, type UpdateSpaceUseCaseInputDTO,
  DeleteSpaceUseCase,
  GetTimelineItemsBySpaceUseCase,
  GetDataEntriesBySpaceUseCase,
  GetActionLogsBySpaceUseCase,
  GetClockEventsBySpaceUseCase,
  GetLastClockEventUseCase,
  SaveClockEventUseCase,
  GetProblemsBySpaceUseCase,
} from '@/application/use-cases';

// Hooks for data management (instantiated here)
import { useSpaceActionsData, useSpaceClockEvents, useSpaceMetrics, useTimelineData } from '@/hooks/data';
import { useSpaceActionLogger } from '@/hooks/actions';
import { useSpaceDialogs } from '@/hooks';

import type { Todo } from '@/domain/entities';

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
  const dialogs = useSpaceDialogs();

  const [currentSessionDisplayMs, setCurrentSessionDisplayMs] = useState(0);

  // --- Repositories (memoized for use cases) ---
  const actionDefinitionRepository = useMemo(() => new IndexedDBActionDefinitionRepository(), []);
  const actionLogRepository = useMemo(() => new IndexedDBActionLogRepository(), []);
  const clockEventRepository = useMemo(() => new IndexedDBClockEventRepository(), []);
  const dataEntryLogRepository = useMemo(() => new IndexedDBDataEntryLogRepository(), []);
  const spaceRepositoryForUpdates = useMemo(() => new IndexedDBSpaceRepository(), []);
  const todoRepositoryForDelete = useMemo(() => new IndexedDBTodoRepository(), []);
  const problemRepositoryForDelete = useMemo(() => new IndexedDBProblemRepository(), []);


  // --- Core Use Cases (memoized) ---
  const updateSpaceUseCase = useMemo(() => new UpdateSpaceUseCase(spaceRepositoryForUpdates), [spaceRepositoryForUpdates]);
  const deleteSpaceUseCase = useMemo(() => new DeleteSpaceUseCase(
    spaceRepositoryForUpdates,
    actionDefinitionRepository,
    actionLogRepository,
    todoRepositoryForDelete,
    problemRepositoryForDelete,
    clockEventRepository,
    dataEntryLogRepository
  ), [spaceRepositoryForUpdates, actionDefinitionRepository, actionLogRepository, todoRepositoryForDelete, problemRepositoryForDelete, clockEventRepository, dataEntryLogRepository]);
  
  const getTimelineItemsBySpaceUseCase = useMemo(() => new GetTimelineItemsBySpaceUseCase(actionLogRepository, actionDefinitionRepository, problemRepositoryForDelete, todoRepositoryForDelete, dataEntryLogRepository), [actionLogRepository, actionDefinitionRepository, problemRepositoryForDelete, todoRepositoryForDelete, dataEntryLogRepository]);
  
  const getProblemsBySpaceUseCaseForMetrics = useMemo(() => new GetProblemsBySpaceUseCase(new IndexedDBProblemRepository()), []);
  
  const getDataEntriesBySpaceUseCase = useMemo(() => new GetDataEntriesBySpaceUseCase(dataEntryLogRepository), [dataEntryLogRepository]);
  const getActionLogsBySpaceUseCase = useMemo(() => new GetActionLogsBySpaceUseCase(actionLogRepository), [actionLogRepository]);
  const getClockEventsBySpaceUseCase = useMemo(() => new GetClockEventsBySpaceUseCase(clockEventRepository), [clockEventRepository]);
  const getLastClockEventUseCase = useMemo(() => new GetLastClockEventUseCase(clockEventRepository), [clockEventRepository]);
  const saveClockEventUseCase = useMemo(() => new SaveClockEventUseCase(clockEventRepository), [clockEventRepository]);

  // --- Data Fetching & Management Hooks ---
  const actionsDataHook = useSpaceActionsData({
    spaceId, actionDefinitionRepository, actionLogRepository, dataEntryLogRepository
  });

  const clockEventsHook = useSpaceClockEvents({
    spaceId, saveClockEventUseCase, getLastClockEventUseCase, getClockEventsBySpaceUseCase,
  });

  const timelineDataHook = useTimelineData(spaceId, getTimelineItemsBySpaceUseCase);

  const metricsHook = useSpaceMetrics({
    spaceId, getActionLogsBySpaceUseCase, getDataEntriesBySpaceUseCase, getProblemsBySpaceUseCase: getProblemsBySpaceUseCaseForMetrics, clockEventsForSpace: clockEventsHook.clockEventsForSpace,
  });
  
  const spaceActionLoggerHook = useSpaceActionLogger({
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
  
  const refreshProblemsForMetricsAndTimeline = useCallback(async () => {
    if (!spaceId || !getProblemsBySpaceUseCaseForMetrics || !metricsHook.setProblemsForMetrics) return;
    try {
      const problemsData = await getProblemsBySpaceUseCaseForMetrics.execute(spaceId);
      metricsHook.setProblemsForMetrics(problemsData);
      timelineDataHook.refreshTimeline();
    } catch (err) {
      console.error("Error refreshing problems for metrics:", err);
    }
  }, [spaceId, getProblemsBySpaceUseCaseForMetrics, metricsHook.setProblemsForMetrics, timelineDataHook.refreshTimeline]);

  const setTodosForMetrics = useCallback((todos: Todo[]) => {
    metricsHook.setTodosForMetrics(todos);
    timelineDataHook.refreshTimeline(); 
  }, [metricsHook.setTodosForMetrics, timelineDataHook.refreshTimeline]);


  const handleSaveSpaceSettings = useCallback(async (data: UpdateSpaceUseCaseInputDTO) => {
    if (!space) return Promise.reject(new Error("Space not found"));
    try {
      await updateSpaceUseCase.execute({ id: space.id, ...data });
      refreshSpace(); 
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
  }, [space, router, deleteSpaceUseCase]);


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
  
  const pageLoading = isLoadingSpace || clockEventsHook.initialClockState.isLoading || (actionsDataHook.isLoadingActionDefinitions && !actionsDataHook.actionDefinitions?.length) || (metricsHook.isLoadingMetricsData && !metricsHook.totalActionPoints && !metricsHook.totalClockedInMs);

  if (pageLoading) {
    return (
      <div className="flex flex-col h-screen">
        <div className="shrink-0 px-3 sm:px-4 pt-2 pb-1 border-b bg-background flex justify-between items-center h-14"> {/* Increased height */}
            <Skeleton className="h-7 w-36" /> {/* Increased size */}
            <div className="flex items-center gap-1.5 sm:gap-2"> {/* Increased gap */}
                <Skeleton className="h-9 w-28" /> {/* Increased size */}
                <Skeleton className="h-9 w-9 rounded-full" /> {/* Increased size */}
            </div>
        </div>
        <div className="flex-grow flex flex-col items-center justify-center p-4">
          <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
          <p className="text-xl text-muted-foreground">Loading Space Details...</p>
        </div>
      </div>
    );
  }

  if (errorLoadingSpace || !space) {
    return (
      <div className="flex flex-col h-screen">
         <div className="shrink-0 px-3 sm:px-4 pt-2 pb-1 border-b bg-background flex justify-start items-center h-14"> {/* Increased height */}
            <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="h-10 w-10 mr-2"> {/* Increased size */}
              <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" /> {/* Increased icon size */}
            </Button>
            <h1 className="text-lg sm:text-xl font-semibold">Error Loading Space</h1>
        </div>
        <div className="text-center flex-grow flex flex-col items-center justify-center p-4">
          <h2 className="text-2xl font-semibold mb-2">Oops! Something went wrong.</h2>
          <p className="text-muted-foreground mb-4">
            {errorLoadingSpace || `The space you are looking for (ID: ${spaceId}) does not exist or could not be loaded.`}
          </p>
          <Button onClick={() => router.push('/')} className="mt-4 px-6 py-3 text-lg">Go Home</Button> {/* Increased size */}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
        <div className="flex h-14 items-center justify-between px-2 sm:px-3 gap-1"> {/* Increased height */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="h-10 w-10"> {/* Increased size */}
              <ArrowLeft className="h-5 w-5" /> {/* Increased icon size */}
              <span className="sr-only">Back to Spaces</span>
            </Button>
            <h1 className="text-md sm:text-lg font-semibold truncate max-w-[150px] sm:max-w-xs md:max-w-sm" title={space.name}>{space.name}</h1>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2"> {/* Increased gap */}
            <ClockWidget
              spaceId={space.id}
              initialIsClockedIn={clockEventsHook.initialClockState.isClockedIn}
              initialStartTime={clockEventsHook.initialClockState.startTime}
              isSubmittingClockEvent={clockEventsHook.isSubmittingClockEvent}
              clockEventError={clockEventsHook.clockEventError}
              onSaveClockEvent={async (type) => {
                await clockEventsHook.handleSaveClockEvent(type);
                metricsHook.refreshAllMetricsData(); 
              }}
            />
            {mounted && (
              <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="h-10 w-10"> {/* Increased size */}
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />} {/* Increased icon size */}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={dialogs.openSettingsDialog} className="h-10 w-10"> {/* Increased size */}
              <Settings className="h-5 w-5" /> {/* Increased icon size */}
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
                actionDefinitions={actionsDataHook.actionDefinitions || []}
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
            <h3 id="other-tools-heading" className="text-md sm:text-lg font-semibold mb-1.5 sm:mb-2 text-muted-foreground">Other Tools</h3> {/* Increased font size */}
            <div className="space-y-2 sm:space-y-3">
                <TodoSummaryWidget
                    spaceId={spaceId}
                    metrics={metricsHook}
                    dialogs={dialogs}
                    onTodosChangedForMetrics={setTodosForMetrics}
                />
                <ProblemSummaryWidget
                    spaceId={spaceId}
                    metrics={metricsHook}
                    dialogs={dialogs}
                    onProblemsChanged={refreshProblemsForMetricsAndTimeline}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <DataLogSummaryWidget
                        spaceId={spaceId}
                        metrics={metricsHook}
                        dialogs={dialogs}
                        getDataEntriesBySpaceUseCase={getDataEntriesBySpaceUseCase}
                        actionDefinitions={actionsDataHook.actionDefinitions || []}
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

      {space && dialogs.isSettingsDialogOpen && (
        <ErrorBoundary fallbackMessage="There was an issue with the Space Settings dialog.">
          <dialogs.SpaceSettingsDialog 
              isOpen={dialogs.isSettingsDialogOpen} 
              onClose={dialogs.closeSettingsDialog} 
              space={space} 
              onSave={handleSaveSpaceSettings} 
              onDelete={handleDeleteSpace} 
          />
        </ErrorBoundary>
      )}
    </div>
  );
}
