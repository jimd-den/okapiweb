// src/application/use-cases/timeline/get-timeline-items-by-space.usecase.ts
import type { TimelineItem } from '@/application/dto/timeline-item.dto';
import type { IActionLogRepository } from '@/application/ports/repositories/iaction-log.repository';
import type { IActionDefinitionRepository } from '@/application/ports/repositories/iaction-definition.repository';
import type { IProblemRepository } from '@/application/ports/repositories/iproblem.repository';
import type { ITodoRepository } from '@/application/ports/repositories/itodo.repository';

export class GetTimelineItemsBySpaceUseCase {
  constructor(
    private readonly actionLogRepository: IActionLogRepository,
    private readonly actionDefinitionRepository: IActionDefinitionRepository,
    private readonly problemRepository: IProblemRepository,
    private readonly todoRepository: ITodoRepository
  ) {}

  async execute(spaceId: string, limit: number = 50): Promise<TimelineItem[]> {
    const actionLogs = await this.actionLogRepository.findBySpaceId(spaceId);
    const problems = await this.problemRepository.findBySpaceId(spaceId);
    const todos = await this.todoRepository.findBySpaceId(spaceId);

    const timelineItems: TimelineItem[] = [];

    // Map ActionLogs
    for (const log of actionLogs) {
      const actionDef = await this.actionDefinitionRepository.findById(log.actionDefinitionId);
      let stepDescription: string | undefined;
      if (log.completedStepId && actionDef && actionDef.steps) {
        const step = actionDef.steps.find(s => s.id === log.completedStepId);
        stepDescription = step?.description;
      }
      
      let title = actionDef?.name || 'Unknown Action';
      let description = log.actionLogNotes || (actionDef && !actionDef.steps ? actionDef.description : undefined);

      if (stepDescription) {
        // Prepend step info to description, or use as description if no other notes
        const stepOutcomeText = log.stepOutcome === 'completed' ? 'Completed' : (log.stepOutcome === 'skipped' ? 'Skipped' : '');
        const stepInfo = `Step: ${stepDescription}${stepOutcomeText ? ` (${stepOutcomeText})` : ''}`;
        description = description ? `${stepInfo} - ${description}` : stepInfo;
      }
      
      timelineItems.push({
        id: log.id,
        spaceId: log.spaceId,
        timestamp: log.timestamp,
        type: 'action_log',
        title: title,
        description: description,
        actionStepDescription: stepDescription, // Keep original step description if needed elsewhere
        stepOutcome: log.stepOutcome, // Pass the outcome
        pointsAwarded: log.pointsAwarded,
        isMultiStepFullCompletion: log.isMultiStepFullCompletion,
        actionLogNotes: log.notes, // Already part of description logic above if present
        actionDefinitionId: log.actionDefinitionId,
        completedStepId: log.completedStepId,
      });
    }

    // Map Problems
    for (const problem of problems) {
      timelineItems.push({
        id: problem.id,
        spaceId: problem.spaceId,
        timestamp: problem.lastModifiedDate, 
        type: 'problem',
        title: `Problem: ${problem.type}`,
        description: problem.description,
        problemType: problem.type,
        problemResolved: problem.resolved,
        problemResolutionNotes: problem.resolutionNotes,
        problemLastModifiedDate: problem.lastModifiedDate,
        problemImageDataUri: problem.imageDataUri,
      });
    }

    // Map Todos
    for (const todo of todos) {
      timelineItems.push({
        id: todo.id,
        spaceId: todo.spaceId,
        timestamp: todo.lastModifiedDate, 
        type: 'todo',
        title: todo.completed ? `To-do Completed` : `To-do Added/Updated`,
        description: todo.description,
        todoCompleted: todo.completed,
        todoCompletionDate: todo.completionDate,
        todoLastModifiedDate: todo.lastModifiedDate,
        todoBeforeImageDataUri: todo.beforeImageDataUri,
        todoAfterImageDataUri: todo.afterImageDataUri,
      });
    }

    // Sort all items by timestamp descending (newest first)
    const sortedTimelineItems = timelineItems.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return sortedTimelineItems.slice(0, limit);
  }
}
