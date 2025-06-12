
// src/components/dialogs/barcode-display-dialog.tsx
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';

// Updated imports to use specific esm5 paths
import { Code128Writer } from '@zxing/library/esm5/core/oned/Code128Writer';
import { BarcodeFormat } from '@zxing/library/esm5/core/BarcodeFormat';
import type { WriterException } from '@zxing/library/esm5/core/WriterException';
import type { BitMatrix } from '@zxing/library/esm5/core/common/BitMatrix';

import { Alert, AlertDescription } from '@/components/ui/alert';

interface BarcodeDisplayDialogProps {
  isOpen: boolean;
  onClose: () => void;
  barcodeValue: string | null;
  barcodeType?: string; // e.g., 'code128', 'qrcode' - currently only 'code128' is implemented
  title?: string;
}

// Helper function to render BitMatrix to Canvas
function renderBitMatrixToCanvas(
  matrix: BitMatrix,
  canvas: HTMLCanvasElement,
  moduleSize: number = 2, // Size of each barcode module/bar in pixels
  quietZone: number = 10 // Pixels of white space around the barcode
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const inputWidth = matrix.getWidth();
  const inputHeight = matrix.getHeight();
  
  // Calculate canvas dimensions including quiet zone
  const outputWidth = inputWidth * moduleSize + 2 * quietZone;
  const outputHeight = inputHeight * moduleSize + 2 * quietZone;

  canvas.width = outputWidth;
  canvas.height = outputHeight;

  // Fill background with white (for the quiet zone)
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, outputWidth, outputHeight);
  
  ctx.fillStyle = 'black';

  for (let inputY = 0; inputY < inputHeight; inputY++) {
    for (let inputX = 0; inputX < inputWidth; inputX++) {
      if (matrix.get(inputX, inputY)) {
        ctx.fillRect(
          quietZone + inputX * moduleSize,
          quietZone + inputY * moduleSize,
          moduleSize,
          moduleSize
        );
      }
    }
  }
}


export function BarcodeDisplayDialog({
  isOpen,
  onClose,
  barcodeValue,
  barcodeType = 'code128', // Defaulting, but currently only Code128 is hardcoded
  title = 'Generated Barcode',
}: BarcodeDisplayDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [barcodeDataUrl, setBarcodeDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && barcodeValue && canvasRef.current) {
      setIsGenerating(true);
      setGenerationError(null);
      setBarcodeDataUrl(null);

      const timerId = setTimeout(() => {
        try {
          const canvasElement = canvasRef.current;
          if (!canvasElement) {
            throw new Error("Canvas element not found.");
          }
          
          let matrix: BitMatrix;
          if (barcodeType.toLowerCase() === 'code128') {
            const writer = new Code128Writer();
            // Code128Writer's encode method does not take width/height hints
            // It expects data, format, width (ignored), height (ignored), hints (optional)
            matrix = writer.encode(barcodeValue, BarcodeFormat.CODE_128, 0, 0); 
          } else {
            throw new Error(`Barcode type "${barcodeType}" is not currently supported for generation.`);
          }
          
          const desiredCanvasHeight = 120; 
          const bitMatrixHeight = matrix.getHeight() > 0 ? matrix.getHeight() : 1; 
          const moduleSize = Math.max(1, Math.floor(desiredCanvasHeight / bitMatrixHeight));

          renderBitMatrixToCanvas(matrix, canvasElement, moduleSize);
          setBarcodeDataUrl(canvasElement.toDataURL('image/png'));

        } catch (error) {
          console.error('Barcode generation error:', error);
          let message = 'Failed to generate barcode.';
          if (typeof error === 'object' && error !== null && 'message' in error) {
             const writerError = error as WriterException | Error;
             message = writerError.message || message;
          }
          setGenerationError(message);
        } finally {
          setIsGenerating(false);
        }
      }, 0); 

      return () => clearTimeout(timerId);
    } else if (!isOpen) {
      setBarcodeDataUrl(null);
      setGenerationError(null);
      setIsGenerating(false);
    }
  }, [isOpen, barcodeValue, barcodeType]);

  if (!isOpen || !barcodeValue) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-0">
        <DialogHeader className="p-5 sm:p-6 pb-3 border-b">
          <DialogTitle className="text-xl sm:text-2xl">{title}</DialogTitle>
        </DialogHeader>
        <div className="p-5 sm:p-6 flex justify-center items-center min-h-[180px] bg-muted/10">
          {isGenerating && (
            <div className="flex flex-col items-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p>Generating Barcode...</p>
            </div>
          )}
          {generationError && !isGenerating && (
            <Alert variant="destructive" className="w-full">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription>{generationError}</AlertDescription>
            </Alert>
          )}
          {!isGenerating && barcodeDataUrl && (
            <img
              src={barcodeDataUrl}
              alt={`Barcode for ${barcodeValue}`}
              className="max-w-full h-auto border rounded-md shadow-md bg-white"
              data-ai-hint="barcode image"
              style={{ imageRendering: 'pixelated' }} 
            />
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
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

