// src/application/use-cases/action-definition/delete-action-definition.usecase.ts
import type { IActionDefinitionRepository } from '@/application/ports/repositories/iaction-definition.repository';
import type { IActionLogRepository } from '@/application/ports/repositories/iaction-log.repository';

export class DeleteActionDefinitionUseCase {
  constructor(
    private readonly actionDefinitionRepository: IActionDefinitionRepository,
    private readonly actionLogRepository: IActionLogRepository
  ) {}

  async execute(id: string): Promise<void> {
    const existingActionDefinition = await this.actionDefinitionRepository.findById(id);
    if (!existingActionDefinition) {
      throw new Error('ActionDefinition not found for deletion.');
    }

    // Also delete associated action logs to maintain data integrity
    const logsToDelete = await this.actionLogRepository.findByActionDefinitionId(id);
    for (const log of logsToDelete) {
      await this.actionLogRepository.delete(log.id);
    }

    await this.actionDefinitionRepository.delete(id);
  }
}
