import { HasId } from '../data/common';
import { PageInfo } from '@verdzie/server/generated-graphql';

export const toPageInfo = <T extends HasId>(arr: T[]): PageInfo => {
  return {
    __typename: 'PageInfo',
    startCursor: arr[0]?.id ?? '',
    endCursor: arr[arr.length - 1]?.id ?? '',
    hasNextPage: false,
    hasPreviousPage: false,
  };
};
