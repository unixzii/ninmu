export function isomorphicQueueMicrotask(callback: () => void) {
  queueMicrotask(callback);
}
