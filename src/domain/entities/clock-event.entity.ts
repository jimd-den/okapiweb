// src/domain/entities/clock-event.entity.ts

/**
 * @file Defines the ClockEvent entity, used for tracking user clock-in and clock-out times within a Space.
 */

/**
 * @interface ClockEvent
 * @description Represents a single clock-in or clock-out event for a user within a specific 'Space'.
 * This entity is fundamental for time tracking features, allowing the system to calculate
 * time spent in different work contexts or on different projects represented by Spaces.
 * Its purpose is to record the boundaries of work sessions.
 */
export interface ClockEvent {
  /** @property {string} id - A unique identifier for this clock event. */
  id: string;
  /** @property {'clock-in' | 'clock-out'} type - Specifies whether this event represents a user clocking in (starting a session) or clocking out (ending a session). */
  type: 'clock-in' | 'clock-out';
  /** @property {string} timestamp - An ISO date string representing the exact date and time when the clock event occurred. */
  timestamp: string;
  /** @property {string} spaceId - The identifier of the 'Space' to which this clock event pertains. This links the time tracking to a specific context. */
  spaceId: string;
}
