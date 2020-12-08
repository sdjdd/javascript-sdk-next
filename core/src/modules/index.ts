import { Module } from '../../../types/module';
import { App } from '../app';

const MODULES: Record<string, Module> = {
  core: {
    name: 'core',
    components: { App },
  },
};

const AFTER_MODULES: Record<string, Module[]> = {};

export function use(module: Module): void {
  if (module.after && !MODULES[module.after]) {
    if (!AFTER_MODULES[module.after]) {
      AFTER_MODULES[module.after] = [];
    }
    AFTER_MODULES[module.after].push(module);
    return;
  }

  if (module.name in MODULES) {
    throw new Error(`Cannot use ${module.name} module twice`);
  }

  MODULES[module.name] = module;
  module.onLoad?.({ modules: MODULES });

  if (AFTER_MODULES[module.name]) {
    AFTER_MODULES[module.name].forEach(use);
    AFTER_MODULES[module.name] = [];
  }
}
