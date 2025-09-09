# Ninmu

A simple environment-agnostic library for managing async tasks. Ninmu (任務) is the Japanese word for "task".

**Highlights:**

- Easy to integrate with any application
- Minimal bundle size (down to 2kb after gzipped)
- Self-contained package without dependencies
- Flexible and extensible

## Getting Started

Install Ninmu using npm:

```bash
npm i ninmu
```

Then, create an engine:

```javascript
import { createEngine } from 'ninmu';

const engine = createEngine();
```

And create your tasks:

```javascript
const greetingTask = engine.createTask({
  name: 'greeting',
  // Both sync and async tasks are supported.
  async execute() {
    console.log('Hello, world!');
  }
});

const farewellTask = engine.createTask({
  name: 'farewell',
  // You can specify some tasks as dependencies.
  dependencies: [greetingTask],
  execute() {
    console.log('Bye!');
  }
});
```

Finally, start the engine:

```javascript
engine.start();
```

### Under the hood

Ninmu has two primary types: `Task` and `Engine`. `Task` represents an individual unit of work, while `Engine` manages the execution of these tasks. `Task` can have dependencies, which are the tasks that must be completed before the task itself can be executed. In the above example, `farewellTask` depends on `greetingTask`, meaning `farewellTask` will only be executed after `greetingTask` has finished.

`Engine` schedules the execution of tasks for you. So you can just create tasks and let the engine handle the rest.

Tasks are executed in parallel by default, but you can utilize dependencies to implement sequential execution — i.e., make every task depend on the last one. There are not many restrictions or preset behaviors, which allows you to use it flexibly to fit your specific needs.

## Advanced Usage

### Observe task status

`Task` and `Engine` exposes various events that you can listen to. For example, do something when a task is failed:

```javascript
task.onFail((err) => {
  console.log('Task failed:', err);
});
```

You can also observe all tasks' status via `Engine.onUpdate`:

```javascript
engine.onUpdate((task) => {
  console.log(`Task "${task.options.name}" updated`);
});
```

### Pass arguments

Task's `execute` method doesn't accept any arguments. If your task needs some arguments, you can capture them in `execute` closure when creating the task:

```javascript
function createGreetingTask(engine, person) {
  return engine.createTask({
    name: 'greeting',
    async execute() {
      console.log(`Hello, ${person}!`);
    }
  });
}
```

### More

See [tests](./tests) or type definitions for more.

## License

Licensed under MIT License, see [LICENSE](./LICENSE) for more information.
