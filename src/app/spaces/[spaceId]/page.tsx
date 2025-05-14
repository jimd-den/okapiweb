
"use client";

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit3, Settings, AlertOctagon, ListTodo, BarChart3, History, GanttChartSquare } from 'lucide-react';
import type { Space } from '@/domain/entities/space.entity';
import type { ActionDefinition } from '@/domain/entities/action-definition.entity';
import type { Todo } from '@/domain/entities/todo.entity';
import type { Problem } from '@/domain/entities/problem.entity';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { CreateActionDefinitionDialog } from '@/components/create-action-definition-dialog';

// Component Imports for Tabs
import { ActionManager } from '@/components/space-tabs/action-manager';
import { TodoSection } from '@/components/space-tabs/todo-section';
import { ActivityTimelineView } from '@/components/space-tabs/activity-timeline-view';
import { ProblemTracker } from '@/components/space-tabs/problem-tracker';
import { SpaceStatistics } from '@/components/space-tabs/space-statistics';

// Repositories
import { IndexedDBSpaceRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-space.repository';
import { IndexedDBActionDefinitionRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-action-definition.repository';
import { IndexedDBActionLogRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-action-log.repository';
import { IndexedDBUserProgressRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-user-progress.repository';
import { IndexedDBTodoRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-todo.repository';
import { IndexedDBProblemRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-problem.repository';

// Use Cases
import { GetSpaceByIdUseCase } from '@/application/use-cases/space/get-space-by-id.usecase';
import { CreateActionDefinitionUseCase, type CreateActionDefinitionInputDTO } from '@/application/use-cases/action-definition/create-action-definition.usecase';
import { GetActionDefinitionsBySpaceUseCase } from '@/application/use-cases/action-definition/get-action-definitions-by-space.usecase';
import { LogActionUseCase, type LogActionInputDTO } from '@/application/use-cases/action-log/log-action.usecase';
import type { EnrichedActionLog } from '@/application/use-cases/action-log/get-action-logs-by-space.usecase';
import { GetActionLogsBySpaceUseCase } from '@/application/use-cases/action-log/get-action-logs-by-space.usecase';

import { CreateTodoUseCase, type CreateTodoInputDTO } from '@/application/use-cases/todo/create-todo.usecase';
import { GetTodosBySpaceUseCase } from '@/application/use-cases/todo/get-todos-by-space.usecase';
import { UpdateTodoUseCase, type UpdateTodoInputDTO } from '@/application/use-cases/todo/update-todo.usecase';
import { DeleteTodoUseCase } from '@/application/use-cases/todo/delete-todo.usecase';

import { CreateProblemUseCase, type CreateProblemInputDTO } from '@/application/use-cases/problem/create-problem.usecase';
import { GetProblemsBySpaceUseCase } from '@/application/use-cases/problem/get-problems-by-space.usecase';
import { UpdateProblemUseCase, type UpdateProblemInputDTO } from '@/application/use-cases/problem/update-problem.usecase';
import { DeleteProblemUseCase } from '@/application/use-cases/problem/delete-problem.usecase';

import { GetSpaceStatsUseCase, type SpaceStatsDTO } from '@/application/use-cases/stats/get-space-stats.usecase';


export default function SpaceDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const spaceId = params.spaceId as string;
  
  const [space, setSpace] = useState<Space | null>(null);
  const [actionDefinitions, setActionDefinitions] = useState<ActionDefinition[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [actionLogs, setActionLogs] = useState<EnrichedActionLog[]>([]);
  const [stats, setStats] = useState<SpaceStatsDTO | null>(null);
  
  const [isLoading, setIsLoading] = useState(true); // Overall page load
  const [isLoadingActions, setIsLoadingActions] = useState(true);
  const [isLoadingTodos, setIsLoadingTodos] = useState(true);
  const [isLoadingProblems, setIsLoadingProblems] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);


  // Instantiate Repositories
  const spaceRepository = useMemo(() => new IndexedDBSpaceRepository(), []);
  const actionDefinitionRepository = useMemo(() => new IndexedDBActionDefinitionRepository(), []);
  const actionLogRepository = useMemo(() => new IndexedDBActionLogRepository(), []);
  const userProgressRepository = useMemo(() => new IndexedDBUserProgressRepository(), []);
  const todoRepository = useMemo(() => new IndexedDBTodoRepository(), []);
  const problemRepository = useMemo(() => new IndexedDBProblemRepository(), []);

  // Instantiate Use Cases
  const getSpaceByIdUseCase = useMemo(() => new GetSpaceByIdUseCase(spaceRepository), [spaceRepository]);
  const createActionDefinitionUseCase = useMemo(() => new CreateActionDefinitionUseCase(actionDefinitionRepository), [actionDefinitionRepository]);
  const getActionDefinitionsBySpaceUseCase = useMemo(() => new GetActionDefinitionsBySpaceUseCase(actionDefinitionRepository), [actionDefinitionRepository]);
  const logActionUseCase = useMemo(() => new LogActionUseCase(actionLogRepository, actionDefinitionRepository, userProgressRepository), [actionLogRepository, actionDefinitionRepository, userProgressRepository]);
  const getActionLogsBySpaceUseCase = useMemo(() => new GetActionLogsBySpaceUseCase(actionLogRepository, actionDefinitionRepository), [actionLogRepository, actionDefinitionRepository]);

  const createTodoUseCase = useMemo(() => new CreateTodoUseCase(todoRepository), [todoRepository]);
  const getTodosBySpaceUseCase = useMemo(() => new GetTodosBySpaceUseCase(todoRepository), [todoRepository]);
  const updateTodoUseCase = useMemo(() => new UpdateTodoUseCase(todoRepository), [todoRepository]);
  const deleteTodoUseCase = useMemo(() => new DeleteTodoUseCase(todoRepository), [todoRepository]);
  
  const createProblemUseCase = useMemo(() => new CreateProblemUseCase(problemRepository), [problemRepository]);
  const getProblemsBySpaceUseCase = useMemo(() => new GetProblemsBySpaceUseCase(problemRepository), [problemRepository]);
  const updateProblemUseCase = useMemo(() => new UpdateProblemUseCase(problemRepository), [problemRepository]);
  const deleteProblemUseCase = useMemo(() => new DeleteProblemUseCase(problemRepository), [problemRepository]);

  const getSpaceStatsUseCase = useMemo(() => new GetSpaceStatsUseCase(actionLogRepository), [actionLogRepository]);


  // Data Fetching Callbacks
  const fetchSpaceDetails = useCallback(async () => {
    if (!spaceId) return;
    setIsLoading(true);
    try {
      const data = await getSpaceByIdUseCase.execute(spaceId);
      if (data) setSpace(data);
      else {
        toast({ title: "Error", description: `Space with ID ${spaceId} not found.`, variant: "destructive" });
        router.push('/');
      }
    } catch (err) {
      console.error("Failed to fetch space details:", err);
      toast({ title: "Error Loading Space", description: String(err), variant: "destructive" });
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  }, [spaceId, getSpaceByIdUseCase, router, toast]);

  const fetchActionDefinitions = useCallback(async () => {
    if (!spaceId) return;
    setIsLoadingActions(true);
    try {
      const data = await getActionDefinitionsBySpaceUseCase.execute(spaceId);
      setActionDefinitions(data);
    } catch (err) {
      console.error("Failed to fetch action definitions:", err);
      toast({ title: "Error Loading Actions", description: String(err), variant: "destructive" });
    } finally {
      setIsLoadingActions(false);
    }
  }, [spaceId, getActionDefinitionsBySpaceUseCase, toast]);

  const fetchTodos = useCallback(async () => {
    if (!spaceId) return;
    setIsLoadingTodos(true);
    try {
      const data = await getTodosBySpaceUseCase.execute(spaceId);
      setTodos(data);
    } catch (err) {
      console.error("Failed to fetch todos:", err);
      toast({ title: "Error Loading To-Dos", description: String(err), variant: "destructive" });
    } finally {
      setIsLoadingTodos(false);
    }
  }, [spaceId, getTodosBySpaceUseCase, toast]);

  const fetchProblems = useCallback(async () => {
    if (!spaceId) return;
    setIsLoadingProblems(true);
    try {
      const data = await getProblemsBySpaceUseCase.execute(spaceId);
      setProblems(data);
    } catch (err) {
      console.error("Failed to fetch problems:", err);
      toast({ title: "Error Loading Problems", description: String(err), variant: "destructive" });
    } finally {
      setIsLoadingProblems(false);
    }
  }, [spaceId, getProblemsBySpaceUseCase, toast]);

  const fetchActionLogs = useCallback(async () => {
    if (!spaceId) return;
    setIsLoadingLogs(true);
    try {
      const data = await getActionLogsBySpaceUseCase.execute(spaceId);
      setActionLogs(data);
    } catch (err) {
      console.error("Failed to fetch action logs:", err);
      toast({ title: "Error Loading Timeline", description: String(err), variant: "destructive" });
    } finally {
      setIsLoadingLogs(false);
    }
  }, [spaceId, getActionLogsBySpaceUseCase, toast]);

  const fetchStats = useCallback(async (): Promise<SpaceStatsDTO> => {
    if (!spaceId) throw new Error("Space ID is missing");
    setIsLoadingStats(true);
    try {
      const data = await getSpaceStatsUseCase.execute(spaceId);
      setStats(data); // Also update local state if needed by other parts directly
      return data;
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      toast({ title: "Error Loading Stats", description: String(err), variant: "destructive" });
      throw err; // Re-throw for the component to handle
    } finally {
      setIsLoadingStats(false);
    }
  }, [spaceId, getSpaceStatsUseCase, toast]);


  useEffect(() => {
    fetchSpaceDetails();
    fetchActionDefinitions();
    fetchTodos();
    fetchProblems();
    fetchActionLogs();
    // fetchStats is called by the SpaceStatistics component itself
  }, [fetchSpaceDetails, fetchActionDefinitions, fetchTodos, fetchProblems, fetchActionLogs]);


  // Callbacks for Child Components
  const handleActionDefinitionCreated = (newDefinition: ActionDefinition) => {
    setActionDefinitions(prev => [...prev, newDefinition].sort((a, b) => (a.order || 0) - (b.order || 0)));
  };

  const handleLogAction = async (actionDefinitionId: string, stepId?: string) => {
    try {
      const input: LogActionInputDTO = { spaceId, actionDefinitionId, completedStepId: stepId };
      const result = await logActionUseCase.execute(input);
      
      const actionDef = actionDefinitions.find(ad => ad.id === actionDefinitionId);
      const actionName = actionDef ? actionDef.name : 'Action';
      let stepName = '';
      if (stepId && actionDef && actionDef.steps) {
        const step = actionDef.steps.find(s => s.id === stepId);
        stepName = step ? ` (Step: ${step.description})` : '';
      }

      toast({
        title: "Action Logged!",
        description: `"${actionName}"${stepName} recorded. +${result.loggedAction.pointsAwarded} points.`,
      });
      // Refresh logs and stats
      fetchActionLogs();
      fetchStats(); // Trigger stats refresh
      // If step completion UI depends on fresh logs, re-fetch action defs or specific log for that def
      if (stepId) fetchActionDefinitions(); 
    } catch (error: any) {
      console.error("Failed to log action:", error);
      toast({ title: "Error Logging Action", description: error.message || "Could not log action.", variant: "destructive" });
    }
  };

  // Bound use case executions for child components
  const executeCreateTodo = useCallback((data: CreateTodoInputDTO) => createTodoUseCase.execute(data), [createTodoUseCase]);
  const executeUpdateTodo = useCallback((data: UpdateTodoInputDTO) => updateTodoUseCase.execute(data), [updateTodoUseCase]);
  const executeDeleteTodo = useCallback((id: string) => deleteTodoUseCase.execute(id), [deleteTodoUseCase]);

  const executeCreateProblem = useCallback((data: CreateProblemInputDTO) => createProblemUseCase.execute(data), [createProblemUseCase]);
  const executeUpdateProblem = useCallback((data: UpdateProblemInputDTO) => updateProblemUseCase.execute(data), [updateProblemUseCase]);
  const executeDeleteProblem = useCallback((id: string) => deleteProblemUseCase.execute(id), [deleteProblemUseCase]);
  
  const executeCreateActionDefinition = useCallback( (data: CreateActionDefinitionInputDTO) => createActionDefinitionUseCase.execute(data), [createActionDefinitionUseCase]);


  if (isLoading) {
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
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-1">{space.name}</h1>
              {space.description && <p className="text-xl text-muted-foreground mb-2">{space.description}</p>}
              {space.goal && <p className="text-lg text-primary"><ListTodo className="inline mr-2 h-5 w-5" />Goal: {space.goal}</p>}
            </div>
            {/* TODO: Space Settings Dialog/Page Link */}
            <Button variant="outline" size="lg" className="text-md p-3">
              <Settings className="mr-2 h-5 w-5" /> Space Settings
            </Button>
          </div>
          <Separator className="my-6" />
        </div>

        <Tabs defaultValue="actions" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 h-auto p-2 mb-6">
            <TabsTrigger value="actions" className="text-md p-3"><Edit3 className="mr-2 h-5 w-5"/>Actions</TabsTrigger>
            <TabsTrigger value="todos" className="text-md p-3"><ListTodo className="mr-2 h-5 w-5"/>To-Dos</TabsTrigger>
            <TabsTrigger value="problems" className="text-md p-3"><AlertOctagon className="mr-2 h-5 w-5"/>Problems</TabsTrigger>
            <TabsTrigger value="timeline" className="text-md p-3"><History className="mr-2 h-5 w-5"/>Timeline</TabsTrigger>
            <TabsTrigger value="stats" className="text-md p-3"><BarChart3 className="mr-2 h-5 w-5"/>Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="actions">
            {isLoadingActions ? (
              <div className="flex justify-center items-center py-10"><Skeleton className="h-10 w-32" /></div>
            ) : (
              <ActionManager 
                spaceId={space.id} 
                actionDefinitions={actionDefinitions}
                onLogAction={handleLogAction}
                onActionDefinitionCreated={handleActionDefinitionCreated}
                createActionDefinitionUseCase={executeCreateActionDefinition}
              />
            )}
          </TabsContent>

          <TabsContent value="todos">
             <TodoSection
                spaceId={space.id}
                initialTodos={todos}
                createTodo={executeCreateTodo}
                updateTodo={executeUpdateTodo}
                deleteTodo={executeDeleteTodo}
                onTodosFetched={setTodos} // Could be used if TodoSection itself fetches
             />
          </TabsContent>

          <TabsContent value="problems">
            <ProblemTracker
              spaceId={space.id}
              initialProblems={problems}
              createProblem={executeCreateProblem}
              updateProblem={executeUpdateProblem}
              deleteProblem={executeDeleteProblem}
            />
          </TabsContent>
          
          <TabsContent value="timeline">
            <ActivityTimelineView actionLogs={actionLogs} isLoading={isLoadingLogs} />
          </TabsContent>

          <TabsContent value="stats">
            <SpaceStatistics spaceId={space.id} fetchStats={fetchStats} />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
