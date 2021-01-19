import { getAdapter } from './adapters';
import { version } from './version';

let userAgent: string;
export function getUserAgent(): string {
  if (userAgent) {
    return userAgent;
  }
  userAgent = 'LeanCloud-JS-SDK/' + version;
  const platformInfo = getAdapter('platformInfo');
  if (platformInfo) {
    const { name, version } = platformInfo;
    if (name) {
      userAgent += version ? ` (${name}/${version})` : ` (${name})`;
    }
  }
  return userAgent;
}
