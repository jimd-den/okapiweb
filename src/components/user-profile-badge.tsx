"use client";

import { Award, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import type { UserProgress } from '@/lib/types';
import { DEFAULT_USER_ID } from '@/lib/constants';

// Mock function, replace with actual data fetching from IndexedDB
async function fetchUserProgress(userId: string): Promise<UserProgress> {
  // In a real app, this would interact with src/lib/db.ts
  console.log(`Fetching progress for ${userId}`); // Simulating DB call
  return {
    userId,
    points: 1250, // Sample data
    level: 5,     // Sample data
    unlockedCustomizations: ['colorScheme_ocean'],
  };
}


export function UserProfileBadge() {
  const [progress, setProgress] = useState<UserProgress | null>(null);

  useEffect(() => {
    fetchUserProgress(DEFAULT_USER_ID).then(setProgress);
  }, []);

  if (!progress) {
    return (
      <div className="flex items-center space-x-2 p-2 rounded-lg bg-muted animate-pulse">
        <div className="w-8 h-8 bg-muted-foreground/20 rounded-full"></div>
        <div className="space-y-1">
          <div className="w-20 h-4 bg-muted-foreground/20 rounded"></div>
          <div className="w-16 h-3 bg-muted-foreground/20 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3 p-2 rounded-lg bg-card shadow-sm border border-border">
      <Award className="h-8 w-8 text-accent" />
      <div>
        <p className="text-sm font-semibold text-card-foreground">Level {progress.level}</p>
        <p className="text-xs text-muted-foreground">{progress.points} Points</p>
      </div>
    </div>
  );
}
