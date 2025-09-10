import { expect, vi, it } from "vitest";
import { createEngine } from "../src/index";

it("should invoke attach hook", () => {
  const mockAttach = vi.fn();

  const engine = createEngine();
  engine.use({
    attach: (engine) => {
      mockAttach(engine);
    },
  });

  expect(mockAttach).toHaveBeenCalledWith(engine);
});

it("should invoke create task hooks", () => {
  const events: string[] = [];

  const engine = createEngine();
  engine.use({
    beforeCreateTask: (options, parent) => {
      expect(options.name).toEqual("test task (refined)");
      expect(parent).toBeUndefined();
      events.push("before 1");
    },
    afterCreateTask: (task, parent) => {
      expect(task.options.name).toEqual("test task (refined)");
      expect(parent).toBeUndefined();
      events.push("after 1");
    },
  });
  engine.use({
    beforeCreateTask: (options, parent) => {
      expect(options.name).toEqual("test task");
      expect(parent).toBeUndefined();
      options.name += " (refined)";
      events.push("before 2");
    },
    afterCreateTask: (task, parent) => {
      expect(task.options.name).toEqual("test task (refined)");
      expect(parent).toBeUndefined();
      events.push("after 2");
    },
  });

  engine.createTask({
    name: "test task",
    execute() {},
  });

  expect(events).toEqual(["before 2", "before 1", "after 1", "after 2"]);
});
