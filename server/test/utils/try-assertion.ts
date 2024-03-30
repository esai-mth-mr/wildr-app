export async function tryAssertion({
  assertionFn,
  maxRetries,
  retryInterval,
}: {
  assertionFn: () => Promise<any>;
  maxRetries: number;
  retryInterval: number;
}) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      await assertionFn();
      return;
    } catch (e) {
      retries++;
      await new Promise(resolve => setTimeout(resolve, retryInterval));
    }
  }
  return assertionFn();
}
