
// src/app/spaces/[spaceId]/page.tsx
"use client";

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Settings, Sun, Moon, ListTodo, History, Cog, Database, GanttChartSquare, AlertTriangle, CheckCircle2Icon, ClipboardCheck, PlusCircle, TimerIcon as LucideTimerIcon, Loader2, CalendarIcon } from 'lucide-react'; // Added TimerIcon, Loader2
import { useTheme } from "next-themes";
import { cn } from '@/lib/utils';

// Dialog Imports
import { SpaceSettingsDialog } from '@/components/dialogs/space-settings-dialog';
import { CreateTodoDialog } from '@/components/dialogs/create-todo-dialog';
import { TodoListDialog } from '@/components/dialogs/todo-list-dialog';
import { ProblemTrackerDialog } from '@/components/dialogs/problem-tracker-dialog';
import { DataViewerDialog } from '@/components/dialogs/data-viewer-dialog';
import { ActivityTimelineDialog } from '@/components/dialogs/activity-timeline-dialog';
import { AdvancedActionsDialog } from '@/components/dialogs/advanced-actions-dialog';
import { MultiStepActionDialog } from '@/components/dialogs/multi-step-action-dialog';
import { DataEntryFormDialog } from '@/components/dialogs/data-entry-form-dialog';
import { TimerActionDialog } from '@/components/dialogs/timer-action-dialog'; 

// Component Imports
import { ClockWidget } from '@/components/clock-widget';
import { SpaceMetricsDisplay } from '@/components/space-metrics-display';
import { ActionManager } from '@/components/space-tabs/action-manager';
import { Skeleton } from '@/components/ui/skeleton';


// Repositories
import {
  IndexedDBSpaceRepository,
  IndexedDBActionDefinitionRepository,
  IndexedDBActionLogRepository,
  IndexedDBTodoRepository,
  IndexedDBProblemRepository,
  IndexedDBClockEventRepository,
  IndexedDBDataEntryLogRepository,
} from '@/infrastructure/persistence/indexeddb';

// Use Cases
import {
  GetSpaceByIdUseCase,
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
  CreateActionDefinitionUseCase, 
  UpdateActionDefinitionUseCase,
  DeleteActionDefinitionUseCase,
  type LogActionResult,
  type LogDataEntryResult,
  type LogDataEntryInputDTO
} from '@/application/use-cases';

// Hooks for data management
import { useSpaceData } from '@/hooks/data/use-space-data';
import { useSpaceActionsData } from '@/hooks/data/use-space-actions-data';
import { useSpaceActionLogger } from '@/hooks/actions/use-space-action-logger';
import { useTimelineData } from '@/hooks/data/use-timeline-data';
import { useSpaceClockEvents } from '@/hooks/data/use-space-clock-events';
import { useSpaceMetrics } from '@/hooks/data/use-space-metrics';
import { useDialogState } from '@/hooks/use-dialog-state';
import { useImageCaptureDialog, type UseImageCaptureDialogReturn } from '@/hooks/use-image-capture-dialog';
import { ImageCaptureDialogView } from '@/components/dialogs/image-capture-dialog-view';

import type { Space } from '@/domain/entities/space.entity';
import type { Todo, TodoStatus } from '@/domain/entities/todo.entity';
import type { ActionDefinition } from '@/domain/entities/action-definition.entity';


const TODO_BOARD_COLUMNS_UI_DATA: Record<TodoStatus, { id: TodoStatus; title: string; icon: React.ReactNode; }> = {
  todo: { id: 'todo', title: 'To Do', icon: <ListTodo className="h-5 w-5" /> },
  doing: { id: 'doing', title: 'Doing', icon: <History className="h-5 w-5" /> },
  done: { id: 'done', title: <ClipboardCheck className="h-5 w-5" /> },
};

const PROBLEM_BUTTON_UI_DATA = {
  pending: { id: 'pending', title: 'Pending', icon: <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive mb-1" /> },
  resolved: { id: 'resolved', title: 'Resolved', icon: <CheckCircle2Icon className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 mb-1" /> },
};


export default function SpaceDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const spaceId = params.spaceId as string;
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // --- Dialog States ---
  const { isOpen: isSettingsDialogOpen, openDialog: openSettingsDialog, closeDialog: closeSettingsDialog } = useDialogState();
  const { isOpen: isAdvancedActionsDialogOpen, openDialog: openAdvancedActionsDialog, closeDialog: closeAdvancedActionsDialog } = useDialogState();
  const { isOpen: isTodoListDialogOpen, openDialog: openTodoListDialogInternal, closeDialog: closeTodoListDialogInternal } = useDialogState();
  const { isOpen: isProblemTrackerDialogOpen, openDialog: openProblemTrackerDialog, closeDialog: closeProblemTrackerDialog } = useDialogState();
  const { isOpen: isDataViewerDialogOpen, openDialog: openDataViewerDialog, closeDialog: closeDataViewerDialog } = useDialogState();
  const { isOpen: isTimelineDialogOpen, openDialog: openTimelineDialog, closeDialog: closeTimelineDialog } = useDialogState();
  const { isOpen: isCreateTodoDialogOpen, openDialog: openCreateTodoDialog, closeDialog: closeCreateTodoDialog } = useDialogState();
  const { isOpen: isMultiStepDialogOpen, openDialog: openMultiStepDialogInternal, closeDialog: closeMultiStepDialog } = useDialogState();
  const { isOpen: isDataEntryDialogOpen, openDialog: openDataEntryDialogInternal, closeDialog: closeDataEntryDialog } = useDialogState();
  const { isOpen: isTimerActionDialogOpen, openDialog: openTimerActionDialogInternal, closeDialog: closeTimerActionDialog } = useDialogState();

  const [currentOpenTodoListStatus, setCurrentOpenTodoListStatus] = useState<TodoStatus | null>(null);
  const [animatingActionId, setAnimatingActionId] = useState<string | null>(null);
  const [currentMultiStepAction, setCurrentMultiStepAction] = useState<ActionDefinition | null>(null);
  const [currentDataEntryAction, setCurrentDataEntryAction] = useState<ActionDefinition | null>(null);
  const [currentTimerAction, setCurrentTimerAction] = useState<ActionDefinition | null>(null);
  const [currentSessionDisplayMs, setCurrentSessionDisplayMs] = useState(0);

  const imageCaptureExistingTodo: UseImageCaptureDialogReturn<Todo, 'before' | 'after'> = useImageCaptureDialog<Todo, 'before' | 'after'>();

  // --- Repositories (memoized) ---
  const spaceRepository = useMemo(() => new IndexedDBSpaceRepository(), []);
  const actionDefinitionRepository = useMemo(() => new IndexedDBActionDefinitionRepository(), []);
  const actionLogRepository = useMemo(() => new IndexedDBActionLogRepository(), []);
  const todoRepository = useMemo(() => new IndexedDBTodoRepository(), []);
  const problemRepository = useMemo(() => new IndexedDBProblemRepository(), []);
  const clockEventRepository = useMemo(() => new IndexedDBClockEventRepository(), []);
  const dataEntryLogRepository = useMemo(() => new IndexedDBDataEntryLogRepository(), []);

  // --- Core Use Cases (memoized) ---
  const getSpaceByIdUseCase = useMemo(() => new GetSpaceByIdUseCase(spaceRepository), [spaceRepository]);
  const updateSpaceUseCase = useMemo(() => new UpdateSpaceUseCase(spaceRepository), [spaceRepository]);
  const deleteSpaceUseCase = useMemo(() => new DeleteSpaceUseCase(spaceRepository, actionDefinitionRepository, actionLogRepository, todoRepository, problemRepository, clockEventRepository, dataEntryLogRepository), [spaceRepository, actionDefinitionRepository, actionLogRepository, todoRepository, problemRepository, clockEventRepository, dataEntryLogRepository]);
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
  const { space, isLoadingSpace, errorLoadingSpace, refreshSpace } = useSpaceData(spaceId, getSpaceByIdUseCase);

  const {
    actionDefinitions,
    isLoadingActionDefinitions,
    createActionDefinitionUseCase: createActionDefUseCaseFromHook,
    updateActionDefinitionUseCase: updateActionDefUseCaseFromHook,
    deleteActionDefinitionUseCase: deleteActionDefUseCaseFromHook,
    addActionDefinitionInState,
    updateActionDefinitionInState,
    removeActionDefinitionFromState,
    refreshActionDefinitions,
  } = useSpaceActionsData({ 
    spaceId, 
    actionDefinitionRepository, 
    actionLogRepository, 
    dataEntryLogRepository 
  });

  const {
    clockEventsForSpace,
    initialClockState,
    isSubmittingClockEvent,
    clockEventError,
    handleSaveClockEvent: hookHandleSaveClockEvent,
    refreshClockEvents
  } = useSpaceClockEvents({
    spaceId,
    saveClockEventUseCase,
    getLastClockEventUseCase,
    getClockEventsBySpaceUseCase,
  });

  const { timelineItems, isLoadingTimeline, errorLoadingTimeline, refreshTimeline } = useTimelineData(spaceId, getTimelineItemsBySpaceUseCase);
  
  const {
    addOptimisticActionLog,
    addOptimisticDataEntryLog,
    setTodosForMetrics,
    setProblemsForMetrics,
    isLoadingMetricsData,
    metricsError,
    refreshAllMetricsData,
    allTodosForSpace, // Destructure allTodosForSpace
    problemsForSpace, // Destructure problemsForSpace
    ...metrics
  } = useSpaceMetrics({
    spaceId,
    getActionLogsBySpaceUseCase,
    getDataEntriesBySpaceUseCase,
    getTodosBySpaceUseCase,
    getProblemsBySpaceUseCase,
    clockEventsForSpace,
  });


  const {
    handleLogAction: baseHandleLogAction,
    handleLogDataEntry,
    isLogging: isLoggingActionOrDataEntry
  } = useSpaceActionLogger({
    spaceId,
    actionLogRepository,
    dataEntryLogRepository,
    actionDefinitionRepository,
    onActionLogged: (result: LogActionResult) => {
      if (result.loggedAction) {
        addOptimisticActionLog(result.loggedAction);
        setAnimatingActionId(result.loggedAction.actionDefinitionId);
        setTimeout(() => setAnimatingActionId(null), 600);
      }
      refreshTimeline();
    },
    onDataEntryLogged: (result: LogDataEntryResult) => {
      if (result.loggedDataEntry) {
        addOptimisticDataEntryLog(result.loggedDataEntry);
        setAnimatingActionId(result.loggedDataEntry.actionDefinitionId);
        setTimeout(() => setAnimatingActionId(null), 600);
      }
      refreshTimeline();
    },
  });

  const openTimerAction = useCallback((actionDef: ActionDefinition) => {
    setCurrentTimerAction(actionDef);
    openTimerActionDialogInternal();
  }, [openTimerActionDialogInternal]);

  const openQuickMultiStepActionDialog = useCallback((actionDef: ActionDefinition) => {
    setCurrentMultiStepAction(actionDef);
    openMultiStepDialogInternal();
  }, [openMultiStepDialogInternal]);

  const openQuickDataEntryActionDialog = useCallback((actionDef: ActionDefinition) => {
    setCurrentDataEntryAction(actionDef);
    openDataEntryDialogInternal();
  }, [openDataEntryDialogInternal]);


  const handleSaveSpaceSettings = useCallback(async (data: UpdateSpaceUseCaseInputDTO) => {
    if (!space) return Promise.reject(new Error("Space not found"));
    try {
      await updateSpaceUseCase.execute({ id: space.id, ...data });
      refreshSpace();
      closeSettingsDialog();
    } catch (error: any) {
      console.error("Error saving space settings:", error);
      throw error;
    }
  }, [space, updateSpaceUseCase, refreshSpace, closeSettingsDialog]);

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

  const [newlyAddedTodoId, setNewlyAddedTodoId] = useState<string | null>(null);

  const refreshTodosAndTimeline = useCallback(async () => {
    if (!spaceId || !getTodosBySpaceUseCase || !setTodosForMetrics) return;
    try {
      const todosData = await getTodosBySpaceUseCase.execute(spaceId);
      setTodosForMetrics(todosData); 
      refreshTimeline();
    } catch (err) {
      console.error("Error refreshing todos:", err);
    }
  }, [spaceId, getTodosBySpaceUseCase, setTodosForMetrics, refreshTimeline]);

  const handleTodoCreated = useCallback(async (newTodo: Todo) => {
    await refreshTodosAndTimeline();
    setNewlyAddedTodoId(newTodo.id);
    setTimeout(() => setNewlyAddedTodoId(null), 1000);
    closeCreateTodoDialog();
  }, [refreshTodosAndTimeline, closeCreateTodoDialog]);

  const handleOpenTodoList = useCallback((status: TodoStatus) => {
    setCurrentOpenTodoListStatus(status);
    openTodoListDialogInternal();
  }, [openTodoListDialogInternal]);

  const refreshProblemsAndTimeline = useCallback(async () => {
    if (!spaceId || !getProblemsBySpaceUseCase || !setProblemsForMetrics) return;
    try {
      const problemsData = await getProblemsBySpaceUseCase.execute(spaceId);
      setProblemsForMetrics(problemsData); 
      refreshTimeline();
    } catch (err) {
      console.error("Error refreshing problems:", err);
    }
  }, [spaceId, getProblemsBySpaceUseCase, setProblemsForMetrics, refreshTimeline]);
  
  const refreshActionDefinitionsAndTimeline = useCallback(() => {
    refreshActionDefinitions();
    refreshTimeline();
  }, [refreshActionDefinitions, refreshTimeline]);

  const handleUpdateTodoStatusInModal = useCallback(async (todo: Todo, newStatus: TodoStatus) => {
    try {
      await updateTodoUseCase.execute({ id: todo.id, status: newStatus });
      await refreshTodosAndTimeline();
    } catch (e: any) {
      console.error(e);
      throw e;
    }
  }, [updateTodoUseCase, refreshTodosAndTimeline]);

  const handleDeleteTodoInModal = useCallback(async (id: string) => {
    try {
      await deleteTodoUseCase.execute(id);
      await refreshTodosAndTimeline();
    } catch (e: any) {
      console.error(e);
      throw e;
    }
  }, [deleteTodoUseCase, refreshTodosAndTimeline]);

  const handleUpdateTodoDescriptionInModal = useCallback(async (id: string, description: string) => {
    try {
      await updateTodoUseCase.execute({ id, description });
      await refreshTodosAndTimeline();
    } catch (e: any) {
      console.error(e);
      throw e;
    }
  }, [updateTodoUseCase, refreshTodosAndTimeline]);

  const handleOpenImageCaptureForExistingTodoInModal = useCallback((todo: Todo, mode: 'before' | 'after') => {
    imageCaptureExistingTodo.handleOpenImageCaptureDialog(todo, mode);
  }, [imageCaptureExistingTodo]);

  const handleCaptureAndSaveImageForExistingTodo = useCallback(async () => {
    if (!imageCaptureExistingTodo.videoRef.current || !imageCaptureExistingTodo.canvasRef.current || !imageCaptureExistingTodo.selectedItemForImage || !imageCaptureExistingTodo.captureMode) return;
    imageCaptureExistingTodo.setIsCapturingImage(true);
    const video = imageCaptureExistingTodo.videoRef.current;
    const canvas = imageCaptureExistingTodo.canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      imageCaptureExistingTodo.setIsCapturingImage(false);
      console.error("Could not get canvas context for image capture.");
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUri = canvas.toDataURL('image/jpeg', 0.8);
    try {
      const updateData: UpdateSpaceUseCaseInputDTO = { id: imageCaptureExistingTodo.selectedItemForImage.id } as any; // Type assertion
      if (imageCaptureExistingTodo.captureMode === 'before') (updateData as any).beforeImageDataUri = imageDataUri;
      else (updateData as any).afterImageDataUri = imageDataUri;
      await updateTodoUseCase.execute(updateData as any); // Type assertion
      await refreshTodosAndTimeline();
      imageCaptureExistingTodo.handleCloseImageCaptureDialog();
    } catch (error: any) {
      console.error("Error saving image for todo:", error);
    } finally {
      imageCaptureExistingTodo.setIsCapturingImage(false);
    }
  }, [imageCaptureExistingTodo, updateTodoUseCase, refreshTodosAndTimeline]);

  const handleRemoveImageForExistingTodoInModal = useCallback(async (todoId: string, mode: 'before' | 'after') => {
    const updateDto: UpdateSpaceUseCaseInputDTO = { id: todoId } as any; // Type assertion
    if (mode === 'before') (updateDto as any).beforeImageDataUri = null;
    else (updateDto as any).afterImageDataUri = null;
    try {
      await updateTodoUseCase.execute(updateDto as any); // Type assertion
      await refreshTodosAndTimeline();
    } catch (e:any) {
      console.error(e);
      throw e;
    }
  }, [updateTodoUseCase, refreshTodosAndTimeline]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' || theme === 'system' ? 'dark' : 'light');
  }, [theme, setTheme]);

  // Live timer update for current session
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (metrics.isCurrentlyClockedIn && metrics.currentSessionStart) {
      const updateDisplay = () => {
        setCurrentSessionDisplayMs(Date.now() - metrics.currentSessionStart!.getTime());
      };
      updateDisplay(); // Initial update
      intervalId = setInterval(updateDisplay, 1000);
    } else {
      setCurrentSessionDisplayMs(0);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [metrics.isCurrentlyClockedIn, metrics.currentSessionStart]);

  const quickActions = useMemo(() => (actionDefinitions || []).filter(ad => ad.isEnabled).slice(0, 6), [actionDefinitions]);
  const getActionInitials = (name: string) => {
    const words = name.split(' ').filter(Boolean);
    if (words.length === 1) return name.substring(0, 2).toUpperCase();
    return words.slice(0, 2).map(word => word[0]).join('').toUpperCase();
  };

  const todoBoardButtonStructure = useMemo(() => [
    { status: 'todo' as TodoStatus, title: 'To Do', icon: TODO_BOARD_COLUMNS_UI_DATA.todo.icon, items: metrics.todoStatusItems },
    { status: 'doing' as TodoStatus, title: 'Doing', icon: TODO_BOARD_COLUMNS_UI_DATA.doing.icon, items: metrics.doingStatusItems },
    { status: 'done' as TodoStatus, title: 'Done', icon: TODO_BOARD_COLUMNS_UI_DATA.done.icon, items: metrics.doneStatusItems },
  ], [metrics.todoStatusItems, metrics.doingStatusItems, metrics.doneStatusItems]);

  const problemBoardButtonStructure = useMemo(() => [
    { type: 'pending', title: 'Pending', icon: PROBLEM_BUTTON_UI_DATA.pending.icon, count: metrics.unresolvedProblemsCount },
    { type: 'resolved', title: 'Resolved', icon: PROBLEM_BUTTON_UI_DATA.resolved.icon, count: metrics.resolvedProblemsCount },
  ], [metrics.unresolvedProblemsCount, metrics.resolvedProblemsCount]);

  const pageLoading = isLoadingSpace || initialClockState.isLoading || (isLoadingActionDefinitions && !actionDefinitions?.length) || (isLoadingMetricsData && !metrics.totalActionPoints && !metrics.totalClockedInMs);

  if (pageLoading) {
    return (
      <div className="flex flex-col h-screen">
        {/* Minimal header during loading to prevent layout shift, actual header rendered below */}
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

  if (errorLoadingSpace || !space) {
    return (
      <div className="flex flex-col h-screen">
         <div className="shrink-0 px-3 sm:px-4 pt-2 pb-1 border-b bg-background flex justify-start items-center h-12">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="h-8 w-8 sm:h-9 sm:w-9 mr-2">
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <h1 className="text-lg sm:text-xl font-semibold">Space Not Found</h1>
        </div>
        <div className="text-center flex-grow flex flex-col items-center justify-center p-4">
          <h2 className="text-2xl font-semibold mb-2">Oops! Space not found.</h2>
          <p className="text-muted-foreground mb-4">
            {errorLoadingSpace ? errorLoadingSpace : `The space you are looking for (ID: ${spaceId}) does not exist or could not be loaded.`}
          </p>
          <Button onClick={() => router.push('/')} className="mt-4">Go Home</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Compact Header */}
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
              initialIsClockedIn={initialClockState.isClockedIn}
              initialStartTime={initialClockState.startTime}
              isSubmittingClockEvent={isSubmittingClockEvent}
              clockEventError={clockEventError}
              onSaveClockEvent={async (type) => {
                await hookHandleSaveClockEvent(type);
                refreshClockEvents(); 
              }}
            />
            {mounted && (
              <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="h-8 w-8">
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={openSettingsDialog} className="h-8 w-8">
              <Settings className="h-4 w-4" />
              <span className="sr-only">Space Settings</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Scrollable Content Area */}
      <ScrollArea className="flex-1">
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {/* Metrics Section */}
          <section aria-labelledby="metrics-heading" className="shrink-0">
            <SpaceMetricsDisplay
              totalActionPoints={metrics.totalActionPoints}
              totalClockedInMs={metrics.totalClockedInMs}
              isCurrentlyClockedIn={metrics.isCurrentlyClockedIn}
              currentSessionDisplayMs={currentSessionDisplayMs} // Use the live-updated state
              currentSessionStart={metrics.currentSessionStart}
            />
          </section>

          {/* Quick Actions Section */}
          <section aria-labelledby="quick-actions-heading" className="shrink-0">
            <Card>
              <CardHeader className="pb-2 pt-3 px-3 flex flex-row justify-between items-center">
                <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
                <Button variant="outline" size="sm" className="text-xs h-7 px-2 py-1" onClick={openAdvancedActionsDialog}>
                  <Cog className="mr-1.5 h-3.5 w-3.5"/> Manage Actions
                </Button>
              </CardHeader>
              <CardContent className="p-2 sm:p-3">
                {isLoadingActionDefinitions ? (
                  <div className="flex justify-center items-center py-4"> <Loader2 className="h-6 w-6 animate-spin text-primary" /> </div>
                ) : quickActions.length === 0 ? (
                  <p className="text-xs sm:text-sm text-muted-foreground text-center py-2">No quick actions. Use "Manage Actions" to add.</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5 sm:gap-2">
                    {quickActions.map(def => (
                      <Button
                        key={def.id}
                        variant="outline"
                        className={cn(
                          "flex flex-col items-center justify-center h-16 sm:h-20 text-[0.6rem] sm:text-xs p-1 break-all text-center leading-tight transition-transform duration-200",
                          animatingActionId === def.id && "animate-pop-in scale-110 bg-primary/20"
                        )}
                        onClick={async () => {
                          if (def.type === 'single') await baseHandleLogAction(def.id, undefined, undefined, undefined, undefined);
                          else if (def.type === 'multi-step') openQuickMultiStepActionDialog(def);
                          else if (def.type === 'data-entry') openQuickDataEntryActionDialog(def);
                          else if (def.type === 'timer') openTimerAction(def);
                        }}
                        disabled={isLoggingActionOrDataEntry || !def.isEnabled || (def.type !== 'single' && def.type !== 'timer' && (!def.steps?.length && !def.formFields?.length))}
                        title={def.name}
                      >
                        <span className="text-sm sm:text-base font-bold mb-0.5">{getActionInitials(def.name)}</span>
                        <span className="truncate w-full block">{def.name}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Other Tools Section */}
          <section aria-labelledby="other-tools-heading" className="shrink-0">
            <h3 id="other-tools-heading" className="text-sm sm:text-md font-semibold mb-1.5 sm:mb-2 text-muted-foreground">Other Tools</h3>
            
             {/* New To-Do Board Button */}
             <Card className="mb-2 sm:mb-3 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="p-2 sm:p-3 pb-1 sm:pb-2">
                    <CardTitle className="text-base sm:text-lg text-center">To-Do Board</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="flex divide-x divide-border">
                    {todoBoardButtonStructure.map((col) => {
                        const itemsCount = col.items.length;
                        return (
                        <Card
                            key={col.status}
                            onClick={() => handleOpenTodoList(col.status)}
                            className="flex-1 flex flex-col items-center justify-center p-2 sm:p-3 hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded-none first:rounded-bl-md last:rounded-br-md cursor-pointer shadow-none border-0"
                            role="button" tabIndex={0}
                            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleOpenTodoList(col.status)}
                        >
                            {column.icon && React.cloneElement(column.icon as React.ReactElement, { className: "h-5 w-5 sm:h-6 sm:w-6 text-primary mb-1" })}
                            <CardTitle className="text-xs sm:text-sm md:text-md">{col.title}</CardTitle>
                            <CardDescription className="text-[0.65rem] sm:text-xs">{itemsCount} item(s)</CardDescription>
                        </Card>
                        );
                    })}
                    </div>
                </CardContent>
            </Card>


            <Card className="mb-2 sm:mb-3 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="p-2 sm:p-3 pb-1 sm:pb-2">
                <CardTitle className="text-base sm:text-lg text-center">Problems</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex divide-x divide-border">
                   {problemBoardButtonStructure.map((col) => (
                     <button
                        key={col.type}
                        onClick={openProblemTrackerDialog}
                        className="flex-1 flex flex-col items-center justify-center p-2 sm:p-3 hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded-none first:rounded-bl-md last:rounded-br-md"
                        role="button" tabIndex={0}
                      >
                        {React.cloneElement(col.icon as React.ReactElement, { className: "h-5 w-5 sm:h-6 sm:w-6 mb-1" })}
                        <CardTitle className="text-xs sm:text-sm md:text-md">{col.title}</CardTitle>
                        <CardDescription className="text-[0.65rem] sm:text-xs">{col.count} problem(s)</CardDescription>
                      </button>
                   ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <Card className="p-2 sm:p-3 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow cursor-pointer min-h-[70px] sm:min-h-[90px] bg-card/70" onClick={openDataViewerDialog} role="button" tabIndex={0}>
                <Database className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500 mb-1" />
                <CardTitle className="text-xs sm:text-sm md:text-md">Data Logs</CardTitle>
                <CardDescription className="text-[0.65rem] sm:text-xs">{(metrics as any).dataEntriesForSpace?.length || 0} entries</CardDescription>
              </Card>
              <Card className="p-2 sm:p-3 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow cursor-pointer min-h-[70px] sm:min-h-[90px] bg-card/70" onClick={openTimelineDialog} role="button" tabIndex={0}>
                <GanttChartSquare className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 mb-1" />
                <CardTitle className="text-xs sm:text-sm md:text-md">Timeline / Gantt (Future)</CardTitle>
                <CardDescription className="text-[0.65rem] sm:text-xs">View history</CardDescription>
              </Card>
            </div>
          </section>
        </div>
      </ScrollArea>

      {/* Dialogs */}
      {space && (
        <SpaceSettingsDialog isOpen={isSettingsDialogOpen} onClose={closeSettingsDialog} space={space} onSave={handleSaveSpaceSettings} onDelete={handleDeleteSpace} />
      )}

      {isTodoListDialogOpen && currentOpenTodoListStatus !== null && space && (
        <TodoListDialog
          isOpen={isTodoListDialogOpen}
          onClose={() => { closeTodoListDialogInternal(); setCurrentOpenTodoListStatus(null); }}
          title={`${TODO_BOARD_COLUMNS_UI_DATA[currentOpenTodoListStatus]?.title || 'Tasks'}`}
          allTodos={allTodosForSpace || []} 
          initialStatusFilter={currentOpenTodoListStatus}
          onUpdateStatus={handleUpdateTodoStatusInModal}
          onDelete={handleDeleteTodoInModal}
          onUpdateDescription={handleUpdateTodoDescriptionInModal}
          onOpenImageCapture={handleOpenImageCaptureForExistingTodoInModal}
          onRemoveImage={handleRemoveImageForExistingTodoInModal}
          isSubmittingParent={isLoggingActionOrDataEntry || isLoadingMetricsData}
          newlyAddedTodoId={newlyAddedTodoId}
          createTodoUseCase={createTodoUseCase}
          spaceId={space.id}
          onTodoCreated={handleTodoCreated}
          onOpenCreateTodoDialog={openCreateTodoDialog}
        />
      )}

      {space && (
        <CreateTodoDialog
          isOpen={isCreateTodoDialogOpen}
          onClose={closeCreateTodoDialog}
          spaceId={space.id}
          createTodoUseCase={createTodoUseCase}
          onTodoCreated={handleTodoCreated}
        />
      )}
      {isProblemTrackerDialogOpen && space && (
         <ProblemTrackerDialog
            isOpen={isProblemTrackerDialogOpen}
            onClose={closeProblemTrackerDialog}
            spaceId={space.id}
            createProblemUseCase={createProblemUseCase}
            updateProblemUseCase={updateProblemUseCase}
            deleteProblemUseCase={deleteProblemUseCase}
            getProblemsBySpaceUseCase={getProblemsBySpaceUseCase}
            onItemsChanged={refreshProblemsAndTimeline}
        />
      )}
      {isDataViewerDialogOpen && space && (
         <DataViewerDialog
            isOpen={isDataViewerDialogOpen}
            onClose={closeDataViewerDialog}
            spaceId={space.id}
            getDataEntriesBySpaceUseCase={getDataEntriesBySpaceUseCase}
            actionDefinitions={actionDefinitions || []}
        />
      )}
      {isTimelineDialogOpen && space && (
         <ActivityTimelineDialog
            isOpen={isTimelineDialogOpen}
            onClose={closeTimelineDialog}
            timelineItems={timelineItems || []}
            isLoading={isLoadingTimeline}
            title="Activity Timeline / Gantt (Future)"
        />
      )}
      {imageCaptureExistingTodo.selectedItemForImage && (
        <ImageCaptureDialogView
            isOpen={imageCaptureExistingTodo.showCameraDialog}
            onClose={imageCaptureExistingTodo.handleCloseImageCaptureDialog}
            dialogTitle={`Capture ${imageCaptureExistingTodo.captureMode || ''} Image`}
            itemDescription={imageCaptureExistingTodo.selectedItemForImage?.description}
            videoRef={imageCaptureExistingTodo.videoRef}
            canvasRef={imageCaptureExistingTodo.canvasRef}
            videoDevices={imageCaptureExistingTodo.videoDevices}
            selectedDeviceId={imageCaptureExistingTodo.selectedDeviceId}
            onDeviceChange={imageCaptureExistingTodo.handleDeviceChange}
            hasCameraPermission={imageCaptureExistingTodo.hasCameraPermission}
            isCheckingPermission={imageCaptureExistingTodo.isCheckingPermission}
            stream={imageCaptureExistingTodo.stream}
            onCaptureAndSave={handleCaptureAndSaveImageForExistingTodo}
            isCapturingImage={imageCaptureExistingTodo.isCapturingImage}
        />
      )}

      {space && (
        <AdvancedActionsDialog
          isOpen={isAdvancedActionsDialogOpen}
          onClose={closeAdvancedActionsDialog}
          spaceId={space.id}
          actionDefinitions={actionDefinitions || []}
          isLoadingActionDefinitions={isLoadingActionDefinitions}
          createActionDefinitionUseCase={createActionDefUseCaseFromHook}
          updateActionDefinitionUseCase={updateActionDefUseCaseFromHook}
          deleteActionDefinitionUseCase={deleteActionDefUseCaseFromHook}
          addActionDefinition={addActionDefinitionInState}
          updateActionDefinitionInState={updateActionDefinitionInState}
          removeActionDefinitionFromState={removeActionDefinitionFromState}
          onActionDefinitionsChanged={refreshActionDefinitionsAndTimeline}
        />
      )}

      {currentMultiStepAction && isMultiStepDialogOpen && (
        <MultiStepActionDialog
          actionDefinition={currentMultiStepAction}
          isOpen={isMultiStepDialogOpen}
          onClose={closeMultiStepDialog}
          onLogAction={baseHandleLogAction}
        />
      )}

      {currentDataEntryAction && isDataEntryDialogOpen && (
        <DataEntryFormDialog
          actionDefinition={currentDataEntryAction}
          isOpen={isDataEntryDialogOpen}
          onClose={closeDataEntryDialog}
          onSubmitLog={async (data: Omit<LogDataEntryInputDTO, 'spaceId'>) => {
            await handleLogDataEntry(data);
            closeDataEntryDialog();
          }}
        />
      )}
       {currentTimerAction && isTimerActionDialogOpen && (
        <TimerActionDialog
          actionDefinition={currentTimerAction}
          isOpen={isTimerActionDialogOpen}
          onClose={closeTimerActionDialog}
          onLogAction={async (actionDefId, notes, durationMs) => {
            await baseHandleLogAction(actionDefId, undefined, undefined, notes, durationMs);
            closeTimerActionDialog();
          }}
        />
      )}
    </div>
  );
}

