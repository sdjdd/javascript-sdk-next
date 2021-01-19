import { event } from './event';

export enum LogLevel {
  TRACE = 'TRACE',
  INFO = 'INFO',
  ERROR = 'ERROR',
}

export interface LogItem {
  label: string;
  level: LogLevel;
  data: Record<string, any>;
}

export const log = {
  trace: (label: string, data: Record<string, any>) =>
    event.emit('log', { level: LogLevel.TRACE, label, data }),
  info: (label: string, data: Record<string, any>) =>
    event.emit('log', { level: LogLevel.INFO, label, data }),
  error: (label: string, data: Record<string, any>) =>
    event.emit('log', { level: LogLevel.ERROR, label, data }),
};
