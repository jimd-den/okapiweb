// src/domain/entities/clock-event.entity.ts

/**
 * Represents a clock-in/out event.
 */
export interface ClockEvent {
  id: string;
  type: 'clock-in' | 'clock-out';
  timestamp: string; // ISO date string
  spaceId?: string; // Optional: if clocking in/out for a specific space
}
