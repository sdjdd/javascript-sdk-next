import { EventEmitter } from 'eventemitter3';

export interface Module {
  name: string;
  components?: Record<string, any>;
  onLoad?: (rtm: typeof runtime) => void;
}

export interface LogItem {
  label: string;
  level: 'trace' | 'info' | 'error';
  data: any | any[];
}

export interface Events {
  'module:load': (name: string) => void;
  log: (logItem: LogItem) => void;
}

class Runtime extends EventEmitter<Events> {
  readonly modules: Record<string, Module> = {};
}

export const runtime = new Runtime();

export function use(module: Module): void {
  const { name } = module;
  if (name in runtime.modules) {
    throw new Error(`已导入名为 ${name} 的模块`);
  }
  runtime.modules[name] = module;
  runtime.emit('module:load', name);
  module.onLoad?.(runtime);
}

export function log(item: LogItem): void {
  runtime.emit('log', item);
}
