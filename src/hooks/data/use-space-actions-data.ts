
// src/hooks/data/use-space-actions-data.ts
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ActionDefinition } from '@/domain/entities';
import { GetActionDefinitionsBySpaceUseCase, CreateActionDefinitionUseCase, UpdateActionDefinitionUseCase, DeleteActionDefinitionUseCase } from '@/application/use-cases';
import type { 
  IActionDefinitionRepository, 
  IActionLogRepository,
  IDataEntryLogRepository 
} from '@/application/ports/repositories'; 

interface UseSpaceActionsDataProps {
  spaceId: string;
  actionDefinitionRepository: IActionDefinitionRepository;
  actionLogRepository: IActionLogRepository; 
  dataEntryLogRepository: IDataEntryLogRepository; 
}

export interface UseSpaceActionsDataReturn {
  actionDefinitions: ActionDefinition[];
  isLoadingActionDefinitions: boolean;
  errorLoadingActionDefinitions: string | null;
  refreshActionDefinitions: () => Promise<void>;
  createActionDefinitionUseCase: CreateActionDefinitionUseCase;
  updateActionDefinitionUseCase: UpdateActionDefinitionUseCase;
  deleteActionDefinitionUseCase: DeleteActionDefinitionUseCase;
  addActionDefinitionInState: (newDefinition: ActionDefinition) => void;
  updateActionDefinitionInState: (updatedDefinition: ActionDefinition) => void;
  removeActionDefinitionFromState: (definitionId: string) => void;
}

export function useSpaceActionsData({
  spaceId,
  actionDefinitionRepository,
  actionLogRepository,
  dataEntryLogRepository,
}: UseSpaceActionsDataProps): UseSpaceActionsDataReturn {
  const [actionDefinitions, setActionDefinitions] = useState<ActionDefinition[]>([]);
  const [isLoadingActionDefinitions, setIsLoadingActionDefinitions] = useState<boolean>(true);
  const [errorLoadingActionDefinitions, setErrorLoadingActionDefinitions] = useState<string | null>(null);

  const getActionDefinitionsBySpaceUseCase = useMemo(() => new GetActionDefinitionsBySpaceUseCase(actionDefinitionRepository), [actionDefinitionRepository]);
  const createActionDefinitionUseCase = useMemo(() => new CreateActionDefinitionUseCase(actionDefinitionRepository), [actionDefinitionRepository]);
  const updateActionDefinitionUseCase = useMemo(() => new UpdateActionDefinitionUseCase(actionDefinitionRepository), [actionDefinitionRepository]);
  const deleteActionDefinitionUseCase = useMemo(() => new DeleteActionDefinitionUseCase(actionDefinitionRepository, actionLogRepository, dataEntryLogRepository), [actionDefinitionRepository, actionLogRepository, dataEntryLogRepository]);

  const fetchActionDefinitions = useCallback(async () => {
    if (!spaceId) {
      setErrorLoadingActionDefinitions("Space ID not provided for fetching action definitions.");
      setIsLoadingActionDefinitions(false);
      return;
    }
    setIsLoadingActionDefinitions(true);
    setErrorLoadingActionDefinitions(null);
    try {
      const data = await getActionDefinitionsBySpaceUseCase.execute(spaceId);
      setActionDefinitions(data.sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name)));
    } catch (err: any) {
      console.error("Failed to fetch action definitions:", err);
      setErrorLoadingActionDefinitions(err.message || "Could not load action definitions.");
    } finally {
      setIsLoadingActionDefinitions(false);
    }
  }, [spaceId, getActionDefinitionsBySpaceUseCase]);

  useEffect(() => {
    if (spaceId && actionDefinitionRepository) {
      fetchActionDefinitions();
    }
  }, [spaceId, actionDefinitionRepository, fetchActionDefinitions]);

  const addActionDefinitionInState = useCallback((newDefinition: ActionDefinition) => {
    setActionDefinitions(prev => {
      const updatedList = [...prev, newDefinition];
      return updatedList.sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));
    });
  }, []);

  const updateActionDefinitionInStateCallback = useCallback((updatedDefinition: ActionDefinition) => {
    setActionDefinitions(prev => {
      const updatedList = prev.map(def => def.id === updatedDefinition.id ? updatedDefinition : def);
      return updatedList.sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));
    });
  }, []);

  const removeActionDefinitionFromStateCallback = useCallback((definitionId: string) => {
    setActionDefinitions(prev => prev.filter(def => def.id !== definitionId));
  }, []);

  return {
    actionDefinitions,
    isLoadingActionDefinitions,
    errorLoadingActionDefinitions,
    refreshActionDefinitions: fetchActionDefinitions,
    createActionDefinitionUseCase,
    updateActionDefinitionUseCase,
    deleteActionDefinitionUseCase,
    addActionDefinitionInState,
    updateActionDefinitionInState: updateActionDefinitionInStateCallback,
    removeActionDefinitionFromState: removeActionDefinitionFromStateCallback,
  };
}
