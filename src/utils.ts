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
