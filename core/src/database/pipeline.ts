import { App, AuthOptions } from '../app';
import { encodeObjectData, LCObjectData } from './lcobject';

type PipelineRequest =
  | {
      method: 'POST' | 'PUT';
      path: string;
      body: Record<string, any>;
    }
  | {
      method: 'DELETE';
      path: string;
    };

export interface PipelineResult {
  results: any;
  errors: Error[];
}

export class Pipeline {
  private _requests: PipelineRequest[] = [];

  constructor(public readonly app: App) {}

  private _add(className: string, data: LCObjectData): void {
    this._requests.push({
      method: 'POST',
      path: `/1.1/classes/${className}`,
      body: encodeObjectData(data),
    });
  }

  add(className: string, data: LCObjectData | LCObjectData[]): this {
    if (Array.isArray(data)) {
      data.forEach((data) => this._add(className, data));
    } else {
      this._add(className, data);
    }
    return this;
  }

  async commit(options?: AuthOptions): Promise<PipelineResult> {
    const res = (await this.app.request(
      {
        method: 'POST',
        path: '/1.1/batch',
        body: {
          requests: this._requests,
        },
      },
      options
    )) as (
      | {
          error: {
            code: number;
            error: string;
          };
        }
      | { success: Record<string, any> }
    )[];
    return {
      results: res,
      errors: [],
    };
  }
}
