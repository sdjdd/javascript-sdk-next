import debug from 'debug';

export const name = 'debug';

const logger: Record<string, any> = {};

export function onLoad(runtime): void {
  runtime.on('log', (item) => {
    const ns = `LC:${item.label}`;
    if (!logger[ns]) {
      logger[ns] = debug(ns);
    }
    logger[ns]('%O', item.data);
  });
}

export const enable = debug.enable;
export const disable = debug.disable;
