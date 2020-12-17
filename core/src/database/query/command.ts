import {
  EqualConstraint,
  ExistsConstraint,
  NotEqualConstraint,
  NotExistsConstraint,
  OrConstraint,
} from './constraint';

export function eq(value: any): EqualConstraint {
  return new EqualConstraint(value);
}

export function ne(value: any): NotEqualConstraint {
  return new NotEqualConstraint(value);
}

export function exists(): ExistsConstraint {
  return new ExistsConstraint();
}

export function notExists(): NotExistsConstraint {
  return new NotExistsConstraint();
}

export function or(...args: any[]): OrConstraint {
  return new OrConstraint(args);
}
