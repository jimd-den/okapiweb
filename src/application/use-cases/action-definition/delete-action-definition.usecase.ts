// src/application/use-cases/action-definition/delete-action-definition.usecase.ts
import type { IActionDefinitionRepository } from '@/application/ports/repositories/iaction-definition.repository';
import type { IActionLogRepository } from '@/application/ports/repositories/iaction-log.repository';
import type { IDataEntryLogRepository } from '@/application/ports/repositories/idata-entry-log.repository';

export class DeleteActionDefinitionUseCase {
  constructor(
    private readonly actionDefinitionRepository: IActionDefinitionRepository,
    private readonly actionLogRepository: IActionLogRepository,
    private readonly dataEntryLogRepository: IDataEntryLogRepository
  ) {}

  async execute(id: string): Promise<void> {
    const existingActionDefinition = await this.actionDefinitionRepository.findById(id);
    if (!existingActionDefinition) {
      throw new Error('ActionDefinition not found for deletion.');
    }

    // Delete associated logs based on type
    if (existingActionDefinition.type === 'single' || existingActionDefinition.type === 'multi-step') {
      await this.actionLogRepository.deleteByActionDefinitionId(id);
    } else if (existingActionDefinition.type === 'data-entry') {
      await this.dataEntryLogRepository.deleteByActionDefinitionId(id);
    }
    // Note: If an action definition could have both action logs AND data entry logs (not current design),
    // you'd call both deleteByActionDefinitionId methods.

    await this.actionDefinitionRepository.delete(id);
  }
}
