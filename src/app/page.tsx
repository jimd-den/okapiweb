
"use client";

import { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/layout/header';
import { SpaceCard } from '@/components/space-card';
import { CreateSpaceDialog } from '@/components/dialogs/create-space-dialog';
import type { Space } from '@/domain/entities/space.entity';
import type { ClockEvent } from '@/domain/entities/clock-event.entity';
import { Input } from '@/components/ui/input';
import { Search, AlertTriangle, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from "@/components/ui/alert";


// Use Cases and Repositories
import { GetAllSpacesUseCase } from '@/application/use-cases/space/get-all-spaces.usecase';
import { CreateSpaceUseCase, type CreateSpaceInputDTO } from '@/application/use-cases/space/create-space.usecase';
import { GetAllClockEventsUseCase } from '@/application/use-cases/clock-event/get-all-clock-events.usecase';
import { IndexedDBSpaceRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-space.repository';
import { IndexedDBClockEventRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-clock-event.repository';

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
  const [createSpaceError, setCreateSpaceError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false); // For instant loading feedback

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
        // Add time from last clock-in to now if still clocked in
        // This part was missing, let's ensure it's covered.
        // However, for display on homepage, this might get stale quickly.
        // For now, we'll stick to completed intervals + marking as active.
        // To show live accruing time, SpaceCard would need its own timer.
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
    setCreateSpaceError(null);
  };
  
  const executeCreateSpace = async (data: CreateSpaceInputDTO): Promise<Space> => {
    setCreateSpaceError(null);
    try {
      return await createSpaceUseCase.execute(data);
    } catch (err: any) {
      setCreateSpaceError(err.message || "Failed to create space.");
      throw err; 
    }
  };

  const handleNavigateToSpace = () => {
    setIsNavigating(true);
    // Actual navigation is handled by Next.js Link in SpaceCard
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
      <Header pageTitle="My Workflow Spaces" />
      <div className="flex-grow flex flex-col overflow-hidden">
        <div className="container mx-auto px-4 pt-6 pb-4 sm:px-6 lg:px-8"> {/* Reduced pt */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search spaces by name, tag, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 text-md w-full"
              />
            </div>
            <CreateSpaceDialog 
              onSpaceCreated={handleSpaceCreated}
              createSpace={executeCreateSpace} 
            />
          </div>
          {createSpaceError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{createSpaceError}</AlertDescription>
            </Alert>
          )}
        </div>

        <ScrollArea className="flex-1 px-4 sm:px-6 lg:px-8 pb-8">
          <div className="container mx-auto p-0">
            {isLoading && (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4 text-xl text-muted-foreground">Loading Spaces...</p>
              </div>
            )}

            {error && !isLoading && (
              <div className="flex flex-col items-center justify-center text-center py-20 bg-destructive/10 p-6 rounded-lg">
                <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
                <h2 className="text-2xl font-semibold text-destructive mb-2">Oops! Something went wrong.</h2>
                <p className="text-lg text-destructive/80">{error}</p>
              </div>
            )}

            {!isLoading && !error && filteredSpaces.length === 0 && (
              <div className="text-center py-20">
                <h2 className="text-2xl font-semibold mb-4 text-muted-foreground">No Spaces Found</h2>
                <p className="text-lg text-muted-foreground mb-6">
                  {searchTerm ? "Try a different search term or " : "It looks like you don't have any spaces yet. "}
                  {!searchTerm && "Create your first space to get started!"}
                </p>
                {!searchTerm && 
                  <CreateSpaceDialog 
                    onSpaceCreated={handleSpaceCreated} 
                    createSpace={executeCreateSpace}
                  />
                }
              </div>
            )}

            {!isLoading && !error && filteredSpaces.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
                {filteredSpaces.map((space) => (
                  <SpaceCard 
                    key={space.id} 
                    space={space} 
                    clockStats={spaceClockStatsMap.get(space.id)}
                    onNavigate={handleNavigateToSpace} // Pass the callback
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
