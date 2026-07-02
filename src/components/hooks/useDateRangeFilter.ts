import {
  useFlag,
  useUserPreference,
} from '@openshift-console/dynamic-plugin-sdk';
import { useMemo } from 'react';
import {
  FLAG_PIPELINE_TEKTON_RESULT_INSTALLED,
  USER_PREFERENCE_PREFIX,
} from '../../consts';

const DURATION_MS: Record<string, number> = {
  s: 1000,
  m: 60000,
  h: 3600000,
  d: 86400000,
  w: 604800000,
};

/** Parse a duration string like "1d", "1w", "4w 2d" into milliseconds. */
export const parseDuration = (duration: string): number => {
  let total = 0;
  for (const part of duration.trim().split(/\s+/)) {
    const match = part.match(/^(\d+)([wdhms])$/);
    if (!match) return 0;
    total += parseInt(match[1], 10) * DURATION_MS[match[2]];
  }
  return total;
};

/** Midnight (00:00) of the current day in local time. */
const startOfToday = (): number => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.getTime();
};

export type DateRangeFilterResult = {
  timespan: number;
  setTimespan: (ms: number) => void;
  startDate: number | undefined;
  dateFilterCEL: string;
  isTektonResultEnabled: boolean;
  preferenceLoaded: boolean;
};

type PageType = 'pipelineRun' | 'taskRun';

export const useDateRangeFilter = (
  pageType: PageType,
): DateRangeFilterResult => {
  const isTektonResultEnabled = useFlag(FLAG_PIPELINE_TEKTON_RESULT_INSTALLED);
  const [timespan, setTimespan, preferenceLoaded] = useUserPreference<number>(
    `${USER_PREFERENCE_PREFIX}.dateRangeFilter.${pageType}`,
    0,
    true,
  );

  const ts = timespan ?? 0;

  // Normalize to midnight so "Last day" means from 00:00 yesterday, not 24h ago
  const startDate = useMemo(() => {
    if (!ts) return undefined;
    return startOfToday() - ts;
  }, [ts]);

  const dateFilterCEL = useMemo(() => {
    if (!startDate) return '';
    return `data.status.startTime > timestamp("${new Date(
      startDate,
    ).toISOString()}")`;
  }, [startDate]);

  return {
    timespan: ts,
    setTimespan,
    startDate,
    dateFilterCEL,
    isTektonResultEnabled,
    preferenceLoaded,
  };
};
