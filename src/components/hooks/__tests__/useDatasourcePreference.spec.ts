import { useUserPreference } from '@openshift-console/dynamic-plugin-sdk';
import { testHook } from '../../../test-data/utils/hooks-utils';
import {
  useDatasourcePreference,
  DEFAULT_DATASOURCE_VALUES,
} from '../useDatasourcePreference';

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  useUserPreference: jest.fn(),
}));

const useUserPreferenceMock = useUserPreference as jest.Mock;

describe('useDatasourcePreference', () => {
  let setPreferenceMock: jest.Mock;

  beforeEach(() => {
    setPreferenceMock = jest.fn();
    useUserPreferenceMock.mockReturnValue([
      ['cluster-data'],
      setPreferenceMock,
      true,
    ]);
  });

  it('should return the persisted preference', () => {
    const { result } = testHook(() =>
      useDatasourcePreference('PipelineRun'),
    );
    expect(result.current.preference).toEqual(['cluster-data']);
    expect(result.current.loaded).toBe(true);
  });

  it('should fall back to default when preference is undefined', () => {
    useUserPreferenceMock.mockReturnValue([
      undefined,
      setPreferenceMock,
      true,
    ]);
    const { result } = testHook(() =>
      useDatasourcePreference('PipelineRun'),
    );
    expect(result.current.preference).toEqual(DEFAULT_DATASOURCE_VALUES);
  });

  it('should persist value via setPreference', () => {
    const { result } = testHook(() =>
      useDatasourcePreference('PipelineRun'),
    );
    result.current.setPreference(['archived-data']);
    expect(setPreferenceMock).toHaveBeenCalledWith(['archived-data']);
  });

  it('should reset preference to default', () => {
    const { result } = testHook(() =>
      useDatasourcePreference('PipelineRun'),
    );
    result.current.resetPreference();
    expect(setPreferenceMock).toHaveBeenCalledWith(DEFAULT_DATASOURCE_VALUES);
  });

  it('should use the correct preference key for PipelineRun', () => {
    testHook(() => useDatasourcePreference('PipelineRun'));
    expect(useUserPreferenceMock).toHaveBeenCalledWith(
      'plugin__pipelines-console-plugin.dataSource.PipelineRun',
      DEFAULT_DATASOURCE_VALUES,
      true,
    );
  });
});
