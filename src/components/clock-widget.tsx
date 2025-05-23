
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Timer, PlayCircle, PauseCircle, Loader2, AlertTriangle } from 'lucide-react';
import type { ClockEvent } from '@/domain/entities/clock-event.entity';
import type { SaveClockEventInputDTO } from '@/application/use-cases/clock-event/save-clock-event.usecase';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { SaveClockEventUseCase } from '@/application/use-cases/clock-event/save-clock-event.usecase';
import { GetLastClockEventUseCase } from '@/application/use-cases/clock-event/get-last-clock-event.usecase';

interface ClockWidgetProps {
  spaceId: string;
  saveClockEventUseCase: SaveClockEventUseCase; 
  getLastClockEventUseCase: GetLastClockEventUseCase; 
}

export function ClockWidget({ spaceId, saveClockEventUseCase, getLastClockEventUseCase }: ClockWidgetProps) {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0); 
  const [isLoadingState, setIsLoadingState] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!spaceId) {
        setIsLoadingState(false);
        return;
    };
    setIsLoadingState(true);
    setError(null);
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
        setError("Could not load clock status.");
        setIsClockedIn(false);
        setStartTime(null);
        setElapsedTime(0);
      })
      .finally(() => setIsLoadingState(false));
  }, [getLastClockEventUseCase, spaceId]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (isClockedIn && startTime) {
      setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000)); 
      intervalId = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    } else if (!isClockedIn) {
      if (intervalId) clearInterval(intervalId);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isClockedIn, startTime]);

  const handleClockAction = useCallback(async (type: 'clock-in' | 'clock-out') => {
    if (!spaceId) return;
    setIsSubmitting(true);
    setError(null);
    const now = new Date();
    const eventData: SaveClockEventInputDTO = { type, timestamp: now.toISOString(), spaceId };
    
    try {
      await saveClockEventUseCase.execute(eventData);
      if (type === 'clock-in') {
        setIsClockedIn(true);
        setStartTime(now);
        setElapsedTime(0);
      } else {
        setIsClockedIn(false);
        setStartTime(null); 
        setElapsedTime(0); 
      }
    } catch (err) {
       setError(`Failed to save ${type} event.`);
       console.error(`Error saving ${type} event:`, err);
       // Optionally revert optimistic UI update or show specific error feedback
    } finally {
      setIsSubmitting(false);
    }
  }, [saveClockEventUseCase, spaceId]);


  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  if (isLoadingState) {
    return (
        <div className="flex items-center space-x-2 p-2 sm:p-3 bg-muted rounded-md h-[44px] sm:h-[48px]">
            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary" />
            <span className="text-sm sm:text-base text-muted-foreground">Loading...</span>
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full xs:w-auto">
      {error && (
        <Alert variant="destructive" className="text-xs p-2">
           <AlertTriangle className="h-4 w-4" />
           <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 w-full xs:w-auto">
        {isClockedIn ? (
          <>
            <Button 
              onClick={() => handleClockAction('clock-out')}
              variant="destructive" 
              size="default" 
              className="text-sm sm:text-base px-3 py-2 sm:px-4 sm:py-2.5 flex-grow xs:flex-grow-0"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PauseCircle className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />}
              Clock Out
            </Button>
            <div className="flex items-center justify-center p-2 sm:p-3 bg-primary/10 text-primary rounded-md font-mono text-base sm:text-lg flex-grow xs:flex-grow-0">
              <Timer className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
              {formatDuration(elapsedTime)}
            </div>
          </>
        ) : (
          <Button 
              onClick={() => handleClockAction('clock-in')}
              variant="default" 
              size="default"
              className="bg-green-600 hover:bg-green-700 text-sm sm:text-base px-3 py-2 sm:px-4 sm:py-2.5 w-full xs:w-auto"
              disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlayCircle className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />}
            Clock In
          </Button>
        )}
      </div>
    </div>
  );
}
