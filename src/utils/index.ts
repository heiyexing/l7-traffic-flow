import {Accessor, NodeItem} from '../types';
import { get } from 'lodash';

export * from './transform';
export * from './location';

export function getValueByAccessor<ValueType = any>(
  data: any,
  accessor: Accessor<ValueType>,
  defaultValue?: any,
): ValueType {
  if (typeof accessor === 'function') {
    return accessor(data) ?? defaultValue;
  }
  return get(data, accessor, defaultValue);
}

export function isClusterNode(node: NodeItem) {
  return !!node.isCluster;
}
