import {
  AndConstraint,
  ContainsAllConstraint,
  EqualConstraint,
  ExistsConstraint,
  GreaterThanConstraint,
  GreaterThanOrEqualConstraint,
  InConstraint,
  LessThanConstraint,
  LessThanOrEqualConstraint,
  MatchesConstraint,
  MatchesKeyConstraint,
  MatchesQueryConstraint,
  NotEqualConstraint,
  NotExistsConstraint,
  NotInConstraint,
  NotMatchesKeyConstraint,
  NotMatchesQueryConstraint,
  OrConstraint,
  RegExpLike,
  SizeEqualConstraint,
} from './constraint';
import type { Query } from './query';

function eq(value?: any): EqualConstraint | undefined {
  if (value === undefined) {
    return undefined;
  }
  return new EqualConstraint(value);
}

function ne(value?: any): NotEqualConstraint | undefined {
  if (value === undefined) {
    return undefined;
  }
  return new NotEqualConstraint(value);
}

function gt(value?: any): GreaterThanConstraint | undefined {
  if (value === undefined) {
    return undefined;
  }
  return new GreaterThanConstraint(value);
}

function gte(value?: any): GreaterThanOrEqualConstraint | undefined {
  if (value === undefined) {
    return undefined;
  }
  return new GreaterThanOrEqualConstraint(value);
}

function lt(value?: any): LessThanConstraint | undefined {
  if (value === undefined) {
    return undefined;
  }
  return new LessThanConstraint(value);
}

function lte(value?: any): LessThanOrEqualConstraint | undefined {
  if (value === undefined) {
    return undefined;
  }
  return new LessThanOrEqualConstraint(value);
}

function exists(): ExistsConstraint {
  return new ExistsConstraint();
}

function notExists(): NotExistsConstraint {
  return new NotExistsConstraint();
}

function sizeIs(size?: number): SizeEqualConstraint | undefined {
  if (size === undefined) {
    return undefined;
  }
  return new SizeEqualConstraint(size);
}

// XXX: 这里直接把类型限制为 Query<any> , 可考虑进一步放宽
function _in(
  value?: any[] | Query<any>
): InConstraint | MatchesKeyConstraint | MatchesQueryConstraint | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return new InConstraint(value);
  }
  const { className, params } = value;
  const keys = params.keys as string;
  if (keys) {
    if (keys.includes(',')) {
      // TODO: 表述的更加明确一些
      throw new Error('使用子查询时，只能包含一个 key');
    }
    return new MatchesKeyConstraint(className, keys, params.where);
  }
  return new MatchesQueryConstraint(className, params.where);
}

function notIn(
  value?: any[] | Query<any>
): NotInConstraint | NotMatchesKeyConstraint | NotMatchesQueryConstraint | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return new NotInConstraint(value);
  }
  const { className, params } = value;
  const keys = params.keys as string;
  if (keys) {
    if (keys.includes(',')) {
      throw new Error('使用子查询时，只能包含一个 key');
    }
    return new NotMatchesKeyConstraint(className, keys, params.where);
  }
  return new NotMatchesQueryConstraint(className, params.where);
}

function matches(regexp?: string | RegExpLike): MatchesConstraint | undefined {
  if (regexp === undefined) {
    return undefined;
  }
  return new MatchesConstraint(regexp);
}

function quote(s: string): string {
  return '\\Q' + s.replace('\\E', '\\E\\\\E\\Q') + '\\E';
}

function contains(s?: string): MatchesConstraint | undefined {
  if (s === undefined) {
    return undefined;
  }
  return matches(quote(s));
}

function containsAll(values?: any[]): ContainsAllConstraint | undefined {
  if (values === undefined) {
    return undefined;
  }
  return new ContainsAllConstraint(values);
}

function or(...args: any[]): OrConstraint | undefined {
  if (args.length === 0) {
    return undefined;
  }
  return new OrConstraint(args);
}

function and(...args: any[]): AndConstraint | undefined {
  if (args.length === 0) {
    return undefined;
  }
  return new AndConstraint(args);
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
  sizeIs,
  'size-is': sizeIs,
  in: _in,
  notIn,
  'not-in': notIn,
  matches,
  contains,
  containsAll,
  'contains-all': containsAll,
  // TODO: 补充地理位置查询命令
  or,
  and,
};

export type QueryCommand = typeof queryCommand;
