// This file is no longer needed as toasts are being replaced with inline feedback.
// To complete removal, also delete src/hooks/use-toast.ts and remove <Toaster /> from layout.tsx.

// Keeping the file structure for now in case of future re-introduction or different notification system.
// For a clean removal, this file should be deleted.

import React from 'react';

export function Toaster() {
  return null; // Effectively removes the toaster from rendering
}
