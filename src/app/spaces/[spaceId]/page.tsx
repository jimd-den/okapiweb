
"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit3, Settings, CheckSquare, BarChart3, AlertOctagon, ListTodo, Clock, History, GanttChartSquare } from 'lucide-react';
import type { Space } from '@/domain/entities/space.entity';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

// Use Cases and Repositories
import { GetSpaceByIdUseCase } from '@/application/use-cases/space/get-space-by-id.usecase';
import { IndexedDBSpaceRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-space.repository';

// Placeholder Components for Tabs - these would be fleshed out
const ActionLogger = ({ spaceId }: { spaceId: string }) => (
  <Card className="mt-4">
    <CardHeader><CardTitle className="text-xl">Log Action</CardTitle></CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Action logging UI for space <code className="bg-muted px-1 rounded">{spaceId}</code> will be here.</p>
      <Input placeholder="Describe your action..." className="my-4 p-3 text-md" />
      <Button size="lg" className="text-md">Log Action</Button>
    </CardContent>
  </Card>
);
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
      <div className="my-4 p-4 border rounded-lg">
        <div className="flex justify-between items-center">
          <Label htmlFor="todo1" className="text-md">Sample To-Do Item</Label>
          <Checkbox id="todo1" />
        </div>
        <div className="flex gap-2 mt-2">
            <Button variant="outline" size="sm">Before Pic</Button>
            <Button variant="outline" size="sm">After Pic</Button>
        </div>
        <Image data-ai-hint="workspace desk" src="https://picsum.photos/200/100?grayscale" alt="placeholder" width={200} height={100} className="mt-2 rounded-md" />
      </div>
    </CardContent>
  </Card>
);

const SpaceStatistics = ({ spaceId }: { spaceId: string }) => (
  <Card className="mt-4">
    <CardHeader><CardTitle className="text-xl">Space Statistics</CardTitle></CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Statistics for space <code className="bg-muted px-1 rounded">{spaceId}</code> (time, action points, clocked-in time) will be displayed here.</p>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Total Time Spent</p>
            <p className="text-2xl font-bold">02:35:00</p>
        </div>
        <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Action Points</p>
            <p className="text-2xl font-bold">1250</p>
        </div>
      </div>
    </CardContent>
  </Card>
);
const GanttChartView = ({ spaceId }: { spaceId: string }) => (
 <Card className="mt-4">
    <CardHeader><CardTitle className="text-xl">Activity Timeline (Gantt)</CardTitle></CardHeader>
    <CardContent>
      <p className="text-muted-foreground">A Gantt chart or timeline of logged actions for space <code className="bg-muted px-1 rounded">{spaceId}</code> will be here.</p>
      <Image data-ai-hint="gantt chart" src="https://picsum.photos/600/200?random=1" alt="Gantt chart placeholder" width={600} height={200} className="mt-4 rounded-md w-full object-cover" />
    </CardContent>
  </Card>
);


export default function SpaceDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const spaceId = params.spaceId as string;
  const [space, setSpace] = useState<Space | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const spaceRepository = useMemo(() => new IndexedDBSpaceRepository(), []);
  const getSpaceByIdUseCase = useMemo(() => new GetSpaceByIdUseCase(spaceRepository), [spaceRepository]);

  useEffect(() => {
    if (spaceId) {
      setIsLoading(true);
      getSpaceByIdUseCase.execute(spaceId)
        .then(data => {
          if (data) {
            setSpace(data);
          } else {
            // Handle space not found, maybe redirect or show error
            console.warn(`Space with ID ${spaceId} not found. Redirecting.`);
            router.push('/'); // For now, redirect to home
          }
        })
        .catch(err => {
          console.error("Failed to fetch space details:", err);
          // Handle error, e.g., show an error message or redirect
          router.push('/'); 
        })
        .finally(() => setIsLoading(false));
    }
  }, [spaceId, router, getSpaceByIdUseCase]);

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
    // This case should ideally be handled by the redirect in useEffect
    // Or show a "Not Found" message if preferred over redirect
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
          <TabsContent value="actions"><ActionLogger spaceId={space.id} /></TabsContent>
          <TabsContent value="problems"><ProblemTracker spaceId={space.id} /></TabsContent>
          <TabsContent value="todos"><TodoSection spaceId={space.id} /></TabsContent>
          <TabsContent value="stats"><SpaceStatistics spaceId={space.id} /></TabsContent>
          <TabsContent value="timeline"><GanttChartView spaceId={space.id} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
