import KDBush from 'kdbush';
import { DataProviderOptions } from '../data';

export type TransLocationItem = {
  id: string;
  lng: number;
  lat: number;
  weight: number;
};

export type TransFlowItem = {
  from_id: string;
  to_id: string;
  weight: number;
};

export type OriginData = {
  locations: any[];
  flows: any[];
};

export interface LocationFlowFieldGetter {
  getLocationLng: Accessor<number>;
  getLocationLat: Accessor<number>;
  getLocationId: Accessor<string>;
  getLocationWeight: Accessor<number>;
  getFlowId: Accessor<string>;
  getFlowFromId: Accessor<string>;
  getFlowToId: Accessor<string>;
  getFlowWeight: Accessor<number>;
}

export interface OdFieldGetter {
  getFromLng: Accessor<number>;
  getFromLat: Accessor<number>;
  getToLng: Accessor<number>;
  getToLat: Accessor<number>;
  getWeight: Accessor<number>;
}

export interface LocationItem {
  id: string;
  lng: number;
  lat: number;
  x: number;
  y: number;
  zoom: number;
  weight: number;
  clusterId?: string;
  isCluster?: boolean;
  data?: any;
}

export interface ClusterItem extends LocationItem {
  isCluster: true;
  childIds?: string[];
}

export type LocationFlow = {
  locations: LocationItem[];
  flows: FlowItem[];
};

export type NodeItem = LocationItem | ClusterItem;

// export type LinkItem =

export type NodeLevel = {
  zoom: number;
  nodes: NodeItem[];
  tree: KDBush<NodeItem>;
};

export interface FlowItem {
  id: string;
  fromId: string;
  toId: string;
  fromLng?: number;
  fromLat?: number;
  toLng?: number;
  toLat?: number;
  weight: number;
  isCluster?: boolean;
  data: any;
  zoom: number;
}

export interface FlowClusterItem extends FlowItem {
  childIds?: string[];
  isCluster: true;
}

export type NodeMap = Map<string, NodeItem>;

export type LinkItem = FlowItem | FlowClusterItem;

export type LinkLevel = {
  zoom: number;
  links: LinkItem[];
};

export type MapState = {
  zoom: number;
  centerLng: number;
  centerLat: number;
  minZoom: number;
  maxZoom: number;
};

export type ClusterOptions = MapState & DataProviderOptions;

export type Accessor<ValueType = any> = string | (string | number)[] | ((item: any) => ValueType);
