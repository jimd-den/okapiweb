
"use client";

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Header } from '@/components/layout';
import { SpaceCard } from '@/components/space-card';
import { CreateSpaceDialog } from '@/components/dialogs';
import type { Space } from '@/domain/entities';
import type { ClockEvent } from '@/domain/entities';
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
  DuplicateSpaceUseCase,
  // type DuplicateSpaceInputDTO, // Removed unused import
} from '@/application/use-cases';

import {
  IndexedDBSpaceRepository,
  IndexedDBClockEventRepository,
  IndexedDBActionDefinitionRepository,
} from '@/infrastructure/persistence/indexeddb';

import { useDialogState } from '@/hooks';
import ErrorBoundary from '@/components/ui/ErrorBoundary';


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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [inputMode, setInputMode] = useState<'date' | 'search'>('date'); // New state for input mode
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
      setFilteredSpaces([]);
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
    fetchData();
    closeCreateSpaceDialog();
  }, [closeCreateSpaceDialog, fetchData]);

  const executeCreateSpace = async (data: Omit<CreateSpaceInputDTO, 'date'>): Promise<Space> => {
    if (!selectedDate) {
      throw new Error("No date selected for creating a space.");
    }
    try {
      const newSpace = await createSpaceUseCase.execute({ ...data, date: format(selectedDate, 'yyyy-MM-dd') });
      return newSpace;
    } catch (err) { // Changed err: any to err: unknown (or Error)
      console.error("Error in executeCreateSpace (HomePage):", err);
      if (err instanceof Error) {
        throw err; // Re-throw if it's an Error object
      }
      throw new Error(String(err)); // Otherwise, wrap it
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
    } catch (err) { // Changed err: any to err: unknown (or Error)
      console.error("Error duplicating space:", err);
      if (err instanceof Error) {
        setDuplicateError(err.message || "Could not duplicate space.");
      } else {
        setDuplicateError("An unknown error occurred while duplicating space.");
      }
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
      <div className="flex-grow flex flex-col overflow-hidden relative animate-in fade-in duration-500 ease-out">
        <div className="container mx-auto px-4 pt-4 pb-2 sm:px-6 lg:px-8 shrink-0">
          <div className="flex flex-row gap-2 items-center justify-center mb-4">
            {inputMode === 'date' && (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "flex-grow justify-start text-left font-normal text-lg py-3.5 h-12 rounded-full shadow-sm min-h-[48px]",
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
                      onSelect={(date) => {
                        setSelectedDate(date);
                        // Optionally switch to search input after picking a date, or keep it on date.
                        // setInputMode('search');
                      }}
                      initialFocus
                      disabled={(date) => date < new Date("1900-01-01")}
                    />
                  </PopoverContent>
                </Popover>
                <Button variant="outline" size="icon" onClick={() => setInputMode('search')} className="h-12 w-12 rounded-full shadow-sm flex-shrink-0">
                  <Search className="h-6 w-6" />
                </Button>
              </>
            )}

            {inputMode === 'search' && (
              <>
                <div className="relative flex-grow">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search spaces for this day..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-4 py-3.5 text-lg w-full rounded-full shadow-sm focus:ring-2 focus:ring-primary h-12 min-h-[48px]"
                  />
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" onClick={() => setInputMode('date')} className="h-12 w-12 rounded-full shadow-sm flex-shrink-0">
                      <CalendarIcon className="h-6 w-6" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      disabled={(date) => date < new Date("1900-01-01")}
                    />
                  </PopoverContent>
                </Popover>
                 {/* Display selected date as text */}
                 {selectedDate && (
                  <p className="text-sm text-muted-foreground ml-2 hidden sm:block whitespace-nowrap">
                    for {format(selectedDate, "PPP")}
                  </p>
                )}
              </>
            )}
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
                <AlertTriangle className="h-5 w-5" /> {/* Icon size consistent */}
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
                  <Button onClick={openCreateSpaceDialog} size="lg" className="rounded-full shadow-lg text-base sm:text-lg py-3 px-6"> {/* Responsive text size */}
                    <Plus className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> Create Space for {format(selectedDate, "MMM d")}
                  </Button>
                }
              </div>
            )}

            {!isLoading && !error && selectedDate && filteredSpaces.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 xl:gap-6"> {/* Adjusted grid gap */}
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
      {isCreateSpaceDialogOpen && selectedDate && (
        <ErrorBoundary fallbackMessage="Could not load the Create Space dialog. Please try again.">
          <CreateSpaceDialog
            isOpen={isCreateSpaceDialogOpen}
            onClose={closeCreateSpaceDialog}
            onSpaceCreated={handleSpaceCreated}
            createSpace={executeCreateSpace}
            selectedDate={selectedDate}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}
