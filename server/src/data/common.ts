import { compareVersions } from 'compare-versions';
import {
  CHALLENGE_MIN_VERSION,
  REPOST_MIN_VERSION,
} from '@verdzie/server/feed/feed.service';

export interface UploadFile {
  __typename: 'UploadFile';
  id: string;
  filename: string;
  mimetype: string;
  encoding: string;
  path: string;
}

export interface HasId {
  id: string;
}

// Will reorder `types` in order specified by `ids`.
export const preserveOrderByIds = <Type extends HasId>(
  ids: string[] | readonly string[],
  types: Type[]
): Type[] => {
  const s: { [key: string]: Type } = {};

  for (const e of types) {
    if (e === undefined) continue;
    s[e.id] = e;
  }
  const result = [];
  for (const id of ids) {
    if (s[id] === undefined) continue;
    result.push(s[id]);
  }
  return result;
};

export const DEFAULT_PAGINATION_COUNT = 8;

export interface PaginateDownParams {
  __type: 'PaginateDownParams';
  first: number;
  after?: string;
}

export interface PaginateUpParams {
  __type: 'PaginateUpParams';
  last: number;
  before?: string;
}

export type PaginateParams = PaginateDownParams | PaginateUpParams;

interface PaginationQueryInput {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
}

export const toPaginateParams = ({
  first,
  after,
  last,
  before,
}: PaginationQueryInput): PaginateParams => {
  if (last) {
    return {
      __type: 'PaginateUpParams',
      last: last,
      before: before,
    };
  }
  return {
    __type: 'PaginateDownParams',
    first: first ?? DEFAULT_PAGINATION_COUNT,
    after: after,
  };
};

export enum PassFailState {
  PASS,
  FAIL,
}

export function getPassFailState(passFailState: string): PassFailState {
  switch (passFailState) {
    case 'PASS':
      return PassFailState.PASS;
    case 'FAIL':
      return PassFailState.FAIL;
    default:
      return PassFailState.FAIL;
  }
}

/**
 * the `compareVersions()` lib returns:
 * 1 if appVersion is greater
 * 0 if same
 * -1 if appVersion is smaller
 * @param args
 */
export const isAppVersionValid = (args: {
  requiredVersion: string;
  appVersion?: string;
}): boolean => {
  const appVersion = args.appVersion ?? '0';
  const result = compareVersions(appVersion, args.requiredVersion);
  return result > -1;
};

export const canShowReposts = (version?: string) => {
  const appVersion = version ?? '0';
  return isAppVersionValid({ requiredVersion: REPOST_MIN_VERSION, appVersion });
};

export const canShowChallengeActivities = (version?: string) => {
  const appVersion = version ?? '0';
  return isAppVersionValid({
    requiredVersion: CHALLENGE_MIN_VERSION,
    appVersion,
  });
};

export const isEmptyObject = (obj: any) => {
  return Object.keys(obj).length === 0;
};
