import type { Engine, TaskOptions } from "./types";
import type { InternalTask } from "./task";
import { createTask } from "./task";
import {
  type Observer,
  createObserverCollection,
  createScheduler,
} from "./utils";

export interface InternalEngine extends Engine {
  allTasks: InternalTask[];
  pendingTasks: Set<InternalTask>;
  runningTasks: Set<InternalTask>;

  isStarted: boolean;
  isFinished: boolean;

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
  isStarted = false;
  isFinished = false;

  onCompleteObservers = createObserverCollection<void>();
  checkTasksScheduler = createScheduler(() => {
    this.checkTasks();
  });

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
    this.isStarted = true;

    this.checkTasks();
  }

  onComplete(observer: Observer<void>) {
    return this.onCompleteObservers.register(observer);
  }

  checkTasks() {
    if (this.isFinished) {
      return;
    }

    if (this.pendingTasks.size === 0) {
      const allFinished = this.allTasks.every((task) => task.isFinished);
      if (allFinished) {
        this.isFinished = true;
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
