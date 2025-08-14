import { expect, vi, it } from "vitest";
import { createTask } from "../src/task.js";
import { _createEngine } from "../src/engine.js";
import { createFuture } from "./utils.js";

it("createTask should always succeed", () => {
  const engine = _createEngine();
  const task = createTask(
    {
      name: "test task",
      execute() {},
    },
    engine,
  );
  expect(task).toBeDefined();
});

it("should run the task by calling _start()", () => {
  const taskBody = vi.fn();
  const cb = vi.fn();

  const engine = _createEngine();
  const task = createTask(
    {
      name: "test task",
      execute() {
        taskBody();
      },
    },
    engine,
  );
  task._start(cb);

  expect(taskBody).toHaveBeenCalledOnce();
  expect(cb).toHaveBeenCalledOnce();
  expect(task.isFinished).toBeTruthy();
});

it("should run the async task by calling _start()", async () => {
  const taskBody = vi.fn();

  const [taskAwaitable, resumeTask] = createFuture<void>();

  const engine = _createEngine();
  const task = createTask(
    {
      name: "test task",
      async execute() {
        await taskAwaitable;
        taskBody();
      },
    },
    engine,
  );

  const [finished, setFinished] = createFuture<void>();
  task._start(() => setFinished());

  resumeTask();
  await finished;

  expect(taskBody).toHaveBeenCalledOnce();
  expect(task.isFinished).toBeTruthy();
});

it("should not start more than once", () => {
  const taskBody = vi.fn();

  const engine = _createEngine();
  const task = createTask(
    {
      name: "test task",
      execute() {
        taskBody();
      },
    },
    engine,
  );

  task._start(() => {});
  expect(() => {
    task._start(() => {});
  }).toThrowError();
  expect(taskBody).toHaveBeenCalledOnce();
});
