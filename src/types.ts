import type { Observer, Disposable } from "./utils";
import type { NinmuPlugin } from "./plugin";

export type TaskOptions = {
  /**
   * Name of this task.
   */
  name: string;
  /**
   * An optional description of this task.
   */
  description?: string;

  /**
   * A set of tasks that are required to be finished successfully before this task starts.
   *
   * If the dependent task has child tasks, this task will also wait for all of them to be finished.
   */
  dependencies?: Task[];

  /**
   * The function that this task executes. It can be async.
   */
  execute: (this: Task) => void | Promise<void>;
};

export interface Task {
  /**
   * The options used to create this task.
   */
  options: TaskOptions;

  /**
   * The child tasks of this task.
   */
  get childTasks(): Task[];

  /**
   * Returns whether this task has started.
   */
  get isStarted(): boolean;

  /**
   * Returns whether this task is started and currently running.
   */
  get isRunning(): boolean;

  /**
   * Returns whether this task has finished.
   */
  get isFinished(): boolean;

  /**
   * Returns whether this task has failed.
   */
  get isFailed(): boolean;

  /**
   * Creates a child task.
   *
   * This method can only be called before the task ends.
   */
  createTask(options: TaskOptions): Task;

  /**
   * Registers an observer to be notified when this task finishes.
   */
  onFinish(observer: Observer<void>): Disposable;

  /**
   * Registers an observer to be notified when this task fails.
   */
  onFail(observer: Observer<unknown>): Disposable;
}

export interface Engine {
  /**
   * Top-level tasks.
   */
  get tasks(): Task[];

  /**
   * Returns whether this engine has started.
   */
  get isStarted(): boolean;

  /**
   * Returns whether there are any tasks running.
   */
  get isRunning(): boolean;

  /**
   * Registers a plugin.
   */
  use(plugin: NinmuPlugin): void;

  /**
   * Creates a top-level task.
   */
  createTask(options: TaskOptions): Task;

  /**
   * Starts all ready tasks.
   */
  start(): void;

  /**
   * Registers an observer to be notified when all tasks have ended.
   */
  onEnd(observer: Observer<void>): Disposable;

  /**
   * Registers an observer to be notified when there is an error in any task.
   */
  onError(observer: Observer<Task>): Disposable;

  /**
   * Registers an observer to be notified when there is an update in any task.
   */
  onUpdate(observer: Observer<Task>): Disposable;
}
