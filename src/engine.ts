import type { Engine, TaskOptions } from "./types";
import type { InternalTask } from "./task";
import { createTask } from "./task";
import {
  type Observer,
  createObserverCollection,
  createScheduler,
} from "./utils";

const STATE_IDLE = 0;
const STATE_STARTED = 1;
const STATE_SETTLED = 2;

type EngineState =
  | typeof STATE_IDLE
  | typeof STATE_STARTED
  | typeof STATE_SETTLED;

export interface InternalEngine extends Engine {
  allTasks: InternalTask[];
  pendingTasks: Set<InternalTask>;
  runningTasks: Set<InternalTask>;

  state: EngineState;

  /**
   * Checks if we can start some tasks. And notify the observers
   * when all tasks are finished.
   */
  checkTasks(): void;
}

class EngineImpl implements InternalEngine {
  allTasks: InternalTask[] = [];
  pendingTasks = new Set<InternalTask>();
  runningTasks = new Set<InternalTask>();
  state: EngineState = STATE_IDLE;

  onCompleteObservers = createObserverCollection<void>();
  onErrorObservers = createObserverCollection<void>();
  checkTasksScheduler = createScheduler(() => {
    this.checkTasks();
  });

  get isStarted(): boolean {
    return this.state >= STATE_STARTED;
  }

  get isRunning(): boolean {
    return this.state !== STATE_SETTLED;
  }

  createTask(options: TaskOptions) {
    const task = createTask(options, this);
    task.onEnd(() => {
      this.runningTasks.delete(task);
      this.checkTasksScheduler.schedule();
    });

    this.allTasks.push(task);
    this.pendingTasks.add(task);

    this.checkTasksScheduler.schedule();

    return task;
  }

  start() {
    if (this.isStarted) {
      throw new Error("Engine already started");
    }
    this.state = STATE_STARTED;

    this.checkTasks();
  }

  onComplete(observer: Observer<void>) {
    return this.onCompleteObservers.register(observer);
  }

  onError(observer: Observer<void>) {
    return this.onErrorObservers.register(observer);
  }

  checkTasks() {
    if (!this.isRunning) {
      return;
    }

    if (this.pendingTasks.size === 0) {
      const allSettled = this.allTasks.every((task) => !task.isRunning);
      if (allSettled) {
        this.state = STATE_SETTLED;
        this.onCompleteObservers.emit();
      }
      return;
    }

    let hasTaskStarted = false;
    const pendingTasks = new Set(this.pendingTasks);
    pendingTasks.forEach((task) => {
      if (!task.canStart()) {
        return;
      }
      hasTaskStarted = true;
      this.pendingTasks.delete(task);
      this.runningTasks.add(task);
      task._start();
    });

    if (!hasTaskStarted && this.runningTasks.size === 0) {
      throw new Error(
        "No more tasks can start, maybe there is a dependency cycle",
      );
    }
  }
}

export function createEngine(): Engine {
  return new EngineImpl();
}
