// src/application/use-cases/index.ts
/**
 * @file This file serves as a central barrel export for all use cases defined
 * within the `src/application/use-cases` directory and its subdirectories.
 * It aggregates and re-exports all use case classes and their associated
 * Data Transfer Objects (DTOs) or input/output types.
 *
 * This approach offers several benefits:
 * 1.  **Simplified Imports**: Consumers of use cases (e.g., UI layer, controllers)
 *     can import them from a single, consistent path (`@/application/use-cases`)
 *     rather than needing to know the specific subdirectory for each use case.
 * 2.  **Decoupling**: It decouples the consumers from the internal file structure
 *     of the use cases directory. The structure can be refactored without
 *     breaking imports in other parts of the application.
 * 3.  **Clear API Surface**: This file effectively defines the public API of the
 *     application layer's use cases, making it easier to see all available
 *     application-specific operations at a glance.
 */

// Action Definition Use Cases
export { CreateActionDefinitionUseCase, type CreateActionDefinitionInputDTO } from './action-definition/create-action-definition.usecase';
export { DeleteActionDefinitionUseCase } from './action-definition/delete-action-definition.usecase';
export { GetActionDefinitionsBySpaceUseCase } from './action-definition/get-action-definitions-by-space.usecase';
export { UpdateActionDefinitionUseCase, type UpdateActionDefinitionInputDTO } from './action-definition/update-action-definition.usecase';

// Action Log Use Cases
export { GetActionLogsBySpaceUseCase } from './action-log/get-action-logs-by-space.usecase';
export { LogActionUseCase, type LogActionInputDTO, type LogActionResult } from './action-log/log-action.usecase';

// Clock Event Use Cases
export { GetAllClockEventsUseCase } from './clock-event/get-all-clock-events.usecase';
export { GetClockEventsBySpaceUseCase } from './clock-event/get-clock-events-by-space.usecase';
export { GetLastClockEventUseCase } from './clock-event/get-last-clock-event.usecase';
export { SaveClockEventUseCase, type SaveClockEventInputDTO } from './clock-event/save-clock-event.usecase';

// Data Use Cases (Import/Export, Clear All)
export { ClearAllDataUseCase } from './data/clear-all-data.usecase';
export { ExportAppDataUseCase } from './data/export-app-data.usecase';
export { ImportAppDataUseCase } from './data/import-app-data.usecase';

// Data Entry Use Cases
export { GetDataEntriesBySpaceUseCase } from './data-entry/get-data-entries-by-space.usecase';
export { LogDataEntryUseCase, type LogDataEntryInputDTO, type LogDataEntryResult } from './data-entry/log-data-entry.usecase';
export { UpdateDataEntryUseCase, type UpdateDataEntryInputDTO } from './data-entry/update-data-entry.usecase';

// Problem Use Cases
export { CreateProblemUseCase, type CreateProblemInputDTO } from './problem/create-problem.usecase';
export { DeleteProblemUseCase } from './problem/delete-problem.usecase';
export { GetProblemsBySpaceUseCase } from './problem/get-problems-by-space.usecase';
export { UpdateProblemUseCase, type UpdateProblemInputDTO } from './problem/update-problem.usecase';

// Space Use Cases
export { CreateSpaceUseCase, type CreateSpaceInputDTO } from './space/create-space.usecase';
export { DeleteSpaceUseCase } from './space/delete-space.usecase';
export { GetAllSpacesUseCase } from './space/get-all-spaces.usecase';
export { GetSpaceByIdUseCase } from './space/get-space-by-id.usecase';
export { UpdateSpaceUseCase, type UpdateSpaceInputDTO as UpdateSpaceUseCaseInputDTO } from './space/update-space.usecase'; // Alias DTO to avoid name clash if imported directly
export { DuplicateSpaceUseCase, type DuplicateSpaceInputDTO } from './space/duplicate-space.usecase';

// Stats Use Cases
export { GetSpaceStatsUseCase, type SpaceStatsDTO } from './stats/get-space-stats.usecase';

// Timeline Use Cases
export { GetTimelineItemsBySpaceUseCase } from './timeline/get-timeline-items-by-space.usecase';

// To-Do Use Cases
export { CreateTodoUseCase, type CreateTodoInputDTO } from './todo/create-todo.usecase';
export { DeleteTodoUseCase } from './todo/delete-todo.usecase';
export { GetTodosBySpaceUseCase } from './todo/get-todos-by-space.usecase';
export { UpdateTodoUseCase, type UpdateTodoInputDTO } from './todo/update-todo.usecase';

// User Progress Use Cases
export { GetUserProgressUseCase } from './user-progress/get-user-progress.usecase';
