
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Timer, PlayCircle, PauseCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ClockEvent } from '@/domain/entities/clock-event.entity';
// import { DEFAULT_USER_ID } from '@/lib/constants'; // Assuming ClockEvents are global or user-specific logic in use case

// Use Cases and Repositories
// Stubs for now, will be replaced with actual use cases
class SaveClockEventUseCase {
  constructor(private repo: any) {} // Replace 'any' with IClockEventRepository
  async execute(event: Omit<ClockEvent, 'id'>): Promise<ClockEvent> {
    const fullEvent = { ...event, id: self.crypto.randomUUID() } as ClockEvent;
    console.warn('STUB: SaveClockEventUseCase.execute()', fullEvent);
    // await this.repo.save(fullEvent);
    return fullEvent;
  }
}
class GetLastClockEventUseCase {
  constructor(private repo: any) {} // Replace 'any' with IClockEventRepository
  async execute(userId?: string): Promise<ClockEvent | null> { // userId might be part of logic
    console.warn('STUB: GetLastClockEventUseCase.execute()');
    // return this.repo.findLastByUserId(userId || DEFAULT_USER_ID);
    return null; // Simulate no last event
  }
}
import { IndexedDBClockEventRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-clock-event.repository.stub';


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
    let interval: NodeJS.Timeout | null = null;
    if (isClockedIn && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    } else if (!isClockedIn && interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isClockedIn, startTime]);

  const handleClockIn = useCallback(async () => {
    const now = new Date();
    setIsClockedIn(true);
    setStartTime(now);
    setElapsedTime(0);
    const eventData: Omit<ClockEvent, 'id'> = { type: 'clock-in', timestamp: now.toISOString() };
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
    const eventData: Omit<ClockEvent, 'id'> = { type: 'clock-out', timestamp: now.toISOString() };
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
