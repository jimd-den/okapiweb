// src/hooks/actions/use-space-action-logger.ts
"use client";

import { useCallback, useState, useMemo } from 'react';
import type { LogActionResult } from '@/application/use-cases/action-log/log-action.usecase';
import type { LogDataEntryInputDTO, LogDataEntryResult } from '@/application/use-cases/data-entry/log-data-entry.usecase';
import type { IActionLogRepository, IActionDefinitionRepository, IDataEntryLogRepository } from '@/application/ports/repositories';
import { LogActionUseCase, LogDataEntryUseCase } from '@/application/use-cases'; // Import LogActionUseCase and LogDataEntryUseCase

interface UseSpaceActionLoggerProps {
  spaceId: string;
  actionLogRepository: IActionLogRepository;
  dataEntryLogRepository: IDataEntryLogRepository;
  actionDefinitionRepository: IActionDefinitionRepository;
  onActionLogged: (result: LogActionResult) => void;
  onDataEntryLogged: (result: LogDataEntryResult) => void;
}

export interface UseSpaceActionLoggerReturn {
  handleLogAction: (actionDefinitionId: string, completedStepId?: string, stepOutcome?: 'completed' | 'skipped', notes?: string) => Promise<LogActionResult>;
  handleLogDataEntry: (data: Omit<LogDataEntryInputDTO, 'spaceId'>) => Promise<LogDataEntryResult>; // spaceId will be from hook
  isLogging: boolean;
}

export function useSpaceActionLogger({
  spaceId,
  actionLogRepository,
  dataEntryLogRepository,
  actionDefinitionRepository,
  onActionLogged,
  onDataEntryLogged,
}: UseSpaceActionLoggerProps): UseSpaceActionLoggerReturn {
  const [isLogging, setIsLogging] = useState(false);

  const logActionUseCase = useMemo(() => 
    new LogActionUseCase(actionLogRepository, actionDefinitionRepository), 
    [actionLogRepository, actionDefinitionRepository]
  );

  const logDataEntryUseCase = useMemo(() => 
    new LogDataEntryUseCase(dataEntryLogRepository, actionDefinitionRepository), 
    [dataEntryLogRepository, actionDefinitionRepository]
  );

  const handleLogAction = useCallback(
    async (actionDefinitionId: string, completedStepId?: string, stepOutcome?: 'completed' | 'skipped', notes?: string): Promise<LogActionResult> => {
      if (!spaceId) {
        console.error("useSpaceActionLogger: spaceId is not properly initialized.");
        throw new Error("Configuration Error: Cannot log action at this time.");
      }
      setIsLogging(true);
      try {
        const input = { // Explicitly type input for LogActionInputDTO if defined
          spaceId,
          actionDefinitionId,
          completedStepId,
          stepOutcome,
          notes,
        };
        const result = await logActionUseCase.execute(input);
        onActionLogged(result);
        return result;
      } catch (error: any) {
        console.error("Error logging action:", error);
        throw error;
      } finally {
        setIsLogging(false);
      }
    },
    [spaceId, logActionUseCase, onActionLogged]
  );

  const handleLogDataEntry = useCallback(
    async (data: Omit<LogDataEntryInputDTO, 'spaceId'>): Promise<LogDataEntryResult> => {
      if (!spaceId) {
        console.error("useSpaceActionLogger: spaceId is not properly initialized.");
        throw new Error("Configuration Error: Cannot log data entry at this time.");
      }
      setIsLogging(true);
      try {
        const input: LogDataEntryInputDTO = {
          ...data,
          spaceId,
        };
        const result = await logDataEntryUseCase.execute(input);
        onDataEntryLogged(result);
        return result;
      } catch (error: any) {
        console.error("Error logging data entry:", error);
        throw error;
      } finally {
        setIsLogging(false);
      }
    },
    [spaceId, logDataEntryUseCase, onDataEntryLogged]
  );

  return { handleLogAction, handleLogDataEntry, isLogging };
}
