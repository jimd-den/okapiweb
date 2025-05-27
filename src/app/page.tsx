
"use client";

import { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/layout/header';
import { SpaceCard } from '@/components/space-card';
import { CreateSpaceDialog } from '@/components/dialogs/create-space-dialog';
import type { Space } from '@/domain/entities/space.entity';
import type { ClockEvent } from '@/domain/entities/clock-event.entity';
import { Input } from '@/components/ui/input';
import { Search, AlertTriangle, Loader2, Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';

// Use Cases and Repositories
import { GetAllSpacesUseCase } from '@/application/use-cases/space/get-all-spaces.usecase';
import { CreateSpaceUseCase, type CreateSpaceInputDTO } from '@/application/use-cases/space/create-space.usecase';
import { GetAllClockEventsUseCase } from '@/application/use-cases/clock-event/get-all-clock-events.usecase';
import { IndexedDBSpaceRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-space.repository';
import { IndexedDBClockEventRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-clock-event.repository';
import { useDialogState } from '@/hooks/use-dialog-state';

interface SpaceClockStats {
  totalDurationMs: number;
  isCurrentlyClockedIn: boolean;
}

export default function HomePage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [allClockEvents, setAllClockEvents] = useState<ClockEvent[]>([]);
  const [filteredSpaces, setFilteredSpaces] = useState<Space[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false); // For instant navigation feedback

  const { 
    isOpen: isCreateSpaceDialogOpen, 
    openDialog: openCreateSpaceDialog, 
    closeDialog: closeCreateSpaceDialog 
  } = useDialogState();


  const spaceRepository = useMemo(() => new IndexedDBSpaceRepository(), []);
  const clockEventRepository = useMemo(() => new IndexedDBClockEventRepository(), []);
  const getAllSpacesUseCase = useMemo(() => new GetAllSpacesUseCase(spaceRepository), [spaceRepository]);
  const createSpaceUseCase = useMemo(() => new CreateSpaceUseCase(spaceRepository), [spaceRepository]);
  const getAllClockEventsUseCase = useMemo(() => new GetAllClockEventsUseCase(clockEventRepository), [clockEventRepository]);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    Promise.all([
      getAllSpacesUseCase.execute(),
      getAllClockEventsUseCase.execute(),
    ])
    .then(([spaceData, clockEventData]) => {
      setSpaces(spaceData);
      setFilteredSpaces(spaceData);
      setAllClockEvents(clockEventData);
    })
    .catch(err => {
      console.error("Failed to fetch data:", err);
      setError("Could not load data. Please try again later.");
    })
    .finally(() => setIsLoading(false));
  }, [getAllSpacesUseCase, getAllClockEventsUseCase]);

  useEffect(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const result = spaces.filter(space =>
      space.name.toLowerCase().includes(lowerSearchTerm) ||
      (space.description && space.description.toLowerCase().includes(lowerSearchTerm)) ||
      (space.tags && space.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm)))
    );
    setFilteredSpaces(result);
  }, [searchTerm, spaces]);

  const spaceClockStatsMap = useMemo(() => {
    const statsMap = new Map<string, SpaceClockStats>();
    spaces.forEach(space => {
      const spaceEvents = allClockEvents
        .filter(event => event.spaceId === space.id)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      let totalDurationMs = 0;
      let lastClockInTime: Date | null = null;
      let isCurrentlyClockedIn = false;

      spaceEvents.forEach(event => {
        if (event.type === 'clock-in') {
          lastClockInTime = new Date(event.timestamp);
        } else if (event.type === 'clock-out' && lastClockInTime) {
          totalDurationMs += new Date(event.timestamp).getTime() - lastClockInTime.getTime();
          lastClockInTime = null;
        }
      });

      if (lastClockInTime) {
        isCurrentlyClockedIn = true;
      }
      statsMap.set(space.id, { totalDurationMs, isCurrentlyClockedIn });
    });
    return statsMap;
  }, [spaces, allClockEvents]);

  const handleSpaceCreated = (newSpace: Space) => {
    setSpaces(prevSpaces => [newSpace, ...prevSpaces].sort((a,b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()));
    if (!searchTerm) {
      setFilteredSpaces(prevFiltered => [newSpace, ...prevFiltered].sort((a,b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()));
    }
    closeCreateSpaceDialog();
  };
  
  const executeCreateSpace = async (data: CreateSpaceInputDTO): Promise<Space> => {
    try {
      const newSpace = await createSpaceUseCase.execute(data);
      return newSpace;
    } catch (err: any) {
      console.error("Error in executeCreateSpace (HomePage):", err);
      throw err; 
    }
  };
  
  const handleNavigateToSpace = () => {
    setIsNavigating(true);
  };

  if (isNavigating) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-100">
        <div className="flex flex-col items-center gap-4 p-8 rounded-lg bg-card shadow-2xl">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="text-xl font-medium text-foreground">Opening Space...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header pageTitle="My Workflow Spaces" showSidebarTrigger={false} />
      <div className="flex-grow flex flex-col overflow-hidden relative">
        <div className="container mx-auto px-4 pt-4 pb-4 sm:px-6 lg:px-8 shrink-0">
          <div className="relative w-full sm:max-w-md mx-auto mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search spaces..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 text-md w-full rounded-full shadow-sm focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-2 sm:px-4 lg:px-6 pb-20"> {/* Added pb-20 for FAB spacing */}
          <div className="container mx-auto p-0">
            {isLoading && (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4 text-lg text-muted-foreground">Loading Spaces...</p>
              </div>
            )}

            {error && !isLoading && (
              <div className="flex flex-col items-center justify-center text-center py-16 bg-destructive/10 p-4 rounded-lg">
                <AlertTriangle className="h-12 w-12 text-destructive mb-3" />
                <h2 className="text-xl font-semibold text-destructive mb-1">Oops! Something went wrong.</h2>
                <p className="text-md text-destructive/80">{error}</p>
              </div>
            )}

            {!isLoading && !error && filteredSpaces.length === 0 && (
              <div className="text-center py-16">
                <h2 className="text-xl font-semibold mb-3 text-muted-foreground">No Spaces Found</h2>
                <p className="text-md text-muted-foreground mb-4">
                  {searchTerm ? "Try a different search term." : "Create your first space to get started!"}
                </p>
                {!searchTerm && 
                  <Button onClick={openCreateSpaceDialog} size="lg" className="rounded-full shadow-lg">
                    <Plus className="mr-2 h-5 w-5"/> Create First Space
                  </Button>
                }
              </div>
            )}

            {!isLoading && !error && filteredSpaces.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-6">
                {filteredSpaces.map((space) => (
                  <SpaceCard 
                    key={space.id} 
                    space={space} 
                    clockStats={spaceClockStatsMap.get(space.id)}
                    onNavigate={handleNavigateToSpace}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Floating Action Button */}
        <div className="absolute bottom-6 right-6 z-10">
          <Button
            onClick={openCreateSpaceDialog}
            size="lg"
            className="rounded-full shadow-xl h-16 w-16 p-0 flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground"
            aria-label="Create new space"
          >
            <Plus className="h-8 w-8" />
          </Button>
        </div>
      </div>
      <CreateSpaceDialog 
        isOpen={isCreateSpaceDialogOpen}
        onClose={closeCreateSpaceDialog}
        onSpaceCreated={handleSpaceCreated}
        createSpace={executeCreateSpace} 
      />
    </div>
  );
}
