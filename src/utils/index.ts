import { Accessor, LocationItem } from '../types';
import { get } from 'lodash';
import { v4 } from 'uuid';

export * from './transform';
export * from './location';

/**
 * 传入原始数据项，通过访问器获取数据
 * @param data         原始数据项
 * @param accessor     访问器
 * @param defaultValue 默认值，可选
 */
export function getValueByAccessor<ValueType = any>(
  data: any,
  accessor: Accessor<ValueType>,
  defaultValue: ValueType,
): ValueType {
  if (typeof accessor === 'function') {
    return accessor(data) || defaultValue;
  }
  return get(data, accessor, defaultValue);
}

export function isClusterLocation(location: LocationItem) {
  return !!location.isCluster;
}

let i = 1;
export function getUUid() {
  return String(i++);
}
