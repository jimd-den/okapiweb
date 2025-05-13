"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Timer, PlayCircle, PauseCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ClockEvent } from '@/lib/types';
import { DEFAULT_USER_ID } from '@/lib/constants';

// Mock functions for DB interaction - replace with actual db.ts calls
async function saveClockEvent(event: ClockEvent): Promise<void> {
  console.log('Saving clock event:', event);
  // await addClockEventDB(event);
}
async function getLastClockEvent(): Promise<ClockEvent | null> {
  console.log('Fetching last clock event');
  // This would query IndexedDB for the most recent clock event for the user
  // For now, let's assume it returns null or a sample event for testing
  // return { id: '1', type: 'clock-in', timestamp: new Date(Date.now() - 3600 * 1000).toISOString(), userId: DEFAULT_USER_ID };
  return null;
}


export function ClockWidget() {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const { toast } = useToast();

  // Load initial state from DB
  useEffect(() => {
    getLastClockEvent().then(lastEvent => {
      if (lastEvent && lastEvent.type === 'clock-in') {
        setIsClockedIn(true);
        setStartTime(new Date(lastEvent.timestamp));
      }
    });
  }, []);

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
    const event: ClockEvent = { id: self.crypto.randomUUID(), type: 'clock-in', timestamp: now.toISOString() };
    try {
      await saveClockEvent(event);
      toast({
        title: "Clocked In",
        description: `Started at ${now.toLocaleTimeString()}`,
      });
    } catch (error) {
       toast({ title: "Error", description: "Failed to save clock-in event.", variant: "destructive" });
    }
  }, [toast]);

  const handleClockOut = useCallback(async () => {
    const now = new Date();
    setIsClockedIn(false);
    const event: ClockEvent = { id: self.crypto.randomUUID(), type: 'clock-out', timestamp: now.toISOString() };
    try {
      await saveClockEvent(event);
      toast({
        title: "Clocked Out",
        description: `Ended at ${now.toLocaleTimeString()}. Total time: ${formatDuration(elapsedTime)}`,
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save clock-out event.", variant: "destructive" });
    }
    setStartTime(null); // Reset start time
  }, [toast, elapsedTime]);

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
          <Button onClick={handleClockOut} variant="destructive" size="lg" className="text-base px-4 py-3"> {/* Driver friendly: larger button */}
            <PauseCircle className="mr-2 h-6 w-6" /> Clock Out
          </Button>
          <div className="flex items-center p-3 bg-primary/10 text-primary rounded-md font-mono text-lg"> {/* Driver friendly: larger text */}
            <Timer className="mr-2 h-6 w-6" />
            {formatDuration(elapsedTime)}
          </div>
        </>
      ) : (
        <Button onClick={handleClockIn} variant="default" size="lg" className="bg-green-600 hover:bg-green-700 text-base px-4 py-3"> {/* Driver friendly: larger button */}
          <PlayCircle className="mr-2 h-6 w-6" /> Clock In
        </Button>
      )}
    </div>
  );
}
