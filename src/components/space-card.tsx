
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
    "shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full bg-card rounded-lg overflow-hidden", // Changed rounded-xl to rounded-lg for consistency
    "animate-in fade-in-0 slide-in-from-bottom-4 duration-500 ease-out", // Added appearance animation
    clockStats?.isCurrentlyClockedIn && "border-2 border-green-500 ring-2 ring-green-500/50"
  );

  return (
    <Card className={cardClasses}>
      <CardHeader className="p-5 sm:p-6"> {/* Increased padding */}
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl sm:text-2xl mb-1.5">{space.name}</CardTitle> {/* Increased mb */}
            {space.description && <CardDescription className="text-base text-muted-foreground line-clamp-2">{space.description}</CardDescription>} {/* text-sm to text-base */}
          </div>
          {clockStats?.isCurrentlyClockedIn && (
            <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1 whitespace-nowrap shrink-0 ml-2"> {/* Increased font, padding */}
              Active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-5 sm:p-6 flex-grow space-y-3.5"> {/* Increased padding and space-y */}
        <div className="flex items-center text-muted-foreground text-sm sm:text-base"> {/* text-base */}
          <CalendarDays className="mr-2.5 h-5 w-5" /> {/* Increased mr, icon size */}
          <span>Created: {formatDistanceToNowStrict(parseISO(space.creationDate), { addSuffix: true })}</span>
        </div>
        {clockStats && (
          <div className="flex items-center text-muted-foreground text-sm sm:text-base"> {/* text-base */}
            <Clock className="mr-2.5 h-5 w-5" /> {/* Increased mr, icon size */}
            <span>Total Time: {formatDuration(clockStats.totalDurationMs)}</span>
          </div>
        )}
        {space.goal && (
          <p className="text-sm sm:text-base line-clamp-2"> {/* text-base */}
            <span className="font-semibold">Goal:</span> {space.goal}
          </p>
        )}
        {space.tags && space.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center"> {/* Increased gap */}
            <Tag className="h-5 w-5 text-muted-foreground" /> {/* Increased icon size */}
            {space.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-sm px-3 py-1">{tag}</Badge> // Increased font, padding
            ))}
            {space.tags.length > 3 && <Badge variant="outline" className="text-sm px-2.5 py-1">+{space.tags.length - 3} more</Badge>}
          </div>
        )}
      </CardContent>
      <CardFooter className="p-5 sm:p-6 border-t mt-auto flex flex-col sm:flex-row gap-3"> {/* Increased padding and gap */}
        <Link href={`/spaces/${space.id}`} passHref legacyBehavior className="w-full sm:w-auto flex-grow">
          <Button
            variant="default"
            size="lg" // Using lg size from button variants
            className="w-full" // text-md and py-3 already good from size="lg"
            onClick={onNavigate}
          >
            Open <ArrowRight className="ml-2 h-5 w-5" /> {/* Icon size consistent */}
          </Button>
        </Link>
        {onDuplicate && (
          <Button
            variant="outline"
            size="lg" // Using lg size
            className="w-full sm:w-auto"
            onClick={() => onDuplicate(space.id)}
            disabled={isDuplicating}
          >
            {isDuplicating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Copy className="mr-2 h-5 w-5" />}
            Duplicate for Today
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

    