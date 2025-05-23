// src/hooks/actions/use-action-logger.ts
"use client";

import type { LogActionUseCase, LogActionInputDTO, LogActionResult } from '@/application/use-cases/action-log/log-action.usecase';
import { useCallback, useState } from 'react';

interface UseActionLoggerProps {
  spaceId: string;
  logActionUseCase: LogActionUseCase;
  onActionLogged: (result: LogActionResult) => void;
}

export function useActionLogger({
  spaceId,
  logActionUseCase,
  onActionLogged,
}: UseActionLoggerProps) {
  const [isLoggingAction, setIsLoggingAction] = useState(false);

  const handleLogAction = useCallback(
    async (actionDefinitionId: string, completedStepId?: string, stepOutcome?: 'completed' | 'skipped', notes?: string): Promise<LogActionResult> => {
      if (!spaceId || !logActionUseCase) {
        console.error("useActionLogger: spaceId or logActionUseCase is not properly initialized.");
        throw new Error("Configuration Error: Cannot log action at this time.");
      }

      setIsLoggingAction(true);
      try {
        const input: LogActionInputDTO = {
          spaceId,
          actionDefinitionId,
          completedStepId,
          stepOutcome,
          notes,
        };
        const result = await logActionUseCase.execute(input);
        onActionLogged(result); // Parent component can show success feedback
        return result;
      } catch (error: any) {
        console.error("Error logging action:", error);
        // Let the calling component handle displaying the error
        throw error;
      } finally {
        setIsLoggingAction(false);
      }
    },
    [spaceId, logActionUseCase, onActionLogged]
  );

  return { handleLogAction, isLoggingAction };
}
