
// src/hooks/data/use-action-definitions-data.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { ActionDefinition } from '@/domain/entities/action-definition.entity';
import type { GetActionDefinitionsBySpaceUseCase } from '@/application/use-cases/action-definition/get-action-definitions-by-space.usecase';
// Removed: import { useToast } from '@/hooks/use-toast';

interface UseActionDefinitionsDataReturn {
  actionDefinitions: ActionDefinition[];
  isLoadingActionDefinitions: boolean;
  errorLoadingActionDefinitions: string | null;
  refreshActionDefinitions: () => Promise<void>;
  addActionDefinition: (newDefinition: ActionDefinition) => void;
  updateActionDefinitionInState: (updatedDefinition: ActionDefinition) => void;
  removeActionDefinitionFromState: (definitionId: string) => void;
}

export function useActionDefinitionsData(
  spaceId: string,
  getActionDefinitionsBySpaceUseCase: GetActionDefinitionsBySpaceUseCase
): UseActionDefinitionsDataReturn {
  const [actionDefinitions, setActionDefinitions] = useState<ActionDefinition[]>([]);
  const [isLoadingActionDefinitions, setIsLoadingActionDefinitions] = useState<boolean>(true);
  const [errorLoadingActionDefinitions, setErrorLoadingActionDefinitions] = useState<string | null>(null);
  // Removed: const { toast } = useToast();

  const fetchActionDefinitions = useCallback(async () => {
    if (!spaceId || !getActionDefinitionsBySpaceUseCase) {
      setErrorLoadingActionDefinitions("Space ID or use case not provided.");
      setIsLoadingActionDefinitions(false);
      return;
    }
    setIsLoadingActionDefinitions(true);
    setErrorLoadingActionDefinitions(null);
    try {
      const data = await getActionDefinitionsBySpaceUseCase.execute(spaceId);
      setActionDefinitions(data);
    } catch (err: any) {
      console.error("Failed to fetch action definitions:", err);
      setErrorLoadingActionDefinitions(err.message || "Could not load action definitions.");
      // Removed toast call:
      // toast({
      //   title: "Error Loading Action Definitions",
      //   description: err.message || "An unexpected error occurred.",
      //   variant: "destructive",
      // });
    } finally {
      setIsLoadingActionDefinitions(false);
    }
  }, [spaceId, getActionDefinitionsBySpaceUseCase]);

  useEffect(() => {
    fetchActionDefinitions();
  }, [fetchActionDefinitions]);

  const addActionDefinition = useCallback((newDefinition: ActionDefinition) => {
    setActionDefinitions(prev => {
      const updatedList = [...prev, newDefinition];
      return updatedList.sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));
    });
  }, []);

  const updateActionDefinitionInState = useCallback((updatedDefinition: ActionDefinition) => {
    setActionDefinitions(prev => {
      const updatedList = prev.map(def => def.id === updatedDefinition.id ? updatedDefinition : def);
      return updatedList.sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));
    });
  }, []);

  const removeActionDefinitionFromState = useCallback((definitionId: string) => {
    setActionDefinitions(prev => prev.filter(def => def.id !== definitionId));
  }, []);

  return {
    actionDefinitions,
    isLoadingActionDefinitions,
    errorLoadingActionDefinitions,
    refreshActionDefinitions: fetchActionDefinitions,
    addActionDefinition,
    updateActionDefinitionInState,
    removeActionDefinitionFromState,
  };
}
