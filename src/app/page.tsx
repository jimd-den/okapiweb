
"use client";

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { SpaceCard } from '@/components/space-card';
import { CreateSpaceDialog } from '@/components/dialogs/create-space-dialog';
import type { Space } from '@/domain/entities/space.entity';
import type { ClockEvent } from '@/domain/entities/clock-event.entity';
import { Input } from '@/components/ui/input';
import { Search, AlertTriangle, Loader2, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

import {
  GetAllSpacesUseCase,
  CreateSpaceUseCase, type CreateSpaceInputDTO,
  GetAllClockEventsUseCase,
  DuplicateSpaceUseCase, type DuplicateSpaceInputDTO,
} from '@/application/use-cases';

import {
  IndexedDBSpaceRepository,
  IndexedDBClockEventRepository,
  IndexedDBActionDefinitionRepository,
} from '@/infrastructure/persistence/indexeddb';

import { useDialogState } from '@/hooks/use-dialog-state';

interface SpaceClockStats {
  totalDurationMs: number;
  isCurrentlyClockedIn: boolean;
}

export default function HomePage() {
  const [allSpaces, setAllSpaces] = useState<Space[]>([]);
  const [allClockEvents, setAllClockEvents] = useState<ClockEvent[]>([]);
  const [filteredSpaces, setFilteredSpaces] = useState<Space[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined); // Initialize to undefined
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  const {
    isOpen: isCreateSpaceDialogOpen,
    openDialog: openCreateSpaceDialog,
    closeDialog: closeCreateSpaceDialog
  } = useDialogState();

  const spaceRepository = useMemo(() => new IndexedDBSpaceRepository(), []);
  const clockEventRepository = useMemo(() => new IndexedDBClockEventRepository(), []);
  const actionDefinitionRepository = useMemo(() => new IndexedDBActionDefinitionRepository(), []);

  const getAllSpacesUseCase = useMemo(() => new GetAllSpacesUseCase(spaceRepository), [spaceRepository]);
  const createSpaceUseCase = useMemo(() => new CreateSpaceUseCase(spaceRepository), [spaceRepository]);
  const getAllClockEventsUseCase = useMemo(() => new GetAllClockEventsUseCase(clockEventRepository), [clockEventRepository]);
  const duplicateSpaceUseCase = useMemo(() => new DuplicateSpaceUseCase(spaceRepository, actionDefinitionRepository), [spaceRepository, actionDefinitionRepository]);

  // Set initial date on client-side after hydration
  useEffect(() => {
    setSelectedDate(startOfDay(new Date()));
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setDuplicateError(null);
    try {
      const [spaceData, clockEventData] = await Promise.all([
        getAllSpacesUseCase.execute(),
        getAllClockEventsUseCase.execute(),
      ]);
      setAllSpaces(spaceData.sort((a,b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()));
      setAllClockEvents(clockEventData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Could not load data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [getAllSpacesUseCase, getAllClockEventsUseCase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!selectedDate) {
      setFilteredSpaces([]); // Or keep current filter if desired when date is briefly undefined
      return;
    }
    const targetDateStr = format(selectedDate, 'yyyy-MM-dd');
    const lowerSearchTerm = searchTerm.toLowerCase();

    const spacesForDate = allSpaces.filter(space => space.date === targetDateStr);

    const result = spacesForDate.filter(space =>
      space.name.toLowerCase().includes(lowerSearchTerm) ||
      (space.description && space.description.toLowerCase().includes(lowerSearchTerm)) ||
      (space.tags && space.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm)))
    );
    setFilteredSpaces(result);
  }, [searchTerm, allSpaces, selectedDate]);

  const spaceClockStatsMap = useMemo(() => {
    const statsMap = new Map<string, SpaceClockStats>();
    allSpaces.forEach(space => {
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
  }, [allSpaces, allClockEvents]);

  const handleSpaceCreated = useCallback((newSpace: Space) => {
    setAllSpaces(prevSpaces => [newSpace, ...prevSpaces].sort((a,b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()));
    fetchData(); // Refetch to ensure clock events and sorting is accurate.
    closeCreateSpaceDialog();
  }, [closeCreateSpaceDialog, fetchData]);

  const executeCreateSpace = async (data: Omit<CreateSpaceInputDTO, 'date'>): Promise<Space> => {
    if (!selectedDate) {
      throw new Error("No date selected for creating a space.");
    }
    try {
      const newSpace = await createSpaceUseCase.execute({ ...data, date: format(selectedDate, 'yyyy-MM-dd') });
      return newSpace;
    } catch (err: any) {
      console.error("Error in executeCreateSpace (HomePage):", err);
      throw err;
    }
  };

  const handleDuplicateSpace = async (spaceId: string) => {
    setIsDuplicating(spaceId);
    setDuplicateError(null);
    try {
      const today = new Date();
      const duplicatedSpace = await duplicateSpaceUseCase.execute({ sourceSpaceId: spaceId, targetDate: today });
      setAllSpaces(prev => [duplicatedSpace, ...prev].sort((a,b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()));
      setSelectedDate(startOfDay(today));
    } catch (err: any) {
      console.error("Error duplicating space:", err);
      setDuplicateError(err.message || "Could not duplicate space.");
    } finally {
      setIsDuplicating(null);
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
      <Header pageTitle={`Spaces for ${selectedDate ? format(selectedDate, 'PPP') : 'Select a Date'}`} showSidebarTrigger={false} />
      <div className="flex-grow flex flex-col overflow-hidden relative">
        <div className="container mx-auto px-4 pt-4 pb-2 sm:px-6 lg:px-8 shrink-0">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-[280px] justify-start text-left font-normal text-lg py-3 h-auto rounded-full shadow-sm",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  disabled={(date) => date < new Date("1900-01-01")} // Example: disable past dates
                />
              </PopoverContent>
            </Popover>
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search spaces for this day..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 text-lg w-full rounded-full shadow-sm focus:ring-2 focus:ring-primary h-auto"
              />
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 px-2 sm:px-4 lg:px-6 pb-24">
          <div className="container mx-auto p-0">
            {isLoading && (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4 text-lg text-muted-foreground">Loading Spaces...</p>
              </div>
            )}

            {(error || duplicateError) && !isLoading && (
              <Alert variant="destructive" className="my-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error || duplicateError}</AlertDescription>
              </Alert>
            )}

            {!isLoading && !error && !selectedDate && (
                <div className="text-center py-16">
                    <CalendarIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold mb-3 text-muted-foreground">Please select a date</h2>
                    <p className="text-md text-muted-foreground">Choose a day from the calendar above to view or create spaces.</p>
                </div>
            )}

            {!isLoading && !error && selectedDate && filteredSpaces.length === 0 && (
              <div className="text-center py-16">
                <h2 className="text-xl font-semibold mb-3 text-muted-foreground">No Spaces Found for {format(selectedDate, "PPP")}</h2>
                <p className="text-md text-muted-foreground mb-4">
                  {searchTerm ? "Try a different search term." : `Create your first space for this day!`}
                </p>
                {!searchTerm &&
                  <Button onClick={openCreateSpaceDialog} size="lg" className="rounded-full shadow-lg text-lg">
                    <Plus className="mr-2 h-6 w-6" /> Create Space for {format(selectedDate, "MMM d")}
                  </Button>
                }
              </div>
            )}

            {!isLoading && !error && selectedDate && filteredSpaces.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-6">
                {filteredSpaces.map((space) => (
                  <SpaceCard
                    key={space.id}
                    space={space}
                    clockStats={spaceClockStatsMap.get(space.id)}
                    onNavigate={handleNavigateToSpace}
                    onDuplicate={handleDuplicateSpace}
                    isDuplicating={isDuplicating === space.id}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {selectedDate && (
          <div className="absolute bottom-6 right-6 z-10">
            <Button
              onClick={openCreateSpaceDialog}
              size="lg"
              className="rounded-full shadow-xl h-16 w-16 p-0 flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground"
              aria-label="Create new space for selected date"
            >
              <Plus className="h-8 w-8" />
            </Button>
          </div>
        )}
      </div>
      <CreateSpaceDialog
        isOpen={isCreateSpaceDialogOpen}
        onClose={closeCreateSpaceDialog}
        onSpaceCreated={handleSpaceCreated}
        createSpace={executeCreateSpace}
        selectedDate={selectedDate}
      />
    </div>
  );
}

    