import { useUserPreference } from '@openshift-console/dynamic-plugin-sdk';
import { useCallback } from 'react';
import { USER_PREFERENCE_PREFIX } from '../../consts';

export const DEFAULT_DATASOURCE_VALUES = ['cluster-data'];

export const useDatasourcePreference = (resourceType: string) => {
  const [preference, setPreference, loaded] = useUserPreference<string[]>(
    `${USER_PREFERENCE_PREFIX}.dataSource.${resourceType}`,
    DEFAULT_DATASOURCE_VALUES,
    true,
  );

  const resetPreference = useCallback(() => {
    setPreference(DEFAULT_DATASOURCE_VALUES);
  }, [setPreference]);

  return {
    preference: preference ?? DEFAULT_DATASOURCE_VALUES,
    setPreference,
    resetPreference,
    loaded,
  };
};
