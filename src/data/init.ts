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

export function initFlowsData(
  originData: any[],
  locations: LocationItem[],
  { getFlowId, getFlowFromId, getFlowToId, getFlowWeight }: DataProviderOptions,
): FlowItem[] {
  const locationMap = new Map(locations.map((location) => [location.id, location]));
  return originData
    .map((item) => {
      const fromId = String(getValueByAccessor<string>(item, getFlowFromId));
      const toId = String(getValueByAccessor<string>(item, getFlowToId));
      const fromLocation = locationMap.get(fromId);
      const toLocation = locationMap.get(toId);
      if (!fromLocation || !toLocation) {
        return undefined;
      }
      const flow: FlowItem = {
        id: String(getValueByAccessor<string>(item, getFlowId)),
        fromId: String(getValueByAccessor<string>(item, getFlowFromId)),
        toId: String(getValueByAccessor<string>(item, getFlowToId)),
        fromLat: fromLocation.lat,
        fromLng: fromLocation.lng,
        toLat: toLocation.lat,
        toLng: toLocation.lng,
        data: item,
        isCluster: false,
        weight: +getValueByAccessor<number>(item, getFlowWeight),
        zoom: Infinity,
      };
      return flow;
    })
    .filter((flow) => !!flow) as FlowItem[];
}
