import { PAGE_NUMBER_SEPARATOR } from '@verdzie/server/common/generateId';

export function getUserPropertyMapId({
  userId,
  pageNumber,
}: {
  userId: string;
  pageNumber?: number;
}) {
  return userId + PAGE_NUMBER_SEPARATOR + (pageNumber ?? 1);
}
