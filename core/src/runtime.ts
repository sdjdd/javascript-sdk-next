import { EventEmitter } from 'eventemitter3';
import { Adapters } from '@leancloud/adapter-types';

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
  'adapters:set': (adapters: Record<string, any>) => void;
  log: (logItem: LogItem) => void;
  'module:load': (name: string) => void;
}

export class Runtime extends EventEmitter<Events> {
  readonly modules: Record<string, Module> = {};
  readonly adapters: Partial<Adapters> = {};
}

export const runtime = new Runtime();

export function use(module: Module): void {
  const { name } = module;
  if (name in runtime.modules) {
    throw new Error(`已导入名为 ${name} 的模块`);
  }

  log.trace('load module', module);

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

export function setAdapters(adapters: Partial<Adapters>): void {
  Object.assign(runtime.adapters, adapters);
  runtime.emit('adapters:set', adapters);
}

export function getAdapter<T extends keyof Adapters>(name: T): Partial<Adapters>[T] {
  return runtime.adapters[name];
}

export function mustGetAdapter<T extends keyof Adapters>(name: T): Adapters[T] | never {
  const adapter = getAdapter(name);
  if (!adapter) {
    throw new Error(`未设置 adapter ${name}`);
  }
  return adapter as Adapters[T];
}
