
// src/components/clock-widget.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Timer, PlayCircle, PauseCircle, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { ClockEvent } from '@/domain/entities/clock-event.entity';
import type { SaveClockEventInputDTO } from '@/application/use-cases/clock-event/save-clock-event.usecase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

import type { SaveClockEventUseCase } from '@/application/use-cases/clock-event/save-clock-event.usecase';
import type { GetLastClockEventUseCase } from '@/application/use-cases/clock-event/get-last-clock-event.usecase';

interface ClockWidgetProps {
  spaceId: string;
  saveClockEventUseCase: SaveClockEventUseCase; 
  getLastClockEventUseCase: GetLastClockEventUseCase; 
  onClockEventSaved?: () => void; // Callback when an event is saved
}

export function ClockWidget({ spaceId, saveClockEventUseCase, getLastClockEventUseCase, onClockEventSaved }: ClockWidgetProps) {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0); 
  const [isLoadingState, setIsLoadingState] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<'clock-in' | 'clock-out' | null>(null);

  const fetchLastEvent = useCallback(() => {
    if (!spaceId || !getLastClockEventUseCase) {
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
    fetchLastEvent();
  }, [fetchLastEvent]);

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
    if (!spaceId || !saveClockEventUseCase) return;
    setIsSubmitting(true);
    setError(null);
    setActionSuccess(null);
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
      setActionSuccess(type);
      onClockEventSaved?.(); 
      setTimeout(() => setActionSuccess(null), 1500);
    } catch (err: any) {
       setError(`Failed to save ${type} event. ${err.message}`);
       console.error(`Error saving ${type} event:`, err);
    } finally {
      setIsSubmitting(false);
    }
  }, [saveClockEventUseCase, spaceId, onClockEventSaved]);


  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  if (isLoadingState) {
    return (
        <div className="flex items-center space-x-1 p-1.5 bg-muted rounded-md h-8">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">...</span>
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 w-auto">
      {error && (
        <Alert variant="destructive" className="text-xs p-1.5">
           <AlertTriangle className="h-3 w-3" />
           <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex items-center gap-1 w-auto">
        {isClockedIn ? (
          <>
            <Button 
              onClick={() => handleClockAction('clock-out')}
              variant="destructive" 
              size="sm"
              className={cn(
                "text-xs px-2 py-1 h-8 transition-all",
                actionSuccess === 'clock-out' && "bg-red-700 animate-success-pulse"
              )}
              disabled={isSubmitting || actionSuccess === 'clock-out'}
            >
              {isSubmitting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : 
               actionSuccess === 'clock-out' ? <CheckCircle2 className="mr-1 h-4 w-4" /> :
               <PauseCircle className="mr-1 h-4 w-4" />}
              {actionSuccess === 'clock-out' ? "Out!" : "Clock Out"}
            </Button>
            <div className={cn(
                "flex items-center justify-center p-1.5 bg-primary/10 text-primary rounded-md font-mono text-xs h-8",
                actionSuccess === 'clock-in' && "animate-fade-in-fast"
              )}>
              <Timer className="mr-1 h-4 w-4" />
              {formatDuration(elapsedTime)}
            </div>
          </>
        ) : (
          <Button 
              onClick={() => handleClockAction('clock-in')}
              variant="default" 
              size="sm"
              className={cn(
                  "bg-green-600 hover:bg-green-700 text-xs px-2 py-1 h-8 transition-all",
                  actionSuccess === 'clock-in' && "bg-green-700 animate-success-pulse"
              )}
              disabled={isSubmitting || actionSuccess === 'clock-in'}
          >
            {isSubmitting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : 
             actionSuccess === 'clock-in' ? <CheckCircle2 className="mr-1 h-4 w-4" /> :
             <PlayCircle className="mr-1 h-4 w-4" />}
            {actionSuccess === 'clock-in' ? "In!" : "Clock In"}
          </Button>
        )}
      </div>
    </div>
  );
}
