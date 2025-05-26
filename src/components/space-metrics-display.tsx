
// src/components/space-metrics-display.tsx
"use client";

import { useState, useEffect } from 'react';
import { Clock, Zap, ListTodo, CheckSquare, AlertTriangle, CheckCircle2Icon, Sun } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface SpaceMetricsDisplayProps {
  totalActionPoints: number;
  pendingTodosCount: number;
  doneTodosCount: number;
  unresolvedProblemsCount: number;
  resolvedProblemsCount: number;
  totalClockedInMs: number;
  currentSessionMs: number | null;
  isCurrentlyClockedIn: boolean;
}

const formatDuration = (ms: number): string => {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

interface CompactMetricProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  className?: string;
  valueClassName?: string;
  subValue?: string | null; // For current session's total
}

function CompactMetric({ label, value, icon, className, valueClassName, subValue }: CompactMetricProps) {
  return (
    <div className={cn("flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted/70", className)}>
      <div className="flex-shrink-0 text-primary">{icon}</div>
      <div className="flex-grow">
        <p className="text-xs text-muted-foreground truncate" title={label}>{label}</p>
        <p className={cn("text-lg font-bold text-foreground", valueClassName)}>{value}</p>
        {subValue && <p className="text-xs text-muted-foreground/80">{subValue}</p>}
      </div>
    </div>
  );
}

export function SpaceMetricsDisplay({
  totalActionPoints,
  pendingTodosCount,
  doneTodosCount,
  unresolvedProblemsCount,
  resolvedProblemsCount,
  totalClockedInMs,
  currentSessionMs,
  isCurrentlyClockedIn,
}: SpaceMetricsDisplayProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3 mb-4">
      <CompactMetric
        label="Current Time"
        value={format(currentTime, 'HH:mm:ss')}
        icon={<Sun className="h-5 w-5 text-yellow-600" />}
      />
      <CompactMetric
        label={isCurrentlyClockedIn ? "Current Session" : "Total Clocked Time"}
        value={formatDuration(isCurrentlyClockedIn && currentSessionMs !== null ? currentSessionMs : totalClockedInMs)}
        icon={<Clock className={cn("h-5 w-5", isCurrentlyClockedIn ? 'text-green-500 animate-pulse' : 'text-primary')} />}
        subValue={isCurrentlyClockedIn && totalClockedInMs > 0 ? `(Total: ${formatDuration(totalClockedInMs)})` : null}
      />
      <CompactMetric
        label="Action Points"
        value={totalActionPoints.toLocaleString()}
        icon={<Zap className="h-5 w-5 text-accent" />}
      />
      <CompactMetric
        label="Pending To-Dos"
        value={pendingTodosCount.toLocaleString()}
        icon={<ListTodo className="h-5 w-5 text-orange-500" />}
      />
      <CompactMetric
        label="Done To-Dos"
        value={doneTodosCount.toLocaleString()}
        icon={<CheckSquare className="h-5 w-5 text-green-600" />}
      />
      <CompactMetric
        label="Open Problems"
        value={unresolvedProblemsCount.toLocaleString()}
        icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
      />
       <CompactMetric
        label="Resolved Problems"
        value={resolvedProblemsCount.toLocaleString()}
        icon={<CheckCircle2Icon className="h-5 w-5 text-blue-500" />}
      />
    </div>
  );
}
