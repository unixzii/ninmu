import type { Engine } from "./types";
import type { InternalTask } from "./task";
import { createTask } from "./task";
import { isomorphicQueueMicrotask } from "./utils";

export interface InternalEngine extends Engine {
  allTasks: InternalTask[];
  pendingTasks: Set<InternalTask>;
  runningTasks: Set<InternalTask>;

  isStarted: boolean;
  isFinished: boolean;

  finishCb: (() => void) | undefined;

  /**
   * Checks if we can start some tasks. And notify the observers
   * when all tasks are finished.
   */
  checkTasks(): void;
  postCheckTasks(): void;
}

export function _createEngine(): InternalEngine {
  return {
    allTasks: [],
    pendingTasks: new Set(),
    runningTasks: new Set(),
    isStarted: false,
    isFinished: false,
    finishCb: undefined,
    createTask(options) {
      const task = createTask(options, this);
      task.onFinish(() => {
        this.runningTasks.delete(task);
        this.postCheckTasks();
      });

      this.allTasks.push(task);
      this.pendingTasks.add(task);

      this.postCheckTasks();

      return task;
    },
    start(cb) {
      if (this.isStarted) {
        throw new Error("Engine already started");
      }
      this.isStarted = true;
      this.finishCb = cb;

      this.checkTasks();
    },
    checkTasks() {
      if (this.isFinished) {
        return;
      }

      if (this.pendingTasks.size === 0) {
        const allFinished = this.allTasks.every((task) => task.isFinished);
        if (allFinished) {
          this.isFinished = true;
          this.finishCb?.();
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
    },
    postCheckTasks() {
      isomorphicQueueMicrotask(() => {
        this.checkTasks();
      });
    },
  };
}

export function createEngine(): Engine {
  return _createEngine();
}
