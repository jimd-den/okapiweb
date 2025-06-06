// src/application/use-cases/timeline/get-timeline-items-by-space.usecase.ts
import type { TimelineItem } from '@/application/dto/timeline-item.dto';
import type { IActionLogRepository } from '@/application/ports/repositories/iaction-log.repository';
import type { IActionDefinitionRepository } from '@/application/ports/repositories/iaction-definition.repository';
import type { IProblemRepository } from '@/application/ports/repositories/iproblem.repository';
import type { ITodoRepository } from '@/application/ports/repositories/itodo.repository';
import type { IDataEntryLogRepository } from '@/application/ports/repositories/idata-entry-log.repository';

const formatDurationForTimeline = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  let parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`); // Show seconds if it's the only unit or primary unit
  return parts.join(' ');
};


export class GetTimelineItemsBySpaceUseCase {
  constructor(
    private readonly actionLogRepository: IActionLogRepository,
    private readonly actionDefinitionRepository: IActionDefinitionRepository,
    private readonly problemRepository: IProblemRepository,
    private readonly todoRepository: ITodoRepository,
    private readonly dataEntryLogRepository: IDataEntryLogRepository
  ) {}

  async execute(spaceId: string, limit: number = 50): Promise<TimelineItem[]> {
    const actionLogs = await this.actionLogRepository.findBySpaceId(spaceId);
    const problems = await this.problemRepository.findBySpaceId(spaceId);
    const todos = await this.todoRepository.findBySpaceId(spaceId);
    const dataEntries = await this.dataEntryLogRepository.findBySpaceId(spaceId);

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
      if (actionDef?.type === 'timer' && log.durationMs !== undefined) {
          title = `${title} (Timer)`;
      }
      let description = log.notes || (actionDef && !actionDef.steps && actionDef.type !== 'timer' ? actionDef.description : undefined);

      if (stepDescription) {
        const stepOutcomeText = log.stepOutcome === 'completed' ? 'Completed' : (log.stepOutcome === 'skipped' ? 'Skipped' : '');
        const stepInfo = `Step: ${stepDescription}${stepOutcomeText ? ` (${stepOutcomeText})` : ''}`;
        description = description ? `${stepInfo} - ${description}` : stepInfo;
      }

      if (actionDef?.type === 'timer' && log.durationMs !== undefined) {
        const durationText = `Logged time: ${formatDurationForTimeline(log.durationMs)}`;
        description = description ? `${durationText} - ${description}` : durationText;
      }
      
      timelineItems.push({
        id: log.id,
        spaceId: log.spaceId,
        timestamp: log.timestamp,
        type: 'action_log',
        title: title,
        description: description,
        actionStepDescription: stepDescription,
        stepOutcome: log.stepOutcome,
        pointsAwarded: log.pointsAwarded,
        isMultiStepFullCompletion: log.isMultiStepFullCompletion,
        actionLogNotes: log.notes,
        actionDefinitionId: log.actionDefinitionId,
        completedStepId: log.completedStepId,
        actionDurationMs: log.durationMs, // Include duration
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
      let title = `To-do: ${todo.description.substring(0, 30)}${todo.description.length > 30 ? '...' : ''}`;
      let desc = `Status: ${todo.status}`;
      if (todo.status === 'done' && todo.completionDate) {
        title = `To-do Completed: ${todo.description.substring(0, 20)}${todo.description.length > 20 ? '...' : ''}`;
        desc = `Completed on ${new Date(todo.completionDate).toLocaleDateString()}`;
      } else if (todo.status === 'doing') {
        desc = 'Marked as "Doing"';
      } else if (todo.creationDate === todo.lastModifiedDate) {
         desc = 'Added to board';
      } else {
         desc = `Status changed to "${todo.status}"`;
      }


      timelineItems.push({
        id: todo.id,
        spaceId: todo.spaceId,
        timestamp: todo.lastModifiedDate, 
        type: 'todo',
        title: title,
        description: desc,
        todoStatus: todo.status,
        todoCompleted: todo.completed, 
        todoCompletionDate: todo.completionDate,
        todoLastModifiedDate: todo.lastModifiedDate,
        todoBeforeImageDataUri: todo.beforeImageDataUri,
        todoAfterImageDataUri: todo.afterImageDataUri,
      });
    }

    // Map DataEntries
    for (const entry of dataEntries) {
      const actionDef = await this.actionDefinitionRepository.findById(entry.actionDefinitionId);
      let descriptionPreview = "Data submitted.";
      if (actionDef?.formFields && actionDef.formFields.length > 0) {
          const firstFieldName = actionDef.formFields[0].name;
          const firstFieldLabel = actionDef.formFields[0].label;
          if(entry.data[firstFieldName]) {
            descriptionPreview = `${firstFieldLabel}: ${String(entry.data[firstFieldName]).substring(0,50)}${String(entry.data[firstFieldName]).length > 50 ? '...' : ''}`;
          }
      }

      timelineItems.push({
        id: entry.id,
        spaceId: entry.spaceId,
        timestamp: entry.timestamp,
        type: 'data_entry',
        title: `Data Logged: ${actionDef?.name || 'Unknown Form'}`,
        description: descriptionPreview,
        dataEntryActionName: actionDef?.name,
        dataEntrySubmittedData: entry.data,
        pointsAwarded: entry.pointsAwarded,
      });
    }

    const sortedTimelineItems = timelineItems.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return sortedTimelineItems.slice(0, limit);
  }
}
