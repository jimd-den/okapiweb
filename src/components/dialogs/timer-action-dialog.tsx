
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { ActionDefinition } from '@/domain/entities';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Loader2, Play, Square, TimerIcon as LucideTimerIcon, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription as UIDialogAlertDescription } from '@/components/ui/alert';

interface TimerActionDialogProps {
  actionDefinition: ActionDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  onLogAction: (actionDefinitionId: string, notes: string | undefined, durationMs: number) => Promise<void>;
}

const formatDuration = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export function TimerActionDialog({
  actionDefinition,
  isOpen,
  onClose,
  onLogAction,
}: TimerActionDialogProps) {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerIntervalId = useRef<NodeJS.Timeout | null>(null);

  const resetTimerState = useCallback(() => {
    if (timerIntervalId.current) {
      clearInterval(timerIntervalId.current);
      timerIntervalId.current = null;
    }
    setStartTime(null);
    setElapsedTime(0);
    setIsTimerRunning(false);
    setIsSubmitting(false);
    setError(null);
  }, []);

  useEffect(() => {
    if (isOpen) {
      resetTimerState();
    } else {
      if (timerIntervalId.current) {
        clearInterval(timerIntervalId.current);
        timerIntervalId.current = null;
      }
    }
    return () => {
      if (timerIntervalId.current) {
        clearInterval(timerIntervalId.current);
      }
    };
  }, [isOpen, resetTimerState]);

  useEffect(() => {
    if (isTimerRunning && startTime !== null) {
      timerIntervalId.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else if (!isTimerRunning && timerIntervalId.current) {
      clearInterval(timerIntervalId.current);
      timerIntervalId.current = null;
    }
    return () => {
      if (timerIntervalId.current) {
        clearInterval(timerIntervalId.current);
      }
    };
  }, [isTimerRunning, startTime]);

  const handleStartTimer = useCallback(() => {
    setStartTime(Date.now());
    setElapsedTime(0); 
    setIsTimerRunning(true);
    setError(null);
  }, []);

  const handleStopAndLog = useCallback(async () => {
    if (!actionDefinition) return;
    setIsSubmitting(true);
    setError(null);
    if (timerIntervalId.current) {
      clearInterval(timerIntervalId.current); 
      timerIntervalId.current = null;
    }
    setIsTimerRunning(false); 

    const durationMs = startTime ? Date.now() - startTime : elapsedTime * 1000;

    try {
      await onLogAction(actionDefinition.id, undefined, durationMs);
      onClose(); 
    } catch (err: any) {
      console.error("Error logging timer action:", err);
      setError(err.message || "Failed to log time.");
    } finally {
      setIsSubmitting(false);
    }
  }, [actionDefinition, onLogAction, onClose, startTime, elapsedTime]);

  const handleDialogClose = useCallback(() => {
    if (isSubmitting) return; 
    onClose();
  }, [isSubmitting, onClose]);

  if (!actionDefinition) return null; 

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-sm p-6">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-xl flex items-center">
            <LucideTimerIcon className="mr-2.5 h-6 w-6 text-primary" />
            {actionDefinition.name}
          </DialogTitle>
          {actionDefinition.description && (
            <DialogDescription className="text-sm">{actionDefinition.description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="py-6 flex flex-col items-center space-y-5">
          <div className="text-6xl font-mono text-foreground tabular-nums">
            {formatDuration(elapsedTime)}
          </div>
          {error && (
            <Alert variant="destructive" className="p-3 text-sm w-full">
              <AlertTriangle className="h-5 w-5" />
              <UIDialogAlertDescription>{error}</UIDialogAlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="mt-3">
          {!isTimerRunning ? (
            <Button
              type="button"
              onClick={handleStartTimer}
              disabled={isSubmitting}
              className="w-full text-lg py-3"
              size="lg"
            >
              <Play className="mr-2.5 h-6 w-6" /> Start Timer
            </Button>
          ) : (
            <Button
              type="button"
              variant="destructive"
              onClick={handleStopAndLog}
              disabled={isSubmitting}
              className="w-full text-lg py-3"
              size="lg"
            >
              {isSubmitting ? <Loader2 className="mr-2.5 h-6 w-6 animate-spin" /> : <Square className="mr-2.5 h-6 w-6" />}
              Stop & Log Time
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
