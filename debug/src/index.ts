import debug from 'debug';

import type { Runtime } from '../../core';

const logger: Record<string, any> = {};

let SDKRuntime: Runtime;

export const debugModule = {
  name: 'debug',
  onLoad: (runtime: Runtime): void => {
    SDKRuntime = runtime;
    runtime.event.on('log', (item) => {
      const ns = `LC:${item.label}`;
      if (!logger[ns]) {
        logger[ns] = debug(ns);
      }
      logger[ns]('%O', item.data);
    });
  },
  enable: (namespace: string, modules = false): void => {
    debug.enable(namespace);
    if (modules && SDKRuntime) {
      Object.values(SDKRuntime.modules).forEach((module) => {
        if (typeof module.components?.debug?.enable === 'function') {
          module.components.debug.enable(namespace);
        }
      });
    }
  },
  disable: (modules = false): void => {
    debug.disable();
    if (modules && SDKRuntime) {
      Object.values(SDKRuntime.modules).forEach((module) => {
        if (typeof module.components?.debug?.disable === 'function') {
          module.components.debug.disable();
        }
      });
    }
  },
};
