import type { Engine } from "./types.js";

export interface InternalEngine extends Engine {}

export function createEngine(): Engine {
  return {
    createTask(options) {
      throw new Error("Not implemented");
    },
    start() {
      throw new Error("Not implemented");
    },
  } satisfies InternalEngine;
}
