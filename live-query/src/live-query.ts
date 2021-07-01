import EventEmitter from 'eventemitter3';
import { Realtime } from 'leancloud-realtime/core';
import { LiveQueryPlugin } from 'leancloud-realtime-plugin-live-query';

import { App, AuthOptions, Query } from '../../core';

export const KEY_SUBSCRIPTION_ID = 'subscription_id';

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
  ABORTING = 'ABORTING',
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
  private _subscribeTask: Promise<this>;
  private _unsubscribeTask: Promise<void>;

  get state(): LiveQueryState {
    return this._state;
  }

  constructor(public readonly query: Query<T>, private _options?: AuthOptions) {
    super();
  }

  private async _subscribe(): Promise<this> {
    const { app } = this.query;

    this._state = LiveQueryState.CONNECTING;
    const subscriptionID = await app.localStorage.getAsync(KEY_SUBSCRIPTION_ID);
    const { id, query_id } = await this._sendSubscribeRequest({
      ...this._options,
      subscriptionID,
    });
    try {
      if (id !== subscriptionID) {
        await app.localStorage.setAsync(KEY_SUBSCRIPTION_ID, id);
      }
      this._id = id;
      this._query_id = query_id;
      if (this._state !== LiveQueryState.CONNECTING) {
        throw new Error('Subscribe aborted');
      }
    } catch (error) {
      await this._sendUnsebscribeRequest(id, query_id);
      throw error;
    }

    try {
      this._state = LiveQueryState.INIT_CLIENT;
      this._onMessage = (messages) => {
        messages.forEach((msg) => {
          if (msg.query_id === query_id) {
            const obj = this.query.decodeObject(msg.object);
            this.emit(msg.op, obj, msg.updatedKeys);
          }
        });
      };
      this._onReconnect = () => {
        this._sendSubscribeRequest({ ...this._options, subscriptionID: id })
          .then(() => app.log.info('live-query', { message: 'reconnected', id }))
          .catch((error) => app.log.error('live-query', { message: 'reconnect failed', error }));
      };
      this._client = await createLiveQueryClient(app, id);
      this._client.register(this);
      this._client.on('message', this._onMessage);
      this._client.on('reconnect', this._onReconnect);
      if (this._state !== LiveQueryState.INIT_CLIENT) {
        throw new Error('Subscribe aborted');
      }
    } catch (error) {
      this._removeClient();
      await this._sendUnsebscribeRequest(id, query_id);
      throw error;
    }

    this._state = LiveQueryState.CONNECTED;
    return this;
  }

  subscribe(): Promise<this> {
    switch (this._state) {
      case LiveQueryState.READY:
        this._subscribeTask = this._subscribe();
        return this._subscribeTask;
      case LiveQueryState.CONNECTING:
      case LiveQueryState.INIT_CLIENT:
      case LiveQueryState.CONNECTED:
        return this._subscribeTask;
      default:
        throw new Error(`Failed to subscribe, current state: ${this._state}`);
    }
  }

  private _removeClient() {
    if (this._client) {
      this._client.off('message', this._onMessage);
      this._client.off('reconnect', this._onReconnect);
      this._client.deregister(this);
      this._client = null;
    }
  }

  private async _sendSubscribeRequest(
    options?: AuthOptions & { subscriptionID?: string }
  ): Promise<{ id: string; query_id: string }> {
    const { app, className, params } = this.query;
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

  private async _sendUnsebscribeRequest(id = this._id, query_id = this._query_id) {
    if (id && query_id) {
      await this.query.app.request(
        {
          method: 'POST',
          path: '/1.1/LiveQuery/unsubscribe',
          body: { id, query_id },
        },
        this._options
      );
    }
  }

  private async _unsubscribe(): Promise<void> {
    this._state = LiveQueryState.CLOSING;
    try {
      this._removeClient();
      await this._sendUnsebscribeRequest();
    } finally {
      this._state = LiveQueryState.CLOSED;
    }
  }

  async unsubscribe(): Promise<void> {
    switch (this._state) {
      case LiveQueryState.READY:
        this._state = LiveQueryState.CLOSED;
        return;
      case LiveQueryState.CONNECTING:
      case LiveQueryState.INIT_CLIENT:
        this._state = LiveQueryState.ABORTING;
        return;
      case (this._state = LiveQueryState.ABORTING):
        return;
      case LiveQueryState.CONNECTED:
        this._unsubscribeTask = this._unsubscribe();
        return this._unsubscribeTask;
      case LiveQueryState.CLOSING:
        return this._unsubscribeTask;
      case LiveQueryState.CLOSED:
        return;
    }
  }
}

function getRealtimeInstance(app: App): any {
  if (!app.payload.realtime) {
    app.log.trace('live-query', { message: 'create realtime instance' });
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
