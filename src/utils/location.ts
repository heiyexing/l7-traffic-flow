import md5 from 'md5';
import { ILngLat } from '@antv/l7';

export const getLocationId = ({ lng, lat }: ILngLat) => {
  return md5(`${lng},${lat}`);
};
