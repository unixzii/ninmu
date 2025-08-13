import { expect, vi, it } from "vitest";
import { createEngine } from "../src/index";

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

  await new Promise<void>((resolve) => {
    engine.start(() => resolve());
  });

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
