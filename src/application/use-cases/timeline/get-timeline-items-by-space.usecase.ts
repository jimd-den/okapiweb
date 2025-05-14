// src/application/use-cases/timeline/get-timeline-items-by-space.usecase.ts
import type { TimelineItem } from '@/application/dto/timeline-item.dto';
import type { IActionLogRepository } from '@/application/ports/repositories/iaction-log.repository';
import type { IActionDefinitionRepository } from '@/application/ports/repositories/iaction-definition.repository';
import type { IProblemRepository } from '@/application/ports/repositories/iproblem.repository';
import type { ITodoRepository } from '@/application/ports/repositories/itodo.repository';
import type { ActionLog } from '@/domain/entities/action-log.entity';
import type { Problem } from '@/domain/entities/problem.entity';
import type { Todo } from '@/domain/entities/todo.entity';

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
      timelineItems.push({
        id: log.id,
        spaceId: log.spaceId,
        timestamp: log.timestamp,
        type: 'action_log',
        title: actionDef?.name || 'Unknown Action',
        description: stepDescription || (actionDef && !actionDef.steps ? actionDef.description : undefined),
        pointsAwarded: log.pointsAwarded,
        isMultiStepFullCompletion: log.isMultiStepFullCompletion,
        actionLogNotes: log.notes,
        actionDefinitionId: log.actionDefinitionId,
        completedStepId: log.completedStepId,
      });
    }

    // Map Problems
    for (const problem of problems) {
      timelineItems.push({
        id: problem.id,
        spaceId: problem.spaceId,
        // Use lastModifiedDate if updated, otherwise creation timestamp
        timestamp: problem.lastModifiedDate, 
        type: 'problem',
        title: `Problem: ${problem.type}`,
        description: problem.description,
        problemType: problem.type,
        problemResolved: problem.resolved,
        problemResolutionNotes: problem.resolutionNotes,
        problemLastModifiedDate: problem.lastModifiedDate,
      });
    }

    // Map Todos
    for (const todo of todos) {
      timelineItems.push({
        id: todo.id,
        spaceId: todo.spaceId,
        // Use lastModifiedDate if updated, otherwise creation timestamp
        timestamp: todo.lastModifiedDate, 
        type: 'todo',
        title: todo.completed ? `Todo Completed` : `Todo Added`,
        description: todo.description,
        todoCompleted: todo.completed,
        todoCompletionDate: todo.completionDate,
        todoLastModifiedDate: todo.lastModifiedDate,
      });
    }

    // Sort all items by timestamp descending (newest first)
    const sortedTimelineItems = timelineItems.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return sortedTimelineItems.slice(0, limit);
  }
}
