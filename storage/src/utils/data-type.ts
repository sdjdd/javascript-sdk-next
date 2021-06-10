export function isBlob(data: any): data is Blob {
  return typeof Blob === 'function' && data instanceof Blob;
}

export function isBuffer(data: any): data is Buffer {
  return typeof Buffer === 'function' && data instanceof Buffer;
}

export function isStream(data: any): boolean {
  try {
    return typeof require === 'function' && data instanceof require('stream');
  } catch {
    return false;
  }
}
