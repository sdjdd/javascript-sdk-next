export class GeoPoint {
  public readonly latitude: number;
  public readonly longitude: number;

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
  }

  protected _LC_encode() {
    return {
      __type: 'GeoPoint',
      latitude: this.latitude,
      longitude: this.longitude,
    };
  }
}
