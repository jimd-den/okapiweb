// src/domain/entities/data-entry-log.entity.ts

/**
 * @file Defines the DataEntryLog entity, which stores data submitted by users through forms.
 */

/**
 * @interface DataEntryLog
 * @description Represents a single submission of data associated with an {@link ActionDefinition}
 * of type 'data-entry', or a specific {@link ActionStep} of type 'data-entry' within a
 * 'multi-step' action. This entity is crucial for capturing structured information
 * provided by users as part of their activities. For example, logging expenses,
 * submitting survey responses, or recording details for a specific task.
 * Its purpose is to persist and make available the data entered by users.
 */
export interface DataEntryLog {
  /** @property {string} id - A unique identifier for this data entry log. */
  id: string;
  /** @property {string} actionDefinitionId - The identifier of the {@link ActionDefinition} for which this data was submitted.
   * This could be an action of type 'data-entry' or a 'multi-step' action that includes a data-entry step. */
  actionDefinitionId: string;
  /** @property {string} [stepId] - Optional. If the data entry was part of a specific step within a 'multi-step' {@link ActionDefinition}, this property holds the ID of that {@link ActionStep}. */
  stepId?: string;
  /** @property {string} spaceId - The identifier of the 'Space' to which this data entry pertains, linking it to a specific context. */
  spaceId: string;
  /** @property {string} timestamp - An ISO date string representing when the data was submitted by the user. */
  timestamp: string;
  /** @property {Record<string, any>} data - An object storing the actual data submitted by the user.
   * The keys of this record correspond to the `name` property of the {@link FormFieldDefinition}s
   * used in the form, and the values are the user-provided entries. For example, `{'customerName': 'John Doe', 'itemQuantity': 5}`. */
  data: Record<string, any>;
  /** @property {number} pointsAwarded - The number of points awarded to the user for this data submission.
   * This is typically derived from the `pointsForCompletion` of the associated {@link ActionDefinition}
   * or `pointsPerStep` if it's for a specific step. */
  pointsAwarded: number;
}
