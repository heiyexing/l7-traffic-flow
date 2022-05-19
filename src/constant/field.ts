import { LocationFlowFieldGetter, OdFieldGetter } from '../types';

export const DEFAULT_LOCATION_FLOW_FIELD_GETTER: LocationFlowFieldGetter = {
  getLocationLng: 'lng',
  getLocationLat: 'lat',
  getLocationId: 'id',
  getLocationWeight: 'weight',
  getFlowFromId: 'fromId',
  getFlowToId: 'toId',
  getFlowWeight: 'weight',
  getFlowId: 'id',
};

export const DEFAULT_OD_FIELD_GETTER: OdFieldGetter = {
  getFromLng: 'fromLng',
  getFromLat: 'fromLat',
  getToLng: 'toLng',
  getToLat: 'toLat',
  getWeight: 'weight',
};
