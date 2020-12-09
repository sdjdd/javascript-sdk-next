import type { App } from '../../core';
import { LCClass } from './class';
import { equalCommand, notEqualCommand, orCommand } from './query/command';

export class Database {
  readonly queryCommand = {
    eq: equalCommand,
    ne: notEqualCommand,
    or: orCommand,
  };

  constructor(public readonly app: App) {}

  class(name: string): LCClass {
    return new LCClass(this.app, name);
  }
}
