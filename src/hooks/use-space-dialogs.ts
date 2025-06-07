
// src/hooks/use-space-dialogs.ts
"use client";

import { useState, useCallback } from 'react';
import type { ActionDefinition, TodoStatus } from '@/domain/entities';


export interface UseSpaceDialogsReturn {
  isSettingsDialogOpen: boolean;
  openSettingsDialog: () => void;
  closeSettingsDialog: () => void;

  isAdvancedActionsDialogOpen: boolean;
  openAdvancedActionsDialog: () => void;
  closeAdvancedActionsDialog: () => void;

  isTodoListDialogOpen: boolean;
  currentOpenTodoListStatus: TodoStatus | null;
  openTodoListDialog: (status: TodoStatus) => void;
  closeTodoListDialog: () => void;

  isProblemTrackerDialogOpen: boolean;
  openProblemTrackerDialog: () => void;
  closeProblemTrackerDialog: () => void;

  isDataViewerDialogOpen: boolean;
  openDataViewerDialog: () => void;
  closeDataViewerDialog: () => void;

  isTimelineDialogOpen: boolean;
  openTimelineDialog: () => void;
  closeTimelineDialog: () => void;
  
  isCreateTodoDialogOpen: boolean;
  openCreateTodoDialog: () => void;
  closeCreateTodoDialog: () => void;

  isMultiStepDialogOpen: boolean;
  currentMultiStepAction: ActionDefinition | null;
  openMultiStepActionDialog: (action: ActionDefinition) => void;
  closeMultiStepDialog: () => void;

  isDataEntryDialogOpen: boolean;
  currentDataEntryAction: ActionDefinition | null;
  openDataEntryFormDialog: (action: ActionDefinition) => void;
  closeDataEntryDialog: () => void;

  isTimerActionDialogOpen: boolean;
  currentTimerAction: ActionDefinition | null;
  openTimerActionDialog: (action: ActionDefinition) => void;
  closeTimerActionDialog: () => void;
}

export function useSpaceDialogs(): UseSpaceDialogsReturn {
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const openSettingsDialog = useCallback(() => setIsSettingsDialogOpen(true), []);
  const closeSettingsDialog = useCallback(() => setIsSettingsDialogOpen(false), []);

  const [isAdvancedActionsDialogOpen, setIsAdvancedActionsDialogOpen] = useState(false);
  const openAdvancedActionsDialog = useCallback(() => setIsAdvancedActionsDialogOpen(true), []);
  const closeAdvancedActionsDialog = useCallback(() => setIsAdvancedActionsDialogOpen(false), []);
  
  const [isCreateTodoDialogOpen, setIsCreateTodoDialogOpen] = useState(false);
  const openCreateTodoDialog = useCallback(() => setIsCreateTodoDialogOpen(true), []);
  const closeCreateTodoDialog = useCallback(() => setIsCreateTodoDialogOpen(false), []);

  const [isTodoListDialogOpen, setIsTodoListDialogOpen] = useState(false);
  const [currentOpenTodoListStatus, setCurrentOpenTodoListStatus] = useState<TodoStatus | null>(null);
  const openTodoListDialog = useCallback((status: TodoStatus) => {
    setCurrentOpenTodoListStatus(status);
    setIsTodoListDialogOpen(true);
  }, []);
  const closeTodoListDialog = useCallback(() => {
    setIsTodoListDialogOpen(false);
  }, []);


  const [isProblemTrackerDialogOpen, setIsProblemTrackerDialogOpen] = useState(false);
  const openProblemTrackerDialog = useCallback(() => setIsProblemTrackerDialogOpen(true), []);
  const closeProblemTrackerDialog = useCallback(() => setIsProblemTrackerDialogOpen(false), []);

  const [isDataViewerDialogOpen, setIsDataViewerDialogOpen] = useState(false);
  const openDataViewerDialog = useCallback(() => setIsDataViewerDialogOpen(true), []);
  const closeDataViewerDialog = useCallback(() => setIsDataViewerDialogOpen(false), []);
  
  const [isTimelineDialogOpen, setIsTimelineDialogOpen] = useState(false);
  const openTimelineDialog = useCallback(() => setIsTimelineDialogOpen(true), []);
  const closeTimelineDialog = useCallback(() => setIsTimelineDialogOpen(false), []);

  const [isMultiStepDialogOpen, setIsMultiStepDialogOpen] = useState(false);
  const [currentMultiStepAction, setCurrentMultiStepAction] = useState<ActionDefinition | null>(null);
  const openMultiStepActionDialog = useCallback((action: ActionDefinition) => {
    setCurrentMultiStepAction(action);
    setIsMultiStepDialogOpen(true);
  }, []);
  const closeMultiStepDialog = useCallback(() => {
    setIsMultiStepDialogOpen(false);
  }, []);

  const [isDataEntryDialogOpen, setIsDataEntryDialogOpen] = useState(false);
  const [currentDataEntryAction, setCurrentDataEntryAction] = useState<ActionDefinition | null>(null);
  const openDataEntryFormDialog = useCallback((action: ActionDefinition) => {
    setCurrentDataEntryAction(action);
    setIsDataEntryDialogOpen(true);
  }, []);
  const closeDataEntryDialog = useCallback(() => {
    setIsDataEntryDialogOpen(false);
  }, []);

  const [isTimerActionDialogOpen, setIsTimerActionDialogOpen] = useState(false);
  const [currentTimerAction, setCurrentTimerAction] = useState<ActionDefinition | null>(null);
  const openTimerActionDialog = useCallback((action: ActionDefinition) => {
    setCurrentTimerAction(action);
    setIsTimerActionDialogOpen(true);
  }, []);
  const closeTimerActionDialog = useCallback(() => {
    setIsTimerActionDialogOpen(false);
  }, []);


  return {
    isSettingsDialogOpen, openSettingsDialog, closeSettingsDialog,
    isAdvancedActionsDialogOpen, openAdvancedActionsDialog, closeAdvancedActionsDialog,
    isTodoListDialogOpen, currentOpenTodoListStatus, openTodoListDialog, closeTodoListDialog,
    isProblemTrackerDialogOpen, openProblemTrackerDialog, closeProblemTrackerDialog,
    isDataViewerDialogOpen, openDataViewerDialog, closeDataViewerDialog,
    isTimelineDialogOpen, openTimelineDialog, closeTimelineDialog,
    isCreateTodoDialogOpen, openCreateTodoDialog, closeCreateTodoDialog,
    isMultiStepDialogOpen, currentMultiStepAction, openMultiStepActionDialog, closeMultiStepDialog,
    isDataEntryDialogOpen, currentDataEntryAction, openDataEntryFormDialog, closeDataEntryDialog,
    isTimerActionDialogOpen, currentTimerAction, openTimerActionDialog, closeTimerActionDialog,
  };
}
