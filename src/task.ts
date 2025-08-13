import type { Task, TaskOptions } from "./types.js";
import type { InternalEngine } from "./engine.js";

export interface InternalTask extends Task {
  parentTask: InternalTask | undefined;
  childTasks: InternalTask[];

  engine: InternalEngine;

  isStarted: boolean;
  _isFinished: boolean;

  canStart(): boolean;
  _start(cb: () => void): void;
}

export function createTask(
  options: TaskOptions,
  engine: InternalEngine,
  parentTask?: InternalTask,
): InternalTask {
  return {
    options,
    get isFinished() {
      return this._isFinished;
    },
    parentTask,
    childTasks: [],
    engine,
    isStarted: false,
    _isFinished: false,
    canStart() {
      const dependencies = this.options.dependencies;
      if (!dependencies) {
        // Task is always runnable when it has no dependencies.
        return true;
      }
      return dependencies.findIndex((t) => !t.isFinished) === -1;
    },
    _start(cb) {
      if (this.isStarted) {
        throw new Error(`Task ("${this.options.name}") already started`);
      }
      // We don't need to check the dependencies here, since the engine will ensure
      // that all prerequisites are met before calling this.
      this.isStarted = true;

      const onDone = () => {
        this._isFinished = true;
        cb();
      };

      const promiseOrVoid = this.options.execute();
      if (promiseOrVoid instanceof Promise) {
        promiseOrVoid.then(() => {
          onDone();
        });
      } else {
        onDone();
      }
    },
  };
}
