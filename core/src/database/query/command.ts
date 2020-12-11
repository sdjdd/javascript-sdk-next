import {
  Constraint,
  EqualConstraint,
  isConstraint,
  NotEqualConstraint,
  OrConstraint,
} from './constraint';

export function equalCommand(value: any): EqualConstraint {
  return new EqualConstraint(value);
}

export function notEqualCommand(value: any): NotEqualConstraint {
  return new NotEqualConstraint(value);
}

export function orCommand(constraints: Constraint[]): OrConstraint;
export function orCommand(conditions: Record<string, Constraint>[]): Record<string, Constraint>[];
export function orCommand(args: any[]): any {
  if (!Array.isArray(args)) {
    throw new TypeError('The or command expect an array parameter');
  }
  if (args.length === 0) {
    return args;
  }
  if (isConstraint(args[0])) {
    args.forEach((item, index) => {
      if (!isConstraint(item)) {
        throw new Error(`Element ${index} is not Constraint`);
      }
    });
    return new OrConstraint(args);
  }
  return args;
}
