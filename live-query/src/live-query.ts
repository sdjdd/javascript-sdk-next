import EventEmitter from 'eventemitter3';
import { Realtime } from 'leancloud-realtime/core';
import { LiveQueryPlugin } from 'leancloud-realtime-plugin-live-query';

import { KEY_SUBSCRIPTION_ID } from '../../common/const';
import { App, AuthOptions, Query } from '../../core';

export interface LiveQueryListeners<T> {
  create(object: T): void;
  update(object: T, updatedKeys: string[]): void;
  delete(object: T): void;
  enter(object: T): void;
  leave(object: T): void;
}

export enum LiveQueryState {
  READY = 'READY',
  CONNECTING = 'CONNECTING',
  INIT_CLIENT = 'INIT_CLIENT',
  CONNECTED = 'CONNECTED',
  CLOSING = 'CLOSING',
  CLOSED = 'CLOSED',
}

export class Subscription<T> extends EventEmitter<LiveQueryListeners<T>> {
  private _state = LiveQueryState.READY;
  private _onMessage: (messages: Record<string, any>[]) => void;
  private _onReconnect: () => void;
  private _client: any;
  private _id: string;
  private _query_id: string;

  get state(): LiveQueryState {
    return this._state;
  }

  constructor(public readonly query: Query<T>, private _options?: AuthOptions) {
    super();
  }

  async subscribe(): Promise<this> {
    if (this._state !== LiveQueryState.READY) {
      throw new Error(`订阅失败，当前状态：${this._state}`);
    }
    this._state = LiveQueryState.CONNECTING;

    const { app } = this.query;
    try {
      const subscriptionID = await app.localStorage.getAsync(KEY_SUBSCRIPTION_ID);
      const { id, query_id } = await subscribe(this.query, { ...this._options, subscriptionID });
      this._state = LiveQueryState.INIT_CLIENT;

      if (id !== subscriptionID) {
        await app.localStorage.setAsync(KEY_SUBSCRIPTION_ID, id);
      }
      this._id = id;
      this._query_id = query_id;

      this._onMessage = (messages) => {
        messages.forEach((msg) => {
          if (msg.query_id === query_id) {
            const obj = this.query.decodeObject(msg.object);
            this.emit(msg.op, obj, msg.updatedKeys);
          }
        });
      };
      this._onReconnect = () =>
        subscribe(this.query, { ...this._options, subscriptionID: id })
          .then(() => app.log.info('live-query', { message: 'reconnected', id }))
          .catch((error) => app.log.error('live-query', { message: 'reconnect failed', error }));

      this._client = await createLiveQueryClient(app, id);
      this._client.register(this);
      this._client.on('message', this._onMessage);
      this._client.on('reconnect', this._onReconnect);
      this._state = LiveQueryState.CONNECTED;
      return this;
    } catch (error) {
      app.log.error('live-query', { message: 'something wrong, unsubscribe', error });
      this.unsubscribe();
      throw error;
    }
  }

  async unsubscribe(): Promise<void> {
    if (this._state === LiveQueryState.CONNECTING) {
      this._state = LiveQueryState.CLOSED;
      return;
    }
    if (this._state !== LiveQueryState.INIT_CLIENT && this._state !== LiveQueryState.CONNECTED) {
      throw new Error(`退订失败，当前状态：${this._state}`);
    }
    this._state = LiveQueryState.CLOSING;

    try {
      this._client?.off('message', this._onMessage);
      this._client?.off('reconnect', this._onReconnect);
      this._client?.deregister(this);
      await this.query.app.request(
        {
          method: 'POST',
          path: '/1.1/LiveQuery/unsubscribe',
          body: {
            id: this._id,
            query_id: this._query_id,
          },
        },
        this._options
      );
    } finally {
      this._state = LiveQueryState.CLOSED;
    }
  }
}

function subscribe(
  query: Query<any>,
  options?: AuthOptions & { subscriptionID?: string }
): Promise<{ id: string; query_id: string }> {
  const { app, className, params } = query;
  return app.request(
    {
      method: 'POST',
      path: '/1.1/LiveQuery/subscribe',
      body: {
        id: options?.subscriptionID || undefined,
        query: {
          className,
          where: params.where || {},
          // XXX: 有问题, 待查明: https://github.com/leancloud/javascript-sdk/issues/637
          // keys: (params.keys as string)?.split(','),
          returnACL: params.returnACL || undefined,
        },
      },
    },
    options
  );
}

function getRealtimeInstance(app: App): any {
  if (!app.payload.realtime) {
    app.log.trace('live-query', { message: 'create realtime instance', app });
    app.payload.realtime = new Realtime({
      appId: app.appId,
      appKey: app.appKey,
      server: app.serverURL,
      plugins: [LiveQueryPlugin],
    });
  }
  return app.payload.realtime;
}

function createLiveQueryClient(app: App, subscriptionID: string): Promise<any> {
  return getRealtimeInstance(app).createLiveQueryClient(subscriptionID);
}
