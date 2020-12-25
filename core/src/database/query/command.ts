import {
  AndConstraint,
  EqualConstraint,
  ExistsConstraint,
  GreaterThanConstraint,
  GreaterThanOrEqualConstraint,
  InConstraint,
  LessThanConstraint,
  LessThanOrEqualConstraint,
  NotEqualConstraint,
  NotExistsConstraint,
  OrConstraint,
} from './constraint';

function eq(value: any): EqualConstraint {
  return new EqualConstraint(value);
}

function ne(value: any): NotEqualConstraint {
  return new NotEqualConstraint(value);
}

function gt(value: any): GreaterThanConstraint {
  return new GreaterThanConstraint(value);
}

function gte(value: any): GreaterThanOrEqualConstraint {
  return new GreaterThanOrEqualConstraint(value);
}

function lt(value: any): LessThanConstraint {
  return new LessThanConstraint(value);
}

function lte(value: any): LessThanOrEqualConstraint {
  return new LessThanOrEqualConstraint(value);
}

function exists(): ExistsConstraint {
  return new ExistsConstraint();
}

function notExists(): NotExistsConstraint {
  return new NotExistsConstraint();
}

function or(...args: any[]): OrConstraint {
  return new OrConstraint(args);
}

function and(...args: any[]): AndConstraint {
  return new AndConstraint(args);
}

function _in(value: any): InConstraint {
  return new InConstraint(value);
}

export const queryCommand = {
  eq,
  '==': eq,
  ne,
  '!=': ne,
  gt,
  '>': gt,
  gte,
  '>=': gte,
  lt,
  '<': lt,
  lte,
  '<=': lte,
  exists,
  notExists,
  'not-exists': notExists,
  or,
  and,
  in: _in,
};

export type QueryCommand = typeof queryCommand;
