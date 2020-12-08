export type IQuery = Record<string, string | number | boolean | undefined>;

export function encodeQuery(query: IQuery): string {
  let str = '';
  Object.entries(query).forEach(([key, value], index) => {
    if (value === undefined) {
      return;
    }

    if (index) {
      str += '&';
    }
    str += key + '=' + encodeURIComponent(value);
  });
  return str;
}
