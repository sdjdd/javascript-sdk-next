import { App, AuthOptions, RequestTask } from './core';

export interface Pointer {
  __type: 'Pointer';
  className: string;
  objectId: string;
}

export interface Database {
  readonly app: App;
  class(name: string): Class;
}

export interface Query {
  readonly app: App;
}

export interface AddObjectOptions extends AuthOptions {
  fetch?: boolean;
}

export interface GetObjectOptions extends AuthOptions {
  keys?: string[];
  include?: string[];
  returnACL?: boolean;
}

export interface UpdateObjectOptions extends AuthOptions {
  fetch?: boolean;
  query?: any; // TODO
}

export interface Class extends Query {
  object(id: string): LCObject;
  add(data: Record<string, any>, options?: AddObjectOptions): RequestTask<LCObject>;
}

export interface LCObject {
  readonly app: App;
  get(options?: GetObjectOptions): RequestTask<LCObject>;
  update(data: Record<string, any>, options?: UpdateObjectOptions): RequestTask<LCObject>;
  delete(options?: AuthOptions): RequestTask<void>;
}
