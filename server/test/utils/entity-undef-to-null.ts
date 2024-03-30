/**
 * Postgres returns null for undefined values so in tests we need to convert
 * undefined to null to match what is inserted.
 */
export function entityUndefToNull<T>(entity: T): T {
  const entityCopy = { ...entity };
  // @ts-ignore
  for (const [key, value] of Object.entries(entityCopy)) {
    if (value === undefined) {
      // @ts-ignore
      entityCopy[key] = null;
    }
  }
  return entityCopy;
}
