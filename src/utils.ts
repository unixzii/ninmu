export function isPromise(obj: unknown): obj is PromiseLike<unknown> {
  if (!obj) {
    return false;
  }
  if (typeof obj !== "object" && typeof obj !== "function") {
    return false;
  }
  if ("then" in obj && typeof obj.then === "function") {
    return true;
  }
  return false;
}

export function isomorphicQueueMicrotask(callback: () => void) {
  queueMicrotask(callback);
}

export interface Disposable {
  (): void;
}

export interface Observer<E> {
  (ev: E): void;
}

export interface ObserverCollection<E> {
  register(observer: Observer<E>): Disposable;
  emit(ev: E): void;
}

export function createObserverCollection<E>(): ObserverCollection<E> {
  const observers = new Set<Observer<E>>();
  return {
    register(observer) {
      observers.add(observer);
      return () => {
        observers.delete(observer);
      };
    },
    emit(ev) {
      const snapshot = new Set(observers);
      snapshot.forEach((observer) => observer(ev));
    },
  };
}

export interface Scheduler {
  schedule(): void;
}

export function createScheduler(fn: () => void): Scheduler {
  let scheduled = false;
  return {
    schedule() {
      if (scheduled) {
        return;
      }

      scheduled = true;
      isomorphicQueueMicrotask(() => {
        scheduled = false;
        fn();
      });
    },
  };
}
