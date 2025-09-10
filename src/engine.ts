import type { Engine, TaskOptions, Task } from "./types";
import type { InternalTask } from "./task";
import { createTask } from "./task";
import {
  type Disposable,
  type Observer,
  createObserverCollection,
  createScheduler,
} from "./utils";
import { type NinmuPlugin, foldPlugins, foldRightPlugins } from "./plugin";

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

  plugins: NinmuPlugin[];

  _createTask(options: TaskOptions, parent?: InternalTask): InternalTask;

  /**
   * Checks if we can start some tasks. And notify the observers
   * when all tasks are finished.
   */
  checkTasks(): void;
}

class EngineImpl implements InternalEngine {
  allTasks: InternalTask[] = [];
  topLevelTasks: InternalTask[] = [];
  pendingTasks = new Set<InternalTask>();
  runningTasks = new Set<InternalTask>();
  state: EngineState = STATE_IDLE;
  hasErrors = false;

  plugins: NinmuPlugin[] = [];

  onEndObservers = createObserverCollection<void>();
  onErrorObservers = createObserverCollection<Task>();
  onUpdateObservers = createObserverCollection<Task>();
  checkTasksScheduler = createScheduler(() => {
    this.checkTasks();
  });

  get tasks(): Task[] {
    return [...this.topLevelTasks];
  }

  get isStarted(): boolean {
    return this.state >= STATE_STARTED;
  }

  get isRunning(): boolean {
    return this.state !== STATE_SETTLED;
  }

  use(plugin: NinmuPlugin): void {
    this.plugins.push(plugin);
    plugin.attach?.(this);
  }

  _createTask(options: TaskOptions, parent?: InternalTask) {
    foldRightPlugins(this.plugins, undefined, (plugin, acc) => {
      plugin.beforeCreateTask?.(options, parent);
      return acc;
    });

    const task = createTask(options, this);
    task.onEnd(() => {
      if (task.isFailed) {
        this.hasErrors = true;
        this.onErrorObservers.emit(task);
      }

      this.runningTasks.delete(task);
      this.checkTasksScheduler.schedule();
      this.onUpdateObservers.emit(task);
    });

    this.allTasks.push(task);
    if (!parent) {
      this.topLevelTasks.push(task);
    }
    this.pendingTasks.add(task);

    this.checkTasksScheduler.schedule();
    this.onUpdateObservers.emit(task);

    foldPlugins(this.plugins, undefined, (acc, plugin) => {
      plugin.afterCreateTask?.(task, parent);
      return acc;
    });

    return task;
  }

  createTask(options: TaskOptions): Task {
    return this._createTask(options, undefined);
  }

  start() {
    if (this.isStarted) {
      throw new Error("Engine already started");
    }
    this.state = STATE_STARTED;

    this.checkTasks();
  }

  onEnd(observer: Observer<void>) {
    return this.onEndObservers.register(observer);
  }

  onError(observer: Observer<Task>) {
    return this.onErrorObservers.register(observer);
  }

  onUpdate(observer: Observer<Task>): Disposable {
    return this.onUpdateObservers.register(observer);
  }

  checkTasks() {
    if (!this.isStarted || !this.isRunning) {
      return;
    }

    if (this.hasErrors || this.pendingTasks.size === 0) {
      const allSettled = this.allTasks.every((task) => !task.isRunning);
      if (allSettled) {
        this.state = STATE_SETTLED;
        this.onEndObservers.emit();
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
      this.onUpdateObservers.emit(task);
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
