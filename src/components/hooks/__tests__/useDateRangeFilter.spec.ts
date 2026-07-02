import {
  useFlag,
  useUserPreference,
} from '@openshift-console/dynamic-plugin-sdk';
import { testHook } from '../../../test-data/utils/hooks-utils';
import { useDateRangeFilter, parseDuration } from '../useDateRangeFilter';

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  useFlag: jest.fn(),
  useUserPreference: jest.fn(),
}));

const useFlagMock = useFlag as jest.Mock;
const useUserPreferenceMock = useUserPreference as jest.Mock;

const ONE_DAY_MS = 86400000;
const ONE_WEEK_MS = 604800000;

describe('useDateRangeFilter', () => {
  let setTimespanMock: jest.Mock;

  beforeEach(() => {
    setTimespanMock = jest.fn();
    useFlagMock.mockReturnValue(true);
    useUserPreferenceMock.mockReturnValue([ONE_DAY_MS, setTimespanMock]);
  });

  it('should return timespan from user preference', () => {
    const { result } = testHook(() => useDateRangeFilter('pipelineRun'));
    expect(result.current.timespan).toBe(ONE_DAY_MS);
  });

  it('should compute startDate from midnight minus timespan', () => {
    const { result } = testHook(() => useDateRangeFilter('pipelineRun'));
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    const expected = midnight.getTime() - ONE_DAY_MS;
    expect(result.current.startDate).toBe(expected);
  });

  it('should generate a valid CEL expression', () => {
    const { result } = testHook(() => useDateRangeFilter('pipelineRun'));
    expect(result.current.dateFilterCEL).toMatch(
      /^data\.status\.startTime > timestamp\(".*"\)$/,
    );
  });

  it('should default to 0 (no filter) when useUserPreference returns undefined', () => {
    useUserPreferenceMock.mockReturnValue([undefined, setTimespanMock]);
    const { result } = testHook(() => useDateRangeFilter('pipelineRun'));
    expect(result.current.timespan).toBe(0);
    expect(result.current.dateFilterCEL).toBe('');
    expect(result.current.startDate).toBeUndefined();
  });

  it('should expose setTimespan from the preference hook', () => {
    const { result } = testHook(() => useDateRangeFilter('pipelineRun'));
    result.current.setTimespan(ONE_WEEK_MS);
    expect(setTimespanMock).toHaveBeenCalledWith(ONE_WEEK_MS);
  });

  it('should reflect the isTektonResultEnabled flag', () => {
    useFlagMock.mockReturnValue(false);
    const { result } = testHook(() => useDateRangeFilter('pipelineRun'));
    expect(result.current.isTektonResultEnabled).toBe(false);
  });

  it('should use a different preference key for taskRun', () => {
    const { result } = testHook(() => useDateRangeFilter('taskRun'));
    expect(result.current.timespan).toBe(ONE_DAY_MS);
    expect(useUserPreferenceMock).toHaveBeenCalledWith(
      'plugin__pipelines-console-plugin.dateRangeFilter.taskRun',
      0,
      true,
    );
  });
});

describe('parseDuration', () => {
  it('should parse single unit durations', () => {
    expect(parseDuration('1d')).toBe(ONE_DAY_MS);
    expect(parseDuration('1w')).toBe(ONE_WEEK_MS);
    expect(parseDuration('2h')).toBe(7_200_000);
    expect(parseDuration('30m')).toBe(1_800_000);
    expect(parseDuration('10s')).toBe(10_000);
  });

  it('should parse multi-unit durations', () => {
    expect(parseDuration('4w 2d')).toBe(4 * ONE_WEEK_MS + 2 * ONE_DAY_MS);
    expect(parseDuration('1d 12h')).toBe(ONE_DAY_MS + 12 * 3_600_000);
  });

  it('should return 0 for invalid input', () => {
    expect(parseDuration('')).toBe(0);
    expect(parseDuration('abc')).toBe(0);
    expect(parseDuration('10x')).toBe(0);
  });
});
