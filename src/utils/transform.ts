import { FlowData, LocationData, OdData } from '../types';
import { getLocationId } from './index';
import { get } from 'lodash';

export const transformOdData = (
  data: any[],
  keyMap: Record<keyof OdData, string | undefined> = {
    f_lng: 'f_lng',
    f_lat: 'f_lat',
    t_lng: 't_lng',
    t_lat: 't_lat',
    value: 'value',
  },
) => {
  const locationMap = new Map<string, string>();
  const locations: LocationData[] = [];
  const flows: FlowData[] = [];
  const {
    f_lng: f_lng_field,
    f_lat: f_lat_field,
    t_lng: t_lng_field,
    t_lat: t_lat_field,
    value: value_field,
  } = keyMap;

  data.forEach((item) => {
    const f_lng = +get(item, f_lng_field ?? 'f_lng', 0);
    const f_lat = +get(item, f_lat_field ?? 'f_lat', 0);
    const t_lng = +get(item, t_lng_field ?? 't_lng', 0);
    const t_lat = +get(item, t_lat_field ?? 't_lat', 0);
    const value = +get(item, value_field ?? 'value', 0);

    const [from_id, to_id] = [
      [f_lng, f_lat],
      [t_lng, t_lat],
    ].map(([lng, lat]) => {
      const key = `${lng},${lat}`;
      let id = locationMap.get(key);
      if (!id) {
        id = getLocationId({ lng, lat });
        locationMap.set(key, id);
      }
      return id;
    });

    flows.push({
      from_id,
      to_id,
      value,
    });
  });

  locationMap.forEach((id, str) => {
    const [lng, lat] = str.split(',');
    locations.push({
      id,
      lng: +lng,
      lat: +lat,
    });
  });

  return {
    locations,
    flows,
  };
};
