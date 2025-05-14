// src/domain/entities/action-definition.entity.ts

/**
 * Represents a single step within a multi-step action.
 */
export interface ActionStep {
  id: string; // Unique ID for the step
  description: string; // Description of the step
  order: number; // Order of the step in the sequence
  // Points for completing just this step (optional, could be 0 if only full multi-step completion awards points)
  pointsPerStep?: number; 
}

/**
 * Defines an action that can be performed within a space.
 * This could be a single action or a multi-step checklist.
 */
export interface ActionDefinition {
  id: string; // Unique ID for the action definition
  spaceId: string; // ID of the space this action belongs to
  name: string; // Name of the action (e.g., "Tidy Desk", "Morning Routine") - used as button label
  description?: string; // Optional description of the action
  type: 'single' | 'multi-step'; // Type of action
  
  // Points awarded when a 'single' action is completed, 
  // or when all steps of a 'multi-step' action are completed.
  pointsForCompletion: number; 
  
  steps?: ActionStep[]; // Array of steps, only applicable if type is 'multi-step'
  
  order?: number; // Optional: for sorting/displaying actions in the UI
  creationDate: string; // ISO date string
  isEnabled: boolean; // Whether this action is currently active/shown
}
