// src/domain/entities/action-definition.entity.ts

/**
 * @file Defines the core domain entities related to actions that can be performed by users.
 * These include action definitions, their steps, and form fields for data entry.
 */

/**
 * @interface FormFieldDefinition
 * @description Defines the structure and properties of a single field within a data-entry form.
 * This entity is used to dynamically render forms for actions of type 'data-entry'
 * or for steps within a 'multi-step' action that are of type 'data-entry'.
 * Its purpose is to capture specific pieces of information from the user.
 */
export interface FormFieldDefinition {
  /** @property {string} id - A unique identifier for this form field. */
  id: string;
  /** @property {string} name - The technical name or key for the field, used for data submission and identification (e.g., 'customerName', 'itemQuantity'). */
  name: string;
  /** @property {string} label - A user-friendly label displayed alongside the form field in the UI (e.g., "Customer Name", "Item Quantity"). */
  label: string;
  /** @property {'text' | 'number' | 'date' | 'textarea' | 'barcode'} fieldType - The type of input control to be rendered for this field. 'barcode' indicates a field that can be populated via barcode scanning. */
  fieldType: 'text' | 'number' | 'date' | 'textarea' | 'barcode';
  /** @property {number} order - A number determining the display order of this field relative to other fields in the same form. Lower numbers appear first. */
  order: number;
  /** @property {boolean} isRequired - Indicates whether this field must be filled out by the user. */
  isRequired: boolean;
  /** @property {string} [placeholder] - Optional placeholder text to display within the input field before the user enters a value. */
  placeholder?: string;
}

/**
 * @interface ActionStep
 * @description Represents a single, distinct step or task within a larger, multi-step action.
 * Each step can be a simple description of something to do, or it can involve data entry.
 * The purpose is to break down complex actions into manageable parts.
 */
export interface ActionStep {
  /** @property {string} id - A unique identifier for this action step. */
  id: string;
  /** @property {string} description - A textual description of what this step entails. If the stepType is 'data-entry', this acts more like a label or title for the data entry section of the step. */
  description: string;
  /** @property {number} order - A number determining the sequence of this step in relation to other steps within the same multi-step action. Lower numbers come first. */
  order: number;
  /** @property {number} [pointsPerStep] - Optional points awarded specifically for completing this individual step. */
  pointsPerStep?: number;
  /** @property {'description' | 'data-entry'} [stepType] - The nature of the step. 'description' indicates a simple textual step. 'data-entry' indicates the step requires filling out a form. Defaults to 'description'. */
  stepType?: 'description' | 'data-entry';
  /** @property {FormFieldDefinition[]} [formFields] - An array of form field definitions. This property is only relevant and present if `stepType` is 'data-entry'. */
  formFields?: FormFieldDefinition[];
}

/**
 * @typedef ActionType
 * @description A type alias representing the different kinds of actions that can be defined.
 * - 'single': A simple, one-off action.
 * - 'multi-step': An action composed of several {@link ActionStep}s.
 * - 'data-entry': An action primarily designed for filling out a form defined by {@link FormFieldDefinition}s.
 * - 'timer': An action that involves timing how long it takes to complete (often a single task).
 */
export type ActionType = 'single' | 'multi-step' | 'data-entry' | 'timer';

/**
 * @interface ActionDefinition
 * @description This is a central entity in the domain, representing the template or blueprint for an action
 * that can be performed by a user within a specific 'Space'. It defines the nature, behavior,
 * and any associated tasks or data requirements of an action. For example, a "Daily Standup"
 * could be an ActionDefinition of type 'multi-step', or "Log Expense" could be 'data-entry'.
 * Its purpose is to provide a reusable structure for activities users can engage in.
 */
export interface ActionDefinition {
  /** @property {string} id - A unique identifier for this action definition. */
  id: string;
  /** @property {string} spaceId - The identifier of the 'Space' to which this action definition belongs. This links the action to a specific context or project. */
  spaceId: string;
  /** @property {string} name - A user-friendly name for the action (e.g., "Morning Checklist", "Submit Bug Report"). */
  name: string;
  /** @property {string} [description] - An optional, more detailed description of the action's purpose or what it involves. */
  description?: string;
  /** @property {ActionType} type - The type of action this definition represents, determining its structure and behavior (e.g., 'single', 'multi-step'). */
  type: ActionType;
  /** @property {number} pointsForCompletion - The number of points awarded to the user upon successful completion of the entire action. For 'multi-step' actions, this is typically for completing all steps, though individual steps might also have points. */
  pointsForCompletion: number;
  /** @property {ActionStep[]} [steps] - An array of action steps. This property is only relevant and present if `type` is 'multi-step'. */
  steps?: ActionStep[];
  /** @property {FormFieldDefinition[]} [formFields] - An array of form field definitions. This property is primarily relevant if `type` is 'data-entry' (for a top-level form) but can also be used by other types if direct form data is needed. */
  formFields?: FormFieldDefinition[];
  /** @property {number} [order] - An optional number that can be used to determine the display order of this action definition relative to others within the same space. */
  order?: number;
  /** @property {string} creationDate - An ISO date string representing when this action definition was created. */
  creationDate: string;
  /** @property {boolean} isEnabled - A flag indicating whether this action definition is currently active and can be performed by users. Disabled actions are typically hidden or shown as inactive. */
  isEnabled: boolean;
}
