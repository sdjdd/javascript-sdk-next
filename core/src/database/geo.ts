export class GeoPoint {
  public latitude: number;
  public longitude: number;

  constructor(latitude: number, longitude: number);
  constructor(point: { latitude: number; longitude: number });
  constructor(point: any, longitude?: number) {
    if (typeof point === 'number') {
      this.latitude = point;
      this.longitude = longitude;
    } else {
      this.latitude = point.latitude;
      this.longitude = point.longitude;
    }
    if (typeof this.latitude !== 'number') {
      throw new Error('The latitude must be a number');
    }
    if (typeof this.longitude !== 'number') {
      throw new Error('The longitude must be a number');
    }
  }

  toJSON() {
    return this._LC_encode();
  }

  protected _LC_encode() {
    return {
      __type: 'GeoPoint',
      latitude: this.latitude,
      longitude: this.longitude,
    };
  }
}
