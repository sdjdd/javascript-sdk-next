import {
  AndConstraint,
  EqualConstraint,
  ExistsConstraint,
  GreaterThanConstraint,
  GreaterThanOrEqualConstraint,
  LessThanConstraint,
  LessThanOrEqualConstraint,
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

export function gt(value: any): GreaterThanConstraint {
  return new GreaterThanConstraint(value);
}

export function gte(value: any): GreaterThanOrEqualConstraint {
  return new GreaterThanOrEqualConstraint(value);
}

export function lt(value: any): LessThanConstraint {
  return new LessThanConstraint(value);
}

export function lte(value: any): LessThanOrEqualConstraint {
  return new LessThanOrEqualConstraint(value);
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

export function and(...args: any[]): AndConstraint {
  return new AndConstraint(args);
}
