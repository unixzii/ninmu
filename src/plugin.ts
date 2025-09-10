import type { Engine, TaskOptions, Task } from "./types";

/**
 * A plugin to extend Ninmu.
 *
 * The interface defines a set of hooks that will be invoked at different
 * stages of the engine lifecycle.
 */
export interface NinmuPlugin {
  /**
   * Invoked when the plugin is attached to the engine.
   *
   * @param engine - The engine that the plugin applies to.
   */
  attach?: (engine: Engine) => void;

  /**
   * Invoked before a task is created. This hook gives the plugin a chance
   * to refine the task options.
   *
   * Note: the last registered plugin is invoked first for this hook.
   *
   * @param options - The options for creating the task.
   * @param parent - The parent task, if any.
   */
  beforeCreateTask?: (options: TaskOptions, parent?: Task) => void;

  /**
   * Invoked after a task is created. This hook gives the plugin a chance
   * to refine the task instance.
   *
   * @param task - The task that was created.
   * @param parent - The parent task, if any.
   */
  afterCreateTask?: (task: Task, parent?: Task) => void;
}

export function foldPlugins<R>(
  plugins: NinmuPlugin[],
  initial: R,
  fn: (acc: R, plugin: NinmuPlugin) => R,
): R {
  let result = initial;
  for (const plugin of plugins) {
    result = fn(result, plugin);
  }
  return result;
}

export function foldRightPlugins<R>(
  plugins: NinmuPlugin[],
  initial: R,
  fn: (plugin: NinmuPlugin, acc: R) => R,
): R {
  let result = initial;
  const count = plugins.length;
  for (let i = count - 1; i >= 0; i--) {
    result = fn(plugins[i]!, result);
  }
  return result;
}
