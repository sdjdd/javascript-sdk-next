import debug from 'debug';

export const name = 'debug';

const logger: Record<string, any> = {};

export function onLoad({ eventHub }): void {
  eventHub.on('log', (item) => {
    const ns = `leancloud:${item.module}:${item.action}`;
    if (!logger[ns]) {
      logger[ns] = debug(ns);
    }
    logger[ns]('%O', item.data);
  });
}
