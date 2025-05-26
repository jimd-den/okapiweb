// src/hooks/use-dialog-state.ts
"use client";

import { useState, useCallback } from 'react';

interface UseDialogStateReturn {
  isOpen: boolean;
  openDialog: () => void;
  closeDialog: () => void;
  toggleDialog: () => void;
}

export function useDialogState(initialOpen: boolean = false): UseDialogStateReturn {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const openDialog = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleDialog = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return { isOpen, openDialog, closeDialog, toggleDialog };
}
