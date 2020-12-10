import { EventEmitter } from 'eventemitter3';

export interface Module {
  name: string;
  components?: Record<string, any>;
  onLoad?: (rtm: typeof runtime) => void;
}

export interface Events {
  'module:load': (name: string, modules: Record<string, Module>) => void;
}

const modules: Record<string, Module> = {};

const eventHub = new EventEmitter<Events>();

export const runtime = {
  modules,
  eventHub,
};

export function use(module: Module): void {
  const { name } = module;
  if (name in modules) {
    throw new Error(`已导入名为 ${name} 的模块`);
  }
  modules[name] = module;
  eventHub.emit('module:load', name, modules);
  module.onLoad?.(runtime);
}
