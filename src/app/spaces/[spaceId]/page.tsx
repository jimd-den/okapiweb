
"use client";

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, ListTodo, BarChart3, History, Loader2, AlertOctagonIcon, Database, Newspaper, GanttChartSquare, ClipboardList, PlusCircle, Cog, ClipboardCheck, Sun, Moon } from 'lucide-react';
import type { Space } from '@/domain/entities/space.entity';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTheme } from "next-themes";
import { cn } from '@/lib/utils';

// Dialog Imports
import { SpaceSettingsDialog } from '@/components/dialogs/space-settings-dialog';
import { TodoListDialog } from '@/components/dialogs/todo-list-dialog';
import { ProblemTrackerDialog } from '@/components/dialogs/problem-tracker-dialog';
import { DataViewerDialog } from '@/components/dialogs/data-viewer-dialog';
import { ActivityTimelineDialog } from '@/components/dialogs/activity-timeline-dialog';
// ActionManager is now directly integrated for its list, its dialogs are managed by it.

// Component Imports
import { ActionManager } from '@/components/space-tabs/action-manager';
import { ClockWidget } from '@/components/clock-widget';
import { SpaceMetricsDisplay } from '@/components/space-metrics-display';

// Repositories
import { IndexedDBSpaceRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-space.repository';
import { IndexedDBActionDefinitionRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-action-definition.repository';
import { IndexedDBActionLogRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-action-log.repository';
import { IndexedDBTodoRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-todo.repository';
import { IndexedDBProblemRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-problem.repository';
import { IndexedDBClockEventRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-clock-event.repository';
import { IndexedDBDataEntryLogRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-data-entry-log.repository';

// Use Cases
import { GetSpaceByIdUseCase } from '@/application/use-cases/space/get-space-by-id.usecase';
import { UpdateSpaceUseCase, type UpdateSpaceInputDTO } from '@/application/use-cases/space/update-space.usecase';
import { DeleteSpaceUseCase } from '@/application/use-cases/space/delete-space.usecase';

import { CreateActionDefinitionUseCase, type CreateActionDefinitionInputDTO } from '@/application/use-cases/action-definition/create-action-definition.usecase';
import { GetActionDefinitionsBySpaceUseCase } from '@/application/use-cases/action-definition/get-action-definitions-by-space.usecase';
import { UpdateActionDefinitionUseCase, type UpdateActionDefinitionInputDTO as UpdateActionDefDto } from '@/application/use-cases/action-definition/update-action-definition.usecase';
import { DeleteActionDefinitionUseCase } from '@/application/use-cases/action-definition/delete-action-definition.usecase';

import { LogActionUseCase, type LogActionResult } from '@/application/use-cases/action-log/log-action.usecase';
import { GetActionLogsBySpaceUseCase } from '@/application/use-cases/action-log/get-action-logs-by-space.usecase';
import { GetTimelineItemsBySpaceUseCase } from '@/application/use-cases/timeline/get-timeline-items-by-space.usecase';

import { CreateTodoUseCase, type CreateTodoInputDTO as CreateTodoDto } from '@/application/use-cases/todo/create-todo.usecase';
import { GetTodosBySpaceUseCase } from '@/application/use-cases/todo/get-todos-by-space.usecase';
import { UpdateTodoUseCase, type UpdateTodoInputDTO as UpdateTodoDto } from '@/application/use-cases/todo/update-todo.usecase';
import { DeleteTodoUseCase } from '@/application/use-cases/todo/delete-todo.usecase';
import type { Todo, TodoStatus } from '@/domain/entities/todo.entity';

import { CreateProblemUseCase, type CreateProblemInputDTO as CreateProblemDto } from '@/application/use-cases/problem/create-problem.usecase';
import { GetProblemsBySpaceUseCase } from '@/application/use-cases/problem/get-problems-by-space.usecase';
import { UpdateProblemUseCase, type UpdateProblemInputDTO as UpdateProblemDto } from '@/application/use-cases/problem/update-problem.usecase';
import { DeleteProblemUseCase } from '@/application/use-cases/problem/delete-problem.usecase';
import type { Problem } from '@/domain/entities/problem.entity';

import { SaveClockEventUseCase } from '@/application/use-cases/clock-event/save-clock-event.usecase';
import { GetLastClockEventUseCase } from '@/application/use-cases/clock-event/get-last-clock-event.usecase';
import { GetClockEventsBySpaceUseCase } from '@/application/use-cases/clock-event/get-clock-events-by-space.usecase';

import { LogDataEntryUseCase, type LogDataEntryInputDTO } from '@/application/use-cases/data-entry/log-data-entry.usecase';
import { GetDataEntriesBySpaceUseCase } from '@/application/use-cases/data-entry/get-data-entries-by-space.usecase';

// Hooks
import { useSpaceData } from '@/hooks/data/use-space-data';
import { useActionDefinitionsData } from '@/hooks/data/use-action-definitions-data';
import { useTimelineData } from '@/hooks/data/use-timeline-data';
import { useActionLogger } from '@/hooks/actions/use-action-logger';
import { useDialogState } from '@/hooks/use-dialog-state';
import { useImageCaptureDialog, type UseImageCaptureDialogReturn } from '@/hooks/use-image-capture-dialog';
import { ImageCaptureDialogView } from '@/components/dialogs/image-capture-dialog-view';

import type { ActionDefinition } from '@/domain/entities/action-definition.entity';
import type { ActionLog } from '@/domain/entities/action-log.entity';
import type { DataEntryLog } from '@/domain/entities/data-entry-log.entity';
import type { ClockEvent } from '@/domain/entities/clock-event.entity';

const COLUMN_UI_DATA: Record<TodoStatus, { id: TodoStatus; title: string; icon: React.ReactNode; }> = {
  todo: { id: 'todo', title: 'To Do', icon: <ListTodo className="h-5 w-5" /> },
  doing: { id: 'doing', title: 'Doing', icon: <History className="h-5 w-5" /> },
  done: { id: 'done', title: 'Done', icon: <ClipboardCheck className="h-5 w-5" /> },
};

export default function SpaceDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const spaceId = params.spaceId as string;
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Dialog States
  const { isOpen: isSettingsDialogOpen, openDialog: openSettingsDialog, closeDialog: closeSettingsDialog } = useDialogState();
  const { isOpen: isTodoListDialogOpen, openDialog: openTodoListDialogInternal, closeDialog: closeTodoListDialogInternal } = useDialogState();
  const { isOpen: isProblemTrackerDialogOpen, openDialog: openProblemTrackerDialog, closeDialog: closeProblemTrackerDialog } = useDialogState();
  const { isOpen: isDataViewerDialogOpen, openDialog: openDataViewerDialog, closeDialog: closeDataViewerDialog } = useDialogState();
  const { isOpen: isTimelineDialogOpen, openDialog: openTimelineDialog, closeDialog: closeTimelineDialog } = useDialogState();
  const { isOpen: isManageActionsDialogOpen, openDialog: openManageActionsDialog, closeDialog: closeManageActionsDialog } = useDialogState(); // For advanced action settings

  // Data states for metrics
  const [actionLogsForSpace, setActionLogsForSpace] = useState<ActionLog[]>([]);
  const [dataEntriesForSpace, setDataEntriesForSpace] = useState<DataEntryLog[]>([]);
  const [allTodosForSpace, setAllTodosForSpace] = useState<Todo[]>([]);
  const [problemsForSpace, setProblemsForSpace] = useState<Problem[]>([]);
  const [clockEventsForSpace, setClockEventsForSpace] = useState<ClockEvent[]>([]);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  
  // Other UI states
  const [currentOpenTodoListStatus, setCurrentOpenTodoListStatus] = useState<TodoStatus | null>(null);
  const [newlyAddedTodoId, setNewlyAddedTodoId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null); // General action error
  const [animatingActionId, setAnimatingActionId] = useState<string | null>(null); // For quick action pop animation
  
  // Hooks instantiation
  const imageCaptureExistingTodo: UseImageCaptureDialogReturn<Todo, 'before' | 'after'> = useImageCaptureDialog<Todo, 'before' | 'after'>();
  
  const spaceRepository = useMemo(() => new IndexedDBSpaceRepository(), []);
  const actionDefinitionRepository = useMemo(() => new IndexedDBActionDefinitionRepository(), []); 
  const actionLogRepository = useMemo(() => new IndexedDBActionLogRepository(), []);
  const todoRepository = useMemo(() => new IndexedDBTodoRepository(), []);
  const problemRepository = useMemo(() => new IndexedDBProblemRepository(), []);
  const clockEventRepository = useMemo(() => new IndexedDBClockEventRepository(), []);
  const dataEntryLogRepository = useMemo(() => new IndexedDBDataEntryLogRepository(), []);

  const getSpaceByIdUseCase = useMemo(() => new GetSpaceByIdUseCase(spaceRepository), [spaceRepository]);
  const updateSpaceUseCase = useMemo(() => new UpdateSpaceUseCase(spaceRepository), [spaceRepository]);
  const deleteSpaceUseCase = useMemo(() => new DeleteSpaceUseCase(spaceRepository, actionDefinitionRepository, actionLogRepository, todoRepository, problemRepository, clockEventRepository, dataEntryLogRepository), [spaceRepository, actionDefinitionRepository, actionLogRepository, todoRepository, problemRepository, clockEventRepository, dataEntryLogRepository]);

  const getActionDefinitionsBySpaceUseCase = useMemo(() => new GetActionDefinitionsBySpaceUseCase(actionDefinitionRepository), [actionDefinitionRepository]);
  const logActionUseCase = useMemo(() => new LogActionUseCase(actionLogRepository, actionDefinitionRepository), [actionLogRepository, actionDefinitionRepository]);
  const getActionLogsBySpaceUseCase = useMemo(() => new GetActionLogsBySpaceUseCase(actionLogRepository), [actionLogRepository]);
  const getTimelineItemsBySpaceUseCase = useMemo(() => new GetTimelineItemsBySpaceUseCase(actionLogRepository, actionDefinitionRepository, problemRepository, todoRepository, dataEntryLogRepository), [actionLogRepository, actionDefinitionRepository, problemRepository, todoRepository, dataEntryLogRepository]);
  
  const createActionDefinitionUseCase = useMemo(() => new CreateActionDefinitionUseCase(actionDefinitionRepository), [actionDefinitionRepository]);
  const updateActionDefinitionUseCase = useMemo(() => new UpdateActionDefinitionUseCase(actionDefinitionRepository), [actionDefinitionRepository]);
  const deleteActionDefinitionUseCase = useMemo(() => new DeleteActionDefinitionUseCase(actionDefinitionRepository, actionLogRepository, dataEntryLogRepository), [actionDefinitionRepository, actionLogRepository, dataEntryLogRepository]);
  
  const createTodoUseCase = useMemo(() => new CreateTodoUseCase(todoRepository), [todoRepository]);
  const getTodosBySpaceUseCase = useMemo(() => new GetTodosBySpaceUseCase(todoRepository), [todoRepository]);
  const updateTodoUseCase = useMemo(() => new UpdateTodoUseCase(todoRepository), [todoRepository]);
  const deleteTodoUseCase = useMemo(() => new DeleteTodoUseCase(todoRepository), [todoRepository]);

  const createProblemUseCase = useMemo(() => new CreateProblemUseCase(problemRepository), [problemRepository]);
  const getProblemsBySpaceUseCase = useMemo(() => new GetProblemsBySpaceUseCase(problemRepository), [problemRepository]);
  const updateProblemUseCase = useMemo(() => new UpdateProblemUseCase(problemRepository), [problemRepository]);
  const deleteProblemUseCase = useMemo(() => new DeleteProblemUseCase(problemRepository), [problemRepository]);

  const saveClockEventUseCase = useMemo(() => new SaveClockEventUseCase(clockEventRepository), [clockEventRepository]);
  const getLastClockEventUseCase = useMemo(() => new GetLastClockEventUseCase(clockEventRepository), [clockEventRepository]);
  const getClockEventsBySpaceUseCase = useMemo(() => new GetClockEventsBySpaceUseCase(clockEventRepository), [clockEventRepository]);

  const logDataEntryUseCase = useMemo(() => new LogDataEntryUseCase(dataEntryLogRepository, actionDefinitionRepository), [dataEntryLogRepository, actionDefinitionRepository]);
  const getDataEntriesBySpaceUseCase = useMemo(() => new GetDataEntriesBySpaceUseCase(dataEntryLogRepository), [dataEntryLogRepository]);

  // Data fetching hooks
  const { space, isLoadingSpace, errorLoadingSpace, refreshSpace } = useSpaceData(spaceId, getSpaceByIdUseCase);
  const { 
    actionDefinitions, 
    isLoadingActionDefinitions,
    refreshActionDefinitions,
    addActionDefinition: addActionDefinitionFromHook,
    updateActionDefinitionInState: updateActionDefinitionInStateFromHook, 
    removeActionDefinitionFromState: removeActionDefinitionFromStateFromHook
  } = useActionDefinitionsData(spaceId, getActionDefinitionsBySpaceUseCase);
  const { timelineItems, isLoadingTimeline, refreshTimeline } = useTimelineData(spaceId, getTimelineItemsBySpaceUseCase);
  
  const { handleLogAction: baseHandleLogAction, isLoggingAction } = useActionLogger({
    spaceId, 
    logActionUseCase, 
    onActionLogged: (result) => {
      if (result.loggedAction) {
        setAnimatingActionId(result.loggedAction.actionDefinitionId);
        setTimeout(() => setAnimatingActionId(null), 600); // Corresponds to pop-in animation
      }
      refreshTimelineData(); 
    } 
  });

  const refreshAllMetricsData = useCallback(async () => {
    if (!spaceId) return;
    setIsLoadingMetrics(true);
    try {
      const [actions, dataEntries, todosData, problemsData, clockEventsData] = await Promise.all([
        getActionLogsBySpaceUseCase.execute(spaceId),
        getDataEntriesBySpaceUseCase.execute(spaceId),
        getTodosBySpaceUseCase.execute(spaceId),
        getProblemsBySpaceUseCase.execute(spaceId),
        getClockEventsBySpaceUseCase.execute(spaceId)
      ]);
      setActionLogsForSpace(actions);
      setDataEntriesForSpace(dataEntries);
      setAllTodosForSpace(todosData.sort((a,b) => (a.order || 0) - (b.order || 0) || new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()));
      setProblemsForSpace(problemsData);
      setClockEventsForSpace(clockEventsData);
    } catch (err) {
      console.error("Error refreshing metrics data:", err);
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoadingMetrics(false);
    }
  }, [spaceId, getActionLogsBySpaceUseCase, getDataEntriesBySpaceUseCase, getTodosBySpaceUseCase, getProblemsBySpaceUseCase, getClockEventsBySpaceUseCase]);

  useEffect(() => {
    if(spaceId) {
      refreshAllMetricsData();
    }
  }, [spaceId, refreshAllMetricsData]);

  useEffect(() => setMounted(true), []);

  const refreshTimelineData = useCallback(() => {
    refreshTimeline();
    refreshAllMetricsData(); 
  }, [refreshTimeline, refreshAllMetricsData]);

  const refreshActionDefinitionsAndTimeline = useCallback(() => {
    refreshActionDefinitions();
    refreshTimelineData();
  }, [refreshActionDefinitions, refreshTimelineData]);

  const addActionDefinitionOptimistic = useCallback((newDef: ActionDefinition) => {
    if (typeof addActionDefinitionFromHook === 'function') {
      addActionDefinitionFromHook(newDef);
    } else {
      refreshActionDefinitions();
    }
  }, [addActionDefinitionFromHook, refreshActionDefinitions]);

  const updateActionDefinitionInStateOptimistic = useCallback((updatedDef: ActionDefinition) => {
    if (typeof updateActionDefinitionInStateFromHook === 'function') {
       updateActionDefinitionInStateFromHook(updatedDef);
    } else {
       refreshActionDefinitions();
    }
  }, [updateActionDefinitionInStateFromHook, refreshActionDefinitions]);

  const removeActionDefinitionFromStateOptimistic = useCallback((definitionId: string) => {
    if (typeof removeActionDefinitionFromStateFromHook === 'function') {
      removeActionDefinitionFromStateFromHook(definitionId);
    } else {
      refreshActionDefinitions();
    }
  }, [removeActionDefinitionFromStateFromHook, refreshActionDefinitions]);

  const handleLogDataEntry = useCallback(async (data: LogDataEntryInputDTO) => {
    if (!logDataEntryUseCase) return;
    setActionError(null);
    try {
      await logDataEntryUseCase.execute(data);
      setAnimatingActionId(data.actionDefinitionId);
      setTimeout(() => setAnimatingActionId(null), 600);
      refreshTimelineData();
      // Dialog should close itself on successful submission
    } catch (error: any) {
      console.error("Error logging data entry:", error);
      setActionError(error.message || "Could not submit data."); 
      throw error; 
    }
  }, [logDataEntryUseCase, refreshTimelineData]);

  const handleSaveSpaceSettings = useCallback(async (data: UpdateSpaceInputDTO) => {
    if (!space) return; 
    setActionError(null);
    try {
      await updateSpaceUseCase.execute({ id: space.id, ...data });
      refreshSpace();
      closeSettingsDialog(); 
    } catch (error: any) {
      console.error("Error saving space settings:", error);
      setActionError(error.message || "Could not save settings.");
      throw error; 
    }
  }, [space, updateSpaceUseCase, refreshSpace, closeSettingsDialog]);

  const handleDeleteSpace = useCallback(async () => {
    if (!space) return;
    setActionError(null);
    try {
      await deleteSpaceUseCase.execute(space.id);
      router.push('/');
    } catch (error: any) {
      console.error("Error deleting space:", error);
      setActionError(error.message || "Could not delete space.");
      throw error; 
    }
  }, [space, deleteSpaceUseCase, router]);

  const spaceMetrics = useMemo(() => {
    const totalActionPoints = 
      actionLogsForSpace.reduce((sum, log) => sum + log.pointsAwarded, 0) +
      dataEntriesForSpace.reduce((sum, entry) => sum + entry.pointsAwarded, 0);
    const pendingTodosCount = allTodosForSpace.filter(t => t.status === 'todo' || t.status === 'doing').length;
    const doneTodosCount = allTodosForSpace.filter(t => t.status === 'done').length;
    const unresolvedProblemsCount = problemsForSpace.filter(p => !p.resolved).length;
    const resolvedProblemsCount = problemsForSpace.filter(p => p.resolved).length;
    let totalClockedInMs = 0;
    let currentSessionMs: number | null = null;
    let lastClockInTime: Date | null = null;
    let isCurrentlyClockedIn = false;
    const sortedClockEvents = [...clockEventsForSpace].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
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
      currentSessionMs = Date.now() - lastClockInTime.getTime();
    }
    return {
      totalActionPoints, pendingTodosCount, doneTodosCount, unresolvedProblemsCount, resolvedProblemsCount,
      totalClockedInMs, currentSessionMs, isCurrentlyClockedIn,
    };
  }, [actionLogsForSpace, dataEntriesForSpace, allTodosForSpace, problemsForSpace, clockEventsForSpace]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (spaceMetrics.isCurrentlyClockedIn && spaceMetrics.currentSessionMs !== null) {
        intervalId = setInterval(() => {
            setClockEventsForSpace(prev => [...prev]); 
        }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [spaceMetrics.isCurrentlyClockedIn, spaceMetrics.currentSessionMs]);

  const handleTodoCreated = useCallback((newTodo: Todo) => {
    setAllTodosForSpace(prev => [newTodo, ...prev].sort((a,b) => (a.order || 0) - (b.order || 0) || new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()));
    setNewlyAddedTodoId(newTodo.id);
    setTimeout(() => setNewlyAddedTodoId(null), 1000);
    refreshTimelineData(); 
  }, [refreshTimelineData]);

  const handleOpenTodoList = useCallback((status: TodoStatus) => {
    setCurrentOpenTodoListStatus(status);
    openTodoListDialogInternal();
  }, [openTodoListDialogInternal]);

  const handleUpdateTodoStatusInModal = useCallback(async (todo: Todo, newStatus: TodoStatus) => {
    setActionError(null);
    try {
      await updateTodoUseCase.execute({ id: todo.id, status: newStatus });
      refreshAllMetricsData(); 
      refreshTimelineData();  
    } catch (e: any) {
      setActionError(e.message || "Could not update to-do status.");
      throw e; 
    }
  }, [updateTodoUseCase, refreshAllMetricsData, refreshTimelineData]);

  const handleDeleteTodoInModal = useCallback(async (id: string) => {
    setActionError(null);
    try {
      await deleteTodoUseCase.execute(id);
      refreshAllMetricsData();
      refreshTimelineData();
    } catch (e: any) {
      setActionError(e.message || "Could not delete to-do.");
      throw e;
    }
  }, [deleteTodoUseCase, refreshAllMetricsData, refreshTimelineData]);
  
  const handleUpdateTodoDescriptionInModal = useCallback(async (id: string, description: string) => {
    setActionError(null);
    try {
      await updateTodoUseCase.execute({ id, description });
      refreshAllMetricsData(); 
      refreshTimelineData();
    } catch (e: any) {
      setActionError(e.message || "Could not update to-do description.");
      throw e;
    }
  }, [updateTodoUseCase, refreshAllMetricsData, refreshTimelineData]);

  const handleOpenImageCaptureForExistingTodoInModal = useCallback((todo: Todo, mode: 'before' | 'after') => {
    setActionError(null);
    imageCaptureExistingTodo.handleOpenImageCaptureDialog(todo, mode);
  }, [imageCaptureExistingTodo]);

  const handleCaptureAndSaveImageForExistingTodo = useCallback(async () => {
    if (!imageCaptureExistingTodo.videoRef.current || !imageCaptureExistingTodo.canvasRef.current || !imageCaptureExistingTodo.selectedItemForImage || !imageCaptureExistingTodo.captureMode) return;
    
    imageCaptureExistingTodo.setIsCapturingImage(true);
    setActionError(null);
    const video = imageCaptureExistingTodo.videoRef.current;
    const canvas = imageCaptureExistingTodo.canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
        setActionError("Could not get canvas context for image capture.");
        imageCaptureExistingTodo.setIsCapturingImage(false);
        return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUri = canvas.toDataURL('image/jpeg', 0.8);

    try {
      const updateData: UpdateTodoDto = { id: imageCaptureExistingTodo.selectedItemForImage.id };
      if (imageCaptureExistingTodo.captureMode === 'before') {
        updateData.beforeImageDataUri = imageDataUri;
      } else {
        updateData.afterImageDataUri = imageDataUri;
      }
      await updateTodoUseCase.execute(updateData);
      refreshAllMetricsData();
      refreshTimelineData();
      imageCaptureExistingTodo.handleCloseImageCaptureDialog();
    } catch (error: any) {
      console.error("Error saving image for todo:", error);
      setActionError(error.message || "Could not save image.");
    } finally {
        imageCaptureExistingTodo.setIsCapturingImage(false);
    }
  }, [imageCaptureExistingTodo, updateTodoUseCase, refreshAllMetricsData, refreshTimelineData]);
  
  const handleRemoveImageForExistingTodoInModal = useCallback(async (todoId: string, mode: 'before' | 'after') => {
    setActionError(null);
    const updateDto: UpdateTodoDto = { id: todoId };
    if (mode === 'before') updateDto.beforeImageDataUri = null;
    else updateDto.afterImageDataUri = null;
    try {
      await updateTodoUseCase.execute(updateDto);
      refreshAllMetricsData();
      refreshTimelineData();
    } catch (e:any) {
      setActionError(e.message || "Could not remove image.");
      throw e;
    }
  }, [updateTodoUseCase, refreshAllMetricsData, refreshTimelineData]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' || theme === 'system' ? 'dark' : 'light');
  }, [theme, setTheme]);

  if (isLoadingSpace || (!space && !errorLoadingSpace && spaceId) || isLoadingMetrics ) {
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
  
  if (!space) { 
    return (
      <div className="flex flex-col h-screen">
         <div className="shrink-0 px-3 sm:px-4 pt-2 pb-1 border-b bg-background flex justify-start items-center h-12">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 sm:h-9 sm:w-9 mr-2">
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

  const getActionInitials = (name: string) => {
    const words = name.split(' ').filter(Boolean);
    if (words.length === 1) return name.substring(0, 2).toUpperCase();
    return words.slice(0, 2).map(word => word[0]).join('').toUpperCase();
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Compact Integrated Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
        <div className="flex h-12 items-center justify-between px-2 sm:px-3 gap-1">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
            <h1 className="text-md sm:text-lg font-semibold truncate" title={space.name}>{space.name}</h1>
          </div>
          <div className="flex items-center gap-1">
            <ClockWidget 
              spaceId={space.id}
              saveClockEventUseCase={saveClockEventUseCase}
              getLastClockEventUseCase={getLastClockEventUseCase}
              onClockEventSaved={refreshAllMetricsData}
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
      
      <ScrollArea className="flex-1">
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          <section aria-labelledby="metrics-heading" className="shrink-0">
            <SpaceMetricsDisplay {...spaceMetrics} />
          </section>

          <section aria-labelledby="quick-actions-heading" className="shrink-0">
            <Card>
              <CardHeader className="pb-2 pt-3 px-3 flex flex-row justify-between items-center">
                <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
                <Button variant="outline" size="sm" className="text-xs h-7 px-2 py-1" onClick={openManageActionsDialog}>
                  <Cog className="mr-1.5 h-3.5 w-3.5"/> Advanced
                </Button>
              </CardHeader>
              <CardContent className="p-2 sm:p-3">
                {isLoadingActionDefinitions ? (
                  <div className="flex justify-center items-center py-4"> <Loader2 className="h-6 w-6 animate-spin text-primary" /> </div>
                ) : actionDefinitions.filter(ad => ad.isEnabled).length === 0 ? (
                  <p className="text-xs sm:text-sm text-muted-foreground text-center py-2">No quick actions. Use "Advanced" to add.</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5 sm:gap-2">
                    {actionDefinitions.filter(ad => ad.isEnabled).map(def => (
                      <Button
                        key={def.id}
                        variant="outline"
                        className={cn(
                          "flex flex-col items-center justify-center h-16 sm:h-20 text-[0.6rem] sm:text-xs p-1 break-all text-center leading-tight transition-transform duration-200",
                          animatingActionId === def.id && "animate-pop-in scale-110 bg-primary/20"
                        )}
                        onClick={() => {
                          if (def.type === 'single') baseHandleLogAction(def.id);
                          else if (def.type === 'multi-step') openManageActionsDialog(); // Or specific multi-step dialog
                          else if (def.type === 'data-entry') openManageActionsDialog(); // Or specific data entry dialog
                        }}
                        disabled={isLoggingAction}
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

          <section aria-labelledby="other-tools-heading" className="shrink-0">
            <h3 id="other-tools-heading" className="text-sm sm:text-md font-semibold mb-1.5 sm:mb-2 text-muted-foreground">Other Tools</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {(Object.keys(COLUMN_UI_DATA) as TodoStatus[]).map((statusKey) => {
                  const column = COLUMN_UI_DATA[statusKey];
                  const itemsCount = allTodosForSpace.filter(t => t.status === statusKey).length;
                  return (
                      <Card key={column.id}
                          className="p-2 sm:p-3 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow cursor-pointer min-h-[70px] sm:min-h-[90px] bg-card/70"
                          onClick={() => handleOpenTodoList(column.id)}
                          role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleOpenTodoList(column.id)}
                      >
                          {column.icon && React.cloneElement(column.icon as React.ReactElement, { className: "h-5 w-5 sm:h-6 sm:w-6 text-primary mb-1" })}
                          <CardTitle className="text-xs sm:text-sm md:text-md">{column.title}</CardTitle>
                          <CardDescription className="text-[0.65rem] sm:text-xs">{itemsCount} item(s)</CardDescription>
                      </Card>
                  );
              })}
              <Card className="p-2 sm:p-3 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow cursor-pointer min-h-[70px] sm:min-h-[90px] bg-card/70" onClick={openProblemTrackerDialog} role="button" tabIndex={0}>
                <AlertOctagonIcon className="h-5 w-5 sm:h-6 sm:w-6 text-destructive mb-1" />
                <CardTitle className="text-xs sm:text-sm md:text-md">Problems</CardTitle>
                <CardDescription className="text-[0.65rem] sm:text-xs">{problemsForSpace.filter(p => !p.resolved).length} open</CardDescription>
              </Card>
              <Card className="p-2 sm:p-3 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow cursor-pointer min-h-[70px] sm:min-h-[90px] bg-card/70" onClick={openDataViewerDialog} role="button" tabIndex={0}>
                <Database className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500 mb-1" />
                <CardTitle className="text-xs sm:text-sm md:text-md">Data Logs</CardTitle>
                <CardDescription className="text-[0.65rem] sm:text-xs">{dataEntriesForSpace.length} entries</CardDescription>
              </Card>
              <Card className="p-2 sm:p-3 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow cursor-pointer min-h-[70px] sm:min-h-[90px] bg-card/70" onClick={openTimelineDialog} role="button" tabIndex={0}>
                <GanttChartSquare className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 mb-1" />
                <CardTitle className="text-xs sm:text-sm md:text-md">Timeline</CardTitle>
                <CardDescription className="text-[0.65rem] sm:text-xs">View history</CardDescription>
              </Card>
            </div>
          </section>
        </div>
      </ScrollArea>
      
      {/* Modals */}
      {space && (
        <SpaceSettingsDialog isOpen={isSettingsDialogOpen} onClose={closeSettingsDialog} space={space} onSave={handleSaveSpaceSettings} onDelete={handleDeleteSpace} />
      )}
      
      {isTodoListDialogOpen && currentOpenTodoListStatus !== null && (
        <TodoListDialog
          isOpen={isTodoListDialogOpen}
          onClose={() => { closeTodoListDialogInternal(); setCurrentOpenTodoListStatus(null); }}
          title={`${COLUMN_UI_DATA[currentOpenTodoListStatus]?.title || ''} Tasks`} 
          allTodos={allTodosForSpace} 
          initialStatusFilter={currentOpenTodoListStatus} 
          onUpdateStatus={handleUpdateTodoStatusInModal}
          onDelete={handleDeleteTodoInModal}
          onUpdateDescription={handleUpdateTodoDescriptionInModal}
          onOpenImageCapture={handleOpenImageCaptureForExistingTodoInModal} 
          onRemoveImage={handleRemoveImageForExistingTodoInModal} 
          isSubmittingParent={isLoggingAction || isLoadingMetrics} 
          newlyAddedTodoId={newlyAddedTodoId}
          createTodoUseCase={createTodoUseCase}
          spaceId={space.id}
          onTodoCreated={handleTodoCreated}
        />
      )}
      {isProblemTrackerDialogOpen && (
         <ProblemTrackerDialog isOpen={isProblemTrackerDialogOpen} onClose={closeProblemTrackerDialog} spaceId={space.id} createProblemUseCase={createProblemUseCase} updateProblemUseCase={updateProblemUseCase} deleteProblemUseCase={deleteProblemUseCase} getProblemsBySpaceUseCase={getProblemsBySpaceUseCase} onItemsChanged={refreshTimelineData}/>
      )}
      {isDataViewerDialogOpen && (
         <DataViewerDialog isOpen={isDataViewerDialogOpen} onClose={closeDataViewerDialog} spaceId={space.id} getDataEntriesBySpaceUseCase={getDataEntriesBySpaceUseCase} actionDefinitions={actionDefinitions || []} />
      )}
      {isTimelineDialogOpen && (
         <ActivityTimelineDialog isOpen={isTimelineDialogOpen} onClose={closeTimelineDialog} timelineItems={timelineItems || []} isLoading={isLoadingTimeline} />
      )}
      {imageCaptureExistingTodo.selectedItemForImage && (
        <ImageCaptureDialogView isOpen={imageCaptureExistingTodo.showCameraDialog} onClose={imageCaptureExistingTodo.handleCloseImageCaptureDialog} dialogTitle={`Capture ${imageCaptureExistingTodo.captureMode || ''} Image`} itemDescription={imageCaptureExistingTodo.selectedItemForImage?.description} videoRef={imageCaptureExistingTodo.videoRef} canvasRef={imageCaptureExistingTodo.canvasRef} videoDevices={imageCaptureExistingTodo.videoDevices} selectedDeviceId={imageCaptureExistingTodo.selectedDeviceId} onDeviceChange={imageCaptureExistingTodo.handleDeviceChange} hasCameraPermission={imageCaptureExistingTodo.hasCameraPermission} isCheckingPermission={imageCaptureExistingTodo.isCheckingPermission} stream={imageCaptureExistingTodo.stream} onCaptureAndSave={handleCaptureAndSaveImageForExistingTodo} isCapturingImage={imageCaptureExistingTodo.isCapturingImage} />
      )}
      
      <ActionManager
        isOpen={isManageActionsDialogOpen}
        onClose={closeManageActionsDialog}
        spaceId={space.id}
        actionDefinitions={actionDefinitions || []}
        isLoadingActionDefinitions={isLoadingActionDefinitions}
        isLoggingAction={isLoggingAction}
        onLogAction={baseHandleLogAction} 
        onLogDataEntry={handleLogDataEntry} 
        createActionDefinitionUseCase={createActionDefinitionUseCase}
        updateActionDefinitionUseCase={updateActionDefinitionUseCase}
        deleteActionDefinitionUseCase={deleteActionDefinitionUseCase}
        logDataEntryUseCase={logDataEntryUseCase}
        addActionDefinition={addActionDefinitionOptimistic}
        updateActionDefinitionInState={updateActionDefinitionInStateOptimistic}
        removeActionDefinitionFromState={removeActionDefinitionFromStateOptimistic}
        onActionDefinitionsChanged={refreshActionDefinitionsAndTimeline}
      />
    </div>
  );
}
