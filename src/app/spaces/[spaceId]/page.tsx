
// src/app/spaces/[spaceId]/page.tsx
"use client";

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, ListTodo, BarChart3, History, Loader2, AlertOctagonIcon, Database, Newspaper, GanttChartSquare, ClipboardList, PlusCircle, Cog } from 'lucide-react';
import type { Space } from '@/domain/entities/space.entity';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Dialog Imports
import { SpaceSettingsDialog } from '@/components/dialogs/space-settings-dialog';
import { TodoListDialog } from '@/components/dialogs/todo-list-dialog';
import { ProblemTrackerDialog } from '@/components/dialogs/problem-tracker-dialog';
import { DataViewerDialog } from '@/components/dialogs/data-viewer-dialog';
import { ActivityTimelineDialog } from '@/components/dialogs/activity-timeline-dialog';
import { CreateActionDefinitionDialog } from '@/components/dialogs/create-action-definition-dialog';
import { EditActionDefinitionDialog } from '@/components/dialogs/edit-action-definition-dialog';
import { MultiStepActionDialog } from '@/components/dialogs/multi-step-action-dialog';
import { DataEntryFormDialog } from '@/components/dialogs/data-entry-form-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle as UIDialogTitle, DialogFooter, DialogDescription as UIDialogDescription } from '@/components/ui/dialog'; // Renamed to avoid conflict

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
import { CreateTodoDialog } from '@/components/dialogs/create-todo-dialog';


import type { ActionDefinition } from '@/domain/entities/action-definition.entity';
import type { ActionLog } from '@/domain/entities/action-log.entity';
import type { DataEntryLog } from '@/domain/entities/data-entry-log.entity';
import type { ClockEvent } from '@/domain/entities/clock-event.entity';

type CaptureMode = 'before' | 'after'; // For Todo images

const COLUMN_UI_DATA: Record<TodoStatus, { id: TodoStatus; title: string; icon: React.ReactNode; }> = {
  todo: { id: 'todo', title: 'To Do', icon: <ListTodo className="h-5 w-5" /> },
  doing: { id: 'doing', title: 'Doing', icon: <History className="h-5 w-5" /> },
  done: { id: 'done', title: 'Done', icon: <ClipboardCheck className="h-5 w-5" /> },
};

export default function SpaceDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const spaceId = params.spaceId as string;

  const { isOpen: isSettingsDialogOpen, openDialog: openSettingsDialog, closeDialog: closeSettingsDialog } = useDialogState();
  const { isOpen: isTodoListDialogOpen, openDialog: openTodoListDialogInternal, closeDialog: closeTodoListDialogInternal } = useDialogState();
  const { isOpen: isProblemTrackerDialogOpen, openDialog: openProblemTrackerDialog, closeDialog: closeProblemTrackerDialog } = useDialogState();
  const { isOpen: isDataViewerDialogOpen, openDialog: openDataViewerDialog, closeDialog: closeDataViewerDialog } = useDialogState();
  const { isOpen: isTimelineDialogOpen, openDialog: openTimelineDialog, closeDialog: closeTimelineDialog } = useDialogState();
  const { isOpen: isManageActionsDialogOpen, openDialog: openManageActionsDialog, closeDialog: closeManageActionsDialog } = useDialogState();
  const { isOpen: isMultiStepDialogOpen, openDialog: openMultiStepDialog, closeDialog: closeMultiStepDialog } = useDialogState();
  const { isOpen: isDataEntryDialogOpen, openDialog: openDataEntryDialog, closeDialog: closeDataEntryDialog } = useDialogState();
  
  const [actionLogsForSpace, setActionLogsForSpace] = useState<ActionLog[]>([]);
  const [dataEntriesForSpace, setDataEntriesForSpace] = useState<DataEntryLog[]>([]);
  const [allTodosForSpace, setAllTodosForSpace] = useState<Todo[]>([]);
  const [problemsForSpace, setProblemsForSpace] = useState<Problem[]>([]);
  const [clockEventsForSpace, setClockEventsForSpace] = useState<ClockEvent[]>([]);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [currentOpenTodoListStatus, setCurrentOpenTodoListStatus] = useState<TodoStatus | null>(null);
  const [newlyAddedTodoId, setNewlyAddedTodoId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [currentMultiStepAction, setCurrentMultiStepAction] = useState<ActionDefinition | null>(null);
  const [currentDataEntryAction, setCurrentDataEntryAction] = useState<ActionDefinition | null>(null);
  
  const imageCaptureExistingTodo: UseImageCaptureDialogReturn<Todo, CaptureMode> = useImageCaptureDialog<Todo, CaptureMode>();
  
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
    } finally {
      setIsLoadingMetrics(false);
    }
  }, [spaceId, getActionLogsBySpaceUseCase, getDataEntriesBySpaceUseCase, getTodosBySpaceUseCase, getProblemsBySpaceUseCase, getClockEventsBySpaceUseCase]);

  useEffect(() => {
    if(spaceId) {
      refreshAllMetricsData();
    }
  }, [spaceId, refreshAllMetricsData]);

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

  const { handleLogAction: baseHandleLogAction, isLoggingAction } = useActionLogger({
    spaceId, logActionUseCase, onActionLogged: (logResult: LogActionResult) => { refreshTimelineData(); }
  });

  const handleOpenMultiStepDialogInternal = useCallback((actionDef: ActionDefinition) => {
    setCurrentMultiStepAction(actionDef);
    openMultiStepDialog();
  }, [openMultiStepDialog]);

  const handleOpenDataEntryDialogInternal = useCallback((actionDef: ActionDefinition) => {
    setCurrentDataEntryAction(actionDef);
    openDataEntryDialog();
  }, [openDataEntryDialog]);

  const handleLogDataEntry = useCallback(async (data: LogDataEntryInputDTO) => {
    if (!logDataEntryUseCase) return;
    try {
      await logDataEntryUseCase.execute(data);
      refreshTimelineData();
    } catch (error: any) {
      console.error("Error logging data entry:", error);
      throw error; 
    }
  }, [logDataEntryUseCase, refreshTimelineData]);

  useEffect(() => {
    if (!isLoadingSpace && errorLoadingSpace) {
       console.error("Error loading space from hook:", errorLoadingSpace);
    }
  }, [isLoadingSpace, errorLoadingSpace, spaceId, router]);

  const handleSaveSpaceSettings = useCallback(async (data: UpdateSpaceInputDTO) => {
    if (!space) return; 
    try {
      await updateSpaceUseCase.execute({ id: space.id, ...data });
      refreshSpace();
      closeSettingsDialog(); 
    } catch (error) {
      console.error("Error saving space settings:", error);
      throw error; 
    }
  }, [space, updateSpaceUseCase, refreshSpace, closeSettingsDialog]);

  const handleDeleteSpace = useCallback(async () => {
    if (!space) return;
    try {
      await deleteSpaceUseCase.execute(space.id);
      router.push('/');
    } catch (error) {
      console.error("Error deleting space:", error);
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
            refreshAllMetricsData(); 
        }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [spaceMetrics.isCurrentlyClockedIn, spaceMetrics.currentSessionMs, refreshAllMetricsData]);

  // --- To-Do Specific Logic ---
  const handleTodoCreated = useCallback((newTodo: Todo) => {
    setAllTodosForSpace(prev => [newTodo, ...prev].sort((a,b) => (a.order || 0) - (b.order || 0) || new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()));
    setNewlyAddedTodoId(newTodo.id);
    setTimeout(() => setNewlyAddedTodoId(null), 1000);
    refreshTimelineData();
    // No longer need to close a global create dialog here, as it's handled in TodoListDialog
  }, [refreshTimelineData]);

  const handleOpenTodoList = useCallback((status: TodoStatus) => {
    setCurrentOpenTodoListStatus(status);
    openTodoListDialogInternal();
  }, [openTodoListDialogInternal]);

  const handleUpdateTodoStatusInModal = useCallback(async (todo: Todo, newStatus: TodoStatus) => {
    await updateTodoUseCase.execute({ id: todo.id, status: newStatus });
    refreshAllMetricsData(); 
    refreshTimelineData();  
  }, [updateTodoUseCase, refreshAllMetricsData, refreshTimelineData]);

  const handleDeleteTodoInModal = useCallback(async (id: string) => {
    await deleteTodoUseCase.execute(id);
    refreshAllMetricsData();
    refreshTimelineData();
  }, [deleteTodoUseCase, refreshAllMetricsData, refreshTimelineData]);
  
  const handleUpdateTodoDescriptionInModal = useCallback(async (id: string, description: string) => {
    await updateTodoUseCase.execute({ id, description });
    refreshAllMetricsData();
    refreshTimelineData();
  }, [updateTodoUseCase, refreshAllMetricsData, refreshTimelineData]);

  const handleOpenImageCaptureForExistingTodoInModal = useCallback((todo: Todo, mode: CaptureMode) => {
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
    const updateDto: UpdateTodoDto = { id: todoId };
    if (mode === 'before') updateDto.beforeImageDataUri = null;
    else updateDto.afterImageDataUri = null;
    await updateTodoUseCase.execute(updateDto);
    refreshAllMetricsData();
    refreshTimelineData();
  }, [updateTodoUseCase, refreshAllMetricsData, refreshTimelineData]);


  if (isLoadingSpace || (!space && !errorLoadingSpace && spaceId) || isLoadingMetrics ) {
    return (
      <div className="flex flex-col h-screen">
        <Header pageTitle="Loading Space..." />
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 flex-grow flex flex-col items-center justify-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
          <p className="text-xl text-muted-foreground">Loading Space Details...</p>
        </div>
      </div>
    );
  }
  
  if (!space) { 
    return (
      <div className="flex flex-col h-screen">
        <Header pageTitle="Space Not Found" />
        <div className="container mx-auto px-4 py-8 text-center flex-grow flex flex-col items-center justify-center">
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
    <div className="flex flex-col h-screen overflow-hidden"> {/* Main container fixed height and overflow hidden */}
      <Header pageTitle="" /> {/* Minimal header */}
      
      {/* Controls Header - shrink-0 */}
      <div className="shrink-0 px-3 sm:px-4 pt-2 pb-1 border-b">
        <div className="flex justify-between items-center gap-2 mb-1">
          <div className="flex items-center gap-1 sm:gap-2 flex-grow min-w-0">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0 h-8 w-8 sm:h-9 sm:w-9">
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="sr-only">Back to Spaces</span>
            </Button>
            <h1 className="text-lg sm:text-xl font-semibold truncate" title={space.name}>{space.name}</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <ClockWidget 
              spaceId={space.id}
              saveClockEventUseCase={saveClockEventUseCase}
              getLastClockEventUseCase={getLastClockEventUseCase}
              onClockEventSaved={refreshAllMetricsData}
            />
            <Button variant="ghost" size="icon" onClick={openSettingsDialog} className="h-8 w-8 sm:h-9 sm:w-9">
              <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="sr-only">Space Settings</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area - flex-1 to take remaining space, with its own ScrollArea */}
      <ScrollArea className="flex-1 bg-background/50">
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {/* Metrics Display */}
          <section aria-labelledby="metrics-heading" className="shrink-0">
            <SpaceMetricsDisplay {...spaceMetrics} />
          </section>

          {/* Quick Actions Section */}
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
                  <p className="text-xs sm:text-sm text-muted-foreground text-center py-2">No quick actions enabled. Use "Advanced" to add or enable actions.</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5 sm:gap-2">
                    {actionDefinitions.filter(ad => ad.isEnabled).map(def => (
                      <Button
                        key={def.id}
                        variant="outline"
                        className="flex flex-col items-center justify-center h-16 sm:h-20 text-[0.6rem] sm:text-xs p-1 break-all text-center leading-tight"
                        onClick={() => {
                          if (def.type === 'single') baseHandleLogAction(def.id);
                          else if (def.type === 'multi-step') handleOpenMultiStepDialogInternal(def);
                          else if (def.type === 'data-entry') handleOpenDataEntryDialogInternal(def);
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

          {/* Other Tools Section */}
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
          title={`To-Do Board`} // Title is for the whole board now
          allTodos={allTodosForSpace} // Pass all todos
          initialStatusFilter={currentOpenTodoListStatus} // Can be used to highlight/scroll to a column
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
      {currentMultiStepAction && <MultiStepActionDialog actionDefinition={currentMultiStepAction} isOpen={isMultiStepDialogOpen} onClose={closeMultiStepDialog} onLogAction={baseHandleLogAction} />}
      {currentDataEntryAction && <DataEntryFormDialog actionDefinition={currentDataEntryAction} isOpen={isDataEntryDialogOpen} onClose={closeDataEntryDialog} onSubmitLog={handleLogDataEntry} />}
      
      <Dialog open={isManageActionsDialogOpen} onOpenChange={closeManageActionsDialog}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-4 border-b shrink-0">
            <UIDialogTitle className="text-xl sm:text-2xl">Advanced Action Settings</UIDialogTitle>
            <UIDialogDescription className="text-sm sm:text-base">Manage all action definitions for this space. Add new actions, edit existing ones, or change their order and properties.</UIDialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-1 sm:p-2 md:p-4">
            <ActionManager
              spaceId={space.id}
              actionDefinitions={actionDefinitions || []}
              isLoadingActionDefinitions={isLoadingActionDefinitions}
              isLoggingAction={isLoggingAction}
              onLogAction={baseHandleLogAction} // Not used for execution here, but ActionManager might need it internally
              onLogDataEntry={handleLogDataEntry} // Same as above
              createActionDefinitionUseCase={createActionDefinitionUseCase}
              updateActionDefinitionUseCase={updateActionDefinitionUseCase}
              deleteActionDefinitionUseCase={deleteActionDefinitionUseCase}
              logDataEntryUseCase={logDataEntryUseCase} // Should not be needed if action manager is for defs only
              addActionDefinition={addActionDefinitionOptimistic}
              updateActionDefinitionInState={updateActionDefinitionInStateOptimistic}
              removeActionDefinitionFromState={removeActionDefinitionFromStateOptimistic}
              onActionDefinitionsChanged={refreshActionDefinitionsAndTimeline}
            />
          </div>
          <DialogFooter className="p-4 sm:p-6 pt-2 sm:pt-4 border-t shrink-0">
            <Button variant="outline" size="lg" onClick={closeManageActionsDialog}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
    
