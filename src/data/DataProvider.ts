import {
  OriginData,
  LocationFlow,
  LocationFlowFieldGetter,
  NodeLevel,
  MapState,
  LinkLevel,
  NodeMap,
  LocationItem,
  LinkItem,
} from '../types';
import { initFlowsData, initLocationsData } from './init';
import { DEFAULT_LOCATION_FLOW_FIELD_GETTER } from '../constant';
import { getLinkLevels, getLocationLevels } from './cluster';
import { lat2Y, lng2X } from '../utils';
import { unionBy } from 'lodash';

export interface DataProviderOptions extends LocationFlowFieldGetter {
  zoomStep: number;
  hideLimit: number;
}

export class DataProvider {
  static defaultOptions: DataProviderOptions = {
    ...DEFAULT_LOCATION_FLOW_FIELD_GETTER,
    zoomStep: 1,
    hideLimit: 5000,
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
    console.log(this.nodeLevels, this.linkLevels);
  }

  get clusterOptions() {
    return {
      ...this.options,
      ...this.mapState,
    };
  }

  getClusterLevels() {
    return getLocationLevels(
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

  getData([lng1, lat1, lng2, lat2]: [number, number, number, number], currentZoom: number) {
    let showLocations: LocationItem[] = [];
    let showLinks: LinkItem[] = [];
    const locationLevels = this.nodeLevels;
    const linkLevels = this.linkLevels;
    if (!locationLevels.length || !linkLevels.length) {
      return {
        nodes: [],
        links: [],
      };
    }

    const index: number = (() => {
      if (currentZoom > locationLevels[0].zoom) {
        return 0;
      }
      for (let i = 1; i < locationLevels.length; i++) {
        const zoom1 = locationLevels[i - 1].zoom;
        const zoom2 = locationLevels[i].zoom;
        if (currentZoom <= zoom1 && zoom2 <= currentZoom) {
          return i;
        }
      }
      return locationLevels.length - 1;
    })();

    const { tree, nodes } = locationLevels[index];
    const { links } = linkLevels[index];
    const nodeIndexes = tree.range(lng2X(lng1), lat2Y(lat2), lng2X(lng2), lat2Y(lat1));
    if (
      nodeIndexes.length === nodes.length ||
      nodes.length + links.length < this.options.hideLimit
    ) {
      showLocations = nodes;
      showLinks = links;
    } else if (nodeIndexes.length > 0) {
      showLocations = nodeIndexes.map((index) => tree.points[index]);
      const nodeIdSet = new Set(showLocations.map((node) => node.id));

      showLinks = links.filter(({ fromId, toId, weight }) => {
        return nodeIdSet.has(fromId) || nodeIdSet.has(toId);
      });
    }
    return {
      nodes: showLocations,
      links: showLinks.sort((a, b) => a.weight - b.weight),
    };
  }
}
