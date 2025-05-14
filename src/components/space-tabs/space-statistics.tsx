// src/components/space-tabs/space-statistics.tsx
"use client";

import { useEffect, useState } from 'react';
import type { SpaceStatsDTO } from '@/application/use-cases/stats/get-space-stats.usecase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Award, ListChecks, Clock, BarChartHorizontalBig, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface SpaceStatisticsProps {
  spaceId: string;
  fetchStats: () => Promise<SpaceStatsDTO>; // Function to fetch stats
  isLoading: boolean; // Prop to indicate if parent is loading overall space data
}

export function SpaceStatistics({ spaceId, fetchStats, isLoading: isLoadingParent }: SpaceStatisticsProps) {
  const [stats, setStats] = useState<SpaceStatsDTO | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    if (!isLoadingParent) { // Only fetch if parent is done loading initial space details
        setIsLoadingStats(true);
        fetchStats()
        .then(setStats)
        .catch(err => {
            console.error("Failed to fetch space statistics:", err);
            setStats(null); 
        })
        .finally(() => setIsLoadingStats(false));
    }
  }, [spaceId, fetchStats, isLoadingParent]);

  if (isLoadingParent || isLoadingStats) {
    return (
      <Card className="mt-4 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center"><BarChartHorizontalBig className="mr-2 h-6 w-6 text-primary" /> Space Statistics</CardTitle>
           <CardDescription>Key metrics for this workflow space.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCardSkeleton/>
            <StatCardSkeleton/>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="mt-4 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center"><BarChartHorizontalBig className="mr-2 h-6 w-6 text-primary" /> Space Statistics</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-10">
          <p className="text-muted-foreground">Could not load statistics for this space.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center"><BarChartHorizontalBig className="mr-2 h-6 w-6 text-primary" />Space Statistics</CardTitle>
        <CardDescription>Key metrics for this workflow space.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard
            title="Total Points Earned"
            value={stats.totalPointsEarned.toLocaleString()}
            icon={<Award className="h-8 w-8 text-accent" />}
            description="Points gained from logged actions."
          />
          <StatCard
            title="Actions Logged"
            value={stats.actionsLoggedCount.toLocaleString()}
            icon={<ListChecks className="h-8 w-8 text-primary" />}
            description="Total number of actions recorded."
          />
          {/* 
          // Uncomment if/when time tracking is space-specific and implemented
          stats.totalTimeClockedInMs !== undefined && (
            <StatCard
              title="Total Time Clocked In"
              value={formatDuration(stats.totalTimeClockedInMs)} // ensure formatDuration is defined
              icon={<Clock className="h-8 w-8 text-secondary" />}
              description="Cumulative time spent working in this space."
            />
          )
          */}
        </div>
      </CardContent>
    </Card>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}

function StatCard({ title, value, icon, description }: StatCardProps) {
  return (
    <Card className="bg-card/50 p-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-3xl font-bold">{value}</div>
            {description && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
        </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
    return (
        <Card className="bg-card/50 p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-5 w-2/5" /> {/* Title skeleton */}
                <Skeleton className="h-8 w-8 rounded-full" /> {/* Icon skeleton */}
            </CardHeader>
            <CardContent>
                <Skeleton className="h-8 w-1/3 mb-1" /> {/* Value skeleton */}
                <Skeleton className="h-3 w-3/4" /> {/* Description skeleton */}
            </CardContent>
        </Card>
    )
}

// Helper to format duration if totalTimeClockedInMs is available
// const formatDuration = (ms: number) => {
//   const seconds = Math.floor((ms / 1000) % 60);
//   const minutes = Math.floor((ms / (1000 * 60)) % 60);
//   const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
//   return `${hours}h ${minutes}m ${seconds}s`;
// };
