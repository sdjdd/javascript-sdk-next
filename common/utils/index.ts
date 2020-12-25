export function ensureArray<T>(value?: T): T extends any[] ? T : T[] {
  if (value === undefined) {
    return [] as any;
  }
  return (Array.isArray(value) ? value : [value]) as any;
}

export function pointer(object: { className: string; id: string }) {
  return {
    __type: 'Pointer',
    className: object.className,
    objectId: object.id,
  };
}
