import { adapters, mustGetAdapter } from './adapters';
import { event } from './event';
import { request, upload } from './http';
import { log } from './log';

export interface Module {
  readonly name: string;
  readonly components?: Record<string, any>;
  onLoad?: (runtime: Runtime) => void;
}

export class Runtime {
  readonly adapters = adapters;
  readonly event = event;
  readonly http = { request, upload };
  readonly log = log;
  readonly modules: Record<string, Module> = {};
  getAdapter = mustGetAdapter;
}

export const runtime = new Runtime();

export function use(module: Module): void {
  const { name } = module;
  if (name in runtime.modules) {
    throw new Error(`已导入名为 ${name} 的模块`);
  }

  runtime.modules[name] = module;
  log.trace('module:load', module);
  event.emit('module:load', module);
  module.onLoad?.(runtime);
}
