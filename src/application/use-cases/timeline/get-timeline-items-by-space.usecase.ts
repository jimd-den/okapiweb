// src/application/use-cases/timeline/get-timeline-items-by-space.usecase.ts
/**
 * @file Implements the use case for generating a timeline of activities for a specific Space.
 * This use case aggregates data from various sources (ActionLogs, Problems, Todos, DataEntryLogs)
 * and transforms them into a unified {@link TimelineItem} DTO format, sorted chronologically.
 */

import type { TimelineItem } from '@/application/dto';
import type { IActionLogRepository, IActionDefinitionRepository, IProblemRepository, ITodoRepository, IDataEntryLogRepository } from '@/application/ports/repositories';

/**
 * Helper function to format duration from milliseconds into a human-readable string (e.g., "1h 30m 15s").
 * @param {number} ms - Duration in milliseconds.
 * @returns {string} Formatted duration string.
 */
const formatDurationForTimeline = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  let parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  // Always show seconds if hours/minutes are zero, or if seconds are non-zero.
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
  return parts.join(' ');
};

/**
 * @class GetTimelineItemsBySpaceUseCase
 * @description Use case responsible for fetching and assembling a chronological timeline of events
 * for a specific {@link Space}. It gathers data from multiple repositories, maps them to
 * a common {@link TimelineItem} format, sorts them, and applies a limit.
 */
export class GetTimelineItemsBySpaceUseCase {
  /**
   * Constructs the GetTimelineItemsBySpaceUseCase.
   * @param {IActionLogRepository} actionLogRepository - Repository for action logs.
   * @param {IActionDefinitionRepository} actionDefinitionRepository - Repository for action definitions (to enrich action logs).
   * @param {IProblemRepository} problemRepository - Repository for problems.
   * @param {ITodoRepository} todoRepository - Repository for to-dos.
   * @param {IDataEntryLogRepository} dataEntryLogRepository - Repository for data entry logs.
   */
  constructor(
    private readonly actionLogRepository: IActionLogRepository,
    private readonly actionDefinitionRepository: IActionDefinitionRepository,
    private readonly problemRepository: IProblemRepository,
    private readonly todoRepository: ITodoRepository,
    private readonly dataEntryLogRepository: IDataEntryLogRepository
  ) {}

  /**
   * Executes the use case to generate timeline items for a specific space.
   * @param {string} spaceId - The unique identifier of the space for which to generate the timeline.
   * @param {number} [limit=50] - Optional. The maximum number of timeline items to return. Defaults to 50.
   * @returns {Promise<TimelineItem[]>} A promise that resolves to an array of {@link TimelineItem} DTOs,
   * sorted by timestamp in descending order (most recent first), and limited by the `limit` parameter.
   * @description This method performs the following steps:
   * 1. Fetches all relevant raw data for the given `spaceId` from their respective repositories:
   *    - ActionLogs, Problems, Todos, DataEntryLogs.
   * 2. Initializes an empty array `timelineItems`.
   * 3. **Maps ActionLogs to TimelineItems**:
   *    - For each ActionLog, fetches its corresponding ActionDefinition to get names and details.
   *    - Constructs a title and description, including step details and timer durations if applicable.
   *    - Pushes the transformed item to `timelineItems`.
   * 4. **Maps Problems to TimelineItems**:
   *    - For each Problem, uses its `lastModifiedDate` as the timestamp for timeline sorting.
   *    - Creates a title like "Problem: [Type]" and uses the problem's description.
   *    - Pushes the transformed item to `timelineItems`.
   * 5. **Maps Todos to TimelineItems**:
   *    - For each Todo, uses its `lastModifiedDate` as the timestamp.
   *    - Creates a context-dependent title and description (e.g., "To-do Completed:", "Status changed to:", "Added to board:").
   *    - Pushes the transformed item to `timelineItems`.
   * 6. **Maps DataEntryLogs to TimelineItems**:
   *    - For each DataEntryLog, fetches its ActionDefinition for context (e.g., form name).
   *    - Creates a description preview from the first form field's data if available.
   *    - Pushes the transformed item to `timelineItems`.
   * 7. **Sorts and Limits**: Sorts all aggregated `timelineItems` by their `timestamp` in descending order.
   * 8. Slices the sorted array to respect the `limit`.
   * 9. Returns the final array of timeline items.
   */
  async execute(spaceId: string, limit: number = 50): Promise<TimelineItem[]> {
    // 1. Fetch all relevant data
    const actionLogs = await this.actionLogRepository.findBySpaceId(spaceId);
    const problems = await this.problemRepository.findBySpaceId(spaceId);
    const todos = await this.todoRepository.findBySpaceId(spaceId);
    const dataEntries = await this.dataEntryLogRepository.findBySpaceId(spaceId);

    const timelineItems: TimelineItem[] = [];

    // 2. Map ActionLogs
    for (const log of actionLogs) {
      const actionDef = await this.actionDefinitionRepository.findById(log.actionDefinitionId);
      let stepDescription: string | undefined;
      if (log.completedStepId && actionDef && actionDef.steps) {
        const step = actionDef.steps.find(s => s.id === log.completedStepId);
        stepDescription = step?.description;
      }
      
      let title = actionDef?.name || 'Unknown Action';
      if (actionDef?.type === 'timer' && log.durationMs !== undefined) {
          title = `${title} (Timer)`; // Clarify timer actions in title
      }
      // Use log notes if available, otherwise use action definition description for non-step, non-timer actions
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
        timestamp: log.timestamp, // ActionLog's own timestamp
        type: 'action_log',
        title: title,
        description: description,
        // ActionLog specific details
        actionStepDescription: stepDescription,
        stepOutcome: log.stepOutcome,
        pointsAwarded: log.pointsAwarded,
        isMultiStepFullCompletion: log.isMultiStepFullCompletion,
        actionLogNotes: log.notes, // Redundant if already in description, but good for specific access
        actionDefinitionId: log.actionDefinitionId,
        completedStepId: log.completedStepId,
        actionDurationMs: log.durationMs,
      });
    }

    // 3. Map Problems
    for (const problem of problems) {
      timelineItems.push({
        id: problem.id,
        spaceId: problem.spaceId,
        timestamp: problem.lastModifiedDate, // Use lastModifiedDate for problem's timeline position
        type: 'problem',
        title: `Problem: ${problem.type}`,
        description: problem.description,
        // Problem specific details
        problemType: problem.type,
        problemResolved: problem.resolved,
        problemResolutionNotes: problem.resolutionNotes,
        problemLastModifiedDate: problem.lastModifiedDate,
        problemImageDataUri: problem.imageDataUri,
      });
    }

    // 4. Map Todos
    for (const todo of todos) {
      let title = `To-do: ${todo.description.substring(0, 30)}${todo.description.length > 30 ? '...' : ''}`;
      let desc = `Status: ${todo.status}`;
      // Provide more context for Todo timeline items
      if (todo.status === 'done' && todo.completionDate) {
        title = `To-do Completed: ${todo.description.substring(0, 20)}${todo.description.length > 20 ? '...' : ''}`;
        desc = `Completed on ${new Date(todo.completionDate).toLocaleDateString()}`;
      } else if (todo.status === 'doing' && todo.creationDate !== todo.lastModifiedDate) { // Check if it was explicitly marked 'doing'
        desc = 'Marked as "Doing"';
      } else if (todo.creationDate === todo.lastModifiedDate && todo.status === 'todo') { // New todo
         desc = 'Added to board';
      } else { // Other status changes or updates
         desc = `Status changed to "${todo.status}"`;
      }

      timelineItems.push({
        id: todo.id,
        spaceId: todo.spaceId,
        timestamp: todo.lastModifiedDate, // Use lastModifiedDate for todo's timeline position
        type: 'todo',
        title: title,
        description: desc,
        // Todo specific details
        todoStatus: todo.status,
        todoCompleted: todo.completed, // Kept for direct boolean check if needed
        todoCompletionDate: todo.completionDate,
        todoLastModifiedDate: todo.lastModifiedDate,
        todoBeforeImageDataUri: todo.beforeImageDataUri,
        todoAfterImageDataUri: todo.afterImageDataUri,
      });
    }

    // 5. Map DataEntryLogs
    for (const entry of dataEntries) {
      const actionDef = await this.actionDefinitionRepository.findById(entry.actionDefinitionId);
      let descriptionPreview = "Data submitted."; // Default preview
      // Try to get a more meaningful preview from the first form field
      if (actionDef?.formFields && actionDef.formFields.length > 0) {
          const firstFieldName = actionDef.formFields[0].name;
          const firstFieldLabel = actionDef.formFields[0].label;
          if(entry.data[firstFieldName]) { // Check if data for the first field exists
            descriptionPreview = `${firstFieldLabel}: ${String(entry.data[firstFieldName]).substring(0,50)}${String(entry.data[firstFieldName]).length > 50 ? '...' : ''}`;
          }
      }

      timelineItems.push({
        id: entry.id,
        spaceId: entry.spaceId,
        timestamp: entry.timestamp, // DataEntryLog's own timestamp
        type: 'data_entry',
        title: `Data Logged: ${actionDef?.name || 'Unknown Form'}`,
        description: descriptionPreview,
        // DataEntryLog specific details
        dataEntryActionName: actionDef?.name,
        dataEntrySubmittedData: entry.data,
        pointsAwarded: entry.pointsAwarded, // Include points if relevant for data entries
      });
    }

    // 6. Sort all items chronologically (most recent first)
    const sortedTimelineItems = timelineItems.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // 7. Limit the number of items
    return sortedTimelineItems.slice(0, limit);
  }
}
