import debug from 'debug';

export const name = 'debug';

const logger: Record<string, any> = {};

export function onLoad(runtime): void {
  runtime.on('log', (item) => {
    const ns = `leancloud:${item.label}`;
    if (!logger[ns]) {
      logger[ns] = debug(ns);
    }
    logger[ns]('%O', item.data);
  });
}

export { debug };
