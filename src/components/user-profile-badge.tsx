
"use client";

import { Award } from 'lucide-react';
import { useEffect, useState, useMemo, useRef } from 'react';
import type { UserProgress } from '@/domain/entities/user-progress.entity';
import { DEFAULT_USER_ID } from '@/lib/constants';
import { cn } from '@/lib/utils';

// Use Cases and Repositories
import { GetUserProgressUseCase } from '@/application/use-cases/user-progress/get-user-progress.usecase';
import { IndexedDBUserProgressRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-user-progress.repository';


export function UserProfileBadge() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [animatePoints, setAnimatePoints] = useState(false);
  const [animateLevel, setAnimateLevel] = useState(false);
  const prevProgressRef = useRef<UserProgress | null>(null);


  const userProgressRepository = useMemo(() => new IndexedDBUserProgressRepository(), []);
  const getUserProgressUseCase = useMemo(() => new GetUserProgressUseCase(userProgressRepository), [userProgressRepository]);

  useEffect(() => {
    getUserProgressUseCase.execute(DEFAULT_USER_ID)
      .then(fetchedProgress => {
        if (fetchedProgress) {
          setProgress(fetchedProgress);
          prevProgressRef.current = fetchedProgress; // Initialize prevProgress
        } else {
          console.warn("User progress not found by use case for UserProfileBadge.");
          const defaultProg = { userId: DEFAULT_USER_ID, points: 0, level: 1, unlockedCustomizations: [] };
          setProgress(defaultProg);
          prevProgressRef.current = defaultProg;
        }
      })
      .catch(err => {
        console.error("Error fetching user progress for badge:", err);
        const errorProg = { userId: DEFAULT_USER_ID, points: 0, level: 1, unlockedCustomizations: [] };
        setProgress(errorProg);
        prevProgressRef.current = errorProg;
      });
  }, [getUserProgressUseCase]);

  useEffect(() => {
    if (progress && prevProgressRef.current) {
      if (progress.points > prevProgressRef.current.points) {
        setAnimatePoints(true);
        setTimeout(() => setAnimatePoints(false), 600); // Duration of 'points-highlight' animation
      }
      if (progress.level > prevProgressRef.current.level) {
        setAnimateLevel(true);
        setTimeout(() => setAnimateLevel(false), 500); // Duration of 'icon-pop' or 'pop-in' animation
      }
    }
    prevProgressRef.current = progress;
  }, [progress]);


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
      <Award className={cn("h-8 w-8 text-accent", animateLevel && "animate-icon-pop")} />
      <div>
        <p className={cn("text-sm font-semibold text-card-foreground", animateLevel && "animate-highlight-pop")}>
          Level {progress.level}
        </p>
        <p className={cn("text-xs text-muted-foreground", animatePoints && "animate-highlight-pop")}>
          {progress.points} Points
        </p>
      </div>
    </div>
  );
}
