
// src/components/space-metrics-display.tsx
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Zap, ListTodo, CheckSquare, AlertTriangle, CheckCircle2Icon, Sun } from 'lucide-react';
import { format } from 'date-fns';

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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mb-4">
      <MetricCard 
        title="Current Time" 
        value={format(currentTime, 'HH:mm:ss')} 
        icon={<Sun className="h-6 w-6 text-yellow-500" />} 
      />
      <MetricCard 
        title={isCurrentlyClockedIn ? "Current Session" : "Total Clocked Time"} 
        value={formatDuration(isCurrentlyClockedIn && currentSessionMs !== null ? currentSessionMs : totalClockedInMs)} 
        icon={<Clock className={`h-6 w-6 ${isCurrentlyClockedIn ? 'text-green-500 animate-pulse' : 'text-primary'}`} />} 
        description={isCurrentlyClockedIn ? `Total: ${formatDuration(totalClockedInMs)}` : undefined}
      />
      <MetricCard 
        title="Action Points" 
        value={totalActionPoints.toLocaleString()} 
        icon={<Zap className="h-6 w-6 text-accent" />} 
      />
      <MetricCard 
        title="Pending To-Dos" 
        value={pendingTodosCount.toLocaleString()} 
        icon={<ListTodo className="h-6 w-6 text-orange-500" />} 
      />
      <MetricCard 
        title="Done To-Dos" 
        value={doneTodosCount.toLocaleString()} 
        icon={<CheckSquare className="h-6 w-6 text-green-500" />} 
      />
      <MetricCard 
        title="Open Problems" 
        value={unresolvedProblemsCount.toLocaleString()} 
        icon={<AlertTriangle className="h-6 w-6 text-destructive" />} 
      />
       <MetricCard 
        title="Resolved Problems" 
        value={resolvedProblemsCount.toLocaleString()} 
        icon={<CheckCircle2Icon className="h-6 w-6 text-blue-500" />} 
      />
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}

function MetricCard({ title, value, icon, description }: MetricCardProps) {
  return (
    <Card className="shadow-md bg-card/80">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="pb-3 px-4">
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}
