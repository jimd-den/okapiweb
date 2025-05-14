// src/hooks/actions/use-action-logger.ts
"use client";

import type { LogActionUseCase, LogActionInputDTO, LogActionResult } from '@/application/use-cases/action-log/log-action.usecase';
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();

  const handleLogAction = useCallback(
    async (actionDefinitionId: string, completedStepId?: string, stepOutcome?: 'completed' | 'skipped', notes?: string) => {
      if (!spaceId || !logActionUseCase) {
        console.error("useActionLogger: spaceId or logActionUseCase is not properly initialized.");
        toast({
          title: "Configuration Error",
          description: "Cannot log action at this time.",
          variant: "destructive",
        });
        return;
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
        toast({
          title: "Action Logged!",
          description: `${result.loggedAction.pointsAwarded} points awarded. Total points: ${result.updatedUserProgress.points}.`,
        });
        onActionLogged(result);
      } catch (error: any) {
        console.error("Error logging action:", error);
        toast({
          title: "Error Logging Action",
          description: error.message || "An unknown error occurred while logging the action.",
          variant: "destructive",
        });
      } finally {
        setIsLoggingAction(false);
      }
    },
    [spaceId, logActionUseCase, toast, onActionLogged]
  );

  return { handleLogAction, isLoggingAction };
}
