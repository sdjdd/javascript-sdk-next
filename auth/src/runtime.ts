import type { Runtime } from '../../core';

export let SDKRuntime: Runtime;

export function setSDKRuntime(runtime: Runtime): void {
  SDKRuntime = runtime;
}
