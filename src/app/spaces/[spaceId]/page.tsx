
// src/app/spaces/[spaceId]/page.tsx
"use client";

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Settings, ListTodo, BarChart3, History, Loader2, ToyBrick, AlertOctagonIcon, Database, LayoutDashboard } from 'lucide-react';
import type { Space } from '@/domain/entities/space.entity';
import { Separator } from '@/components/ui/separator';
import { SpaceSettingsDialog } from '@/components/dialogs/space-settings-dialog';
import { useDialogState } from '@/hooks/use-dialog-state';

// Component Imports for Tabs
import { ActionManager } from '@/components/space-tabs/action-manager';
import { TodoSection } from '@/components/space-tabs/todo-section';
import { ActivityTimelineView } from '@/components/space-tabs/activity-timeline-view';
import { ProblemTracker } from '@/components/space-tabs/problem-tracker';
import { SpaceStatistics } from '@/components/space-tabs/space-statistics';
import { DataViewer } from '@/components/space-tabs/data-viewer';
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

import { CreateActionDefinitionUseCase } from '@/application/use-cases/action-definition/create-action-definition.usecase';
import { GetActionDefinitionsBySpaceUseCase } from '@/application/use-cases/action-definition/get-action-definitions-by-space.usecase';
import { UpdateActionDefinitionUseCase } from '@/application/use-cases/action-definition/update-action-definition.usecase';
import { DeleteActionDefinitionUseCase } from '@/application/use-cases/action-definition/delete-action-definition.usecase';

import { LogActionUseCase, type LogActionResult } from '@/application/use-cases/action-log/log-action.usecase';
import { GetActionLogsBySpaceUseCase } from '@/application/use-cases/action-log/get-action-logs-by-space.usecase';
import { GetTimelineItemsBySpaceUseCase } from '@/application/use-cases/timeline/get-timeline-items-by-space.usecase';

import { CreateTodoUseCase } from '@/application/use-cases/todo/create-todo.usecase';
import { GetTodosBySpaceUseCase } from '@/application/use-cases/todo/get-todos-by-space.usecase';
import { UpdateTodoUseCase } from '@/application/use-cases/todo/update-todo.usecase';
import { DeleteTodoUseCase } from '@/application/use-cases/todo/delete-todo.usecase';

import { CreateProblemUseCase } from '@/application/use-cases/problem/create-problem.usecase';
import { GetProblemsBySpaceUseCase } from '@/application/use-cases/problem/get-problems-by-space.usecase';
import { UpdateProblemUseCase } from '@/application/use-cases/problem/update-problem.usecase';
import { DeleteProblemUseCase } from '@/application/use-cases/problem/delete-problem.usecase';

import { SaveClockEventUseCase } from '@/application/use-cases/clock-event/save-clock-event.usecase';
import { GetLastClockEventUseCase } from '@/application/use-cases/clock-event/get-last-clock-event.usecase';
import { GetClockEventsBySpaceUseCase } from '@/application/use-cases/clock-event/get-clock-events-by-space.usecase';

import { LogDataEntryUseCase, type LogDataEntryInputDTO } from '@/application/use-cases/data-entry/log-data-entry.usecase';
import { GetDataEntriesBySpaceUseCase } from '@/application/use-cases/data-entry/get-data-entries-by-space.usecase';

// Hooks for data management
import { useSpaceData } from '@/hooks/data/use-space-data';
import { useActionDefinitionsData } from '@/hooks/data/use-action-definitions-data';
import { useTimelineData } from '@/hooks/data/use-timeline-data';
import { useActionLogger } from '@/hooks/actions/use-action-logger';

import type { ActionLog } from '@/domain/entities/action-log.entity';
import type { DataEntryLog } from '@/domain/entities/data-entry-log.entity';
import type { Todo } from '@/domain/entities/todo.entity';
import type { Problem } from '@/domain/entities/problem.entity';
import type { ClockEvent } from '@/domain/entities/clock-event.entity';


export default function SpaceDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const spaceId = params.spaceId as string;

  const { 
    isOpen: isSettingsDialogOpen, 
    openDialog: openSettingsDialog, 
    closeDialog: closeSettingsDialog 
  } = useDialogState();
  const [activeTab, setActiveTab] = useState<string>("overview");
  
  const [actionLogsForSpace, setActionLogsForSpace] = useState<ActionLog[]>([]);
  const [dataEntriesForSpace, setDataEntriesForSpace] = useState<DataEntryLog[]>([]);
  const [todosForSpace, setTodosForSpace] = useState<Todo[]>([]);
  const [problemsForSpace, setProblemsForSpace] = useState<Problem[]>([]);
  const [clockEventsForSpace, setClockEventsForSpace] = useState<ClockEvent[]>([]);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  
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
      const [actions, dataEntries, todos, problems, clockEvents] = await Promise.all([
        getActionLogsBySpaceUseCase.execute(spaceId),
        getDataEntriesBySpaceUseCase.execute(spaceId),
        getTodosBySpaceUseCase.execute(spaceId),
        getProblemsBySpaceUseCase.execute(spaceId),
        getClockEventsBySpaceUseCase.execute(spaceId)
      ]);
      setActionLogsForSpace(actions);
      setDataEntriesForSpace(dataEntries);
      setTodosForSpace(todos);
      setProblemsForSpace(problems);
      setClockEventsForSpace(clockEvents);
      refreshTimeline();
    } catch (err) {
      console.error("Error refreshing metrics data:", err);
    } finally {
      setIsLoadingMetrics(false);
    }
  }, [spaceId, getActionLogsBySpaceUseCase, getDataEntriesBySpaceUseCase, getTodosBySpaceUseCase, getProblemsBySpaceUseCase, getClockEventsBySpaceUseCase, refreshTimeline]);

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

  const addActionDefinition = useCallback((newDef: import('@/domain/entities/action-definition.entity').ActionDefinition) => {
    if (typeof addActionDefinitionFromHook === 'function') {
      addActionDefinitionFromHook(newDef);
    } else {
      refreshActionDefinitions();
    }
  }, [addActionDefinitionFromHook, refreshActionDefinitions]);

  const updateActionDefinitionInState = useCallback((updatedDef: import('@/domain/entities/action-definition.entity').ActionDefinition) => {
    if (typeof updateActionDefinitionInStateFromHook === 'function') {
       updateActionDefinitionInStateFromHook(updatedDef);
    } else {
       refreshActionDefinitions();
    }
  }, [updateActionDefinitionInStateFromHook, refreshActionDefinitions]);

  const removeActionDefinitionFromState = useCallback((definitionId: string) => {
    if (typeof removeActionDefinitionFromStateFromHook === 'function') {
      removeActionDefinitionFromStateFromHook(definitionId);
    } else {
      refreshActionDefinitions();
    }
  }, [removeActionDefinitionFromStateFromHook, refreshActionDefinitions]);

  const { handleLogAction: baseHandleLogAction, isLoggingAction } = useActionLogger({
    spaceId, logActionUseCase, onActionLogged: (logResult: LogActionResult) => { refreshTimelineData(); }
  });

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
    const pendingTodosCount = todosForSpace.filter(t => t.status === 'todo' || t.status === 'doing').length;
    const doneTodosCount = todosForSpace.filter(t => t.status === 'done').length;
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
  }, [actionLogsForSpace, dataEntriesForSpace, todosForSpace, problemsForSpace, clockEventsForSpace]);

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

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header pageTitle={space.name} />
      
      <div className="shrink-0 px-4 pt-3 pb-2 sm:px-6 lg:px-8"> {/* Reduced pt and pb */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mb-2"> {/* Reduced mb */}
          <div className="flex items-center gap-1 flex-grow min-w-0"> {/* Reduced gap */}
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0 h-9 w-9"> {/* Smaller icon button */}
              <ArrowLeft className="h-4 w-4" /> {/* Smaller icon */}
              <span className="sr-only">Back to Spaces</span>
            </Button>
            <h2 className="text-xl font-semibold truncate" title={space.name}>{space.name}</h2> {/* Reduced title size */}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ClockWidget 
              spaceId={space.id}
              saveClockEventUseCase={saveClockEventUseCase}
              getLastClockEventUseCase={getLastClockEventUseCase}
              onClockEventSaved={refreshAllMetricsData}
            />
            <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2 py-1" onClick={openSettingsDialog}> {/* Smaller button */}
              <Settings className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Settings
            </Button>
          </div>
        </div>
        {(space.description || space.goal) && (
          <div className="mb-1 text-xs"> {/* Reduced mb */}
            {space.description && <p className="text-muted-foreground line-clamp-1 sm:line-clamp-2">{space.description}</p>} {/* Line clamp 1 on small screens */}
            {space.goal && <p className="text-primary mt-0.5 text-xs line-clamp-1"><ListTodo className="inline mr-1 h-3 w-3" />Goal: {space.goal}</p>}
          </div>
        )}
        <Separator className="my-1.5" /> {/* Reduced separator margin */}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden px-4 sm:px-6 lg:px-8 pb-2"> {/* Reduced pb */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-1 h-auto p-0.5 mb-2 shrink-0"> {/* Reduced gap, padding, mb */}
            <TabsTrigger value="overview" className="text-xs p-1 sm:p-1.5"><LayoutDashboard className="mr-1 h-3.5 w-3.5"/>Overview</TabsTrigger>
            <TabsTrigger value="actions" className="text-xs p-1 sm:p-1.5"><ToyBrick className="mr-1 h-3.5 w-3.5"/>Actions</TabsTrigger>
            <TabsTrigger value="todos" className="text-xs p-1 sm:p-1.5"><ListTodo className="mr-1 h-3.5 w-3.5"/>To-Dos</TabsTrigger>
            <TabsTrigger value="problems" className="text-xs p-1 sm:p-1.5"><AlertOctagonIcon className="mr-1 h-3.5 w-3.5"/>Problems</TabsTrigger>
            <TabsTrigger value="data" className="text-xs p-1 sm:p-1.5"><Database className="mr-1 h-3.5 w-3.5"/>Data Logs</TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs p-1 sm:p-1.5"><History className="mr-1 h-3.5 w-3.5"/>Timeline</TabsTrigger>
            <TabsTrigger value="stats" className="text-xs p-1 sm:p-1.5"><BarChart3 className="mr-1 h-3.5 w-3.5"/>Old Stats</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="flex-1 overflow-hidden">
            <SpaceMetricsDisplay {...spaceMetrics} />
          </TabsContent>
          
          <TabsContent value="actions" className="flex-1 overflow-hidden">
            <ActionManager 
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
              addActionDefinition={addActionDefinition}
              updateActionDefinitionInState={updateActionDefinitionInState}
              removeActionDefinitionFromState={removeActionDefinitionFromState}
              onActionDefinitionsChanged={refreshActionDefinitionsAndTimeline}
            />
          </TabsContent>

          <TabsContent value="todos" className="flex-1 overflow-hidden">
             <TodoSection
                spaceId={space.id}
                createTodoUseCase={createTodoUseCase}
                updateTodoUseCase={updateTodoUseCase}
                deleteTodoUseCase={deleteTodoUseCase}
                getTodosBySpaceUseCase={getTodosBySpaceUseCase}
                onItemsChanged={refreshTimelineData}
             />
          </TabsContent>

          <TabsContent value="problems" className="flex-1 overflow-hidden">
            <ProblemTracker
              spaceId={space.id}
              createProblemUseCase={createProblemUseCase}
              updateProblemUseCase={updateProblemUseCase}
              deleteProblemUseCase={deleteProblemUseCase}
              getProblemsBySpaceUseCase={getProblemsBySpaceUseCase}
              onItemsChanged={refreshTimelineData}
            />
          </TabsContent>

          <TabsContent value="data" className="flex-1 overflow-hidden">
            <DataViewer 
              spaceId={space.id}
              getDataEntriesBySpaceUseCase={getDataEntriesBySpaceUseCase}
              actionDefinitions={actionDefinitions || []} 
            />
          </TabsContent>
          
          <TabsContent value="timeline" className="flex-1 overflow-hidden">
            <ActivityTimelineView 
              timelineItems={timelineItems || []} 
              isLoading={isLoadingTimeline} 
            />
          </TabsContent>

          <TabsContent value="stats" className="flex-1 overflow-hidden">
            <SpaceStatistics 
              spaceId={space.id} 
              fetchStats={async () => ({ totalPointsEarned: spaceMetrics.totalActionPoints, actionsLoggedCount: actionLogsForSpace.length + dataEntriesForSpace.length })}
             />
          </TabsContent>

        </Tabs>
      </div>
      {space && (
        <SpaceSettingsDialog
          isOpen={isSettingsDialogOpen}
          onClose={closeSettingsDialog}
          space={space}
          onSave={handleSaveSpaceSettings}
          onDelete={handleDeleteSpace}
        />
      )}
    </div>
  );
}

