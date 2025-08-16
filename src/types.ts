import type { Observer, Disposable } from "./utils";

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
   */
  dependencies?: Task[];

  /**
   * The function that this task executes. It can be async.
   */
  execute: () => void | Promise<void>;
};

export interface Task {
  /**
   * The options used to create this task.
   */
  options: TaskOptions;

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
   * Returns whether this engine has started.
   */
  get isStarted(): boolean;

  /**
   * Returns whether there are any tasks running.
   */
  get isRunning(): boolean;

  /**
   * Creates a top-level task.
   */
  createTask(options: TaskOptions): Task;

  /**
   * Starts all ready tasks.
   */
  start(): void;

  /**
   * Registers an observer to be notified when all tasks complete.
   */
  onComplete(observer: Observer<void>): Disposable;

  /**
   * Registers an observer to be notified when there is an error in any task.
   */
  onError(observer: Observer<void>): Disposable;
}
