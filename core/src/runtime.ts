import { EventEmitter } from 'eventemitter3';

export interface Module {
  name: string;
  components?: Record<string, any>;
  onLoad?: (rtm: typeof runtime) => void;
}

export enum LogLevel {
  TRACE = 'TRACE',
  INFO = 'INFO',
  ERROR = 'ERROR',
}

export interface LogItem extends Record<string, any> {
  label: string;
  level?: LogLevel;
  data: any;
}

export interface Events {
  'module:load': (name: string) => void;
  log: (logItem: LogItem) => void;
}

export class Runtime extends EventEmitter<Events> {
  readonly modules: Record<string, Module> = {};
}

export const runtime = new Runtime();

export function use(module: Module): void {
  const { name } = module;
  if (name in runtime.modules) {
    throw new Error(`已导入名为 ${name} 的模块`);
  }

  log.trace('module', module);

  runtime.modules[name] = module;
  runtime.emit('module:load', name);
  module.onLoad?.(runtime);
}

export function getModules(): Record<string, Module> {
  return runtime.modules;
}

export const log = {
  trace: (label: string, data: any, extra?: Record<string, any>) =>
    runtime.emit('log', { level: LogLevel.TRACE, label, data, ...extra }),
  info: (label: string, data: any, extra?: Record<string, any>) =>
    runtime.emit('log', { level: LogLevel.INFO, label, data, ...extra }),
  error: (label: string, data: any, extra?: Record<string, any>) =>
    runtime.emit('log', { level: LogLevel.ERROR, label, data, ...extra }),
};
