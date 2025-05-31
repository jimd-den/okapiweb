
// src/hooks/use-space-dialogs.ts
"use client";

import { useState, useCallback } from 'react';
import type { ActionDefinition } from '@/domain/entities/action-definition.entity';
import type { TodoStatus } from '@/domain/entities/todo.entity';


export interface UseSpaceDialogsReturn {
  // Settings Dialog
  isSettingsDialogOpen: boolean;
  openSettingsDialog: () => void;
  closeSettingsDialog: () => void;

  // Advanced Actions Dialog
  isAdvancedActionsDialogOpen: boolean;
  openAdvancedActionsDialog: () => void;
  closeAdvancedActionsDialog: () => void;

  // To-Do List Dialog
  isTodoListDialogOpen: boolean;
  currentOpenTodoListStatus: TodoStatus | null;
  openTodoListDialog: (status: TodoStatus) => void;
  closeTodoListDialog: () => void;

  // Problem Tracker Dialog
  isProblemTrackerDialogOpen: boolean;
  openProblemTrackerDialog: () => void;
  closeProblemTrackerDialog: () => void;

  // Data Viewer Dialog
  isDataViewerDialogOpen: boolean;
  openDataViewerDialog: () => void;
  closeDataViewerDialog: () => void;

  // Timeline Dialog
  isTimelineDialogOpen: boolean;
  openTimelineDialog: () => void;
  closeTimelineDialog: () => void;
  
  // Create To-Do Dialog
  isCreateTodoDialogOpen: boolean;
  openCreateTodoDialog: () => void;
  closeCreateTodoDialog: () => void;

  // Multi-Step Action Dialog
  isMultiStepDialogOpen: boolean;
  currentMultiStepAction: ActionDefinition | null;
  openMultiStepActionDialog: (action: ActionDefinition) => void;
  closeMultiStepDialog: () => void;

  // Data Entry Form Dialog
  isDataEntryDialogOpen: boolean;
  currentDataEntryAction: ActionDefinition | null;
  openDataEntryFormDialog: (action: ActionDefinition) => void;
  closeDataEntryDialog: () => void;

  // Timer Action Dialog
  isTimerActionDialogOpen: boolean;
  currentTimerAction: ActionDefinition | null;
  openTimerActionDialog: (action: ActionDefinition) => void;
  closeTimerActionDialog: () => void;
}

export function useSpaceDialogs(): UseSpaceDialogsReturn {
  // Settings
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const openSettingsDialog = useCallback(() => setIsSettingsDialogOpen(true), []);
  const closeSettingsDialog = useCallback(() => setIsSettingsDialogOpen(false), []);

  // Advanced Actions
  const [isAdvancedActionsDialogOpen, setIsAdvancedActionsDialogOpen] = useState(false);
  const openAdvancedActionsDialog = useCallback(() => setIsAdvancedActionsDialogOpen(true), []);
  const closeAdvancedActionsDialog = useCallback(() => setIsAdvancedActionsDialogOpen(false), []);
  
  // Create To-Do
  const [isCreateTodoDialogOpen, setIsCreateTodoDialogOpen] = useState(false);
  const openCreateTodoDialog = useCallback(() => setIsCreateTodoDialogOpen(true), []);
  const closeCreateTodoDialog = useCallback(() => setIsCreateTodoDialogOpen(false), []);

  // To-Do List
  const [isTodoListDialogOpen, setIsTodoListDialogOpen] = useState(false);
  const [currentOpenTodoListStatus, setCurrentOpenTodoListStatus] = useState<TodoStatus | null>(null);
  const openTodoListDialog = useCallback((status: TodoStatus) => {
    setCurrentOpenTodoListStatus(status);
    setIsTodoListDialogOpen(true);
  }, []);
  const closeTodoListDialog = useCallback(() => {
    setIsTodoListDialogOpen(false);
    // setTimeout(() => setCurrentOpenTodoListStatus(null), 300); // Delay reset for animation
  }, []);


  // Problem Tracker
  const [isProblemTrackerDialogOpen, setIsProblemTrackerDialogOpen] = useState(false);
  const openProblemTrackerDialog = useCallback(() => setIsProblemTrackerDialogOpen(true), []);
  const closeProblemTrackerDialog = useCallback(() => setIsProblemTrackerDialogOpen(false), []);

  // Data Viewer
  const [isDataViewerDialogOpen, setIsDataViewerDialogOpen] = useState(false);
  const openDataViewerDialog = useCallback(() => setIsDataViewerDialogOpen(true), []);
  const closeDataViewerDialog = useCallback(() => setIsDataViewerDialogOpen(false), []);
  
  // Timeline Dialog
  const [isTimelineDialogOpen, setIsTimelineDialogOpen] = useState(false);
  const openTimelineDialog = useCallback(() => setIsTimelineDialogOpen(true), []);
  const closeTimelineDialog = useCallback(() => setIsTimelineDialogOpen(false), []);

  // Multi-Step Action
  const [isMultiStepDialogOpen, setIsMultiStepDialogOpen] = useState(false);
  const [currentMultiStepAction, setCurrentMultiStepAction] = useState<ActionDefinition | null>(null);
  const openMultiStepActionDialog = useCallback((action: ActionDefinition) => {
    setCurrentMultiStepAction(action);
    setIsMultiStepDialogOpen(true);
  }, []);
  const closeMultiStepDialog = useCallback(() => {
    setIsMultiStepDialogOpen(false);
    // setTimeout(() => setCurrentMultiStepAction(null), 300);
  }, []);

  // Data Entry Form
  const [isDataEntryDialogOpen, setIsDataEntryDialogOpen] = useState(false);
  const [currentDataEntryAction, setCurrentDataEntryAction] = useState<ActionDefinition | null>(null);
  const openDataEntryFormDialog = useCallback((action: ActionDefinition) => {
    setCurrentDataEntryAction(action);
    setIsDataEntryDialogOpen(true);
  }, []);
  const closeDataEntryDialog = useCallback(() => {
    setIsDataEntryDialogOpen(false);
    // setTimeout(() => setCurrentDataEntryAction(null), 300);
  }, []);

  // Timer Action Dialog
  const [isTimerActionDialogOpen, setIsTimerActionDialogOpen] = useState(false);
  const [currentTimerAction, setCurrentTimerAction] = useState<ActionDefinition | null>(null);
  const openTimerActionDialog = useCallback((action: ActionDefinition) => {
    setCurrentTimerAction(action);
    setIsTimerActionDialogOpen(true);
  }, []);
  const closeTimerActionDialog = useCallback(() => {
    setIsTimerActionDialogOpen(false);
    // setTimeout(() => setCurrentTimerAction(null), 300);
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
