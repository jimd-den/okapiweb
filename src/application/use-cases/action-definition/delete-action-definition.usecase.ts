
// src/application/use-cases/action-definition/delete-action-definition.usecase.ts
import type { IActionDefinitionRepository, IActionLogRepository, IDataEntryLogRepository } from '@/application/ports/repositories';

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

    if (existingActionDefinition.type === 'single' || existingActionDefinition.type === 'multi-step' || existingActionDefinition.type === 'timer') {
      await this.actionLogRepository.deleteByActionDefinitionId(id);
    } else if (existingActionDefinition.type === 'data-entry') {
      await this.dataEntryLogRepository.deleteByActionDefinitionId(id);
    }
    
    if (existingActionDefinition.type === 'multi-step' && existingActionDefinition.steps) {
        for (const step of existingActionDefinition.steps) {
            if (step.stepType === 'data-entry') {
                // Assuming data entries for steps are linked via actionDefinitionId AND stepId
                // This might need adjustment if dataEntryLogRepository doesn't support stepId based deletion directly
                // For now, direct deletion of step-specific data entries is not implemented here,
                // relying on cascade if actionDefinitionId is sufficient.
                // If logs are only linked to the parent ActionDefinition, no extra step needed here.
            }
        }
    }


    await this.actionDefinitionRepository.delete(id);
  }
}
