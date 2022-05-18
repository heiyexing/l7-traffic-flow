import { Accessor, OdFieldGetter, TransFlowItem, TransLocationItem } from '../types';
import { getLocationId, getValueByAccessor } from './index';
import { get } from 'lodash';
import { DEFAULT_OD_FIELD_GETTER } from '../constant';

// 将经纬度标识成字符串
export const getLngLatStr = (lng: number, lat: number) => [lng, lat].join(',');

/**
 * 将OD数据转换为locations和flows数据
 * @param data
 * @param config
 */
export function transformOdData(
  data: any[],
  config: OdFieldGetter = DEFAULT_OD_FIELD_GETTER,
): { locations: TransLocationItem[]; flows: TransFlowItem[] } {
  const locationMap = new Map<string, TransLocationItem>();
  const locations: TransLocationItem[] = [];
  const flows: TransFlowItem[] = [];

  const { getFromLng, getFromLat, getToLng, getToLat, getWeight } = {
    ...DEFAULT_OD_FIELD_GETTER,
    ...config,
  };

  data.forEach((item) => {
    const f_lng = +getValueByAccessor<number>(item, getFromLng, 0);
    const f_lat = +getValueByAccessor<number>(item, getFromLat, 0);
    const t_lng = +getValueByAccessor<number>(item, getToLng, 0);
    const t_lat = +getValueByAccessor<number>(item, getToLat, 0);
    const weight = +getValueByAccessor<number>(item, getWeight, 0);
    const [from_id, to_id] = [
      [f_lng, f_lat],
      [t_lng, t_lat],
    ].map(([lng, lat]) => {
      // 消除重复的经纬度点
      const key = getLngLatStr(lng, lat);
      let targetItem = locationMap.get(key);
      if (targetItem) {
        targetItem.weight += weight;
        locationMap.set(key, targetItem);
        return targetItem.id;
      } else {
        const id = getLocationId({ lng, lat });
        locationMap.set(key, {
          id,
          lng,
          lat,
          weight,
        });
        return id;
      }
    });

    flows.push({
      from_id,
      to_id,
      weight,
    });
  });

  locationMap.forEach((location) => {
    locations.push(location);
  });

  return {
    locations,
    flows,
  };
}
