
// src/app/loading.tsx
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-4 p-8 rounded-lg bg-card shadow-2xl animate-in zoom-in-90 duration-300">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="text-xl font-medium text-foreground">Loading Page...</p>
      </div>
    </div>
  );
}
