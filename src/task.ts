import type { Task, TaskOptions } from "./types";
import type { InternalEngine } from "./engine";
import {
  type Disposable,
  type Observer,
  isPromise,
  createObserverCollection,
} from "./utils";

const STATE_IDLE = 0;
const STATE_STARTED = 1;
const STATE_FINISHED = 2;
const STATE_FAILED = 3;

type TaskState =
  | typeof STATE_IDLE
  | typeof STATE_STARTED
  | typeof STATE_FINISHED
  | typeof STATE_FAILED;

export interface InternalTask extends Task {
  parentTask: InternalTask | undefined;
  _childTasks: InternalTask[];
  engine: InternalEngine;
  state: TaskState;

  isTreeFinished(): boolean;

  canStart(): boolean;
  _start(): void;

  onEnd(observer: Observer<void>): Disposable;
}

function runGuarded(
  fn: () => unknown,
  onDone: (thrown?: { err: unknown }) => void,
) {
  try {
    const maybePromise = fn();
    if (!isPromise(maybePromise)) {
      onDone();
      return;
    }

    const nextPromise = maybePromise.then(() => onDone());
    if ("catch" in nextPromise && typeof nextPromise.catch === "function") {
      nextPromise.catch((err: unknown) => onDone({ err }));
    }
  } catch (err) {
    onDone({ err });
  }
}

export function createTask(
  options: TaskOptions,
  engine: InternalEngine,
  parentTask?: InternalTask,
): InternalTask {
  const onFinishObservers = createObserverCollection<void>();
  const onFailObservers = createObserverCollection<unknown>();
  const onEndObservers = createObserverCollection<void>();

  return {
    options,
    parentTask,
    _childTasks: [],
    engine,
    state: STATE_IDLE,

    get childTasks() {
      return [...this._childTasks];
    },
    get isStarted() {
      return this.state >= STATE_STARTED;
    },
    get isRunning() {
      return this.state === STATE_STARTED;
    },
    get isFinished() {
      return this.state === STATE_FINISHED;
    },
    get isFailed() {
      return this.state === STATE_FAILED;
    },

    createTask(options) {
      if (this.state > STATE_STARTED) {
        throw new Error("Cannot create child tasks in the current state");
      }

      const task = this.engine._createTask(options, false);
      this._childTasks.push(task as InternalTask);
      return task;
    },
    isTreeFinished() {
      if (!this.isFinished) {
        return false;
      }

      return this._childTasks.every((t) => t.isTreeFinished());
    },
    canStart() {
      const dependencies = this.options.dependencies;
      if (!dependencies) {
        // Task is always runnable when it has no dependencies.
        return true;
      }
      return dependencies.every((t) => (t as InternalTask).isTreeFinished());
    },
    _start() {
      if (this.state >= STATE_STARTED) {
        throw new Error(`Task ("${this.options.name}") already started`);
      }
      // We don't need to check the dependencies here, since the engine will ensure
      // that all prerequisites are met before calling this.
      this.state = STATE_STARTED;

      runGuarded(this.options.execute.bind(this), (thrown) => {
        if (thrown) {
          this.state = STATE_FAILED;
          onFailObservers.emit(thrown.err);
        } else {
          this.state = STATE_FINISHED;
          onFinishObservers.emit();
        }
        onEndObservers.emit();
      });
    },
    onFinish(observer) {
      return onFinishObservers.register(observer);
    },
    onFail(observer) {
      return onFailObservers.register(observer);
    },
    onEnd(observer) {
      return onEndObservers.register(observer);
    },
  };
}
