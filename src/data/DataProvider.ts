import {
  OriginData,
  LocationFlow,
  LocationFlowFieldGetter,
  NodeLevel,
  MapState,
  LinkLevel,
  NodeMap,
  NodeItem,
  LinkItem,
} from '../types';
import { initFlowsData, initLocationsData } from './init';
import { DEFAULT_LOCATION_FLOW_FIELD_GETTER } from '../constant';
import { getLinkLevels, getNodeLevels } from './cluster';
import { Scene } from '@antv/l7';
import { lat2Y, lng2X } from '../utils';

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

    const locations = initLocationsData(data.locations, this.options);

    this.data = {
      locations,
      flows: initFlowsData(data.flows, locations, this.options),
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

  getData([lng1, lat1, lng2, lat2]: [number, number, number, number], zoom: number) {
    let showNodes: NodeItem[] = [];
    let showLinks: LinkItem[] = [];
    const nodeLevels = this.nodeLevels;
    const linkLevels = this.linkLevels;
    if (!nodeLevels.length || !linkLevels.length) {
      return {
        nodes: [],
        links: [],
      };
    }
    let index =
      nodeLevels.findIndex((nodeLevel) => {
        console.log(nodeLevel.zoom, zoom);
        return nodeLevel.zoom <= zoom;
      }) - 1;
    if (index < 0) {
      index = 0;
    }
    console.log(index);
    const { tree, nodes } = nodeLevels[index];
    console.log(zoom);
    console.log(nodeLevels[index].zoom);
    const { links } = linkLevels[index];
    const nodeIndexes = tree.range(lng2X(lng1), lat2Y(lat2), lng2X(lng2), lat2Y(lat1));
    if (nodeIndexes.length === nodes.length) {
      showNodes = nodes;
      showLinks = links;
    } else if (nodeIndexes.length > 0) {
      showNodes = nodeIndexes.map((index) => tree.points[index]);
      const nodeIdSet = new Set(showNodes.map((node) => node.id));
      showLinks = links.filter(({ fromId, toId }) => {
        return nodeIdSet.has(fromId) || nodeIdSet.has(toId);
      });
    }

    return {
      nodes: showNodes,
      links: showLinks,
    };
  }
}
