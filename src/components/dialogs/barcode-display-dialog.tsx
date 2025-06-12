// src/components/dialogs/barcode-display-dialog.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface BarcodeDisplayDialogProps {
  isOpen: boolean;
  onClose: () => void;
  barcodeValue: string | null;
  barcodeType?: string; // e.g., 'code128', 'qrcode'
  title?: string;
}

export function BarcodeDisplayDialog({
  isOpen,
  onClose,
  barcodeValue,
  barcodeType = 'code128', // Default to code128
  title = 'Generated Barcode',
}: BarcodeDisplayDialogProps) {
  if (!isOpen || !barcodeValue) {
    return null;
  }

  // Construct the bwipjs URL for embedding
  // Example: https://bwipjs.com/demo/api?bcid=code128&text=1234567890&scale=3&rotate=N&includetext
  const barcodeImageUrl = `https://bwipjs.com/demo/api?bcid=${barcodeType}&text=${encodeURIComponent(
    barcodeValue
  )}&scale=3&rotate=N&includetext&guardwhitespace`; // Added guardwhitespace for better readability

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-0">
        <DialogHeader className="p-5 sm:p-6 pb-3 border-b">
          <DialogTitle className="text-xl sm:text-2xl">{title}</DialogTitle>
        </DialogHeader>
        <div className="p-5 sm:p-6 flex justify-center items-center min-h-[150px] bg-muted/10">
          {/* Using a regular img tag for external URL, next/image needs config for external domains */}
          <img
            src={barcodeImageUrl}
            alt={`Barcode for ${barcodeValue}`}
            className="max-w-full h-auto border rounded-md shadow-md bg-white" // Added bg-white for barcode readability
            data-ai-hint="barcode image"
            style={{ imageRendering: 'pixelated' }} // Ensures crisp barcodes
          />
        </div>
        <DialogFooter className="p-5 sm:p-6 pt-3 border-t">
          <Button type="button" variant="outline" size="lg" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
