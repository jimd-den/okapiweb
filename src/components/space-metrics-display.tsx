// src/components/space-metrics-display.tsx
"use client";

import { useState, useEffect } from 'react';
import { Clock, Zap, Sun } from 'lucide-react'; // Removed AlertTriangle, CheckCircle2Icon
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { SpaceMetrics } from '@/hooks/data/use-space-metrics';

interface SpaceMetricsDisplayProps extends Omit<SpaceMetrics, 'unresolvedProblemsCount' | 'resolvedProblemsCount' | 'todoStatusItems' | 'doingStatusItems' | 'doneStatusItems'> {
  currentSessionDisplayMs: number;
}

const formatDuration = (ms: number): string => {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

interface UltraCompactMetricProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  className?: string;
  valueClassName?: string;
  subValue?: string | null;
}

function UltraCompactMetric({ label, value, icon, className, valueClassName, subValue }: UltraCompactMetricProps) {
  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <div className="flex-shrink-0 text-primary mb-0.5">{icon}</div>
      <p className={cn("text-sm font-semibold text-foreground leading-tight", valueClassName)}>{value}</p>
      <p className="text-[0.65rem] text-muted-foreground leading-tight truncate" title={label}>{label}</p>
      {subValue && <p className="text-[0.6rem] text-muted-foreground/80 leading-tight">{subValue}</p>}
    </div>
  );
}

export function SpaceMetricsDisplay({
  totalActionPoints,
  totalClockedInMs,
  currentSessionDisplayMs,
  isCurrentlyClockedIn,
  currentSessionStart, // Keep for subValue logic
}: SpaceMetricsDisplayProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  return (
    <div className="grid grid-cols-3 gap-1 mb-3 items-start">
      <UltraCompactMetric
        label="Current Time"
        value={format(currentTime, 'HH:mm:ss')}
        icon={<Sun className="h-4 w-4 text-yellow-500" />}
      />
      <UltraCompactMetric
        label={isCurrentlyClockedIn ? "Session" : "Total Time"}
        value={formatDuration(isCurrentlyClockedIn ? currentSessionDisplayMs : totalClockedInMs)}
        icon={<Clock className={cn("h-4 w-4", isCurrentlyClockedIn ? 'text-green-500 animate-pulse' : 'text-primary')} />}
        subValue={isCurrentlyClockedIn && totalClockedInMs > 0 && currentSessionDisplayMs !== totalClockedInMs ? `(Total: ${formatDuration(totalClockedInMs)})` : null}
      />
      <UltraCompactMetric
        label="Action Pts"
        value={totalActionPoints.toLocaleString()}
        icon={<Zap className="h-4 w-4 text-accent" />}
      />
    </div>
  );
}
