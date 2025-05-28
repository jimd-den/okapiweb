
// src/hooks/data/use-space-clock-events.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { ClockEvent } from '@/domain/entities/clock-event.entity';
import type { SaveClockEventUseCase, SaveClockEventInputDTO } from '@/application/use-cases/clock-event/save-clock-event.usecase';
import type { GetLastClockEventUseCase } from '@/application/use-cases/clock-event/get-last-clock-event.usecase';
import type { GetClockEventsBySpaceUseCase } from '@/application/use-cases/clock-event/get-clock-events-by-space.usecase';

interface UseSpaceClockEventsProps {
  spaceId: string;
  saveClockEventUseCase: SaveClockEventUseCase;
  getLastClockEventUseCase: GetLastClockEventUseCase;
  getClockEventsBySpaceUseCase: GetClockEventsBySpaceUseCase;
}

export interface UseSpaceClockEventsReturn {
  clockEventsForSpace: ClockEvent[];
  initialClockState: {
    isClockedIn: boolean;
    startTime: Date | null;
    isLoading: boolean;
    error: string | null;
  };
  isSubmittingClockEvent: boolean;
  clockEventError: string | null;
  handleSaveClockEvent: (type: 'clock-in' | 'clock-out') => Promise<void>;
  refreshClockEvents: () => Promise<void>;
}

export function useSpaceClockEvents({
  spaceId,
  saveClockEventUseCase,
  getLastClockEventUseCase,
  getClockEventsBySpaceUseCase,
}: UseSpaceClockEventsProps): UseSpaceClockEventsReturn {
  const [clockEventsForSpace, setClockEventsForSpace] = useState<ClockEvent[]>([]);
  const [initialClockState, setInitialClockState] = useState({
    isClockedIn: false,
    startTime: null as Date | null,
    isLoading: true,
    error: null as string | null,
  });
  const [isSubmittingClockEvent, setIsSubmittingClockEvent] = useState(false);
  const [clockEventError, setClockEventError] = useState<string | null>(null);

  const fetchAllClockEventsForSpace = useCallback(async () => {
    if (!spaceId || !getClockEventsBySpaceUseCase) return;
    try {
      const events = await getClockEventsBySpaceUseCase.execute(spaceId);
      setClockEventsForSpace(events);
    } catch (err: any) {
      console.error("Error fetching all clock events for space:", err);
      // This error might not need to be user-facing if initial state is handled
    }
  }, [spaceId, getClockEventsBySpaceUseCase]);

  const fetchInitialClockStatus = useCallback(async () => {
    if (!spaceId || !getLastClockEventUseCase) {
      setInitialClockState(prev => ({ ...prev, isLoading: false, error: "Configuration error." }));
      return;
    }
    setInitialClockState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const lastEvent = await getLastClockEventUseCase.execute(spaceId);
      if (lastEvent && lastEvent.type === 'clock-in') {
        setInitialClockState({
          isClockedIn: true,
          startTime: new Date(lastEvent.timestamp),
          isLoading: false,
          error: null,
        });
      } else {
        setInitialClockState({
          isClockedIn: false,
          startTime: null,
          isLoading: false,
          error: null,
        });
      }
      await fetchAllClockEventsForSpace(); // Fetch all events after determining initial state
    } catch (err: any) {
      console.error("Error fetching last clock event:", err);
      setInitialClockState({
        isClockedIn: false,
        startTime: null,
        isLoading: false,
        error: "Could not load clock status.",
      });
    }
  }, [spaceId, getLastClockEventUseCase, fetchAllClockEventsForSpace]);

  useEffect(() => {
    fetchInitialClockStatus();
  }, [fetchInitialClockStatus]);

  const handleSaveClockEvent = useCallback(async (type: 'clock-in' | 'clock-out') => {
    if (!spaceId || !saveClockEventUseCase) return;
    setIsSubmittingClockEvent(true);
    setClockEventError(null);
    const now = new Date();
    const eventData: SaveClockEventInputDTO = { type, timestamp: now.toISOString(), spaceId };

    try {
      await saveClockEventUseCase.execute(eventData);
      // After saving, refetch initial status to update UI and all events for metrics
      await fetchInitialClockStatus(); 
    } catch (err: any) {
      setClockEventError(`Failed to save ${type} event. ${err.message}`);
      console.error(`Error saving ${type} event:`, err);
    } finally {
      setIsSubmittingClockEvent(false);
    }
  }, [spaceId, saveClockEventUseCase, fetchInitialClockStatus]);

  const refreshClockEvents = useCallback(async () => {
    await fetchInitialClockStatus(); // This also fetches all clock events for space
  }, [fetchInitialClockStatus]);

  return {
    clockEventsForSpace,
    initialClockState,
    isSubmittingClockEvent,
    clockEventError,
    handleSaveClockEvent,
    refreshClockEvents,
  };
}
