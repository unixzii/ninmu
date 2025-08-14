import type { Task, TaskOptions } from "./types.js";
import type { InternalEngine } from "./engine.js";
import { createObserverCollection } from "./utils.js";

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
  childTasks: InternalTask[];

  engine: InternalEngine;

  state: TaskState;

  canStart(): boolean;
  _start(): void;
}

export function createTask(
  options: TaskOptions,
  engine: InternalEngine,
  parentTask?: InternalTask,
): InternalTask {
  const onFinishObservers = createObserverCollection<void>();

  return {
    options,
    get isStarted() {
      return this.state >= STATE_STARTED;
    },
    get isRunning() {
      return this.state == STATE_STARTED;
    },
    get isFinished() {
      return this.state == STATE_FINISHED;
    },
    onFinish(observer) {
      return onFinishObservers.register(observer);
    },
    parentTask,
    childTasks: [],
    engine,
    state: STATE_IDLE,
    canStart() {
      const dependencies = this.options.dependencies;
      if (!dependencies) {
        // Task is always runnable when it has no dependencies.
        return true;
      }
      return dependencies.findIndex((t) => !t.isFinished) === -1;
    },
    _start() {
      if (this.state >= STATE_STARTED) {
        throw new Error(`Task ("${this.options.name}") already started`);
      }
      // We don't need to check the dependencies here, since the engine will ensure
      // that all prerequisites are met before calling this.
      this.state = STATE_STARTED;

      const onDone = () => {
        this.state = STATE_FINISHED;
        onFinishObservers.emit();
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
