import { expect, vi, it } from "vitest";
import { createEngine } from "../src/index";
import { createFuture, waitMicrotask } from "./utils";

it("should run all tasks", async () => {
  const taskBody1 = vi.fn();
  const taskBody2 = vi.fn();
  const taskBody3 = vi.fn();

  const engine = createEngine();
  engine.createTask({
    name: "task 1",
    execute() {
      taskBody1();
    },
  });
  engine.createTask({
    name: "task 2",
    execute() {
      taskBody2();
    },
  });
  engine.createTask({
    name: "task 3",
    execute() {
      taskBody3();
    },
  });

  const [finished, setFinished] = createFuture<void>();
  engine.onEnd(setFinished);
  engine.start();

  await finished;

  expect(taskBody1).toHaveBeenCalledOnce();
  expect(taskBody2).toHaveBeenCalledOnce();
  expect(taskBody3).toHaveBeenCalledOnce();
});

it("should not start more than once", () => {
  const taskBody = vi.fn();

  const engine = createEngine();
  engine.createTask({
    name: "test task",
    execute() {
      taskBody();
    },
  });

  engine.start();
  expect(() => engine.start()).toThrowError();
  expect(taskBody).toHaveBeenCalledOnce();
});

it("should handle dependencies correctly", async () => {
  const taskBody1 = vi.fn();
  const taskBody2 = vi.fn();
  const taskBody3 = vi.fn();

  const [taskAwaitable, resumeTask] = createFuture<void>();

  const engine = createEngine();
  engine.createTask({
    name: "task 1",
    execute() {
      taskBody1();
    },
  });
  const task2 = engine.createTask({
    name: "task 2",
    async execute() {
      await taskAwaitable;
      taskBody2();
    },
  });
  engine.createTask({
    name: "task 3",
    dependencies: [task2],
    execute() {
      taskBody3();
    },
  });

  const [finished, setFinished] = createFuture<void>();
  engine.onEnd(setFinished);
  engine.start();

  await waitMicrotask();

  // Task 3 must wait for task 2 to complete.
  expect(taskBody3).toBeCalledTimes(0);
  resumeTask();

  await finished;

  expect(taskBody1).toHaveBeenCalledOnce();
  expect(taskBody2).toHaveBeenCalledOnce();
  expect(taskBody3).toHaveBeenCalledOnce();
});

it("should abort when some task fails", async () => {
  const taskBody1 = vi.fn();
  const taskBody3 = vi.fn();

  const engine = createEngine();
  engine.createTask({
    name: "task 1",
    execute() {
      taskBody1();
    },
  });
  const task2 = engine.createTask({
    name: "task 2",
    async execute() {
      throw new Error("mock error");
    },
  });
  engine.createTask({
    name: "task 3",
    dependencies: [task2],
    execute() {
      taskBody3();
    },
  });

  const onError = vi.fn();
  const [finished, setFinished] = createFuture<void>();
  engine.onError(onError);
  engine.onEnd(setFinished);
  engine.start();

  await finished;

  expect(onError).toHaveBeenCalledWith(task2);
  expect(taskBody1).toHaveBeenCalledOnce();
  expect(taskBody3).toBeCalledTimes(0);
});

it("should handle child tasks correctly", async () => {
  const taskBody = vi.fn();
  const [taskAwaitable, resumeTask] = createFuture<void>();

  const engine = createEngine();
  const parentTask = engine.createTask({
    name: "parent task",
    execute() {},
  });
  const childTask = parentTask.createTask({
    name: "child task",
    execute() {},
  });
  childTask.createTask({
    name: "grandchild task",
    async execute() {
      await taskAwaitable;
    },
  });
  engine.createTask({
    name: "test task",
    dependencies: [parentTask],
    execute() {
      taskBody();
    },
  });

  const [finished, setFinished] = createFuture<void>();
  engine.onEnd(setFinished);
  engine.start();

  await waitMicrotask();

  expect(taskBody).toBeCalledTimes(0);

  resumeTask();
  await finished;

  expect(taskBody).toHaveBeenCalledOnce();
});
