import { InConstraint } from './constraint';
import * as command from './command';

export const queryCommand = {
  ...command,
  in: (value: any) => new InConstraint(value),
};

export * from './query';
