
// src/hooks/data/use-timeline-data.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { TimelineItem } from '@/application/dto/timeline-item.dto';
import type { GetTimelineItemsBySpaceUseCase } from '@/application/use-cases/timeline/get-timeline-items-by-space.usecase';

interface UseTimelineDataReturn {
  timelineItems: TimelineItem[];
  isLoadingTimeline: boolean;
  errorLoadingTimeline: string | null;
  refreshTimeline: () => Promise<void>;
}

export function useTimelineData(
  spaceId: string,
  getTimelineItemsBySpaceUseCase: GetTimelineItemsBySpaceUseCase
): UseTimelineDataReturn {
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState<boolean>(true);
  const [errorLoadingTimeline, setErrorLoadingTimeline] = useState<string | null>(null);

  const fetchTimelineItems = useCallback(async () => {
    if (!spaceId || !getTimelineItemsBySpaceUseCase) {
      setErrorLoadingTimeline("Space ID or use case not provided for timeline.");
      setIsLoadingTimeline(false);
      return;
    }
    setIsLoadingTimeline(true);
    setErrorLoadingTimeline(null);
    try {
      const data = await getTimelineItemsBySpaceUseCase.execute(spaceId);
      setTimelineItems(data);
    } catch (err: any) {
      console.error("Failed to fetch timeline items:", err);
      setErrorLoadingTimeline(err.message || "Could not load activity timeline.");
    } finally {
      setIsLoadingTimeline(false);
    }
  }, [spaceId, getTimelineItemsBySpaceUseCase]);

  useEffect(() => {
    fetchTimelineItems();
  }, [fetchTimelineItems]);

  return {
    timelineItems,
    isLoadingTimeline,
    errorLoadingTimeline,
    refreshTimeline: fetchTimelineItems,
  };
}
