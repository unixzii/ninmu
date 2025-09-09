import { expect, vi, it } from "vitest";
import { type InternalTask, createTask } from "../src/task";
import { type InternalEngine, createEngine } from "../src/engine";
import { createFuture, waitMicrotask } from "./utils";

function createInternalEngine() {
  return createEngine() as InternalEngine;
}

it("createTask should always succeed", () => {
  const engine = createInternalEngine();
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

  const engine = createInternalEngine();
  const task = createTask(
    {
      name: "test task",
      execute() {
        taskBody();
      },
    },
    engine,
  );
  task.onFinish(cb);
  task._start();

  expect(taskBody).toHaveBeenCalledOnce();
  expect(cb).toHaveBeenCalledOnce();
  expect(task.isFinished).toBeTruthy();
});

it("should run the async task by calling _start()", async () => {
  const taskBody = vi.fn();

  const [taskAwaitable, resumeTask] = createFuture<void>();

  const engine = createInternalEngine();
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
  task.onFinish(() => setFinished());
  task._start();

  resumeTask();
  await finished;

  expect(taskBody).toHaveBeenCalledOnce();
  expect(task.isFinished).toBeTruthy();
});

it("should run throwing task safely", () => {
  const cb = vi.fn();
  const mockErr = new Error("mock error");

  const engine = createInternalEngine();
  const task = createTask(
    {
      name: "test task",
      execute() {
        throw mockErr;
      },
    },
    engine,
  );
  task.onFail(cb);
  task._start();

  expect(cb).toHaveBeenCalledWith(mockErr);
  expect(task.isFailed).toBeTruthy();
});

it("should run throwing async task safely", async () => {
  const mockErr = new Error("mock error");

  const engine = createInternalEngine();
  const task = createTask(
    {
      name: "test task",
      async execute() {
        await waitMicrotask();
        throw mockErr;
      },
    },
    engine,
  );

  const [failed, setFailed] = createFuture<unknown>();
  task.onFail(setFailed);
  task._start();

  expect(await failed).toEqual(mockErr);
  expect(task.isFailed).toBeTruthy();
});

it("should not start more than once", () => {
  const taskBody = vi.fn();

  const engine = createInternalEngine();
  const task = createTask(
    {
      name: "test task",
      execute() {
        taskBody();
      },
    },
    engine,
  );

  task._start();
  expect(() => {
    task._start();
  }).toThrowError();
  expect(taskBody).toHaveBeenCalledOnce();
});

it("should has correct state", async () => {
  const [taskAwaitable, resumeTask] = createFuture<void>();

  const engine = createInternalEngine();
  const task = createTask(
    {
      name: "test task",
      async execute() {
        await taskAwaitable;
      },
    },
    engine,
  );

  expect(task.isStarted).toBe(false);
  expect(task.isRunning).toBe(false);
  expect(task.isFinished).toBe(false);

  task._start();

  expect(task.isStarted).toBe(true);
  expect(task.isRunning).toBe(true);
  expect(task.isFinished).toBe(false);

  resumeTask();
  await waitMicrotask();

  expect(task.isStarted).toBe(true);
  expect(task.isRunning).toBe(false);
  expect(task.isFinished).toBe(true);
});

it("isTreeFinished() should have correct value", async () => {
  const [taskAwaitable, resumeTask] = createFuture<void>();

  const engine = createInternalEngine();
  const parentTask = createTask(
    {
      name: "parent task",
      execute() {},
    },
    engine,
  );
  const childTask = parentTask.createTask({
    name: "child task",
    async execute() {
      await taskAwaitable;
    },
  }) as InternalTask;

  parentTask._start();
  childTask._start();

  expect(parentTask.isFinished).toBe(true);
  expect(parentTask.isTreeFinished()).toBe(false);

  resumeTask();
  await waitMicrotask();

  expect(parentTask.isTreeFinished()).toBe(true);
});

it("should execute with correct context", () => {
  const taskBody = vi.fn();

  const engine = createInternalEngine();
  const task = createTask(
    {
      name: "test task",
      execute() {
        taskBody(this);
      },
    },
    engine,
  );

  task._start();

  expect(taskBody).toHaveBeenCalledWith(task);
});
