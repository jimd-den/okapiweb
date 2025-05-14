
"use client";

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Settings, ListTodo, BarChart3, History, Loader2, ToyBrick, AlertOctagonIcon } from 'lucide-react';
import type { Space } from '@/domain/entities/space.entity';
import type { ActionDefinition } from '@/domain/entities/action-definition.entity';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

// Component Imports for Tabs
import { ActionManager } from '@/components/space-tabs/action-manager';
import { TodoSection } from '@/components/space-tabs/todo-section';
import { ActivityTimelineView } from '@/components/space-tabs/activity-timeline-view';
import { ProblemTracker } from '@/components/space-tabs/problem-tracker';
import { SpaceStatistics } from '@/components/space-tabs/space-statistics';
import { ClockWidget } from '@/components/clock-widget';

// Repositories - these will be used by use cases instantiated here or in child components
import { IndexedDBSpaceRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-space.repository';
import { IndexedDBActionDefinitionRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-action-definition.repository';
import { IndexedDBActionLogRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-action-log.repository';
import { IndexedDBUserProgressRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-user-progress.repository';
import { IndexedDBTodoRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-todo.repository';
import { IndexedDBProblemRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-problem.repository';
import { IndexedDBClockEventRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-clock-event.repository';


// Use Cases - Instantiated here and passed down, or instantiated by child components
import { GetSpaceByIdUseCase } from '@/application/use-cases/space/get-space-by-id.usecase';
import { CreateActionDefinitionUseCase, type CreateActionDefinitionInputDTO } from '@/application/use-cases/action-definition/create-action-definition.usecase';
import { GetActionDefinitionsBySpaceUseCase } from '@/application/use-cases/action-definition/get-action-definitions-by-space.usecase';
import { LogActionUseCase, type LogActionInputDTO } from '@/application/use-cases/action-log/log-action.usecase';
import type { TimelineItem } from '@/application/dto/timeline-item.dto';
import { GetTimelineItemsBySpaceUseCase } from '@/application/use-cases/timeline/get-timeline-items-by-space.usecase';
import { CreateTodoUseCase } from '@/application/use-cases/todo/create-todo.usecase';
import { GetTodosBySpaceUseCase } from '@/application/use-cases/todo/get-todos-by-space.usecase';
import { UpdateTodoUseCase } from '@/application/use-cases/todo/update-todo.usecase';
import { DeleteTodoUseCase } from '@/application/use-cases/todo/delete-todo.usecase';
import { CreateProblemUseCase } from '@/application/use-cases/problem/create-problem.usecase';
import { GetProblemsBySpaceUseCase } from '@/application/use-cases/problem/get-problems-by-space.usecase';
import { UpdateProblemUseCase } from '@/application/use-cases/problem/update-problem.usecase';
import { DeleteProblemUseCase } from '@/application/use-cases/problem/delete-problem.usecase';
import { GetSpaceStatsUseCase, type SpaceStatsDTO } from '@/application/use-cases/stats/get-space-stats.usecase';
import { SaveClockEventUseCase } from '@/application/use-cases/clock-event/save-clock-event.usecase';
import { GetLastClockEventUseCase } from '@/application/use-cases/clock-event/get-last-clock-event.usecase';

// Hooks for data management
import { useSpaceData } from '@/hooks/data/use-space-data';
import { useActionDefinitionsData } from '@/hooks/data/use-action-definitions-data';
import { useTimelineData } from '@/hooks/data/use-timeline-data';
import { useActionLogger } from '@/hooks/actions/use-action-logger';


export default function SpaceDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const spaceId = params.spaceId as string;
  
  
  // Instantiate repositories
  const spaceRepository = useMemo(() => new IndexedDBSpaceRepository(), []);
  const actionDefinitionRepository = useMemo(() => new IndexedDBActionDefinitionRepository(), []); 
  const actionLogRepository = useMemo(() => new IndexedDBActionLogRepository(), []);
  const userProgressRepository = useMemo(() => new IndexedDBUserProgressRepository(), []);
  const todoRepository = useMemo(() => new IndexedDBTodoRepository(), []);
  const problemRepository = useMemo(() => new IndexedDBProblemRepository(), []);
  const clockEventRepository = useMemo(() => new IndexedDBClockEventRepository(), []);

  // Instantiate core use cases needed by hooks or directly
  const getSpaceByIdUseCase = useMemo(() => new GetSpaceByIdUseCase(spaceRepository), [spaceRepository]);
  const getActionDefinitionsBySpaceUseCase = useMemo(() => new GetActionDefinitionsBySpaceUseCase(actionDefinitionRepository), [actionDefinitionRepository]);
  const logActionUseCase = useMemo(() => new LogActionUseCase(actionLogRepository, actionDefinitionRepository, userProgressRepository), [actionLogRepository, actionDefinitionRepository, userProgressRepository]);
  const getTimelineItemsBySpaceUseCase = useMemo(() => new GetTimelineItemsBySpaceUseCase(actionLogRepository, actionDefinitionRepository, problemRepository, todoRepository), [actionLogRepository, actionDefinitionRepository, problemRepository, todoRepository]);
  
  // Instantiate other use cases that will be passed directly to child components
  const createActionDefinitionUseCase = useMemo(() => new CreateActionDefinitionUseCase(actionDefinitionRepository), [actionDefinitionRepository]);
  const createTodoUseCase = useMemo(() => new CreateTodoUseCase(todoRepository), [todoRepository]);
  const getTodosBySpaceUseCase = useMemo(() => new GetTodosBySpaceUseCase(todoRepository), [todoRepository]);
  const updateTodoUseCase = useMemo(() => new UpdateTodoUseCase(todoRepository), [todoRepository]);
  const deleteTodoUseCase = useMemo(() => new DeleteTodoUseCase(todoRepository), [todoRepository]);
  const createProblemUseCase = useMemo(() => new CreateProblemUseCase(problemRepository), [problemRepository]);
  const getProblemsBySpaceUseCase = useMemo(() => new GetProblemsBySpaceUseCase(problemRepository), [problemRepository]);
  const updateProblemUseCase = useMemo(() => new UpdateProblemUseCase(problemRepository), [problemRepository]);
  const deleteProblemUseCase = useMemo(() => new DeleteProblemUseCase(problemRepository), [problemRepository]);
  const getSpaceStatsUseCase = useMemo(() => new GetSpaceStatsUseCase(actionLogRepository), [actionLogRepository]);
  const saveClockEventUseCase = useMemo(() => new SaveClockEventUseCase(clockEventRepository), [clockEventRepository]);
  const getLastClockEventUseCase = useMemo(() => new GetLastClockEventUseCase(clockEventRepository), [clockEventRepository]);


  // Use custom hooks for data management and actions
  const { space, isLoadingSpace, errorLoadingSpace } = useSpaceData(spaceId, getSpaceByIdUseCase);
  
  const { 
    actionDefinitions, 
    isLoadingActionDefinitions, 
    errorLoadingActionDefinitions,
    refreshActionDefinitions,
    addActionDefinition: addActionDefinitionToState,
  } = useActionDefinitionsData(spaceId, getActionDefinitionsBySpaceUseCase);

  const { 
    timelineItems, 
    isLoadingTimeline, 
    errorLoadingTimeline,
    refreshTimeline,
  } = useTimelineData(spaceId, getTimelineItemsBySpaceUseCase);
  
  const { handleLogAction, isLoggingAction } = useActionLogger(logActionUseCase, actionDefinitions, refreshTimeline, refreshActionDefinitions);


  // Callback to refresh all relevant data when a child component makes a change
  const onDataChangedRefreshAll = useCallback(() => {
    refreshTimeline();
    refreshActionDefinitions(); // In case logging an action modifies definition state (e.g. count of logs)
    // Potentially refresh stats here too, or stats component handles its own refresh
  }, [refreshTimeline, refreshActionDefinitions]);

  // If space failed to load or doesn't exist, redirect or show error
  useEffect(() => {
    if (!isLoadingSpace && errorLoadingSpace) {
      toast({ title: "Error Loading Space", description: String(errorLoadingSpace), variant: "destructive" });
      router.push('/');
    }
    if (!isLoadingSpace && !space && !errorLoadingSpace) {
       toast({ title: "Space Not Found", description: `Space with ID ${spaceId} could not be found.`, variant: "destructive" });
       router.push('/');
    }
  }, [isLoadingSpace, space, errorLoadingSpace, spaceId, router, toast]);


  const handleFetchStats = useCallback(async (): Promise<SpaceStatsDTO | null> => {
    if (!spaceId) return null;
    try {
      return await getSpaceStatsUseCase.execute(spaceId);
    } catch (err) {
      console.error("Error in handleFetchStats:", err);
      toast({ title: "Error Loading Stats", description: String(err), variant: "destructive" });
      return null;
    }
  }, [spaceId, getSpaceStatsUseCase, toast]);

  if (isLoadingSpace || (!space && !errorLoadingSpace) ) { // Added check for !space && !errorLoadingSpace
    return (
      <div className="flex flex-col min-h-screen">
        <Header pageTitle="Loading Space..." />
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 flex-grow">
          <Skeleton className="h-12 w-1/2 mb-4" />
          <Skeleton className="h-8 w-3/4 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64 md:col-span-2" />
          </div>
        </div>
      </div>
    );
  }
  
  // This check is now redundant due to useEffect, but kept for safety, can be removed.
  if (!space) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header pageTitle="Space Not Found" />
        <div className="container mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl font-semibold">The space you are looking for does not exist.</h2>
          <Button onClick={() => router.push('/')} className="mt-4">Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header pageTitle={space.name} />
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 flex-grow">
        <div className="mb-8">
          <Button variant="outline" onClick={() => router.back()} className="mb-6 text-md p-3">
            <ArrowLeft className="mr-2 h-5 w-5" /> Back to Spaces
          </Button>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-1">{space.name}</h1>
              {space.description && <p className="text-xl text-muted-foreground mb-2">{space.description}</p>}
              {space.goal && <p className="text-lg text-primary"><ListTodo className="inline mr-2 h-5 w-5" />Goal: {space.goal}</p>}
            </div>
            <div className="flex items-center gap-4 self-start sm:self-center">
              <ClockWidget 
                spaceId={space.id}
                saveClockEventUseCase={saveClockEventUseCase}
                getLastClockEventUseCase={getLastClockEventUseCase}
              />
              <Button variant="outline" size="lg" className="text-md p-3">
                <Settings className="mr-2 h-5 w-5" /> Space Settings
              </Button>
            </div>
          </div>
          <Separator className="my-6" />
        </div>

        <Tabs defaultValue="actions" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 h-auto p-2 mb-6">
            <TabsTrigger value="actions" className="text-md p-3"><ToyBrick className="mr-2 h-5 w-5"/>Actions</TabsTrigger>
            <TabsTrigger value="todos" className="text-md p-3"><ListTodo className="mr-2 h-5 w-5"/>To-Dos</TabsTrigger>
            <TabsTrigger value="problems" className="text-md p-3"><AlertOctagonIcon className="mr-2 h-5 w-5"/>Problems</TabsTrigger>
            <TabsTrigger value="timeline" className="text-md p-3"><History className="mr-2 h-5 w-5"/>Timeline</TabsTrigger>
            <TabsTrigger value="stats" className="text-md p-3"><BarChart3 className="mr-2 h-5 w-5"/>Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="actions">
            <ActionManager 
              spaceId={space.id} 
              actionDefinitions={actionDefinitions}
              isLoading={isLoadingActionDefinitions}
              isLoggingAction={isLoggingAction}
              onLogAction={handleLogAction}
              onActionDefinitionCreated={(newDef) => {
                addActionDefinitionToState(newDef); // Update local state via hook
                onDataChangedRefreshAll(); // Refresh timeline and other dependent data
              }}
              createActionDefinitionUseCase={createActionDefinitionUseCase}
            />
          </TabsContent>

          <TabsContent value="todos">
             <TodoSection
                spaceId={space.id}
                createTodoUseCase={createTodoUseCase}
                updateTodoUseCase={updateTodoUseCase}
                deleteTodoUseCase={deleteTodoUseCase}
                getTodosBySpaceUseCase={getTodosBySpaceUseCase}
                onTodosChanged={onDataChangedRefreshAll}
             />
          </TabsContent>

          <TabsContent value="problems">
            <ProblemTracker
              spaceId={space.id}
              createProblemUseCase={createProblemUseCase}
              updateProblemUseCase={updateProblemUseCase}
              deleteProblemUseCase={deleteProblemUseCase}
              getProblemsBySpaceUseCase={getProblemsBySpaceUseCase} // Passed correctly
              onProblemsChanged={onDataChangedRefreshAll}
            />
          </TabsContent>
          
          <TabsContent value="timeline">
            <ActivityTimelineView 
              timelineItems={timelineItems} 
              isLoading={isLoadingTimeline} 
              error={errorLoadingTimeline}
            />
          </TabsContent>

          <TabsContent value="stats">
            <SpaceStatistics 
              spaceId={space.id} 
              fetchStats={handleFetchStats}
             />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}

    


