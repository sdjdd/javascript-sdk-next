import { ensureArray } from '../../../utils';

interface LCObjectLike {
  className: string;
  id: string;
}
function pointer(object: LCObjectLike) {
  return {
    __type: 'Pointer',
    className: object.className,
    objectId: object.id,
  };
}

export interface Operation {
  __op: string;
  [key: string]: any;
}

export function unset(): Operation {
  return { __op: 'Delete' };
}

export function increment(amount = 1): Operation {
  return { __op: 'Increment', amount };
}

export function decrement(amount = 1): Operation {
  return { __op: 'Decrement', amount };
}

export function add(objects: any | any[]): Operation {
  return { __op: 'Add', objects: ensureArray(objects) };
}

export function addUnique(objects: any | any[]): Operation {
  return { __op: 'AddUnique', objects: ensureArray(objects) };
}

export function remove(objects: any | any[]): Operation {
  return { __op: 'Remove', objects: ensureArray(objects) };
}

export function bitAnd(value: number): Operation {
  return { __op: 'BitAnd', value };
}

export function bitOr(value: number): Operation {
  return { __op: 'BitOr', value };
}

export function bitXor(value: number): Operation {
  return { __op: 'BitXor', value };
}

export function addRelation(objects: LCObjectLike | LCObjectLike[]): Operation {
  return { __op: 'AddRelation', objects: ensureArray(objects).map(pointer) };
}

export function removeRelation(objects: LCObjectLike | LCObjectLike[]): Operation {
  return { __op: 'RemoveRelation', objects: ensureArray(objects).map(pointer) };
}
