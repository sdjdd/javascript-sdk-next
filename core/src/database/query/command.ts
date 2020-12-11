import { EqualConstraint, NotEqualConstraint, OrConstraint } from './constraint';

export function equalCommand(value: any): EqualConstraint {
  return new EqualConstraint(value);
}

export function notEqualCommand(value: any): NotEqualConstraint {
  return new NotEqualConstraint(value);
}

export function orCommand(...args: any[]): OrConstraint {
  return new OrConstraint(args);
}
