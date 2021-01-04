export interface GeoPointLike {
  latitude: number;
  longitude: number;
}

export interface GeoPoint extends GeoPointLike {
  __type: 'GeoPoint';
}

export function geoPoint(geo: GeoPointLike): GeoPoint {
  return {
    __type: 'GeoPoint',
    latitude: geo.latitude,
    longitude: geo.longitude,
  };
}
