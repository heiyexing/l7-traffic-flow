import {
  NodeLevel,
  LocationItem,
  MapState,
  ClusterOptions,
  NodeMap,
  LinkItem,
  LinkLevel,
  FlowItem,
  FlowClusterItem,
} from '../types';
import KDBush from 'kdbush';
import { getUUid, isClusterLocation, x2Lng, y2Lat } from '../utils';
import { v4 } from 'uuid';
import { differenceBy, pick } from 'lodash';

/**
 *
 * @param x
 * @param y
 * @param zoom
 * @param childIds
 * @param id
 * @param weight
 */
export function createClusterItem({
  x,
  y,
  zoom,
  childIds,
  id,
  weight,
}: {
  x: number;
  y: number;
  zoom: number;
  childIds: string[];
  id: string;
  weight: number;
}): LocationItem {
  return {
    childIds,
    id,
    isCluster: true,
    lng: x2Lng(x),
    lat: y2Lat(y),
    weight,
    x,
    y,
    zoom,
  };
}

/**
 * 生成kdbush搜索树
 * @param locations
 */
export function getSearchTree(locations: LocationItem[]): KDBush<LocationItem> {
  return new KDBush<LocationItem>(
    locations,
    (p) => p.x,
    (p) => p.y,
    64,
    Float64Array,
  );
}

export function getLocationCount(location: LocationItem) {
  return (isClusterLocation(location) ? (location as LocationItem).childIds?.length : 1) ?? 1;
}

export function sortLocationsByWeight(locations: LocationItem[]) {
  return locations.sort((a, b) => a.weight - b.weight);
}

/**
 * 计算当前zoom下的聚合点数据
 * @param locations: 上一层级的聚合点数据
 * @param tree: 上一层级的聚合点数据对应的kd-tree
 * @param zoom: 当前地图缩放比
 * @param options: 聚合配置参数
 */
export function getLocationsByZoom(
  locations: LocationItem[],
  tree: KDBush<LocationItem>,
  zoom: number,
  options: ClusterOptions,
): LocationItem[] {
  const result: LocationItem[] = [];
  const radius = 60 / (256 * Math.pow(2, zoom));
  const doneIdSet = new Set();

  for (let location of locations) {
    if (doneIdSet.has(location.id)) {
      continue;
    }
    const innerIndexes = tree.within(location.x, location.y, radius);
    const childIds: string[] = [location.id];
    doneIdSet.add(location.id);

    let weight = location.weight;
    let locationCount = getLocationCount(location);
    let weightX = location.x * weight;
    let weightY = location.y * weight;

    const clusterId = getUUid();
    if (innerIndexes.length > 1) {
      for (const innerIndex of innerIndexes) {
        const innerLocation = tree.points[innerIndex];
        if (doneIdSet.has(innerLocation.id)) {
          continue;
        }
        doneIdSet.add(innerLocation.id);
        weight += innerLocation.weight;
        locationCount += getLocationCount(innerLocation);
        weightX += innerLocation.weight * innerLocation.x;
        weightY += innerLocation.weight * innerLocation.y;
        innerLocation.clusterId = clusterId;
        childIds.push(innerLocation.id);
      }
      // 仅当cluster子节点数量大于1时才升级了新Cluster
      if (childIds.length > 1) {
        location.clusterId = clusterId;
        result.push(
          createClusterItem({
            x: weightX / weight,
            y: weightY / weight,
            childIds,
            id: clusterId,
            weight,
            zoom,
          }),
        );
        continue;
      }
    }
    result.push(location);
  }
  return sortLocationsByWeight(result);
}

/**
 * 遍历所有zoom层级，获取所有聚合点经纬度
 * @param locations
 * @param options
 */
export function getLocationLevels(locations: LocationItem[], options: ClusterOptions): NodeLevel[] {
  if (!locations.length) {
    return [];
  }
  const locationLevels: NodeLevel[] = [];
  const { minZoom, maxZoom, zoomStep } = options;
  const originNodes = locations.map((location) => {
    location.zoom = maxZoom;
    return location;
  });
  let oldLocations: LocationItem[] = [...locations];
  let tree = getSearchTree(oldLocations);
  const originTree = tree;
  for (let zoom = maxZoom - zoomStep; zoom >= minZoom; zoom -= zoomStep) {
    const newLocations = getLocationsByZoom(oldLocations, tree, zoom, options);
    if (newLocations.length < oldLocations.length) {
      tree = getSearchTree(newLocations);
      locationLevels.push({
        nodes: newLocations.map((node) => {
          node.zoom = zoom;
          return node;
        }),
        zoom,
        tree,
      });
    }
    oldLocations = newLocations;
  }
  if (locationLevels.length) {
    const newZoom = locationLevels[0].zoom + zoomStep;
    locationLevels.unshift({
      nodes: originNodes.map((node) => {
        if (node.zoom === maxZoom) {
          node.zoom = newZoom;
        }
        return node;
      }),
      zoom: newZoom,
      tree: originTree,
    });
  }
  return locationLevels;
}

export function getLinkKey(fromId: string, toId: string) {
  return `${fromId},${toId}`;
}

export function addLinkToMap(
  link: LinkItem,
  fromId: string,
  toId: string,
  map: Map<string, LinkItem[]>,
) {
  const key = getLinkKey(fromId, toId);
  map.set(key, (map.get(key) ?? []).concat(link));
}

export function createFlowClusterItem(
  fromId: string,
  toId: string,
  links: LinkItem[],
  zoom: number,
): FlowClusterItem {
  return {
    childIds: links.map((link) => link.id),
    data: undefined,
    fromId,
    id: getUUid(),
    isCluster: true,
    toId,
    weight: links.map((link) => link.weight).reduce((a, b) => a + b, 0),
    zoom,
  };
}

export function getLinkLevels(
  flows: FlowItem[],
  locationLevels: NodeLevel[],
  nodeMap: NodeMap,
  options: ClusterOptions,
): LinkLevel[] {
  if (!locationLevels.length || !flows.length) {
    return [];
  }
  const firstZoom = locationLevels[0].zoom;
  const linkLevels: LinkLevel[] = [
    {
      zoom: firstZoom,
      links: flows.map((flow) => {
        flow.zoom = firstZoom;
        return flow;
      }),
    },
  ];

  let { zoom: preZoom, links: preLinks } = linkLevels[0];

  for (let index = 1; index < locationLevels.length; index++) {
    let links: LinkItem[] = [];
    const { zoom, nodes } = locationLevels[index];
    const linkListMap = new Map<string, LinkItem[]>();
    const nodeIdSet = new Set(nodes.map((node) => node.id));
    for (const link of preLinks) {
      let newLink = link;
      let { fromId, toId } = newLink;
      const isFromInNode = nodeIdSet.has(fromId);
      const isToInNode = nodeIdSet.has(toId);
      if (!isFromInNode || !isToInNode) {
        if (!isFromInNode) {
          const fromNode = nodeMap.get(fromId);
          const fromParentId = fromNode?.clusterId;
          if (!isFromInNode && fromParentId && nodeIdSet.has(fromParentId)) {
            fromId = fromParentId;
          }
        }
        if (!isToInNode) {
          const toNode = nodeMap.get(toId);
          const toParentId = toNode?.clusterId;
          if (!isToInNode && toParentId && nodeIdSet.has(toParentId)) {
            toId = toParentId;
          }
        }
        newLink = {
          ...link,
          fromId,
          toId,
          id: getUUid(),
        };
      }
      newLink.zoom = zoom;
      addLinkToMap(newLink, fromId, toId, linkListMap);
    }
    // const linkMap = new Map();
    linkListMap.forEach((linkList, key) => {
      const { fromId, toId } = linkList[0];
      if (fromId === toId) {
        return;
      }
      const link =
        linkList.length === 1 ? linkList[0] : createFlowClusterItem(fromId, toId, linkList, zoom);
      const { lng: fromLng, lat: fromLat } = nodeMap.get(link.fromId)!;
      const { lng: toLng, lat: toLat } = nodeMap.get(link.toId)!;
      Object.assign(link, {
        fromLng,
        fromLat,
        toLng,
        toLat,
      });
      links.push(link);
    });
    links.sort((a, b) => a.weight - b.weight);
    linkLevels.push({
      zoom,
      links,
    });
    preLinks = links;
    preZoom = zoom;
  }
  return linkLevels;
}
