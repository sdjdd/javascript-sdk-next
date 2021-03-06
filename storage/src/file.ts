import { App, DeleteObjectOptions, EncodeOptions, LCObject } from '../../core';

export class LCFile {
  constructor(private _object: LCObject) {}

  get app() {
    return this._object.app;
  }
  get className() {
    return '_File';
  }
  get id() {
    return this._object.id;
  }
  get data() {
    return this._object.data;
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

  static fromJSON(app: App, data: any): LCFile {
    return new LCFile(app.database().decodeObject(data, '_File'));
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

  delete(options?: DeleteObjectOptions): Promise<void> {
    return this.app.database().class(this.className).object(this.id).delete(options);
  }

  toJSON() {
    return this._object.toJSON();
  }

  protected _LC_encode(options?: EncodeOptions) {
    // @ts-ignore
    const encoded = this._object._LC_encode(options);
    if (encoded.__type === 'Object') {
      encoded.__type = 'File';
    }
    return encoded;
  }

  protected _isLCObject = true;
}
