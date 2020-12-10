import { Adapters } from '@leancloud/adapter-types';
import { EventEmitter } from 'eventemitter3';

import { setAdapters } from './adapters';
import { App, AppConfig } from './app';

export interface Module {
  name: string;
  components?: Record<string, any>;
  onLoad?: (env: any) => void;
}

export interface LeanCloudEvents {
  'module:load': (name: string, modules: Record<string, Module>) => void;
}

export class LeanCloud extends EventEmitter<LeanCloudEvents> {
  readonly apps: App[] = [];
  readonly modules: Record<string, Module> = {};

  init(appConfig: AppConfig): App {
    const app = new App(appConfig);
    this.apps.push(app);
    return app;
  }

  use(module: Module): void {
    const { name } = module;
    if (name in this.modules) {
      throw new Error(`已导入名为 ${name} 的模块`);
    }
    this.modules[name] = module;
    module.onLoad?.(this);
    this.emit('module:load', name, this.modules);
  }

  setAdapters(adapters: Partial<Adapters>): void {
    setAdapters(adapters);
  }
}
