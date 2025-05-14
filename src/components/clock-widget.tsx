
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
}

export function ClockWidget({ spaceId }: ClockWidgetProps) {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [isLoadingState, setIsLoadingState] = useState(true);
  const { toast } = useToast();

  const clockEventRepository = useMemo(() => new IndexedDBClockEventRepository(), []);
  const saveClockEventUseCase = useMemo(() => new SaveClockEventUseCase(clockEventRepository), [clockEventRepository]);
  const getLastClockEventUseCase = useMemo(() => new GetLastClockEventUseCase(clockEventRepository), [clockEventRepository]);


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
      setElapsedTime(0); // Reset elapsed time when clocked out
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
    setElapsedTime(0);
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
    const currentElapsedTime = startTime ? Math.floor((Date.now() - startTime.getTime()) / 1000) : elapsedTime;
    
    setIsClockedIn(false);
    setStartTime(null); 
    
    const eventData: SaveClockEventInputDTO = { type: 'clock-out', timestamp: now.toISOString(), spaceId };
    try {
      await saveClockEventUseCase.execute(eventData);
      toast({
        title: "Clocked Out",
        description: `Ended at ${now.toLocaleTimeString()}. Total time: ${formatDuration(currentElapsedTime)}`,
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save clock-out event.", variant: "destructive" });
      // Revert state on error - tricky, might need to refetch
      setIsClockedIn(true); 
      setStartTime(new Date(Date.now() - currentElapsedTime * 1000)); // Approximate previous start time
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
        <div className="flex items-center space-x-2 p-3 bg-muted rounded-md">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-muted-foreground">Loading...</span>
        </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {isClockedIn ? (
        <>
          <Button onClick={handleClockOut} variant="destructive" size="lg" className="text-base px-4 py-3">
            <PauseCircle className="mr-2 h-6 w-6" /> Clock Out
          </Button>
          <div className="flex items-center p-3 bg-primary/10 text-primary rounded-md font-mono text-lg">
            <Timer className="mr-2 h-6 w-6" />
            {formatDuration(elapsedTime)}
          </div>
        </>
      ) : (
        <Button onClick={handleClockIn} variant="default" size="lg" className="bg-green-600 hover:bg-green-700 text-base px-4 py-3">
          <PlayCircle className="mr-2 h-6 w-6" /> Clock In
        </Button>
      )}
    </div>
  );
}
