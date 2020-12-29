import isUndefined from 'lodash/isUndefined';
import omitBy from 'lodash/omitBy';

import { FormDataPart, HTTPMethod, RequestOptions, Response } from '@leancloud/adapter-types';
import { getAdapter, mustGetAdapter } from './adapter';
import { log } from './runtime';
import { version } from './version';

export interface HTTPRequest {
  method: HTTPMethod;
  url: string;
  header?: Record<string, string | undefined>;
  query?: Record<string, any>;
  body?: any;
}

export interface UploadRequest extends Omit<HTTPRequest, 'body'> {
  file: FormDataPart;
  form?: Record<string, any>;
}

export interface HTTPResponse {
  status: number;
  header?: Record<string, string>;
  body?: any;
}

export interface HTTPRequestOptions {
  onProgress?: RequestOptions['onprogress'];
  abortSignal?: RequestOptions['signal'];
}

export function encodeQuery(query: HTTPRequest['query']): string {
  let str = '';
  Object.entries(query).forEach(([key, value], index) => {
    if (value === undefined) {
      return;
    }
    if (typeof value !== 'string') {
      value = JSON.stringify(value);
    }
    if (index) {
      str += '&';
    }
    str += key + '=' + encodeURIComponent(value);
  });
  return str;
}

export function encodeURL(base: string, query?: HTTPRequest['query']): string {
  if (query) {
    const queryString = encodeQuery(query);
    if (queryString) {
      return base + '?' + queryString;
    }
  }
  return base;
}

function convertResponse(res: Response): HTTPResponse {
  return {
    status: res.status || 200,
    header: res.headers as HTTPResponse['header'],
    body: res.data,
  };
}

let nextId = 1;

export async function doHTTPRequest(
  request: HTTPRequest,
  options?: HTTPRequestOptions
): Promise<HTTPResponse> {
  const doRequest = mustGetAdapter('request');
  const id = nextId++;

  log.trace('http:send', { id, request });

  const url = encodeURL(request.url, request.query);
  const response = await doRequest(url, {
    method: request.method,
    headers: omitBy(request.header, isUndefined),
    data: request.body,
    signal: options?.abortSignal,
    onprogress: options?.onProgress,
  }).then(convertResponse);

  log.trace('http:recv', { id, response });

  return response;
}

export async function upload(
  request: UploadRequest,
  options?: HTTPRequestOptions
): Promise<HTTPResponse> {
  const upload = mustGetAdapter('upload');
  const url = encodeURL(request.url, request.query);
  const id = nextId++;

  log.trace('upload:send', { id, request });

  const response = await upload(url, request.file, {
    ...options,
    method: request.method,
    headers: request.header,
    data: request.form,
  }).then(convertResponse);

  log.trace('upload:recv', { id, response });

  return response;
}

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
