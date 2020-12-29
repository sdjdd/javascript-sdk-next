import { App, AuthOptions, LCObject } from '../../core';

export class LCFile {
  rawData: Record<string, any>;
  data: Record<string, any>;

  get className(): string {
    return '_File';
  }
  get name(): string {
    return this.data.name;
  }
  get url(): string {
    return this.data.url;
  }
  get size(): number | undefined {
    return this.data.metaData?.size;
  }
  get mime(): string {
    return this.data.mime_type;
  }

  constructor(public readonly app: App, public readonly id: string) {}

  static fromLCObject(object: LCObject): LCFile {
    const file = new LCFile(object.app, object.id);
    file.rawData = object.rawData;
    file.data = object.data;
    return file;
  }

  static fromJSON(app: App, data: any): LCFile {
    return LCFile.fromLCObject(app.database().decodeObject(data, '_File'));
  }

  thumbnailURL(
    width: number,
    height: number,
    quality = 100,
    scaleToFit = true,
    format = 'png'
  ): string {
    const mode = scaleToFit ? 2 : 1;
    return this.url + `?imageView/${mode}/w/${width}/h/${height}/q/${quality}/format/${format}`;
  }

  delete(options?: AuthOptions): Promise<void> {
    return this.app.database().class(this.className).object(this.id).delete(options);
  }
}
