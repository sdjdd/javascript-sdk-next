import {
  EqualConstraint,
  ExistsConstraint,
  NotEqualConstraint,
  NotExistsConstraint,
  OrConstraint,
} from './constraint';

export function equalCommand(value: any): EqualConstraint {
  return new EqualConstraint(value);
}

export function notEqualCommand(value: any): NotEqualConstraint {
  return new NotEqualConstraint(value);
}

export function existsCommand(): ExistsConstraint {
  return new ExistsConstraint();
}

export function notExistsCommand(): NotExistsConstraint {
  return new NotExistsConstraint();
}

export function orCommand(...args: any[]): OrConstraint {
  return new OrConstraint(args);
}
