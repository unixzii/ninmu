import { expect, vi, it } from "vitest";
import { createTask } from "../src/task.js";
import { _createEngine } from "../src/engine.js";

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

  const engine = _createEngine();
  const task = createTask(
    {
      name: "test task",
      async execute() {
        await new Promise<void>((resolve) => {
          setTimeout(() => resolve(), 5);
        });
        taskBody();
      },
    },
    engine,
  );

  await new Promise<void>((resolve) => {
    task._start(() => resolve());
  });

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
