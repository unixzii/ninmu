export function createFuture<T>(): [Promise<T>, (value: T) => void] {
  let _resolve: ((value: T) => void) | undefined;
  const promise = new Promise<T>((resolve) => {
    _resolve = resolve;
  });
  return [promise, _resolve!];
}

export function waitMicrotask(): Promise<void> {
  return new Promise((resolve) => {
    queueMicrotask(() => resolve());
  });
}
