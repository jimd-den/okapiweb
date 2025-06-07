
// src/components/clock-widget.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Timer, PlayCircle, PauseCircle, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface ClockWidgetProps {
  spaceId: string; 
  initialIsClockedIn: boolean;
  initialStartTime: Date | null;
  isSubmittingClockEvent: boolean;
  clockEventError: string | null;
  onSaveClockEvent: (type: 'clock-in' | 'clock-out') => Promise<void>;
}

export function ClockWidget({ 
  initialIsClockedIn, 
  initialStartTime, 
  isSubmittingClockEvent, 
  clockEventError,
  onSaveClockEvent 
}: ClockWidgetProps) {
  const [isClockedIn, setIsClockedIn] = useState(initialIsClockedIn);
  const [startTime, setStartTime] = useState<Date | null>(initialStartTime);
  const [elapsedTime, setElapsedTime] = useState(0); 
  const [actionSuccess, setActionSuccess] = useState<'clock-in' | 'clock-out' | null>(null);

  useEffect(() => {
    setIsClockedIn(initialIsClockedIn);
    setStartTime(initialStartTime);
  }, [initialIsClockedIn, initialStartTime]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (isClockedIn && startTime) {
      setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000)); 
      intervalId = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    } else if (!isClockedIn) {
      if (intervalId) clearInterval(intervalId);
      setElapsedTime(0); 
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isClockedIn, startTime]);

  const handleClockAction = useCallback(async (type: 'clock-in' | 'clock-out') => {
    setActionSuccess(null);
    await onSaveClockEvent(type);
    if (!clockEventError) { 
        setActionSuccess(type);
        setTimeout(() => setActionSuccess(null), 1500);
    }
  }, [onSaveClockEvent, clockEventError]);


  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-1 w-auto">
      {clockEventError && (
        <Alert variant="destructive" className="text-sm p-2"> {/* Increased padding, text-sm */}
           <AlertTriangle className="h-4 w-4" /> {/* Increased icon size */}
           <AlertDescription>{clockEventError}</AlertDescription>
        </Alert>
      )}
      <div className="flex items-center gap-1.5 w-auto"> {/* Increased gap */}
        {isClockedIn ? (
          <>
            <Button 
              onClick={() => handleClockAction('clock-out')}
              variant="destructive" 
              size="default" // Using default size
              className={cn(
                "px-3 py-2 text-sm transition-all min-w-[130px]", // Ensure min width for consistency
                actionSuccess === 'clock-out' && "bg-red-700 animate-success-pulse"
              )}
              disabled={isSubmittingClockEvent || actionSuccess === 'clock-out'}
            >
              {isSubmittingClockEvent ? <Loader2 className="mr-1.5 h-5 w-5 animate-spin" /> : 
               actionSuccess === 'clock-out' ? <CheckCircle2 className="mr-1.5 h-5 w-5" /> :
               <PauseCircle className="mr-1.5 h-5 w-5" />}
              {actionSuccess === 'clock-out' ? "Out!" : "Clock Out"}
            </Button>
            <div className={cn(
                "flex items-center justify-center p-2.5 bg-primary/10 text-primary rounded-md font-mono text-sm h-11 min-w-[110px]", // Increased padding, height, text-sm
                actionSuccess === 'clock-in' && "animate-fade-in-fast" 
              )}>
              <Timer className="mr-1.5 h-5 w-5" /> {/* Increased icon size */}
              {formatDuration(elapsedTime)}
            </div>
          </>
        ) : (
          <Button 
              onClick={() => handleClockAction('clock-in')}
              variant="default" 
              size="default" // Using default size
              className={cn(
                  "bg-green-600 hover:bg-green-700 px-3 py-2 text-sm transition-all min-w-[120px]", // Ensure min width
                  actionSuccess === 'clock-in' && "bg-green-700 animate-success-pulse"
              )}
              disabled={isSubmittingClockEvent || actionSuccess === 'clock-in'}
          >
            {isSubmittingClockEvent ? <Loader2 className="mr-1.5 h-5 w-5 animate-spin" /> : 
             actionSuccess === 'clock-in' ? <CheckCircle2 className="mr-1.5 h-5 w-5" /> :
             <PlayCircle className="mr-1.5 h-5 w-5" />}
            {actionSuccess === 'clock-in' ? "In!" : "Clock In"}
          </Button>
        )}
      </div>
    </div>
  );
}

    