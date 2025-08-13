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
   * Returns whether this task has finished.
   */
  get isFinished(): boolean;
}

export interface Engine {
  /**
   * Creates a top-level task.
   */
  createTask(options: TaskOptions): Task;

  /**
   * Starts all ready tasks.
   */
  start(): void;
}
