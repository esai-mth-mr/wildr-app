import { nanoid } from 'nanoid';
import { FEED_ID_SEPARATOR } from '@verdzie/server/feed/feed.service';

export const generateId = (length = 16): string => {
  const size = length > 0 ? length : 16;
  return nanoid(size)
    .replace(PAGE_NUMBER_SEPARATOR, '-')
    .replace(ID_SEPARATOR, '-')
    .replace(FEED_ID_SEPARATOR, '-');
};

export const ID_SEPARATOR = '#';
export const PAGE_NUMBER_SEPARATOR = '~#';
