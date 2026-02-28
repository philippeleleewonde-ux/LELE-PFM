/**
 * Wraps a promise with a timeout. Rejects if the promise
 * doesn't resolve within the given milliseconds.
 */
export function withTimeout<T>(promise: PromiseLike<T>, ms = 10000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), ms)
    ),
  ]);
}
