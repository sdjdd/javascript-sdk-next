import castArray from 'lodash/castArray';

interface LCObjectLike {
  className: string;
  id: string;
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
  return { __op: 'Add', objects: castArray(objects) };
}

export function addUnique(objects: any | any[]): Operation {
  return { __op: 'AddUnique', objects: castArray(objects) };
}

export function remove(objects: any | any[]): Operation {
  return { __op: 'Remove', objects: castArray(objects) };
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

function Pointer({ className, id }: { className: string; id: string }) {
  return { __type: 'Pointer', className, objectId: id };
}

export function addRelation(objects: LCObjectLike | LCObjectLike[]): Operation {
  return { __op: 'AddRelation', objects: castArray(objects).map(Pointer) };
}

export function removeRelation(objects: LCObjectLike | LCObjectLike[]): Operation {
  return { __op: 'RemoveRelation', objects: castArray(objects).map(Pointer) };
}
