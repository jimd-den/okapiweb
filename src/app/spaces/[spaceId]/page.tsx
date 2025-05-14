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
import { IndexedDBActionDefinitionRepository from '@/infrastructure/persistence/indexeddb/indexeddb-action-definition.repository';
import { IndexedDBActionLogRepository from '@/infrastructure/persistence/indexeddb/indexeddb-action-log.repository';
import { IndexedDBUserProgressRepository from '@/infrastructure/persistence/indexeddb/indexeddb-user-progress.repository';
import { IndexedDBTodoRepository from '@/infrastructure/persistence/indexeddb/indexeddb-todo.repository';
import { IndexedDBProblemRepository from '@/infrastructure/persistence/indexeddb/indexeddb-problem.repository';

// Use Cases - Instantiated here and passed down, or instantiated by child components
import { GetSpaceByIdUseCase } from '@/application/use-cases/space/get-space-by-id.usecase';
import { CreateActionDefinitionUseCase, type CreateActionDefinitionInputDTO } from '@/application/use-cases/action-definition/create-action-definition.usecase';
import { GetActionDefinitionsBySpaceUseCase from '@/application/use-cases/action-definition/get-action-definitions-by-space.usecase';
import { LogActionUseCase, type LogActionInputDTO } from '@/application/use-cases/action-log/log-action.usecase';
import type { TimelineItem } from '@/application/dto/timeline-item.dto';
import { GetTimelineItemsBySpaceUseCase from '@/application/use-cases/timeline/get-timeline-items-by-space.usecase';
import { CreateTodoUseCase, type CreateTodoInputDTO } from '@/application/use-cases/todo/create-todo.usecase';
import { GetTodosBySpaceUseCase from '@/application/use-cases/todo/get-todos-by-space.usecase';
import { UpdateTodoUseCase, type UpdateTodoInputDTO } from '@/application/use-cases/todo/update-todo.usecase';
import { DeleteTodoUseCase } from '@/application/use-cases/todo/delete-todo.usecase';
import { CreateProblemUseCase, type CreateProblemInputDTO } from '@/application/use-cases/problem/create-problem.usecase';
import { GetProblemsBySpaceUseCase from '@/application/use-cases/problem/get-problems-by-space.usecase';
import { UpdateProblemUseCase, type UpdateProblemInputDTO } from '@/application/use-cases/problem/update-problem.usecase';
import { DeleteProblemUseCase } from '@/application/use-cases/problem/delete-problem.usecase';
import { GetSpaceStatsUseCase, type SpaceStatsDTO } from '@/application/use-cases/stats/get-space-stats.usecase';


export default function SpaceDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const spaceId = params.spaceId as string;
  
  const [space, setSpace] = useState<Space | null>(null);
  const [isLoadingSpace, setIsLoadingSpace] = useState(true);
  
  // State for Action Definitions - managed here as it's used by LogActionUseCase
  const [actionDefinitions, setActionDefinitions] = useState<ActionDefinition[]>([]);
  const [isLoadingActions, setIsLoadingActions] = useState(true);

  // State for Timeline Items - managed here as multiple tabs can cause updates
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(true);
  
  // Instantiate Repositories - can be scoped more narrowly if certain repos are only used by one child
  const spaceRepository = useMemo(() => new IndexedDBSpaceRepository(), []);
  const actionDefinitionRepository = useMemo(() => new IndexedDBActionDefinitionRepository(), []); 
  const actionLogRepository = useMemo(() => new IndexedDBActionLogRepository(), []);
  const userProgressRepository = useMemo(() => new IndexedDBUserProgressRepository(), []);
  const todoRepository = useMemo(() => new IndexedDBTodoRepository(), []);
  const problemRepository = useMemo(() => new IndexedDBProblemRepository(), []);

  // Instantiate Use Cases - pass these down to child components
  const getSpaceByIdUseCase = useMemo(() => new GetSpaceByIdUseCase(spaceRepository), [spaceRepository]);
  const createActionDefinitionUseCase = useMemo(() => new CreateActionDefinitionUseCase(actionDefinitionRepository), [actionDefinitionRepository]);
  const getActionDefinitionsBySpaceUseCase = useMemo(() => new GetActionDefinitionsBySpaceUseCase(actionDefinitionRepository), [actionDefinitionRepository]);
  const logActionUseCase = useMemo(() => new LogActionUseCase(actionLogRepository, actionDefinitionRepository, userProgressRepository), [actionLogRepository, actionDefinitionRepository, userProgressRepository]);
  const getTimelineItemsBySpaceUseCase = useMemo(() => new GetTimelineItemsBySpaceUseCase(actionLogRepository, actionDefinitionRepository, problemRepository, todoRepository), [actionLogRepository, actionDefinitionRepository, problemRepository, todoRepository]);
  const createTodoUseCase = useMemo(() => new CreateTodoUseCase(todoRepository), [todoRepository]);
  const getTodosBySpaceUseCase = useMemo(() => new GetTodosBySpaceUseCase(todoRepository), [todoRepository]);
  const updateTodoUseCase = useMemo(() => new UpdateTodoUseCase(todoRepository), [todoRepository]);
  const deleteTodoUseCase = useMemo(() => new DeleteTodoUseCase(todoRepository), [todoRepository]);
  const createProblemUseCase = useMemo(() => new CreateProblemUseCase(problemRepository), [problemRepository]);
  const getProblemsBySpaceUseCase = useMemo(() => new GetProblemsBySpaceUseCase(problemRepository), [problemRepository]);
  const updateProblemUseCase = useMemo(() => new UpdateProblemUseCase(problemRepository), [problemRepository]);
  const deleteProblemUseCase = useMemo(() => new DeleteProblemUseCase(problemRepository), [problemRepository]);
  const getSpaceStatsUseCase = useMemo(() => new GetSpaceStatsUseCase(actionLogRepository), [actionLogRepository]);


  const fetchSpaceDetails = useCallback(async () => {
    if (!spaceId) return;
    setIsLoadingSpace(true);
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
      setIsLoadingSpace(false);
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
  
  const fetchTimelineItems = useCallback(async () => {
    if (!spaceId) return;
    setIsLoadingTimeline(true);
    try {
      const data = await getTimelineItemsBySpaceUseCase.execute(spaceId);
      setTimelineItems(data);
    } catch (err) {
      console.error("Failed to fetch timeline items:", err);
      toast({ title: "Error Loading Timeline", description: String(err), variant: "destructive" });
    } finally {
      setIsLoadingTimeline(false);
    }
  }, [spaceId, getTimelineItemsBySpaceUseCase, toast]);
  

  useEffect(() => {
    fetchSpaceDetails();
    fetchActionDefinitions(); // Actions needed for logging, so fetch here
    fetchTimelineItems(); // Timeline is central, fetch here
  }, [fetchSpaceDetails, fetchActionDefinitions, fetchTimelineItems]);

  // Callbacks for Child Components to trigger data refresh for shared data
  const onDataChangedRefreshTimelineAndStats = useCallback(() => {
    fetchTimelineItems();
    // Stats component will fetch its own data, but this could trigger its refresh if needed
  }, [fetchTimelineItems]);

  const onActionDefinitionsChanged = useCallback((newDefinition: ActionDefinition) => {
    // This callback is primarily for CreateActionDefinitionDialog success.
    // It should update the local actionDefinitions state and then refresh shared data.
    setActionDefinitions(prev => [...prev, newDefinition].sort((a,b)=>(a.order || 0) - (b.order || 0)));
    onDataChangedRefreshTimelineAndStats(); 
  }, [onDataChangedRefreshTimelineAndStats]);

  const handleLogAction = async (actionDefinitionId: string, stepId?: string, stepOutcome?: 'completed' | 'skipped') => {
    if (!space) return;
    try {
      const input: LogActionInputDTO = { 
        spaceId: space.id, 
        actionDefinitionId, 
        completedStepId: stepId,
        stepOutcome: stepId ? stepOutcome : undefined
      };
      const result = await logActionUseCase.execute(input);
      
      const actionDef = actionDefinitions.find(ad => ad.id === actionDefinitionId);
      const actionName = actionDef ? actionDef.name : 'Action';
      let stepNamePart = '';
      let outcomePart = '';

      if (stepId && actionDef && actionDef.steps) {
        const step = actionDef.steps.find(s => s.id === stepId);
        stepNamePart = step ? ` (Step: ${step.description})` : '';
        outcomePart = stepOutcome === 'skipped' ? ' - Skipped' : (stepOutcome === 'completed' ? ' - Completed' : '');
      }

      let toastTitle = "Action Logged!";
      let toastDescription = `"${actionName}"${stepNamePart}${outcomePart} recorded.`;
      if (result.loggedAction.pointsAwarded > 0) {
        toastDescription += ` +${result.loggedAction.pointsAwarded} points.`;
      }

      if (result.loggedAction.isMultiStepFullCompletion) {
        toastTitle = "Checklist Completed!";
        toastDescription = `All steps for "${actionName}" complete! +${result.loggedAction.pointsAwarded} total points for this log.`;
      } else if (stepId) {
        toastTitle = stepOutcome === 'completed' ? "Step Completed!" : "Step Skipped";
      }
      
      toast({
        title: toastTitle,
        description: toastDescription,
      });

      onDataChangedRefreshTimelineAndStats();
    } catch (error: any) {
      console.error("Failed to log action:", error);
      toast({ title: "Error Logging Action", description: error.message || "Could not log action.", variant: "destructive" });
    }
  };

  if (isLoadingSpace) {
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
    // This state should ideally be prevented by the redirect in fetchSpaceDetails
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
              <ClockWidget spaceId={space.id} />
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
              actionDefinitions={actionDefinitions} // Pass fetched action definitions
              isLoading={isLoadingActions} // Pass loading state for actions
              onLogAction={handleLogAction}
              onActionDefinitionCreated={onActionDefinitionsChanged} // Refresh actions and timeline/stats
              createActionDefinitionUseCase={createActionDefinitionUseCase}
            />
          </TabsContent>

          <TabsContent value="todos">
             <TodoSection
                spaceId={space.id}
                // TodoSection will fetch its own initialTodos
                // isLoading will be managed internally by TodoSection
                createTodo={createTodoUseCase}
                updateTodo={updateTodoUseCase}
                deleteTodo={deleteTodoUseCase}
                getTodosBySpace={getTodosBySpaceUseCase} // Pass the getter use case
                onTodosChanged={onDataChangedRefreshTimelineAndStats} // Refresh timeline/stats
             />
          </TabsContent>

          <TabsContent value="problems">
            <ProblemTracker
              spaceId={space.id}
              // ProblemTracker will fetch its own initialProblems
              // isLoading will be managed internally by ProblemTracker
              createProblem={createProblemUseCase}
              updateProblem={updateProblemUseCase}
              deleteProblem={deleteProblemUseCase}
              getProblemsBySpace={getProblemsBySpaceUseCase} // Pass the getter use case
              onProblemsChanged={onDataChangedRefreshTimelineAndStats} // Refresh timeline/stats
            />
          </TabsContent>
          
          <TabsContent value="timeline">
            <ActivityTimelineView timelineItems={timelineItems} isLoading={isLoadingTimeline} />
          </TabsContent>

          <TabsContent value="stats">
            {/* SpaceStatistics will fetch its own stats */}
            <SpaceStatistics spaceId={space.id} fetchStats={() => getSpaceStatsUseCase.execute(space.id)} />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}

// Adjusted ActionManager prop to include isLoading
interface ActionManagerProps {
  spaceId: string;
  actionDefinitions: ActionDefinition[];
  isLoading: boolean; // Added isLoading prop
  onLogAction: (actionDefinitionId: string, stepId?: string, stepOutcome?: 'completed' | 'skipped') => Promise<void>;
  onActionDefinitionCreated: (newDefinition: ActionDefinition) => void;
  createActionDefinitionUseCase: CreateActionDefinitionUseCase;
}

// Adjusted TodoSection props
interface TodoSectionProps {
  spaceId: string;
  createTodo: CreateTodoUseCase;
  updateTodo: UpdateTodoUseCase;
  deleteTodo: DeleteTodoUseCase;
  getTodosBySpace: GetTodosBySpaceUseCase; // To fetch its own data
  onTodosChanged: () => void;
}

// Adjusted ProblemTracker props
interface ProblemTrackerProps {
  spaceId: string;
  createProblem: CreateProblemUseCase;
  updateProblem: UpdateProblemUseCase;
  deleteProblem: DeleteProblemUseCase;
  getProblemsBySpace: GetProblemsBySpaceUseCase; // To fetch its own data
  onProblemsChanged: () => void;
}

// Adjusted SpaceStatistics props
interface SpaceStatisticsProps {
    spaceId: string;
    fetchStats: () => Promise<SpaceStatsDTO | null>; // Allow null if fetch might fail
}
