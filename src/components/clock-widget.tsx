
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Timer, PlayCircle, PauseCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ClockEvent } from '@/domain/entities/clock-event.entity';
import type { SaveClockEventInputDTO } from '@/application/use-cases/clock-event/save-clock-event.usecase';

// Use Cases and Repositories
import { SaveClockEventUseCase } from '@/application/use-cases/clock-event/save-clock-event.usecase';
import { GetLastClockEventUseCase } from '@/application/use-cases/clock-event/get-last-clock-event.usecase';
import { IndexedDBClockEventRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-clock-event.repository';


export function ClockWidget() {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const { toast } = useToast();

  const clockEventRepository = useMemo(() => new IndexedDBClockEventRepository(), []);
  const saveClockEventUseCase = useMemo(() => new SaveClockEventUseCase(clockEventRepository), [clockEventRepository]);
  const getLastClockEventUseCase = useMemo(() => new GetLastClockEventUseCase(clockEventRepository), [clockEventRepository]);


  // Load initial state from DB
  useEffect(() => {
    getLastClockEventUseCase.execute(/* pass user ID if applicable */)
      .then(lastEvent => {
        if (lastEvent && lastEvent.type === 'clock-in') {
          setIsClockedIn(true);
          setStartTime(new Date(lastEvent.timestamp));
        }
      })
      .catch(err => console.error("Error fetching last clock event:", err));
  }, [getLastClockEventUseCase]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (isClockedIn && startTime) {
      intervalId = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    } else if (!isClockedIn && intervalId) {
      clearInterval(intervalId);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isClockedIn, startTime]);

  const handleClockIn = useCallback(async () => {
    const now = new Date();
    setIsClockedIn(true);
    setStartTime(now);
    setElapsedTime(0);
    const eventData: SaveClockEventInputDTO = { type: 'clock-in', timestamp: now.toISOString() };
    try {
      await saveClockEventUseCase.execute(eventData);
      toast({
        title: "Clocked In",
        description: `Started at ${now.toLocaleTimeString()}`,
      });
    } catch (error) {
       toast({ title: "Error", description: "Failed to save clock-in event.", variant: "destructive" });
    }
  }, [toast, saveClockEventUseCase]);

  const handleClockOut = useCallback(async () => {
    const now = new Date();
    setIsClockedIn(false);
    const eventData: SaveClockEventInputDTO = { type: 'clock-out', timestamp: now.toISOString() };
    try {
      await saveClockEventUseCase.execute(eventData);
      toast({
        title: "Clocked Out",
        description: `Ended at ${now.toLocaleTimeString()}. Total time: ${formatDuration(elapsedTime)}`,
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save clock-out event.", variant: "destructive" });
    }
    setStartTime(null); // Reset start time
  }, [toast, elapsedTime, saveClockEventUseCase]);

  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

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
