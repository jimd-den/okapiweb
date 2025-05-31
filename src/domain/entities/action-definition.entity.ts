// src/domain/entities/action-definition.entity.ts

/**
 * Defines the structure of a single field in a data-entry form.
 */
export interface FormFieldDefinition {
  id: string; // Unique ID for the field
  name: string; // Technical name/key for the field (e.g., 'customerName', 'itemQuantity')
  label: string; // User-friendly label for the form field (e.g., "Customer Name", "Item Quantity")
  fieldType: 'text' | 'number' | 'date' | 'textarea' | 'barcode'; // Type of input, 'barcode' added
  order: number; // Order of the field in the form
  isRequired: boolean;
  placeholder?: string;
}

/**
 * Represents a single step within a multi-step action.
 */
export interface ActionStep {
  id: string; // Unique ID for the step
  description: string; // Description of the step (or label for data-entry step)
  order: number; // Order of the step in the sequence
  pointsPerStep?: number;
  stepType?: 'description' | 'data-entry'; // Type of step, defaults to 'description'
  formFields?: FormFieldDefinition[]; // Only present if stepType is 'data-entry'
}

/**
 * Defines an action that can be performed within a space.
 */
export type ActionType = 'single' | 'multi-step' | 'data-entry' | 'timer';

export interface ActionDefinition {
  id: string;
  spaceId: string;
  name: string;
  description?: string;
  type: ActionType;
  pointsForCompletion: number; // Points for single, full multi-step, data-entry, or timer completion
  steps?: ActionStep[]; // For 'multi-step'
  formFields?: FormFieldDefinition[]; // For top-level 'data-entry' type
  order?: number;
  creationDate: string; // ISO date string
  isEnabled: boolean;
}
