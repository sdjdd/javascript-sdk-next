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

function sizeIs(size: number): SizeEqualConstraint {
  return new SizeEqualConstraint(size);
}

// XXX: 这里直接把类型限制为 Query<unknown> , 可考虑进一步放宽
function _in(
  value: any[] | Query<unknown>
): InConstraint | MatchesKeyConstraint | MatchesQueryConstraint {
  if (Array.isArray(value)) {
    return new InConstraint(value);
  }
  const { className, params, condition } = value;
  const keys = params.keys as string;
  if (keys) {
    if (keys.includes(',')) {
      // TODO: 表述的更加明确一些
      throw new Error('使用子查询时，只能包含一个 key');
    }
    return new MatchesKeyConstraint(className, keys, condition);
  }
  return new MatchesQueryConstraint(className, condition);
}

function notIn(
  value: any[] | Query<unknown>
): NotInConstraint | NotMatchesKeyConstraint | NotMatchesQueryConstraint {
  if (Array.isArray(value)) {
    return new NotInConstraint(value);
  }
  const { className, params, condition } = value;
  const keys = params.keys as string;
  if (keys) {
    if (keys.includes(',')) {
      throw new Error('使用子查询时，只能包含一个 key');
    }
    return new NotMatchesKeyConstraint(className, keys, condition);
  }
  return new NotMatchesQueryConstraint(className, condition);
}

function matches(regexp: string | RegExpLike): MatchesConstraint {
  return new MatchesConstraint(regexp);
}

function quote(s: string): string {
  return '\\Q' + s.replace('\\E', '\\E\\\\E\\Q') + '\\E';
}

function contains(s: string): MatchesConstraint {
  return matches(quote(s));
}

function containsAll(values: any[]): ContainsAllConstraint {
  return new ContainsAllConstraint(values);
}

function or(...args: any[]): OrConstraint {
  return new OrConstraint(args);
}

function and(...args: any[]): AndConstraint {
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
