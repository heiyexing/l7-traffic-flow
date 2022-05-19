// import md5 from 'md5';
import { ILngLat } from '@antv/l7';

export const Count = 100;

export const getLocationId = (() => {
  let id = 1;
  return ({ lng, lat }: ILngLat) => {
    return String(id++);
  };
})();

export const lng2X = (lng: number) => {
  return (lng / 360 + 0.5) * Count;
};

export const lat2Y = (lat: number) => {
  const sin = Math.sin((lat * Math.PI) / 180);
  const y = 0.5 - (0.25 * Math.log((1 + sin) / (1 - sin))) / Math.PI;
  return (y < 0 ? 0 : y > 1 ? 1 : y) * Count;
};

export function x2Lng(x: number) {
  return (x / Count - 0.5) * 360;
}

export function y2Lat(y: number) {
  const y2 = ((180 - (y / Count) * 360) * Math.PI) / 180;
  return (360 * Math.atan(Math.exp(y2))) / Math.PI - 90;
}
