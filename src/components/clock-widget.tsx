
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Timer, PlayCircle, PauseCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ClockEvent } from '@/domain/entities/clock-event.entity';
import type { SaveClockEventInputDTO } from '@/application/use-cases/clock-event/save-clock-event.usecase';

// Use Cases and Repositories
import { SaveClockEventUseCase } from '@/application/use-cases/clock-event/save-clock-event.usecase';
import { GetLastClockEventUseCase } from '@/application/use-cases/clock-event/get-last-clock-event.usecase';
import { IndexedDBClockEventRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-clock-event.repository';

interface ClockWidgetProps {
  spaceId: string;
  saveClockEventUseCase: SaveClockEventUseCase; // Pass use cases as props
  getLastClockEventUseCase: GetLastClockEventUseCase; // Pass use cases as props
}

export function ClockWidget({ spaceId, saveClockEventUseCase, getLastClockEventUseCase }: ClockWidgetProps) {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [isLoadingState, setIsLoadingState] = useState(true);
  const { toast } = useToast();

  // Load initial state from DB
  useEffect(() => {
    if (!spaceId) {
        setIsLoadingState(false);
        return;
    };
    setIsLoadingState(true);
    getLastClockEventUseCase.execute(spaceId)
      .then(lastEvent => {
        if (lastEvent && lastEvent.type === 'clock-in') {
          setIsClockedIn(true);
          setStartTime(new Date(lastEvent.timestamp));
        } else {
          setIsClockedIn(false);
          setStartTime(null);
          setElapsedTime(0); 
        }
      })
      .catch(err => {
        console.error("Error fetching last clock event:", err);
        // Set to a default safe state
        setIsClockedIn(false);
        setStartTime(null);
        setElapsedTime(0);
      })
      .finally(() => setIsLoadingState(false));
  }, [getLastClockEventUseCase, spaceId]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (isClockedIn && startTime) {
      setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000)); // Initial set
      intervalId = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    } else if (!isClockedIn) {
      if (intervalId) clearInterval(intervalId);
      // setElapsedTime(0); // Reset elapsed time when clocked out - only if not already showing total from last session
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isClockedIn, startTime]);

  const handleClockIn = useCallback(async () => {
    if (!spaceId) return;
    const now = new Date();
    setIsClockedIn(true);
    setStartTime(now);
    setElapsedTime(0); // Reset timer for new session
    const eventData: SaveClockEventInputDTO = { type: 'clock-in', timestamp: now.toISOString(), spaceId };
    try {
      await saveClockEventUseCase.execute(eventData);
      toast({
        title: "Clocked In",
        description: `Started at ${now.toLocaleTimeString()}`,
      });
    } catch (error) {
       toast({ title: "Error", description: "Failed to save clock-in event.", variant: "destructive" });
       // Revert state on error
       setIsClockedIn(false);
       setStartTime(null);
    }
  }, [toast, saveClockEventUseCase, spaceId]);

  const handleClockOut = useCallback(async () => {
    if (!spaceId) return;
    const now = new Date();
    // Calculate duration of this specific session before clocking out
    const currentSessionDuration = startTime ? Math.floor((Date.now() - startTime.getTime()) / 1000) : elapsedTime;
    
    setIsClockedIn(false);
    setStartTime(null); 
    // elapsedTime will now hold the duration of the session that just ended.
    // Or, if we want elapsedTime to always show the *current* session if clocked in, and 0 if not,
    // we could set setElapsedTime(0) here.
    // For clarity, let's make elapsedTime represent the *active* session.
    // The total time for the space is handled by SpaceCard.
    setElapsedTime(0); 
    
    const eventData: SaveClockEventInputDTO = { type: 'clock-out', timestamp: now.toISOString(), spaceId };
    try {
      await saveClockEventUseCase.execute(eventData);
      toast({
        title: "Clocked Out",
        description: `Ended at ${now.toLocaleTimeString()}. Session time: ${formatDuration(currentSessionDuration)}`,
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save clock-out event.", variant: "destructive" });
      // Revert state on error - might need to refetch last event
      setIsClockedIn(true); 
      setStartTime(new Date(Date.now() - currentSessionDuration * 1000)); // Approximate previous start time
      setElapsedTime(currentSessionDuration);
    }
  }, [toast, elapsedTime, saveClockEventUseCase, spaceId, startTime]);

  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  if (isLoadingState) {
    return (
        <div className="flex items-center space-x-2 p-2 sm:p-3 bg-muted rounded-md h-[44px] sm:h-[48px]"> {/* Consistent height */}
            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary" />
            <span className="text-sm sm:text-base text-muted-foreground">Loading...</span>
        </div>
    );
  }

  return (
    <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 w-full xs:w-auto">
      {isClockedIn ? (
        <>
          <Button 
            onClick={handleClockOut} 
            variant="destructive" 
            size="default" // Use default and control padding with className
            className="text-sm sm:text-base px-3 py-2 sm:px-4 sm:py-2.5 flex-grow xs:flex-grow-0" // Adjusted padding & size
          >
            <PauseCircle className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> Clock Out
          </Button>
          <div className="flex items-center justify-center p-2 sm:p-3 bg-primary/10 text-primary rounded-md font-mono text-base sm:text-lg flex-grow xs:flex-grow-0">
            <Timer className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
            {formatDuration(elapsedTime)}
          </div>
        </>
      ) : (
        <Button 
            onClick={handleClockIn} 
            variant="default" 
            size="default" // Use default and control padding with className
            className="bg-green-600 hover:bg-green-700 text-sm sm:text-base px-3 py-2 sm:px-4 sm:py-2.5 w-full xs:w-auto" // Adjusted padding & size
        >
          <PlayCircle className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> Clock In
        </Button>
      )}
    </div>
  );
}
