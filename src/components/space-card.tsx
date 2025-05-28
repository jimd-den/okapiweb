
"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Space } from '@/domain/entities/space.entity';
import { ArrowRight, CalendarDays, Tag, Clock, Copy, Loader2 } from 'lucide-react';
import { format, parseISO, formatDistanceToNowStrict } from 'date-fns';
import { cn } from '@/lib/utils';

interface SpaceClockStats {
  totalDurationMs: number;
  isCurrentlyClockedIn: boolean;
}

interface SpaceCardProps {
  space: Space;
  clockStats?: SpaceClockStats;
  onNavigate?: () => void;
  onDuplicate?: (spaceId: string) => Promise<void>;
  isDuplicating?: boolean;
}

const formatDuration = (ms: number): string => {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export function SpaceCard({ space, clockStats, onNavigate, onDuplicate, isDuplicating }: SpaceCardProps) {
  const cardClasses = cn(
    "shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full bg-card rounded-xl overflow-hidden",
    clockStats?.isCurrentlyClockedIn && "border-2 border-green-500 ring-2 ring-green-500/50"
  );

  return (
    <Card className={cardClasses}>
      <CardHeader className="p-4 sm:p-5">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl sm:text-2xl mb-1">{space.name}</CardTitle>
            {space.description && <CardDescription className="text-sm sm:text-md text-muted-foreground line-clamp-2">{space.description}</CardDescription>}
          </div>
          {clockStats?.isCurrentlyClockedIn && (
            <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white text-xs whitespace-nowrap shrink-0 ml-2">
              Active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-5 flex-grow space-y-3">
        <div className="flex items-center text-muted-foreground text-xs sm:text-sm">
          <CalendarDays className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          <span>Created: {formatDistanceToNowStrict(parseISO(space.creationDate), { addSuffix: true })}</span>
        </div>
        {clockStats && (
          <div className="flex items-center text-muted-foreground text-xs sm:text-sm">
            <Clock className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            <span>Total Time: {formatDuration(clockStats.totalDurationMs)}</span>
          </div>
        )}
        {space.goal && (
          <p className="text-xs sm:text-sm line-clamp-2">
            <span className="font-semibold">Goal:</span> {space.goal}
          </p>
        )}
        {space.tags && space.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            {space.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs sm:text-sm px-2 py-0.5 sm:px-3 sm:py-1">{tag}</Badge>
            ))}
            {space.tags.length > 3 && <Badge variant="outline" className="text-xs sm:text-sm">+{space.tags.length - 3} more</Badge>}
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 sm:p-5 border-t mt-auto flex flex-col sm:flex-row gap-2">
        <Link href={`/spaces/${space.id}`} passHref legacyBehavior className="w-full sm:w-auto flex-grow">
          <Button
            variant="default"
            className="w-full text-md sm:text-lg py-2.5 sm:py-3"
            onClick={onNavigate}
          >
            Open <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </Link>
        {onDuplicate && (
          <Button
            variant="outline"
            size="default"
            className="w-full sm:w-auto text-md sm:text-lg py-2.5 sm:py-3"
            onClick={() => onDuplicate(space.id)}
            disabled={isDuplicating}
          >
            {isDuplicating ? <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> : <Copy className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />}
            Duplicate for Today
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
