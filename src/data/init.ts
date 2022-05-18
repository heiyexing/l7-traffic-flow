import { FlowItem, LocationItem } from '../types';
import { DataProviderOptions } from './DataProvider';
import { getValueByAccessor, lat2Y, lng2X } from '../utils';

export function initLocationsData(
  originData: any[],
  { getLocationId, getLocationLat, getLocationLng, getLocationWeight }: DataProviderOptions,
): LocationItem[] {
  return originData.map((item) => {
    const lng = +getValueByAccessor<number>(item, getLocationLng);
    const lat = +getValueByAccessor<number>(item, getLocationLat);
    const location: LocationItem = {
      id: String(getValueByAccessor<string>(item, getLocationId)),
      lng,
      lat,
      zoom: Infinity,
      x: lng2X(lng),
      y: lat2Y(lat),
      weight: +getValueByAccessor<number>(item, getLocationWeight),
      data: item,
    };
    return location;
  });
}

export function initFlowsData(originData: any[], options: DataProviderOptions): FlowItem[] {
  return [];
}
