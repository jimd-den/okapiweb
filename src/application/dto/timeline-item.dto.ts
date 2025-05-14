// src/application/dto/timeline-item.dto.ts

export type TimelineItemType = 'action_log' | 'problem' | 'todo';

export interface TimelineItem {
  id: string; // ID of the original entity (ActionLog, Problem, Todo)
  spaceId: string;
  timestamp: string; // Primary timestamp for sorting (e.g., action.timestamp, problem.timestamp, todo.creationDate)
  type: TimelineItemType;
  
  title: string; // Main title for the timeline entry (e.g., Action Name, "Problem Logged", "Todo Created")
  description?: string; // Main description for the timeline entry (e.g., step description, problem details, todo details)
  
  // --- ActionLog specific details ---
  actionDefinitionId?: string; // ID of the ActionDefinition
  actionName?: string; // Name of the action, derived from ActionDefinition
  actionStepDescription?: string; // Description of the completed step, if any
  pointsAwarded?: number;
  isMultiStepFullCompletion?: boolean;
  actionLogNotes?: string; 
  completedStepId?: string;

  // --- Problem specific details ---
  problemType?: 'Waste' | 'Blocker' | 'Issue';
  // problemDescription is the main `description` field
  problemResolved?: boolean;
  problemResolutionNotes?: string;
  problemLastModifiedDate?: string;
  problemImageDataUri?: string; // Image associated with the problem


  // --- Todo specific details ---
  // todoDescription is the main `description` field
  todoCompleted?: boolean;
  todoCompletionDate?: string;
  todoLastModifiedDate?: string;
  todoBeforeImageDataUri?: string;
  todoAfterImageDataUri?: string;
}

