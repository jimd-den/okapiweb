
// src/components/ui/barcode-renderer-css.tsx
"use client";

import React from 'react';
import { cn } from '@/lib/utils';

export interface BarRenderData {
  isBar: boolean; // True for a bar, false for a space
  widthFactor: number; // Relative width unit (e.g., 1, 2, 3, 4 for Code128 modules)
}

interface BarcodeRendererCSSProps {
  data: BarRenderData[];
  height?: number; // Height of the barcode in pixels
  baseModuleWidth?: number; // Width of a single module/unit in pixels
  barColor?: string;
  spaceColor?: string; // Typically the background color, effectively
  className?: string;
}

export function BarcodeRendererCSS({
  data,
  height = 80,
  baseModuleWidth = 1.5, // Adjust for finer or coarser bars
  barColor = 'black',
  spaceColor = 'white', // This will be the background of the container
  className,
}: BarcodeRendererCSSProps) {
  if (!data || data.length === 0) {
    return <div className={cn("text-xs text-destructive", className)}>No barcode data to render.</div>;
  }

  return (
    <div
      className={cn("flex items-stretch", className)}
      style={{ height: `${height}px`, backgroundColor: spaceColor }}
      aria-label="CSS rendered barcode"
      role="img"
    >
      {data.map((segment, index) => (
        <div
          key={index}
          style={{
            width: `${segment.widthFactor * baseModuleWidth}px`,
            backgroundColor: segment.isBar ? barColor : 'transparent', // Use transparent for spaces
          }}
          title={segment.isBar ? `Bar (width factor ${segment.widthFactor})` : `Space (width factor ${segment.widthFactor})`}
        />
      ))}
    </div>
  );
}
