
"use client";

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit3, Settings, CheckSquare, BarChart3, AlertOctagon, ListTodo, Clock, History, GanttChartSquare, PlusCircle, CheckCircle2, Circle } from 'lucide-react';
import type { Space } from '@/domain/entities/space.entity';
import type { ActionDefinition, ActionStep } from '@/domain/entities/action-definition.entity';
import type { ActionLog } from '@/domain/entities/action-log.entity';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image'; // Keep for other tabs if needed
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { CreateActionDefinitionDialog } from '@/components/create-action-definition-dialog';

// Use Cases and Repositories
import { GetSpaceByIdUseCase } from '@/application/use-cases/space/get-space-by-id.usecase';
import { IndexedDBSpaceRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-space.repository';

import { CreateActionDefinitionUseCase, type CreateActionDefinitionInputDTO } from '@/application/use-cases/action-definition/create-action-definition.usecase';
import { GetActionDefinitionsBySpaceUseCase } from '@/application/use-cases/action-definition/get-action-definitions-by-space.usecase';
import { IndexedDBActionDefinitionRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-action-definition.repository';

import { LogActionUseCase, type LogActionInputDTO, type LogActionResult } from '@/application/use-cases/action-log/log-action.usecase';
import { IndexedDBActionLogRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-action-log.repository';
import { IndexedDBUserProgressRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-user-progress.repository';
import { GetUserProgressUseCase } from '@/application/use-cases/user-progress/get-user-progress.usecase'; 
import { POINTS_TO_LEVEL_UP_BASE } from '@/lib/constants';


// Placeholder Components for other Tabs - these would be fleshed out
const ProblemTracker = ({ spaceId }: { spaceId: string }) => (
  <Card className="mt-4">
    <CardHeader><CardTitle className="text-xl">Track Problem/Waste</CardTitle></CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Problem tracking UI for space <code className="bg-muted px-1 rounded">{spaceId}</code> will be here.</p>
      <div className="flex gap-2 my-4">
        <Button variant="outline" className="text-md p-3"><AlertOctagon className="mr-2 h-5 w-5"/>Log Waste</Button>
        <Button variant="outline" className="text-md p-3"><AlertOctagon className="mr-2 h-5 w-5"/>Log Problem</Button>
      </div>
    </CardContent>
  </Card>
);
const TodoSection = ({ spaceId }: { spaceId: string }) => (
 <Card className="mt-4">
    <CardHeader><CardTitle className="text-xl">To-Do List</CardTitle></CardHeader>
    <CardContent>
      <p className="text-muted-foreground">To-Do list for space <code className="bg-muted px-1 rounded">{spaceId}</code> will be here. Each item can have before/after pictures.</p>
      {/* ... existing TodoSection content ... */}
    </CardContent>
  </Card>
);

const SpaceStatistics = ({ spaceId }: { spaceId: string }) => (
  <Card className="mt-4">
    <CardHeader><CardTitle className="text-xl">Space Statistics</CardTitle></CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Statistics for space <code className="bg-muted px-1 rounded">{spaceId}</code> (time, action points, clocked-in time) will be displayed here.</p>
      {/* ... existing SpaceStatistics content ... */}
    </CardContent>
  </Card>
);
const GanttChartView = ({ spaceId }: { spaceId: string }) => (
 <Card className="mt-4">
    <CardHeader><CardTitle className="text-xl">Activity Timeline (Gantt)</CardTitle></CardHeader>
    <CardContent>
      <p className="text-muted-foreground">A Gantt chart or timeline of logged actions for space <code className="bg-muted px-1 rounded">{spaceId}</code> will be here.</p>
      {/* ... existing GanttChartView content ... */}
    </CardContent>
  </Card>
);

// New Action Logger Component
const ActionManager = ({ 
  spaceId, 
  actionDefinitions, 
  onLogAction,
  onActionDefinitionCreated,
  createActionDefinitionUseCase
}: { 
  spaceId: string; 
  actionDefinitions: ActionDefinition[];
  onLogAction: (actionDefinitionId: string, stepId?: string) => Promise<void>;
  onActionDefinitionCreated: (newDefinition: ActionDefinition) => void;
  createActionDefinitionUseCase: CreateActionDefinitionUseCase;
}) => {
  const { toast } = useToast();
  const [expandedMultiStep, setExpandedMultiStep] = useState<Record<string, boolean>>({});
  
  // TODO: Fetch existing ActionLogs to determine step completion status
  // For now, steps are stateless in UI after logging.

  const handleToggleMultiStep = (defId: string) => {
    setExpandedMultiStep(prev => ({ ...prev, [defId]: !prev[defId] }));
  };
  
  const executeCreateActionDefinition = async (data: CreateActionDefinitionInputDTO): Promise<ActionDefinition> => {
    return createActionDefinitionUseCase.execute(data);
  };

  return (
    <Card className="mt-4 shadow-lg">
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle className="text-xl">Log Actions</CardTitle>
        <CreateActionDefinitionDialog 
          spaceId={spaceId} 
          onActionDefinitionCreated={onActionDefinitionCreated}
          createActionDefinition={executeCreateActionDefinition}
        />
      </CardHeader>
      <CardContent>
        {actionDefinitions.length === 0 && (
          <p className="text-muted-foreground text-center py-4">No actions defined for this space yet. Click 'Add New Action' to get started.</p>
        )}
        <div className="space-y-4">
          {actionDefinitions.map(def => (
            <Card key={def.id} className="bg-card/50 p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-lg">{def.name}</h4>
                  {def.description && <p className="text-sm text-muted-foreground">{def.description}</p>}
                  <p className="text-xs text-primary">Points for completion: {def.pointsForCompletion}</p>
                </div>
                {def.type === 'single' && (
                  <Button size="lg" className="text-md px-4 py-2" onClick={() => onLogAction(def.id)}>
                    Log Action
                  </Button>
                )}
                {def.type === 'multi-step' && (
                  <Button variant="outline" size="sm" onClick={() => handleToggleMultiStep(def.id)}>
                    {expandedMultiStep[def.id] ? "Hide Steps" : "Show Steps"}
                  </Button>
                )}
              </div>
              {def.type === 'multi-step' && expandedMultiStep[def.id] && def.steps && (
                <div className="mt-3 space-y-2 pl-4 border-l-2 border-primary/30">
                  {def.steps.sort((a,b) => a.order - b.order).map(step => (
                    <div key={step.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                      <div className="flex items-center">
                         {/* Basic checkbox for step completion logging */}
                        <Checkbox 
                          id={`step-${step.id}`} 
                          className="mr-3 h-5 w-5"
                          onCheckedChange={(checked) => {
                            if(checked) { onLogAction(def.id, step.id); }
                            // TODO: UI should reflect completion based on ActionLogs
                          }}
                          // checked={isStepCompleted(def.id, step.id)} // Needs logic
                        />
                        <Label htmlFor={`step-${step.id}`} className="text-md">{step.description}</Label>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {step.pointsPerStep ? `+${step.pointsPerStep} pts` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};


export default function SpaceDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const spaceId = params.spaceId as string;
  
  const [space, setSpace] = useState<Space | null>(null);
  const [actionDefinitions, setActionDefinitions] = useState<ActionDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingActions, setIsLoadingActions] = useState(true);

  // Repositories
  const spaceRepository = useMemo(() => new IndexedDBSpaceRepository(), []);
  const actionDefinitionRepository = useMemo(() => new IndexedDBActionDefinitionRepository(), []);
  const actionLogRepository = useMemo(() => new IndexedDBActionLogRepository(), []);
  const userProgressRepository = useMemo(() => new IndexedDBUserProgressRepository(), []);


  // Use Cases
  const getSpaceByIdUseCase = useMemo(() => new GetSpaceByIdUseCase(spaceRepository), [spaceRepository]);
  const createActionDefinitionUseCase = useMemo(() => new CreateActionDefinitionUseCase(actionDefinitionRepository), [actionDefinitionRepository]);
  const getActionDefinitionsBySpaceUseCase = useMemo(() => new GetActionDefinitionsBySpaceUseCase(actionDefinitionRepository), [actionDefinitionRepository]);
  const logActionUseCase = useMemo(() => new LogActionUseCase(actionLogRepository, actionDefinitionRepository, userProgressRepository), [actionLogRepository, actionDefinitionRepository, userProgressRepository]);
  // const getUserProgressUseCase = useMemo(() => new GetUserProgressUseCase(userProgressRepository), [userProgressRepository]);


  const fetchSpaceDetails = useCallback(async () => {
    if (spaceId) {
      setIsLoading(true);
      try {
        const data = await getSpaceByIdUseCase.execute(spaceId);
        if (data) {
          setSpace(data);
        } else {
          toast({ title: "Error", description: `Space with ID ${spaceId} not found.`, variant: "destructive" });
          router.push('/');
        }
      } catch (err) {
        console.error("Failed to fetch space details:", err);
        toast({ title: "Error", description: "Could not load space details.", variant: "destructive" });
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    }
  }, [spaceId, getSpaceByIdUseCase, router, toast]);

  const fetchActionDefinitions = useCallback(async () => {
    if (spaceId) {
      setIsLoadingActions(true);
      try {
        const data = await getActionDefinitionsBySpaceUseCase.execute(spaceId);
        setActionDefinitions(data);
      } catch (err) {
        console.error("Failed to fetch action definitions:", err);
        toast({ title: "Error", description: "Could not load actions for this space.", variant: "destructive" });
      } finally {
        setIsLoadingActions(false);
      }
    }
  }, [spaceId, getActionDefinitionsBySpaceUseCase, toast]);

  useEffect(() => {
    fetchSpaceDetails();
    fetchActionDefinitions();
  }, [fetchSpaceDetails, fetchActionDefinitions]);

  const handleActionDefinitionCreated = (newDefinition: ActionDefinition) => {
    setActionDefinitions(prev => [...prev, newDefinition].sort((a, b) => (a.order || 0) - (b.order || 0)));
  };

  const handleLogAction = async (actionDefinitionId: string, stepId?: string) => {
    try {
      const input: LogActionInputDTO = { spaceId, actionDefinitionId, completedStepId: stepId };
      const result = await logActionUseCase.execute(input);
      
      // Try to find the action definition name for the toast message
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
      // Potentially update user progress display globally / in header
      // Refresh action logs if displayed, or step completion status
      if (stepId) fetchActionDefinitions(); // Re-fetch to update step statuses (if UI depends on it)
    } catch (error: any) {
      console.error("Failed to log action:", error);
      toast({ title: "Error Logging Action", description: error.message || "Could not log action.", variant: "destructive" });
    }
  };


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
              {space.goal && <p className="text-lg text-primary"><CheckSquare className="inline mr-2 h-5 w-5" />Goal: {space.goal}</p>}
            </div>
            <Button variant="outline" size="lg" className="text-md p-3">
              <Settings className="mr-2 h-5 w-5" /> Space Settings
            </Button>
          </div>
          <Separator className="my-6" />
        </div>

        <Tabs defaultValue="actions" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 h-auto p-2 mb-6">
            <TabsTrigger value="actions" className="text-md p-3"><Edit3 className="mr-2 h-5 w-5"/>Actions</TabsTrigger>
            <TabsTrigger value="problems" className="text-md p-3"><AlertOctagon className="mr-2 h-5 w-5"/>Problems</TabsTrigger>
            <TabsTrigger value="todos" className="text-md p-3"><ListTodo className="mr-2 h-5 w-5"/>To-Dos</TabsTrigger>
            <TabsTrigger value="stats" className="text-md p-3"><BarChart3 className="mr-2 h-5 w-5"/>Stats</TabsTrigger>
            <TabsTrigger value="timeline" className="text-md p-3"><GanttChartSquare className="mr-2 h-5 w-5"/>Timeline</TabsTrigger>
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
                createActionDefinitionUseCase={createActionDefinitionUseCase}
              />
            )}
          </TabsContent>
          <TabsContent value="problems"><ProblemTracker spaceId={space.id} /></TabsContent>
          <TabsContent value="todos"><TodoSection spaceId={space.id} /></TabsContent>
          <TabsContent value="stats"><SpaceStatistics spaceId={space.id} /></TabsContent>
          <TabsContent value="timeline"><GanttChartView spaceId={space.id} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
