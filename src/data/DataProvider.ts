import {
  TransLocationItem,
  OriginData,
  Accessor,
  LocationFlow,
  LocationFlowFieldGetter,
  NodeLevel,
  MapState,
  NodeItem,
  LocationItem,
  LinkLevel,
  NodeMap,
} from '../types';
import { initFlowsData, initLocationsData } from './init';
import { DEFAULT_LOCATION_FLOW_FIELD_GETTER } from '../constant';
import { getLinkLevels, getNodeLevels, getNodesByZoom } from './cluster';

export interface DataProviderOptions extends LocationFlowFieldGetter {
  zoomStep: number;
}

export class DataProvider {
  static defaultOptions: DataProviderOptions = {
    ...DEFAULT_LOCATION_FLOW_FIELD_GETTER,
    zoomStep: 1,
  };

  mapState: MapState = {
    zoom: 12,
    centerLng: 120,
    centerLat: 30,
    minZoom: 2,
    maxZoom: 18,
  };

  data: LocationFlow;

  options: DataProviderOptions;

  nodeMap: NodeMap = new Map();

  nodeLevels: NodeLevel[] = [];

  linkLevels: LinkLevel[] = [];

  constructor(data: OriginData, options: Partial<DataProviderOptions> = {}) {
    this.options = {
      ...DataProvider.defaultOptions,
      ...options,
    };

    this.data = {
      locations: initLocationsData(data.locations, this.options),
      flows: initFlowsData(data.flows, this.options),
    };

    this.nodeLevels = this.getClusterLevels();
    this.nodeMap = this.getNodeMap();
    this.linkLevels = this.getLinkLevels();
  }

  get clusterOptions() {
    return {
      ...this.options,
      ...this.mapState,
    };
  }

  getClusterLevels() {
    return getNodeLevels(
      this.data.locations.map((location) => location),
      this.clusterOptions,
    );
  }

  getNodeMap() {
    const nodeMap = this.nodeMap;
    nodeMap.clear();
    this.nodeLevels.forEach(({ nodes }) => {
      nodes.forEach((node) => {
        nodeMap.set(node.id, node);
      });
    });
    return this.nodeMap;
  }

  getLinkLevels() {
    return getLinkLevels(this.data.flows, this.nodeLevels, this.nodeMap, this.clusterOptions);
  }
}
