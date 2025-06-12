
// src/components/dialogs/barcode-display-dialog.tsx
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';

// Attempt to import the UMD bundle and access its exports
// @ts-ignore because TypeScript might not know the shape of the UMD module well
import * as ZXing from '@zxing/library/umd/library.js';

import { Alert, AlertDescription } from '@/components/ui/alert';

interface BarcodeDisplayDialogProps {
  isOpen: boolean;
  onClose: () => void;
  barcodeValue: string | null;
  barcodeType?: string;
  title?: string;
}

function renderBitMatrixToCanvas(
  matrix: any, // Assuming BitMatrix type might be tricky from UMD
  canvas: HTMLCanvasElement,
  moduleSize: number = 2,
  quietZone: number = 10
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const inputWidth = matrix.getWidth();
  const inputHeight = matrix.getHeight();
  
  const outputWidth = inputWidth * moduleSize + 2 * quietZone;
  const outputHeight = inputHeight * moduleSize + 2 * quietZone;

  canvas.width = outputWidth;
  canvas.height = outputHeight;

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
  barcodeType = 'code128',
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

          if (!ZXing || !ZXing.Code128Writer || !ZXing.BarcodeFormat) {
            throw new Error("ZXing library components (Code128Writer, BarcodeFormat) not loaded correctly from UMD bundle.");
          }
          
          let zxingBarcodeFormatValue;
          switch (barcodeType.toUpperCase()) {
            case 'CODE_128':
              zxingBarcodeFormatValue = ZXing.BarcodeFormat.CODE_128;
              break;
            // Add other cases like QR_CODE, EAN_13 etc. if needed
            // e.g. case 'QR_CODE': zxingBarcodeFormatValue = ZXing.BarcodeFormat.QR_CODE; break;
            default:
              console.warn(`Unsupported barcode type: ${barcodeType}, defaulting to CODE_128.`);
              zxingBarcodeFormatValue = ZXing.BarcodeFormat.CODE_128;
          }

          let writer;
          if (zxingBarcodeFormatValue === ZXing.BarcodeFormat.CODE_128) {
            writer = new ZXing.Code128Writer();
          } else {
            // Fallback or error for unsupported types by this simplified setup
            // For now, assuming only Code128 is primary via this writer.
            // Could extend to use new ZXing.MultiFormatWriter() if that's exposed and works.
            throw new Error(`Barcode writer for type ID ${zxingBarcodeFormatValue} (${barcodeType}) is not implemented with this UMD import strategy.`);
          }
          
          const matrix = writer.encode(barcodeValue, zxingBarcodeFormatValue, 0, 0); 
          
          const desiredCanvasHeight = 120; 
          const bitMatrixHeight = matrix.getHeight() > 0 ? matrix.getHeight() : 1; 
          const moduleSize = Math.max(1, Math.floor(desiredCanvasHeight / bitMatrixHeight));

          renderBitMatrixToCanvas(matrix, canvasElement, moduleSize);
          setBarcodeDataUrl(canvasElement.toDataURL('image/png'));

        } catch (error: any) {
          console.error('Barcode generation error:', error);
          setGenerationError(error.message || 'Failed to generate barcode using UMD module.');
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

