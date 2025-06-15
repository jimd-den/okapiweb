// src/application/use-cases/action-definition/get-action-definitions-by-space.usecase.ts
/**
 * @file Implements the use case for retrieving all action definitions associated with a specific space.
 * This use case fetches action definitions and sorts them based on their defined order.
 */

import type { ActionDefinition } from '@/domain/entities/action-definition.entity';
import type { IActionDefinitionRepository } from '@/application/ports/repositories/iaction-definition.repository';

/**
 * @class GetActionDefinitionsBySpaceUseCase
 * @description Use case responsible for fetching all action definitions that belong to a given space.
 * It retrieves the definitions using a repository and then sorts them by their `order` property.
 */
export class GetActionDefinitionsBySpaceUseCase {
  /**
   * Constructs the GetActionDefinitionsBySpaceUseCase.
   * @param {IActionDefinitionRepository} actionDefinitionRepository - The repository for accessing action definition data.
   * This dependency is injected to abstract the data access mechanism.
   */
  constructor(private readonly actionDefinitionRepository: IActionDefinitionRepository) {}

  /**
   * Executes the use case to get action definitions for a specific space.
   * @param {string} spaceId - The unique identifier of the space for which to retrieve action definitions.
   * @returns {Promise<ActionDefinition[]>} A promise that resolves to an array of {@link ActionDefinition} entities,
   * sorted by their `order` property (ascending, with undefined or 0 order first).
   * @description This method performs the following steps:
   * 1. Calls `actionDefinitionRepository.findBySpaceId` to fetch all action definitions associated with the given `spaceId`.
   * 2. Sorts the retrieved action definitions. The sort logic places items with a lower `order` value first.
   *    If `order` is not defined or is 0, it's treated as 0 for sorting purposes.
   * 3. Returns the sorted array of action definitions.
   */
  async execute(spaceId: string): Promise<ActionDefinition[]> {
    const definitions = await this.actionDefinitionRepository.findBySpaceId(spaceId);
    // Sort by the 'order' property, treating undefined or null order as 0.
    return definitions.sort((a, b) => (a.order || 0) - (b.order || 0));
  }
}
